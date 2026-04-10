-- ═══════════════════════════════════════════════════════════════
-- Migration: users table (sincronizada com team_members do ERP)
-- ═══════════════════════════════════════════════════════════════
-- Cada user local representa um team_member do ERP que está habilitado
-- a usar o Creative Studio. A fonte de verdade para auth/role é sempre
-- o ERP — esta tabela apenas espelha os dados pra tracking e analytics.

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linking com o ERP (Supabase Auth cross-project)
  erp_auth_user_id uuid NOT NULL UNIQUE,       -- auth.users.id do ERP
  erp_team_member_id uuid NOT NULL,            -- team_members.id do ERP
  erp_role_name text NOT NULL,                 -- job_roles.name (ex: "Gerente de Tráfego")

  -- Perfil espelhado do ERP
  email text NOT NULL,
  name text NOT NULL,
  avatar_url text,

  -- Role interno do Creative Studio
  creative_role text NOT NULL CHECK (creative_role IN ('admin', 'gerente', 'trafego', 'cs')),
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_erp_auth_user_id ON public.users(erp_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_creative_role ON public.users(creative_role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Trigger pra updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS desabilitado por enquanto (Creative Studio é acessado via
-- middleware + service role key do lado do servidor, não via client
-- direto com JWT do usuário).
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- Migration: usage_events table (tracking de cada ação do usuário)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem fez
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- O que aconteceu
  event_type text NOT NULL CHECK (event_type IN (
    'generate_single',      -- gerou 1 criativo no step 4 (wave 1, 2 ou 3)
    'generate_batch_item',  -- 1 item de lote no step 5
    'adjust_creative',      -- ajustou criativo existente
    'refine_prompt',        -- chamou /api/ai/refine-adjustment
    'export_creative'       -- exportou/aprovou criativo
  )),

  -- Contexto
  client_id uuid,           -- clients.id (cliente pro qual foi gerado)
  product_id uuid,          -- products.id (se existir)
  creative_id uuid,         -- creatives.id resultante

  -- Detalhes da geração
  style_family int,         -- 1-9
  typography_family int,    -- 1-6
  wave_index int,           -- 0, 1 ou 2 (step 4)
  batch_mode boolean DEFAULT false,
  model text,               -- "gpt-image-1.5", "gpt-4o-mini", etc

  -- Custo
  tokens_input int DEFAULT 0,
  tokens_output int DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0,

  -- Performance
  duration_ms int DEFAULT 0,

  -- Resultado
  outcome text CHECK (outcome IN ('success', 'error', 'fallback')),
  error_message text,

  -- Metadados livres
  metadata jsonb DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_client_id ON public.usage_events(client_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON public.usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_created ON public.usage_events(user_id, created_at DESC);

ALTER TABLE public.usage_events DISABLE ROW LEVEL SECURITY;

-- View agregada por dia/usuário (pra dashboard)
CREATE OR REPLACE VIEW public.usage_daily_by_user AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
  event_type,
  COUNT(*) AS event_count,
  SUM(COALESCE(cost_usd, 0)) AS total_cost_usd,
  SUM(COALESCE(duration_ms, 0)) AS total_duration_ms
FROM public.usage_events
GROUP BY user_id, day, event_type;

-- View de totais por usuário (all-time)
CREATE OR REPLACE VIEW public.usage_totals_by_user AS
SELECT
  u.id AS user_id,
  u.name,
  u.email,
  u.creative_role,
  u.avatar_url,
  COUNT(e.id) FILTER (WHERE e.event_type IN ('generate_single', 'generate_batch_item')) AS total_creatives,
  COUNT(e.id) FILTER (WHERE e.event_type = 'adjust_creative') AS total_adjustments,
  COUNT(e.id) FILTER (WHERE e.event_type = 'export_creative') AS total_exports,
  SUM(COALESCE(e.cost_usd, 0)) AS total_cost_usd,
  -- Tempo economizado: 17 minutos por criativo gerado
  (COUNT(e.id) FILTER (WHERE e.event_type IN ('generate_single', 'generate_batch_item')) * 17) AS minutes_saved,
  MAX(e.created_at) AS last_activity_at
FROM public.users u
LEFT JOIN public.usage_events e ON e.user_id = u.id
GROUP BY u.id, u.name, u.email, u.creative_role, u.avatar_url;
