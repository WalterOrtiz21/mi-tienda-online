-- init.sql - Script de inicialización completo para Annya Modas
-- Base de datos para tienda de prendas y calzados

-- Configuración de charset
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS annyamodas_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE annyamodas_db;

-- 1. Tabla de productos
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  image VARCHAR(500) NOT NULL,
  images JSON DEFAULT NULL COMMENT 'Array de URLs de imágenes adicionales',
  category ENUM('prendas', 'calzados') NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  gender ENUM('hombre', 'mujer', 'unisex') NOT NULL,
  sizes JSON NOT NULL COMMENT 'Array de talles disponibles',
  colors JSON DEFAULT NULL COMMENT 'Array de colores disponibles',
  material VARCHAR(100) DEFAULT NULL COMMENT 'Material del producto',
  brand VARCHAR(100) DEFAULT NULL COMMENT 'Marca del producto',
  rating DECIMAL(2,1) DEFAULT 4.0,
  in_stock TINYINT(1) DEFAULT 1,
  features JSON DEFAULT NULL COMMENT 'Array de características',
  tags JSON DEFAULT NULL COMMENT 'Array de tags para búsqueda',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para mejorar performance
  INDEX idx_category (category),
  INDEX idx_gender (gender),
  INDEX idx_in_stock (in_stock),
  INDEX idx_price (price),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de configuración de la tienda
DROP TABLE IF EXISTS store_settings;
CREATE TABLE store_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL DEFAULT 'Annya Modas',
  whatsapp_number VARCHAR(20) NOT NULL DEFAULT '595981234567',
  store_icon TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insertar configuración inicial
INSERT INTO store_settings (id, store_name, whatsapp_number) VALUES 
(1, 'Annya Modas - Prendas & Calzados', '595981234567')
ON DUPLICATE KEY UPDATE 
store_name = VALUES(store_name),
whatsapp_number = VALUES(whatsapp_number);

-- 4. Insertar productos de ejemplo

-- PRENDAS
INSERT INTO products (
  name, description, price, original_price, image, images, 
  category, subcategory, gender, sizes, colors, material, brand,
  rating, in_stock, features, tags
) VALUES 
(
  'Remera Oversize Algodón Premium',
  'Remera cómoda de corte oversize, perfecta para uso diario. Tela de algodón premium 100% natural.',
  4500, 6000,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  JSON_ARRAY(
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400'
  ),
  'prendas', 'remeras', 'unisex',
  JSON_ARRAY('S', 'M', 'L', 'XL', 'XXL'),
  JSON_ARRAY('Negro', 'Blanco', 'Gris', 'Navy'),
  '100% Algodón Premium', 'Urban Style',
  4.5, 1,
  JSON_ARRAY('Oversize', 'Algodón premium', 'Unisex', 'Lavable'),
  JSON_ARRAY('casual', 'cómoda', 'básica', 'algodón', 'oversize')
),
(
  'Jean Skinny Tiro Alto Mujer',
  'Jean ajustado de corte skinny con tiro alto. Perfecto para looks modernos y casuales.',
  8500, 12000,
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
  NULL,
  'prendas', 'jeans', 'mujer',
  JSON_ARRAY('26', '28', '30', '32', '34'),
  JSON_ARRAY('Azul claro', 'Azul oscuro', 'Negro'),
  '98% Algodón, 2% Elastano', 'Denim Co',
  4.7, 1,
  JSON_ARRAY('Skinny fit', 'Tiro alto', 'Stretch', 'Cómodo'),
  JSON_ARRAY('skinny', 'jeans', 'mujer', 'ajustado', 'tiro-alto')
),
(
  'Vestido Floral Verano',
  'Hermoso vestido con estampado floral, perfecto para el verano y ocasiones especiales.',
  7200, 10000,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
  NULL,
  'prendas', 'vestidos', 'mujer',
  JSON_ARRAY('XS', 'S', 'M', 'L'),
  JSON_ARRAY('Floral azul', 'Floral rosa', 'Floral amarillo'),
  'Gasa y forro de algodón', 'Summer Vibes',
  4.8, 1,
  JSON_ARRAY('Estampado floral', 'Tela ligera', 'Fresco', 'Elegante'),
  JSON_ARRAY('verano', 'floral', 'femenino', 'fresco', 'elegante')
),
(
  'Buzo Canguro con Capucha',
  'Buzo abrigado con capucha y bolsillo canguro. Ideal para días frescos y looks casuales.',
  5500, 7500,
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
  NULL,
  'prendas', 'buzos', 'unisex',
  JSON_ARRAY('S', 'M', 'L', 'XL', 'XXL'),
  JSON_ARRAY('Negro', 'Gris', 'Bordeaux', 'Navy'),
  '80% Algodón, 20% Poliéster', 'Comfort Zone',
  4.6, 1,
  JSON_ARRAY('Con capucha', 'Bolsillo canguro', 'Cálido', 'Cómodo'),
  JSON_ARRAY('abrigo', 'cómodo', 'casual', 'capucha', 'invierno')
),
(
  'Camisa Formal Hombre',
  'Camisa elegante de corte clásico, perfecta para ocasiones formales y trabajo.',
  6500, 9000,
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
  NULL,
  'prendas', 'camisas', 'hombre',
  JSON_ARRAY('S', 'M', 'L', 'XL'),
  JSON_ARRAY('Blanco', 'Celeste', 'Negro'),
  'Algodón Premium', 'Formal Wear',
  4.3, 1,
  JSON_ARRAY('Formal', 'Algodón premium', 'Corte clásico', 'Plancha fácil'),
  JSON_ARRAY('formal', 'elegante', 'trabajo', 'algodón', 'clásico')
);

-- CALZADOS
INSERT INTO products (
  name, description, price, original_price, image, images, 
  category, subcategory, gender, sizes, colors, material, brand,
  rating, in_stock, features, tags
) VALUES 
(
  'Zapatillas Running Deportivas',
  'Zapatillas profesionales para running con tecnología de amortiguación avanzada y diseño ergonómico.',
  12000, 15000,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  JSON_ARRAY(
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
  ),
  'calzados', 'zapatillas', 'unisex',
  JSON_ARRAY('38', '39', '40', '41', '42', '43', '44'),
  JSON_ARRAY('Negro/Blanco', 'Azul/Gris', 'Rojo/Negro'),
  'Mesh transpirable y suela EVA', 'RunTech',
  4.9, 1,
  JSON_ARRAY('Amortiguación avanzada', 'Transpirable', 'Antideslizante', 'Ergonómico'),
  JSON_ARRAY('running', 'deportivo', 'cómodo', 'transpirable', 'profesional')
),
(
  'Botas de Cuero Elegantes',
  'Botas elegantes de cuero genuino, perfectas para ocasiones formales y casuales.',
  18000, 25000,
  'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400',
  NULL,
  'calzados', 'botas', 'mujer',
  JSON_ARRAY('35', '36', '37', '38', '39', '40'),
  JSON_ARRAY('Negro', 'Marrón', 'Cognac'),
  'Cuero genuino', 'Leather Style',
  4.4, 1,
  JSON_ARRAY('Cuero genuino', 'Tacón medio', 'Cremallera', 'Resistente'),
  JSON_ARRAY('elegante', 'cuero', 'tacón', 'formal', 'invernal')
),
(
  'Mocasines Casuales Hombre',
  'Mocasines cómodos de cuero sintético para uso diario y ocasiones casuales.',
  9500, 13000,
  'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400',
  NULL,
  'calzados', 'mocasines', 'hombre',
  JSON_ARRAY('39', '40', '41', '42', '43', '44'),
  JSON_ARRAY('Negro', 'Marrón', 'Azul marino'),
  'Cuero sintético de alta calidad', 'Casual Comfort',
  4.2, 1,
  JSON_ARRAY('Sin cordones', 'Cómodos', 'Versátiles', 'Fácil calce'),
  JSON_ARRAY('casual', 'cómodo', 'mocasín', 'sin-cordones', 'versátil')
),
(
  'Sandalias de Verano',
  'Sandalias ligeras y cómodas para el verano con suela antideslizante.',
  3500, 5000,
  'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
  NULL,
  'calzados', 'sandalias', 'mujer',
  JSON_ARRAY('35', '36', '37', '38', '39'),
  JSON_ARRAY('Dorado', 'Plateado', 'Negro'),
  'Sintético y suela de goma', 'Summer Feet',
  4.0, 1,
  JSON_ARRAY('Ligeras', 'Antideslizantes', 'Verano', 'Cómodas'),
  JSON_ARRAY('verano', 'sandalias', 'playa', 'ligero', 'cómodo')
),
(
  'Zapatillas Urbanas Casuales',
  'Zapatillas urbanas con diseño moderno para uso diario y looks casuales.',
  8500, 11000,
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
  NULL,
  'calzados', 'zapatillas', 'hombre',
  JSON_ARRAY('40', '41', '42', '43', '44', '45'),
  JSON_ARRAY('Blanco', 'Negro', 'Gris'),
  'Cuero sintético y textil', 'Urban Walk',
  4.3, 1,
  JSON_ARRAY('Diseño urbano', 'Cómodos', 'Versátiles', 'Moderno'),
  JSON_ARRAY('urbano', 'casual', 'moderno', 'diario', 'estilo')
),
(
  'Botas de Trabajo Hombre',
  'Botas resistentes para trabajo, con puntera de seguridad y suela antideslizante.',
  15000, 20000,
  'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400',
  NULL,
  'calzados', 'botas', 'hombre',
  JSON_ARRAY('39', '40', '41', '42', '43', '44', '45'),
  JSON_ARRAY('Negro', 'Marrón'),
  'Cuero genuino y suela de goma', 'WorkTech',
  4.6, 1,
  JSON_ARRAY('Puntera de seguridad', 'Antideslizante', 'Resistente', 'Cómodo'),
  JSON_ARRAY('trabajo', 'seguridad', 'resistente', 'profesional', 'duradero')
);

-- 5. Crear usuarios y permisos (opcional, para producción)
-- CREATE USER IF NOT EXISTS 'annyamodas_user'@'%' IDENTIFIED BY '5eba7d39cfb';
-- GRANT ALL PRIVILEGES ON annyamodas_db.* TO 'annyamodas_user'@'%';
-- FLUSH PRIVILEGES;

-- 6. Verificar la inserción
SELECT 'Base de datos inicializada correctamente' as message;
SELECT category, COUNT(*) as total_productos FROM products GROUP BY category;
SELECT 'Configuración de tienda:' as info, store_name, whatsapp_number FROM store_settings WHERE id = 1;