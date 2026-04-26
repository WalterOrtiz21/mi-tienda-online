-- Migration: agregar columna `archived` a products
-- Idempotente. Ejecutar en Supabase SQL Editor.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(archived);
