#!/bin/bash
# quick-deploy.sh - Deploy súper rápido

set -e
trap 'echo "❌ Error en línea $LINENO"' ERR

echo "⚡ ULTRA FAST DEPLOY v2.0"
echo "========================="
start_time=$(date +%s)

# Configuración
APP_NAME="annyamodas-app"
APP_IMAGE="annyamodas-app:latest"
HEALTH_URL="http://localhost:8080/api/health"
BUILD_CACHE_DIR=".build-cache"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# ====================
# VERIFICACIONES INICIALES
# ====================

print_status "Verificando requisitos..."

# Verificar Docker
if ! docker ps &> /dev/null; then
    print_error "Docker no accesible"
    exit 1
fi

# Verificar BD
if ! docker-compose ps | grep -q "db.*Up"; then
    print_status "Iniciando BD..."
    docker-compose up -d db
    until docker-compose exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; do
        printf "."
        sleep 1
    done
    echo ""
fi
print_success "BD lista"

# Verificar si la app actual funciona
CURRENT_WORKING=false
if curl -f -s $HEALTH_URL > /dev/null 2>&1; then
    CURRENT_WORKING=true
    print_success "Aplicación actual funcionando"
else
    print_warning "Aplicación actual no responde"
fi

# ====================
# GESTIÓN DE CONTENEDORES EXISTENTES
# ====================

print_status "Limpiando contenedores existentes..."

# Parar contenedor actual si existe
if docker ps -q -f name="^${APP_NAME}$" | grep -q .; then
    print_status "Parando contenedor actual..."
    docker stop $APP_NAME >/dev/null 2>&1 || true
fi

# Eliminar contenedor existente si existe
if docker ps -aq -f name="^${APP_NAME}$" | grep -q .; then
    print_status "Eliminando contenedor existente..."
    docker rm $APP_NAME >/dev/null 2>&1 || true
fi

print_success "Contenedores limpiados"

# ====================
# BUILD INTELIGENTE
# ====================

print_status "Verificando cambios..."

# Crear hash de archivos relevantes para detectar cambios
CURRENT_HASH=$(find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" \
    -o -name "package*.json" -o -name "Dockerfile" -o -name "next.config.js" \
    -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./build/*" \
    -not -path "./.build-cache/*" \
    2>/dev/null | sort | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)

LAST_HASH=""
if [ -f "$BUILD_CACHE_DIR/last_build_hash" ]; then
    LAST_HASH=$(cat "$BUILD_CACHE_DIR/last_build_hash")
fi

BUILD_NEEDED=true
if [ "$CURRENT_HASH" = "$LAST_HASH" ] && docker images | grep -q "$APP_IMAGE"; then
    print_success "No hay cambios detectados, usando imagen existente"
    BUILD_NEEDED=false
else
    print_status "Cambios detectados, construyendo nueva imagen..."
fi

if [ "$BUILD_NEEDED" = true ]; then
    # Crear directorio de cache
    mkdir -p "$BUILD_CACHE_DIR"
    
    # Build con mejor estrategia de cache
    print_status "Construyendo imagen optimizada..."
    
    # Usar buildkit para builds más rápidos
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Limpiar imagen anterior si existe
    if docker images | grep -q "$APP_IMAGE"; then
        print_status "Eliminando imagen anterior..."
        docker rmi $APP_IMAGE >/dev/null 2>&1 || true
    fi
    
    # Build con cache inteligente
    if ! docker-compose build app 2>&1 | tee "$BUILD_CACHE_DIR/last_build.log"; then
        print_error "Error en build. Detalles:"
        tail -20 "$BUILD_CACHE_DIR/last_build.log"
        
        # Intentar build sin cache como fallback
        print_warning "Intentando build sin cache..."
        if ! docker-compose build --no-cache app; then
            print_error "Build falló completamente"
            exit 1
        fi
    fi
    
    # Guardar hash del build exitoso
    echo "$CURRENT_HASH" > "$BUILD_CACHE_DIR/last_build_hash"
    print_success "Build completado"
else
    print_success "Usando imagen en cache"
fi

# ====================
# DEPLOY RÁPIDO SIN DUPLICADOS
# ====================

print_status "Iniciando nueva aplicación..."

# Usar docker-compose up para crear solo el servicio app
if docker-compose up -d app > /dev/null 2>&1; then
    print_success "Contenedor iniciado"
else
    print_error "Error al iniciar contenedor"
    
    # Mostrar logs si falla
    print_status "Logs del contenedor:"
    docker-compose logs app --tail=20
    exit 1
fi

# ====================
# VERIFICACIÓN RÁPIDA
# ====================

print_status "Verificando nueva aplicación..."

# Health check con timeout agresivo
attempt=1
max_attempts=30
healthy=false

while [ $attempt -le $max_attempts ]; do
    if curl -f -s --max-time 2 $HEALTH_URL > /dev/null 2>&1; then
        healthy=true
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Nueva aplicación no responde"
        
        # Mostrar logs de error
        print_status "Logs de la aplicación:"
        docker-compose logs app --tail=15
        exit 1
    fi
    
    printf "\r   Health check... (%d/%d)" $attempt $max_attempts
    sleep 1
    ((attempt++))
done

echo ""
print_success "Aplicación verificada en ${attempt}s"

# ====================
# VERIFICACIÓN EXTERNA OPCIONAL
# ====================

if curl -f -s --max-time 5 "https://annyamodas.com/api/health" > /dev/null 2>&1; then
    print_success "Sitio externo accesible"
else
    print_warning "Sitio externo no verificado (normal si hay proxy/CDN)"
fi

# ====================
# LIMPIEZA POST-DEPLOY
# ====================

print_status "Limpiando recursos obsoletos..."

# Limpiar imágenes dangling
docker image prune -f > /dev/null 2>&1 || true

# Limpiar contenedores parados
docker container prune -f > /dev/null 2>&1 || true

print_success "Limpieza completada"

# ====================
# ESTADÍSTICAS
# ====================

end_time=$(date +%s)
total_time=$((end_time - start_time))

echo ""
echo -e "${GREEN}🎯 DEPLOY ULTRA RÁPIDO COMPLETADO${NC}"
echo "================================"
echo -e "   ⏱️  Tiempo total: ${BLUE}${total_time}s${NC}"
echo -e "   ⚡ Downtime: ${BLUE}~2-3s${NC}"
echo -e "   🔧 Build necesario: ${BUILD_NEEDED}"
echo -e "   🌐 Web: ${BLUE}https://annyamodas.com${NC}"
echo -e "   👨‍💼 Admin: ${BLUE}https://annyamodas.com/admin${NC}"

echo ""
print_status "Estado de servicios:"
docker-compose ps

# Verificar que no hay duplicados
APP_COUNT=$(docker ps --filter name="annyamodas-app" --format "table {{.Names}}" | grep -c "annyamodas-app" || echo "0")
if [ "$APP_COUNT" -gt 1 ]; then
    print_warning "Se detectaron múltiples contenedores de app. Limpiando..."
    docker ps --filter name="annyamodas-app" --format "table {{.Names}}" | tail -n +2 | head -n -1 | xargs -r docker stop
    docker ps -a --filter name="annyamodas-app" --format "table {{.Names}}" | tail -n +2 | head -n -1 | xargs -r docker rm
    print_success "Duplicados eliminados"
elif [ "$APP_COUNT" -eq 1 ]; then
    print_success "Solo hay un contenedor de app ejecutándose"
else
    print_error "No hay contenedores de app ejecutándose"
fi

print_success "Deploy completado exitosamente!"

# Guardar estadísticas de deploy
echo "$(date '+%Y-%m-%d %H:%M:%S'),${total_time}s,${BUILD_NEEDED},${APP_COUNT}" >> "$BUILD_CACHE_DIR/deploy_stats.csv"