-- Migration: adicionar coluna erp_account_id para integração com ERP Petron
-- Execute no Supabase SQL Editor

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS erp_account_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS idx_clients_erp_account_id ON public.clients(erp_account_id);
