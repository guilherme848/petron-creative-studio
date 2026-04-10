/**
 * USAGE TRACKING — Petron Creative Studio
 *
 * Helper server-side que registra cada evento significativo
 * (geração, ajuste, refine, export) na tabela public.usage_events.
 *
 * Chamado a partir de route handlers (/api/ai/*). Nunca bloqueia o fluxo:
 * se o tracking falhar, loga o erro e segue — a resposta ao usuário é
 * entregue normalmente.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UsageEventType =
  | "generate_single"
  | "generate_batch_item"
  | "adjust_creative"
  | "refine_prompt"
  | "export_creative";

export interface UsageEventInput {
  userId: string; // users.id (local — não o erp_auth_user_id)
  eventType: UsageEventType;

  clientId?: string | null;
  productId?: string | null;
  creativeId?: string | null;

  styleFamily?: number | null;
  typographyFamily?: number | null;
  waveIndex?: number | null;
  batchMode?: boolean;
  model?: string | null;

  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;

  durationMs?: number;

  outcome?: "success" | "error" | "fallback";
  errorMessage?: string | null;

  metadata?: Record<string, unknown>;
}

/**
 * Registra um evento de uso. Fire-and-forget — nunca lança exceção
 * pro caller. Se falhar, loga no console e continua.
 */
export async function logUsageEvent(input: UsageEventInput): Promise<void> {
  try {
    await supabase.from("usage_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      client_id: input.clientId ?? null,
      product_id: input.productId ?? null,
      creative_id: input.creativeId ?? null,
      style_family: input.styleFamily ?? null,
      typography_family: input.typographyFamily ?? null,
      wave_index: input.waveIndex ?? null,
      batch_mode: input.batchMode ?? false,
      model: input.model ?? null,
      tokens_input: input.tokensInput ?? 0,
      tokens_output: input.tokensOutput ?? 0,
      cost_usd: input.costUsd ?? 0,
      duration_ms: input.durationMs ?? 0,
      outcome: input.outcome ?? "success",
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error(
      "[tracking] Failed to log usage event:",
      err instanceof Error ? err.message : err
    );
  }
}
