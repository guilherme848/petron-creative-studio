-- Migration: Renomear campos para hierarquia Categoria > Subcategoria
-- Execute no Supabase SQL Editor

-- Renomear category → subcategory
ALTER TABLE products RENAME COLUMN category TO subcategory;

-- Renomear department → category
ALTER TABLE products RENAME COLUMN department TO category;

-- Recriar índices com nomes corretos
DROP INDEX IF EXISTS idx_products_department;
DROP INDEX IF EXISTS idx_products_category;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products (subcategory) WHERE subcategory IS NOT NULL;
