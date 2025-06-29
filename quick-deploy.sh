#!/bin/bash

# quick-deploy.sh - Deploy rápido para producción
# Solo actualiza la aplicación, mantiene la BD corriendo

echo "⚡ Deploy rápido - Solo aplicación"
echo "=================================="

# Verificar que Docker funcione
if ! docker ps &> /dev/null; then
    echo "❌ Docker no está accesible"
    exit 1
fi

# Verificar que la BD esté corriendo
if ! docker-compose ps | grep -q "db.*Up"; then
    echo "⚠️  Base de datos no está corriendo. ¿Quieres iniciarla? (y/N)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗄️  Iniciando base de datos..."
        docker-compose up -d db
        sleep 10
    else
        echo "❌ Necesitas la base de datos para continuar"
        exit 1
    fi
fi

echo "🗄️  ✅ Base de datos está corriendo"

# Solo parar y reconstruir la aplicación
echo "🔄 Actualizando aplicación..."
docker-compose stop app
docker-compose rm -f app

# Build y start solo la app
echo "🔧 Construyendo nueva versión..."
if docker-compose up --build -d app; then
    echo "✅ Aplicación actualizada"
else
    echo "❌ Error al actualizar aplicación"
    exit 1
fi

# Verificar que esté funcionando
echo "⏳ Verificando aplicación..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s https://annyamodas.com/api/health > /dev/null 2>&1; then
        echo "✅ Aplicación funcionando (intento $attempt/$max_attempts)"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Aplicación no responde después de $max_attempts intentos"
        echo "📝 Logs:"
        docker-compose logs app --tail=10
        exit 1
    fi
    
    echo "   Verificando... ($attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Estado final
echo ""
echo "📊 Estado de servicios:"
docker-compose ps

echo ""
echo "🎉 ¡Deploy rápido completado!"
echo "   🌐 Sitio: https://annyamodas.com"
echo "   👨‍💼 Admin: https://annyamodas.com/admin"
echo "   ⏱️  Tiempo de inactividad: ~30-60 segundos"