# ---- Dockerfile que Funciona - Usando directorio de host ----

# ---- 1. Etapa Base ----
FROM node:18-alpine AS base
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# ---- 2. Etapa de Dependencias ----
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# ---- 3. Etapa de Builder ----
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm ci --frozen-lockfile

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE=true

# Build de la aplicación
RUN npm run build

# ---- 4. Etapa de Producción ----
FROM base AS runner

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_ENV=true

# 🎯 CREAR USUARIO
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 🎯 CREAR SOLO DIRECTORIOS DE LA APP (no /opt)
RUN mkdir -p /app/public && \
    mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar build output con permisos específicos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 🎯 EL DIRECTORIO SE MAPEARÁ DESDE EL HOST
# No crear /opt/annyamodas aquí, se mapea desde docker-compose

# 🔍 SCRIPT DE VERIFICACIÓN
RUN echo '#!/bin/sh' > /app/check-dirs.sh && \
    echo 'echo "🔍 Verificando directorios mapeados..."' >> /app/check-dirs.sh && \
    echo 'echo "Host mapping: $CONTENT_DIR_HOST -> $CONTENT_DIR"' >> /app/check-dirs.sh && \
    echo 'ls -la $CONTENT_DIR 2>/dev/null || echo "❌ $CONTENT_DIR no accesible"' >> /app/check-dirs.sh && \
    echo 'ls -la $CONTENT_DIR/uploads 2>/dev/null || echo "⚠️ $CONTENT_DIR/uploads no existe aún"' >> /app/check-dirs.sh && \
    echo 'touch $CONTENT_DIR/uploads/.test 2>/dev/null && rm $CONTENT_DIR/uploads/.test && echo "✅ Directorio escribible" || echo "⚠️ Creando directorio..."' >> /app/check-dirs.sh && \
    echo 'mkdir -p $CONTENT_DIR/uploads 2>/dev/null || true' >> /app/check-dirs.sh && \
    echo 'echo "✅ Verificación completada"' >> /app/check-dirs.sh && \
    chmod +x /app/check-dirs.sh && \
    chown nextjs:nodejs /app/check-dirs.sh

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para el runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 🎯 ESTAS VARIABLES SE CONFIGURAN DESDE .env
# ENV CONTENT_DIR y UPLOADS_DIR vienen del docker-compose

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e " \
    const http = require('http'); \
    const options = { \
      hostname: 'localhost', \
      port: 3000, \
      path: '/api/health', \
      method: 'GET', \
      timeout: 8000 \
    }; \
    const req = http.request(options, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }; \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.setTimeout(8000); \
    req.end(); \
  " || exit 1

# 🎯 COMANDO CON VERIFICACIÓN
CMD sh /app/check-dirs.sh && node server.js