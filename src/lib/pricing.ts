/**
 * PRICING — Petron Creative Studio
 *
 * Estimativa de custo em USD das chamadas de API que o Creative Studio faz.
 *
 * ═══════════════════════════════════════════════════════════════
 * Preços oficiais OpenAI gpt-image-2 (abril/2026, lançado 21/04/2026)
 * ═══════════════════════════════════════════════════════════════
 *
 * Por imagem 1024x1024 (valores oficiais OpenAI):
 *   - Low quality:    $0.006 por imagem
 *   - Medium quality: $0.053 por imagem  ← default da API (quality "auto")
 *   - High quality:   $0.211 por imagem
 *
 * Por tokens (cobrança alternativa):
 *   - Text input:        $5.00  / 1M tokens
 *   - Text cached input: $1.25  / 1M tokens
 *   - Text output:       $10.00 / 1M tokens
 *   - Image input:       $8.00  / 1M tokens (usado em /v1/images/edits)
 *   - Image cached:      $2.00  / 1M tokens
 *   - Image output:      $30.00 / 1M tokens
 *
 * Endpoint /v1/images/edits (multipart com input images):
 *   O route.ts envia product.png + logo.png + reference.png (até 3 inputs).
 *   Cada imagem de input pesa ~260 tokens a $8/1M = $0.0021 por input.
 *   Edit típico = medium ($0.053) + 2 inputs × $0.0021 = ~$0.057 por geração.
 *
 * Observação: o route.ts atual não passa `quality` pro gpt-image-2,
 * então a OpenAI usa "auto" que equivale a medium na maioria dos casos.
 *
 * Mudança vs gpt-image-1.5:
 *   - Medium subiu de $0.034 → $0.053 (+56%)
 *   - High subiu de $0.133 → $0.211 (+59%)
 *   - Low caiu de $0.009 → $0.006 (-33%)
 *   → Se custo total importa, considere passar quality:"low" em drafts.
 *
 * Batch API: halves os token rates (não implementado aqui, mas vale lembrar
 * que operações assíncronas em massa podem cair ~50% no custo).
 *
 * ═══════════════════════════════════════════════════════════════
 * gpt-4o-mini (usado no refine-adjustment)
 * ═══════════════════════════════════════════════════════════════
 *   - Input:  $0.150 / 1M tokens
 *   - Output: $0.600 / 1M tokens
 *
 * ═══════════════════════════════════════════════════════════════
 * Override via env vars (ajuste sem redeploy)
 * ═══════════════════════════════════════════════════════════════
 *
 *   OPENAI_IMAGE_COST_USD        (default: 0.053 — medium 1024x1024 image-2)
 *   OPENAI_IMAGE_EDIT_COST_USD   (default: 0.057 — medium + ~2 inputs)
 *   OPENAI_IMAGE_LOW_USD         (default: 0.006)
 *   OPENAI_IMAGE_HIGH_USD        (default: 0.211)
 *   OPENAI_4O_MINI_INPUT_PER_1M  (default: 0.15)
 *   OPENAI_4O_MINI_OUTPUT_PER_1M (default: 0.60)
 *   BRL_PER_USD                  (default: 5.40)
 *
 * Fontes:
 *   - https://developers.openai.com/api/docs/models/gpt-image-2
 *   - https://openai.com/api/pricing/
 *   - https://platform.openai.com/docs/pricing/
 */

const num = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const PRICING = {
  /**
   * Preço de 1 imagem gerada via /v1/images/generations
   * gpt-image-2 · 1024x1024 · quality "auto" (= medium)
   * Valor oficial OpenAI: $0.053 por imagem
   */
  imageGenerationUsd: num("OPENAI_IMAGE_COST_USD", 0.053),
  /**
   * Preço de 1 imagem via /v1/images/edits com inputs reais
   * Base medium ($0.053) + ~2 input images ($0.004) ≈ $0.057
   */
  imageEditUsd: num("OPENAI_IMAGE_EDIT_COST_USD", 0.057),
  /** gpt-image-2 · 1024x1024 · low quality */
  imageLowUsd: num("OPENAI_IMAGE_LOW_USD", 0.006),
  /** gpt-image-2 · 1024x1024 · high quality */
  imageHighUsd: num("OPENAI_IMAGE_HIGH_USD", 0.211),
  /** gpt-4o-mini — USD / 1M input tokens */
  mini4oInputPerMillion: num("OPENAI_4O_MINI_INPUT_PER_1M", 0.15),
  /** gpt-4o-mini — USD / 1M output tokens */
  mini4oOutputPerMillion: num("OPENAI_4O_MINI_OUTPUT_PER_1M", 0.6),
  /**
   * Cotação USD→BRL pra exibir no dashboard em reais.
   * Abril/2026: ~R$ 5.20-5.80. Default 5.40.
   * Ajustar via env var BRL_PER_USD quando a cotação mudar significativamente.
   */
  brlPerUsd: num("BRL_PER_USD", 5.4),
} as const;

export type ImageQuality = "low" | "medium" | "high";

/**
 * Estima o custo em USD de 1 geração de imagem pelo gpt-image-2.
 *
 * @param hasInputImages — true quando a requisição usa /v1/images/edits
 *   com input images (produto, logo, referência). Nesse caso soma o custo
 *   dos input image tokens ao custo base.
 * @param quality — "low" | "medium" | "high" | undefined (default medium,
 *   que é o que a API entrega quando quality="auto" não é especificado).
 */
export function estimateImageCost(
  hasInputImages: boolean,
  quality?: ImageQuality
): number {
  // Custo base da geração por quality tier
  let base: number;
  switch (quality) {
    case "low":
      base = PRICING.imageLowUsd;
      break;
    case "high":
      base = PRICING.imageHighUsd;
      break;
    case "medium":
    default:
      base = PRICING.imageGenerationUsd;
      break;
  }

  // Se /edits, adiciona delta dos input image tokens.
  // Calculado como: edit_default - generation_default (o delta médio)
  if (hasInputImages) {
    const delta = PRICING.imageEditUsd - PRICING.imageGenerationUsd;
    return base + Math.max(0, delta);
  }
  return base;
}

/**
 * Estima o custo em USD de 1 chamada do gpt-4o-mini pra refinar prompt.
 * Baseado em tokens de input e output reais retornados pela API.
 */
export function estimate4oMiniCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING.mini4oInputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * PRICING.mini4oOutputPerMillion;
  return inputCost + outputCost;
}

/** Converte USD pra BRL usando a cotação configurada */
export function usdToBrl(usd: number): number {
  return usd * PRICING.brlPerUsd;
}

/** Formata USD com 4 casas decimais (ex: $0.0712) */
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

/** Formata BRL com 2 casas decimais (ex: R$ 0,37) */
export function formatBrl(brl: number): string {
  return `R$ ${brl.toFixed(2).replace(".", ",")}`;
}

/**
 * Minutos economizados por criativo gerado (baseline definido pelo PO).
 * Se um designer humano levava ~17min pra fazer cada criativo manualmente,
 * cada geração do Creative Studio economiza esse tempo.
 */
export const MINUTES_SAVED_PER_CREATIVE = 17;

/** Converte minutos economizados em string amigável ("3h 12min" ou "45min") */
export function formatMinutesSaved(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
