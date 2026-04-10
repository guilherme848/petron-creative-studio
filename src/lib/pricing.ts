/**
 * PRICING — Petron Creative Studio
 *
 * Estimativa de custo em USD das chamadas de API que o Creative Studio faz.
 *
 * ═══════════════════════════════════════════════════════════════
 * Preços oficiais OpenAI (referência abril 2026)
 * ═══════════════════════════════════════════════════════════════
 *
 * gpt-image-1 / gpt-image-1.5  (cobrado por tokens de output de imagem)
 *   - Text tokens:    $5.00 / 1M input,  $40.00 / 1M output
 *   - Image tokens:   $40.00 / 1M output
 *
 *   Tokens por imagem 1024x1024 (quality: "auto" = medium):
 *     ~1056 image output tokens → 1056 × $40/1M = $0.0422 por imagem
 *
 *   Endpoint /v1/images/edits (multipart com input images):
 *     Mesmo custo de output + custo dos input image tokens
 *     Cada imagem de input pesa ~260 tokens adicionais
 *     2 inputs (produto + logo) = ~520 tokens * $10/1M = $0.0052
 *     Total: ~$0.0474 por edit com 2 imagens de input
 *
 * gpt-4o-mini  (usado no refine-adjustment)
 *   - Input:  $0.150 / 1M tokens
 *   - Output: $0.600 / 1M tokens
 *
 * ═══════════════════════════════════════════════════════════════
 * Override via env vars (ajuste sem redeploy)
 * ═══════════════════════════════════════════════════════════════
 *
 *   OPENAI_IMAGE_COST_USD        (default: 0.042)
 *   OPENAI_IMAGE_EDIT_COST_USD   (default: 0.048)
 *   OPENAI_4O_MINI_INPUT_PER_1M  (default: 0.15)
 *   OPENAI_4O_MINI_OUTPUT_PER_1M (default: 0.60)
 *   BRL_PER_USD                  (default: 5.20)
 *
 * Quando a OpenAI mudar os preços, você só atualiza a env var no Vercel
 * e reinicia — nenhum deploy de código necessário.
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
   * gpt-image-1.5 · 1024x1024 · quality "auto" (medium)
   * = 1056 image output tokens × $40/1M = $0.0422
   */
  imageGenerationUsd: num("OPENAI_IMAGE_COST_USD", 0.042),
  /**
   * Preço de 1 imagem via /v1/images/edits com 1-3 input images
   * Base: $0.0422 (output) + ~$0.006 (input image tokens) = ~$0.048
   */
  imageEditUsd: num("OPENAI_IMAGE_EDIT_COST_USD", 0.048),
  /** gpt-4o-mini — USD / 1M input tokens */
  mini4oInputPerMillion: num("OPENAI_4O_MINI_INPUT_PER_1M", 0.15),
  /** gpt-4o-mini — USD / 1M output tokens */
  mini4oOutputPerMillion: num("OPENAI_4O_MINI_OUTPUT_PER_1M", 0.6),
  /**
   * Cotação USD→BRL pra exibir no dashboard em reais.
   * Abril/2026: ~R$ 5.20-5.80. Default conservador 5.40.
   * Ajustar via env var BRL_PER_USD quando a cotação mudar significativamente.
   */
  brlPerUsd: num("BRL_PER_USD", 5.4),
} as const;

/**
 * Estima o custo em USD de 1 geração de imagem pelo gpt-image-1.5.
 * Se hasInputImages=true, usa o pricing de /edits (mais caro) — senão /generations.
 */
export function estimateImageCost(hasInputImages: boolean): number {
  return hasInputImages ? PRICING.imageEditUsd : PRICING.imageGenerationUsd;
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
