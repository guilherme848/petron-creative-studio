-- Migration: Adicionar Departamento na tabela products
-- Execute no Supabase SQL Editor

-- Nova coluna
ALTER TABLE products ADD COLUMN IF NOT EXISTS department text;

-- Índices para busca em volume
CREATE INDEX IF NOT EXISTS idx_products_department ON products (department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (lower(name));
