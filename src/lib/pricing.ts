/**
 * PRICING — Petron Creative Studio
 *
 * Estimativa de custo em USD das chamadas de API que o Creative Studio faz.
 * Valores baseados no pricing público da OpenAI (abril 2026, 1024x1024 quality
 * médio). Ajustável via env vars pra acompanhar mudanças de preço sem deploy:
 *
 *   OPENAI_IMAGE_COST_USD        = 0.07    (padrão gpt-image-1.5 1024x1024)
 *   OPENAI_IMAGE_EDIT_COST_USD   = 0.10    (padrão gpt-image-1.5 /edits 1024x1024)
 *   OPENAI_4O_MINI_INPUT_PER_1M  = 0.15    (USD por 1M input tokens)
 *   OPENAI_4O_MINI_OUTPUT_PER_1M = 0.60    (USD por 1M output tokens)
 *
 * Cotação USD→BRL também configurável:
 *   BRL_PER_USD = 5.20
 */

const num = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const PRICING = {
  /** Preço de 1 imagem gerada via /v1/images/generations (gpt-image-1.5 1024x1024) */
  imageGenerationUsd: num("OPENAI_IMAGE_COST_USD", 0.07),
  /** Preço de 1 imagem via /v1/images/edits (multipart com inputs) */
  imageEditUsd: num("OPENAI_IMAGE_EDIT_COST_USD", 0.10),
  /** Input token (gpt-4o-mini) USD / 1M */
  mini4oInputPerMillion: num("OPENAI_4O_MINI_INPUT_PER_1M", 0.15),
  /** Output token (gpt-4o-mini) USD / 1M */
  mini4oOutputPerMillion: num("OPENAI_4O_MINI_OUTPUT_PER_1M", 0.60),
  /** Cotação USD→BRL pra exibir no dashboard em reais */
  brlPerUsd: num("BRL_PER_USD", 5.2),
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
