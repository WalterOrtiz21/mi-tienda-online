-- supabase/schema.sql
-- Schema de Annya Modas para Postgres (Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar y RUN

-- ============================================================
-- 1. TABLA products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  original_price  NUMERIC(10,2),
  image           VARCHAR(500) NOT NULL,
  images          JSONB,
  category        VARCHAR(20) NOT NULL CHECK (category IN ('prendas','calzados')),
  subcategory     VARCHAR(100) NOT NULL,
  gender          VARCHAR(20) NOT NULL CHECK (gender IN ('hombre','mujer','unisex')),
  sizes           JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors          JSONB,
  material        VARCHAR(100),
  brand           VARCHAR(100),
  rating          NUMERIC(2,1) DEFAULT 4.0,
  in_stock        BOOLEAN DEFAULT TRUE,
  features        JSONB,
  tags            JSONB,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category   ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_gender     ON public.products(gender);
CREATE INDEX IF NOT EXISTS idx_products_in_stock   ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_price      ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating     ON public.products(rating);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_archived   ON public.products(archived);

-- ============================================================
-- 2. TABLA store_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id               INT PRIMARY KEY,
  store_name       VARCHAR(255) NOT NULL DEFAULT 'Annya Modas',
  whatsapp_number  VARCHAR(20)  NOT NULL DEFAULT '595981234567',
  store_icon       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Trigger: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. RLS (Row Level Security)
--    - Lectura pública (anyone puede SELECT)
--    - Escrituras solo via service_role (bypass RLS)
-- ============================================================
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read"
  ON public.store_settings FOR SELECT
  USING (true);

-- ============================================================
-- 5. Configuración inicial de la tienda
-- ============================================================
INSERT INTO public.store_settings (id, store_name, whatsapp_number) VALUES
  (1, 'Annya Modas - Prendas & Calzados', '595981234567')
ON CONFLICT (id) DO UPDATE SET
  store_name      = EXCLUDED.store_name,
  whatsapp_number = EXCLUDED.whatsapp_number;

-- ============================================================
-- 6. Productos de ejemplo (idempotente: solo inserta si está vacío)
-- ============================================================
INSERT INTO public.products
  (name, description, price, original_price, image, images, category, subcategory, gender, sizes, colors, material, brand, rating, in_stock, features, tags)
SELECT * FROM (VALUES
  (
    'Remera Oversize Algodón Premium',
    'Remera cómoda de corte oversize, perfecta para uso diario. Tela de algodón premium 100% natural.',
    4500::numeric, 6000::numeric,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400"]'::jsonb,
    'prendas', 'remeras', 'unisex',
    '["S","M","L","XL","XXL"]'::jsonb,
    '["Negro","Blanco","Gris","Navy"]'::jsonb,
    '100% Algodón Premium', 'Urban Style',
    4.5::numeric, true,
    '["Oversize","Algodón premium","Unisex","Lavable"]'::jsonb,
    '["casual","cómoda","básica","algodón","oversize"]'::jsonb
  ),
  (
    'Jean Skinny Tiro Alto Mujer',
    'Jean ajustado de corte skinny con tiro alto. Perfecto para looks modernos y casuales.',
    8500::numeric, 12000::numeric,
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    NULL::jsonb,
    'prendas', 'jeans', 'mujer',
    '["26","28","30","32","34"]'::jsonb,
    '["Azul claro","Azul oscuro","Negro"]'::jsonb,
    '98% Algodón, 2% Elastano', 'Denim Co',
    4.7::numeric, true,
    '["Skinny fit","Tiro alto","Stretch","Cómodo"]'::jsonb,
    '["skinny","jeans","mujer","ajustado","tiro-alto"]'::jsonb
  ),
  (
    'Vestido Floral Verano',
    'Hermoso vestido con estampado floral, perfecto para el verano y ocasiones especiales.',
    7200::numeric, 10000::numeric,
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    NULL::jsonb,
    'prendas', 'vestidos', 'mujer',
    '["XS","S","M","L"]'::jsonb,
    '["Floral azul","Floral rosa","Floral amarillo"]'::jsonb,
    'Gasa y forro de algodón', 'Summer Vibes',
    4.8::numeric, true,
    '["Estampado floral","Tela ligera","Fresco","Elegante"]'::jsonb,
    '["verano","floral","femenino","fresco","elegante"]'::jsonb
  ),
  (
    'Buzo Canguro con Capucha',
    'Buzo abrigado con capucha y bolsillo canguro. Ideal para días frescos y looks casuales.',
    5500::numeric, 7500::numeric,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    NULL::jsonb,
    'prendas', 'buzos', 'unisex',
    '["S","M","L","XL","XXL"]'::jsonb,
    '["Negro","Gris","Bordeaux","Navy"]'::jsonb,
    '80% Algodón, 20% Poliéster', 'Comfort Zone',
    4.6::numeric, true,
    '["Con capucha","Bolsillo canguro","Cálido","Cómodo"]'::jsonb,
    '["abrigo","cómodo","casual","capucha","invierno"]'::jsonb
  ),
  (
    'Camisa Formal Hombre',
    'Camisa elegante de corte clásico, perfecta para ocasiones formales y trabajo.',
    6500::numeric, 9000::numeric,
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    NULL::jsonb,
    'prendas', 'camisas', 'hombre',
    '["S","M","L","XL"]'::jsonb,
    '["Blanco","Celeste","Negro"]'::jsonb,
    'Algodón Premium', 'Formal Wear',
    4.3::numeric, true,
    '["Formal","Algodón premium","Corte clásico","Plancha fácil"]'::jsonb,
    '["formal","elegante","trabajo","algodón","clásico"]'::jsonb
  ),
  (
    'Zapatillas Running Deportivas',
    'Zapatillas profesionales para running con tecnología de amortiguación avanzada y diseño ergonómico.',
    12000::numeric, 15000::numeric,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400","https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"]'::jsonb,
    'calzados', 'zapatillas', 'unisex',
    '["38","39","40","41","42","43","44"]'::jsonb,
    '["Negro/Blanco","Azul/Gris","Rojo/Negro"]'::jsonb,
    'Mesh transpirable y suela EVA', 'RunTech',
    4.9::numeric, true,
    '["Amortiguación avanzada","Transpirable","Antideslizante","Ergonómico"]'::jsonb,
    '["running","deportivo","cómodo","transpirable","profesional"]'::jsonb
  ),
  (
    'Botas de Cuero Elegantes',
    'Botas elegantes de cuero genuino, perfectas para ocasiones formales y casuales.',
    18000::numeric, 25000::numeric,
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400',
    NULL::jsonb,
    'calzados', 'botas', 'mujer',
    '["35","36","37","38","39","40"]'::jsonb,
    '["Negro","Marrón","Cognac"]'::jsonb,
    'Cuero genuino', 'Leather Style',
    4.4::numeric, true,
    '["Cuero genuino","Tacón medio","Cremallera","Resistente"]'::jsonb,
    '["elegante","cuero","tacón","formal","invernal"]'::jsonb
  ),
  (
    'Mocasines Casuales Hombre',
    'Mocasines cómodos de cuero sintético para uso diario y ocasiones casuales.',
    9500::numeric, 13000::numeric,
    'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400',
    NULL::jsonb,
    'calzados', 'mocasines', 'hombre',
    '["39","40","41","42","43","44"]'::jsonb,
    '["Negro","Marrón","Azul marino"]'::jsonb,
    'Cuero sintético de alta calidad', 'Casual Comfort',
    4.2::numeric, true,
    '["Sin cordones","Cómodos","Versátiles","Fácil calce"]'::jsonb,
    '["casual","cómodo","mocasín","sin-cordones","versátil"]'::jsonb
  ),
  (
    'Sandalias de Verano',
    'Sandalias ligeras y cómodas para el verano con suela antideslizante.',
    3500::numeric, 5000::numeric,
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    NULL::jsonb,
    'calzados', 'sandalias', 'mujer',
    '["35","36","37","38","39"]'::jsonb,
    '["Dorado","Plateado","Negro"]'::jsonb,
    'Sintético y suela de goma', 'Summer Feet',
    4.0::numeric, true,
    '["Ligeras","Antideslizantes","Verano","Cómodas"]'::jsonb,
    '["verano","sandalias","playa","ligero","cómodo"]'::jsonb
  ),
  (
    'Zapatillas Urbanas Casuales',
    'Zapatillas urbanas con diseño moderno para uso diario y looks casuales.',
    8500::numeric, 11000::numeric,
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
    NULL::jsonb,
    'calzados', 'zapatillas', 'hombre',
    '["40","41","42","43","44","45"]'::jsonb,
    '["Blanco","Negro","Gris"]'::jsonb,
    'Cuero sintético y textil', 'Urban Walk',
    4.3::numeric, true,
    '["Diseño urbano","Cómodos","Versátiles","Moderno"]'::jsonb,
    '["urbano","casual","moderno","diario","estilo"]'::jsonb
  ),
  (
    'Botas de Trabajo Hombre',
    'Botas resistentes para trabajo, con puntera de seguridad y suela antideslizante.',
    15000::numeric, 20000::numeric,
    'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400',
    NULL::jsonb,
    'calzados', 'botas', 'hombre',
    '["39","40","41","42","43","44","45"]'::jsonb,
    '["Negro","Marrón"]'::jsonb,
    'Cuero genuino y suela de goma', 'WorkTech',
    4.6::numeric, true,
    '["Puntera de seguridad","Antideslizante","Resistente","Cómodo"]'::jsonb,
    '["trabajo","seguridad","resistente","profesional","duradero"]'::jsonb
  )
) AS seed(name, description, price, original_price, image, images, category, subcategory, gender, sizes, colors, material, brand, rating, in_stock, features, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.products);

-- ============================================================
-- 7. Storage bucket 'products' (público)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies de storage: lectura pública, escritura solo service_role
DROP POLICY IF EXISTS "products_bucket_public_read" ON storage.objects;
CREATE POLICY "products_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');
