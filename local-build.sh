#!/bin/bash

# local-build.sh - Build local como alternativa

echo "🏠 Build local como alternativa a Docker build..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "📦 Instalando dependencias localmente..."
npm install

echo "🔧 Construyendo aplicación..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build local exitoso"
    
    # Crear Dockerfile simple que use el build local
    cat > Dockerfile.local << 'EOF'
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar build ya construido localmente
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

    echo "🐳 Construyendo imagen Docker con build local..."
    docker build -f Dockerfile.local -t annyamodas-app-local .
    
    # Actualizar docker-compose para usar la imagen local
    sed -i 's/build: \./image: annyamodas-app-local/' docker-compose.yml
    
    echo "🚀 Levantando servicios..."
    docker-compose up -d
    
    echo "✅ Deploy completado usando build local"
else
    echo "❌ Build local falló"
    exit 1
fi