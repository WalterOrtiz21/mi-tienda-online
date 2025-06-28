#!/bin/bash

# deploy.sh - Script completo de deployment para Annya Modas
# Versión: 2.0

set -e  # Salir si hay algún error

echo "🚀 Iniciando deployment completo de Annya Modas..."
echo "================================================"

# Función para mostrar progreso
show_progress() {
    echo ""
    echo "🔸 $1"
    echo "---"
}

# Verificar prerrequisitos
show_progress "Verificando prerrequisitos"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar permisos de Docker
if ! docker ps &> /dev/null; then
    echo "⚠️  Arreglando permisos de Docker..."
    sudo usermod -aG docker $USER
    sudo chmod 666 /var/run/docker.sock
    echo "✅ Permisos de Docker arreglados"
fi

# Crear directorios necesarios
show_progress "Preparando directorios"
mkdir -p public/uploads
mkdir -p logs
echo "✅ Directorios creados"

# Backup de datos existentes (opcional)
show_progress "Backup de datos"
if docker-compose ps | grep -q "db.*Up"; then
    timestamp=$(date +"%Y%m%d_%H%M%S")
    echo "📦 Creando backup de la base de datos..."
    docker-compose exec -T db mysqldump -u annyamodas_user -p5eba7d39cfb annyamodas_db > "backup_${timestamp}.sql" 2>/dev/null || echo "⚠️  No se pudo crear backup (DB no disponible)"
    echo "✅ Backup guardado como backup_${timestamp}.sql"
else
    echo "ℹ️  Base de datos no está corriendo, saltando backup"
fi

# Parar servicios existentes
show_progress "Deteniendo servicios existentes"
docker-compose down
echo "✅ Servicios detenidos"

# Limpiar recursos (opcional)
read -p "¿Quieres limpiar imágenes Docker antiguas? (recomendado) (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "🧹 Limpiando recursos antiguos..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Recursos limpiados"
fi

# Build y deploy
show_progress "Construyendo y desplegando aplicación"
if docker-compose up --build -d; then
    echo "✅ Servicios iniciados correctamente"
else
    echo "❌ Error al iniciar servicios"
    echo "📝 Mostrando logs de error:"
    docker-compose logs --tail=20
    exit 1
fi

# Esperar a que los servicios estén listos
show_progress "Esperando a que los servicios estén listos"
echo "⏳ Verificando base de datos..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ Base de datos lista (intento $attempt/$max_attempts)"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Base de datos no responde después de $max_attempts intentos"
        docker-compose logs db --tail=10
        exit 1
    fi
    
    echo "   Esperando... (intento $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Verificar y poblar base de datos si es necesario
show_progress "Verificando datos de la base de datos"
PRODUCT_COUNT=$(docker-compose exec -T db mysql -u annyamodas_user -p5eba7d39cfb annyamodas_db -e "SELECT COUNT(*) FROM products;" -s -N 2>/dev/null || echo "0")

if [ "$PRODUCT_COUNT" -eq 0 ]; then
    echo "📦 No hay productos. Poblando base de datos..."
    
    # Crear script temporal con datos
    cat > /tmp/populate.sql << 'EOF'
USE annyamodas_db;

-- Configuración de la tienda
INSERT INTO store_settings (id, store_name, whatsapp_number) 
VALUES (1, 'Annya Modas', '595981234567')
ON DUPLICATE KEY UPDATE 
store_name = VALUES(store_name),
whatsapp_number = VALUES(whatsapp_number);

-- Productos de ejemplo
INSERT INTO products (name, description, price, original_price, image, category, subcategory, gender, rating, in_stock, features, tags) VALUES 
('Chanel No. 5', 'El perfume más icónico del mundo. Una fragancia floral aldehídica atemporal.', 150000, 180000, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', 'perfumes', 'clásico', 'mujer', 4.8, TRUE, JSON_ARRAY('100ml', 'Larga duración', 'Original'), JSON_ARRAY('floral', 'clásico', 'elegante')),
('Dior Sauvage', 'Una fragancia fresca y especiada que evoca paisajes salvajes.', 120000, 140000, 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400', 'perfumes', 'fresco', 'hombre', 4.7, TRUE, JSON_ARRAY('100ml', 'Fresco', 'Versátil'), JSON_ARRAY('fresco', 'especiado', 'masculino')),
('Tom Ford Black Orchid', 'Fragancia lujosa y sensual con notas orientales.', 200000, 250000, 'https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?w=400', 'perfumes', 'oriental', 'unisex', 4.9, TRUE, JSON_ARRAY('50ml', 'Lujoso', 'Intenso'), JSON_ARRAY('oriental', 'lujoso', 'sensual')),
('Vestido Floral Vintage', 'Hermoso vestido con estampado floral, perfecto para ocasiones especiales.', 85000, 120000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 'ropa', 'vestidos', NULL, 4.5, TRUE, JSON_ARRAY('Tallas S-XL', 'Algodón', 'Lavable'), JSON_ARRAY('vintage', 'floral', 'elegante')),
('Blusa Casual Oversize', 'Blusa cómoda y moderna. Ideal para uso diario.', 45000, 60000, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 'ropa', 'blusas', NULL, 4.3, TRUE, JSON_ARRAY('Tallas S-XXL', 'Poliéster', 'Cómoda'), JSON_ARRAY('casual', 'cómoda', 'moderna'));
EOF

    if docker-compose exec -T db mysql -u annyamodas_user -p5eba7d39cfb annyamodas_db < /tmp/populate.sql; then
        echo "✅ Base de datos poblada correctamente"
        rm -f /tmp/populate.sql
    else
        echo "❌ Error al poblar la base de datos"
        exit 1
    fi
else
    echo "✅ Base de datos ya tiene $PRODUCT_COUNT productos"
fi

# Verificar aplicación
show_progress "Verificando aplicación"
echo "⏳ Esperando respuesta de la aplicación..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s https://annyamodas.com > /dev/null 2>&1; then
        echo "✅ Aplicación respondiendo (intento $attempt/$max_attempts)"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Aplicación no responde después de $max_attempts intentos"
        echo "📝 Logs de la aplicación:"
        docker-compose logs app --tail=20
        exit 1
    fi
    
    echo "   Esperando respuesta... (intento $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# Verificaciones finales
show_progress "Verificaciones finales"

# Verificar APIs
echo "🔍 Verificando APIs:"
health_status=$(curl -s https://annyamodas.com/api/health | jq -r .status 2>/dev/null || echo "error")
products_count=$(curl -s https://annyamodas.com/api/products | jq length 2>/dev/null || echo "0")
store_name=$(curl -s https://annyamodas.com/api/settings | jq -r .storeName 2>/dev/null || echo "error")

echo "   • Health API: $health_status"
echo "   • Products API: $products_count productos"
echo "   • Settings API: $store_name"

# Verificar admin
if curl -s https://annyamodas.com/admin | grep -q "Admin Panel" 2>/dev/null; then
    echo "   • Admin Panel: ✅ Accesible"
else
    echo "   • Admin Panel: ⚠️  Verificar manualmente"
fi

# Estado final
show_progress "Estado de los servicios"
docker-compose ps

# Información final
echo ""
echo "🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
echo "================================================"
echo ""
echo "🌐 URLs importantes:"
echo "   • Sitio web:      https://annyamodas.com"
echo "   • Admin panel:    https://annyamodas.com/admin"
echo "   • Health check:   https://annyamodas.com/api/health"
echo "   • Products API:   https://annyamodas.com/api/products"
echo ""
echo "🔐 Credenciales:"
echo "   • Admin password: annyamodas2025"
echo "   • Database:       annyamodas_user / 5eba7d39cfb"
echo ""
echo "📚 Comandos útiles post-deployment:"
echo "   • Ver logs:       docker-compose logs -f"
echo "   • Reiniciar app:  docker-compose restart app"
echo "   • Acceder DB:     docker-compose exec db mysql -u annyamodas_user -p annyamodas_db"
echo "   • Backup DB:      docker-compose exec db mysqldump -u annyamodas_user -p5eba7d39cfb annyamodas_db > backup.sql"
echo "   • Parar todo:     docker-compose down"
echo ""
echo "📊 Estadísticas:"
echo "   • Productos:      $products_count"
echo "   • Estado APIs:    $health_status"
echo "   • Tienda:         $store_name"
echo ""

# Verificar errores en logs
if docker-compose logs app | grep -i "error\|failed\|exception" > /dev/null 2>&1; then
    echo "⚠️  Se encontraron algunos errores en los logs:"
    docker-compose logs app | grep -i "error\|failed\|exception" | tail -3
    echo "   Para ver logs completos: docker-compose logs app"
    echo ""
fi

echo "✨ ¡Listo para usar! Visita https://annyamodas.com"