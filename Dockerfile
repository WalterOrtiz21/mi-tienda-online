# ---- Dockerfile Optimizado para Annya Modas ----
# Dockerfile mejorado con mejor cache y multi-stage builds

# ---- 1. Etapa Base ----
FROM node:18-alpine AS base
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# ---- 2. Etapa de Dependencias ----
FROM base AS deps

# Copiar solo archivos de dependencias para mejor cache
COPY package.json package-lock.json* ./

# Instalar dependencias de producción
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# ---- 3. Etapa de Builder ----
FROM base AS builder

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Instalar todas las dependencias (incluidas dev) para el build
RUN npm ci --frozen-lockfile

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Deshabilitar TypeScript strict checking para build más rápido (opcional)
ENV NEXT_STRICT_CSP=false

# Build de la aplicación
RUN npm run build

# ---- 4. Etapa de Producción ----
FROM base AS runner

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Crear directorios necesarios con permisos correctos
RUN mkdir -p /app/public/uploads && \
    mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar build output con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Asegurar permisos del directorio de uploads
RUN chown -R nextjs:nodejs /app/public/uploads

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para el runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Comando de inicio
CMD ["node", "server.js"]