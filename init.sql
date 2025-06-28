-- init.sql
-- Usar la base de datos creada por Docker Compose
USE annyamodas_db;

-- Crear tabla para los productos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NULL,
    image VARCHAR(500) NOT NULL,
    images JSON NULL, -- Array de URLs de imágenes adicionales
    category ENUM('perfumes', 'ropa') NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    gender ENUM('hombre', 'mujer', 'unisex') NULL,
    rating DECIMAL(2, 1) DEFAULT 4.0,
    in_stock BOOLEAN DEFAULT TRUE,
    features JSON NULL, -- Array de características
    tags JSON NULL, -- Array de tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla para configuración de la tienda
CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1,
    store_name VARCHAR(255) DEFAULT 'Tu Tienda Online',
    whatsapp_number VARCHAR(50) DEFAULT '595981234567',
    store_icon VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla para usuarios admin (opcional para futuro)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración inicial de la tienda
INSERT INTO store_settings (id, store_name, whatsapp_number) 
VALUES (1, 'Tu Tienda Online', '595981234567')
ON DUPLICATE KEY UPDATE 
store_name = VALUES(store_name),
whatsapp_number = VALUES(whatsapp_number);

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, original_price, image, category, subcategory, gender, rating, in_stock, features, tags) VALUES 
(
    'Chanel No. 5',
    'El perfume más icónico del mundo. Una fragancia floral aldehídica atemporal.',
    150000,
    180000,
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    'perfumes',
    'clásico',
    'mujer',
    4.8,
    TRUE,
    '["100ml", "Larga duración", "Original"]',
    '["floral", "clásico", "elegante"]'
),
(
    'Dior Sauvage',
    'Una fragancia fresca y especiada que evoca paisajes salvajes.',
    120000,
    140000,
    'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400',
    'perfumes',
    'fresco',
    'hombre',
    4.7,
    TRUE,
    '["100ml", "Fresco", "Versátil"]',
    '["fresco", "especiado", "masculino"]'
),
(
    'Vestido Floral Vintage',
    'Hermoso vestido con estampado floral, perfecto para ocasiones especiales.',
    85000,
    120000,
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    'ropa',
    'vestidos',
    NULL,
    4.5,
    TRUE,
    '["Tallas S-XL", "Algodón", "Lavable"]',
    '["vintage", "floral", "elegante"]'
);