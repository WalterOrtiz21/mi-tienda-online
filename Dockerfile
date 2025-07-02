# ---- Dockerfile Optimizado para Annya Modas - Sin Cache Issues ----
# Dockerfile mejorado para detección inmediata de uploads

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

# 🔥 VARIABLES CRÍTICAS PARA UPLOAD SIN CACHE
ENV NEXT_CACHE_ENABLED=false
ENV NEXT_PRIVATE_STANDALONE=true

# Build de la aplicación
RUN npm run build

# ---- 4. Etapa de Producción ----
FROM base AS runner

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 🔥 VARIABLES PARA DETECCIÓN INMEDIATA DE UPLOADS
ENV NEXT_CACHE_ENABLED=false
ENV UPLOADS_NO_CACHE=true

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 🔥 CREAR ESTRUCTURA DE DIRECTORIOS OPTIMIZADA
RUN mkdir -p /opt/annyamodas/CONTENT/uploads && \
    mkdir -p /app/public/uploads && \
    mkdir -p /app/.next && \
    chown -R nextjs:nodejs /opt/annyamodas && \
    chown -R nextjs:nodejs /app

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar build output con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 🔥 CREAR SYMLINK PARA UPLOADS (crítico para detección)
RUN ln -sf /opt/annyamodas/CONTENT/uploads /app/public/uploads && \
    chown -h nextjs:nodejs /app/public/uploads

# Asegurar permisos correctos
RUN chown -R nextjs:nodejs /opt/annyamodas/CONTENT && \
    chmod -R 755 /opt/annyamodas/CONTENT

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para el runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 🔥 VARIABLES CRÍTICAS PARA RUNTIME
ENV CONTENT_DIR=/opt/annyamodas/CONTENT
ENV UPLOADS_DIR=/opt/annyamodas/CONTENT/uploads

# Health check mejorado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET' }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();" || exit 1

# Comando de inicio
CMD ["node", "server.js"]