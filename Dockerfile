# ---- 1. Etapa de Dependencias ----
FROM node:18-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar manifiestos del proyecto
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# ---- 2. Etapa de Build ----
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiar código fuente
COPY . .

# Instalar devDependencies para el build
RUN npm ci

# Configurar Next.js para output standalone
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ---- 3. Etapa de Producción ----
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para producción
COPY --from=builder /app/public ./public

# Copiar build output con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear directorio para uploads (si usas almacenamiento local)
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]