/**
 * PROMPT COMPILER — Petron Creative Studio
 *
 * Função única buildMasterPrompt() que compila o prompt final pro gpt-image-1.5
 * a partir de um BriefingInput (dados do form /criar + cadastro de cliente/produto).
 *
 * Fluxo:
 *   Briefing → buildMasterPrompt → String final → gpt-image-1.5 / Gemini fallback
 *
 * Arquitetura:
 *   1. Seleciona STYLE_FAMILY e TYPOGRAPHY_FAMILY (com fallbacks)
 *   2. Resolve legacyStyleVariation (1-3) → styleFamily (1-9)
 *   3. Monta blocos condicionais (phone, address, validity, logo, spec, adjustment)
 *   4. Substitui todos os slots {{KEY}} no template mestre
 *   5. Retorna string pronta pra API de imagem
 */

import { MASTER_PROMPT_TEMPLATE } from "./master-prompt";
import {
  STYLE_FAMILIES,
  DEFAULT_STYLE_ID,
  LEGACY_STYLE_VARIATION_MAP,
} from "./style-families";
import {
  TYPOGRAPHY_FAMILIES,
  DEFAULT_TYPOGRAPHY_ID,
  RECOMMENDED_TYPOGRAPHY_FOR_STYLE,
} from "./typography-families";

export interface BriefingInput {
  /** Nome da loja (aparece no rodapé) */
  clientName: string;
  /** Cor primária da marca (hex) */
  primaryColor: string;
  /** Nome da campanha/promoção (aparece no selo 3D) */
  promotionName: string;
  /** Nome do produto */
  productName: string;
  /** Especificação técnica do produto (opcional) */
  productSpec?: string;
  /** Bloco de preço já formatado (ex: "De R$ 399,90 → Por R$ 279,90") */
  priceBlock: string;
  /** Texto do botão CTA verde WhatsApp */
  ctaText: string;
  /** Telefone (opcional, aparece abaixo do CTA) */
  phone?: string;
  /** Endereço da loja (opcional, aparece no rodapé) */
  storeAddress?: string;
  /** Bloco de validade (ex: "Ofertas válidas de X a Y") */
  validityBlock?: string;
  /**
   * ID da style family (1-9). Sobrepõe legacyStyleVariation se fornecido.
   * Ver style-families.ts
   */
  styleFamily?: number;
  /**
   * ID legado do fluxo atual da tela /criar (1, 2 ou 3).
   * Mapeado internamente para styleFamily via LEGACY_STYLE_VARIATION_MAP.
   * Usado quando styleFamily não é fornecido.
   */
  legacyStyleVariation?: number;
  /**
   * ID da typography family (1-6). Se não fornecido, usa a recomendada
   * para o style escolhido (RECOMMENDED_TYPOGRAPHY_FOR_STYLE).
   */
  typographyFamily?: number;
  /** Indica se há logo do cliente sendo fornecida via upload */
  hasLogo: boolean;
  /** Indica se há foto do produto sendo fornecida via upload */
  hasProductImage: boolean;
  /** Prompt livre de ajuste feito pelo usuário (quando refinando criativo) */
  adjustmentPrompt?: string;
}

/**
 * Compila o prompt mestre final a partir do briefing.
 * Função pura — mesma entrada sempre produz a mesma saída (exceto pelo seed).
 */
export function buildMasterPrompt(input: BriefingInput): string {
  // ─── 1. Resolver style family ──────────────────────────────────────────
  const resolvedStyleId =
    input.styleFamily ??
    (input.legacyStyleVariation
      ? LEGACY_STYLE_VARIATION_MAP[input.legacyStyleVariation]
      : undefined) ??
    DEFAULT_STYLE_ID;

  const styleFamily =
    STYLE_FAMILIES[resolvedStyleId] ?? STYLE_FAMILIES[DEFAULT_STYLE_ID];

  // ─── 2. Resolver typography family ─────────────────────────────────────
  const resolvedTypoId =
    input.typographyFamily ??
    RECOMMENDED_TYPOGRAPHY_FOR_STYLE[resolvedStyleId] ??
    DEFAULT_TYPOGRAPHY_ID;

  const typoFamily =
    TYPOGRAPHY_FAMILIES[resolvedTypoId] ??
    TYPOGRAPHY_FAMILIES[DEFAULT_TYPOGRAPHY_ID];

  // ─── 3. Montar blocos condicionais ─────────────────────────────────────
  const seed = Math.floor(Math.random() * 99999);

  const productSpecBlock = input.productSpec
    ? `Sub-label text reads: "${input.productSpec}". Smaller, supporting role.`
    : "";

  const phoneBlock = input.phone
    ? `Below the button, render the WhatsApp icon and the phone number "${input.phone}" in white bold.`
    : "";

  const storeAddressBlock = input.storeAddress
    ? `Render the address "${input.storeAddress}" as small text in the footer with a pin icon to its left.`
    : "";

  const validityBlock = input.validityBlock
    ? `Disclaimer text reads: "${input.validityBlock}".`
    : `Disclaimer text reads: "*IMAGEM MERAMENTE ILUSTRATIVA".`;

  const logoInstruction = input.hasLogo
    ? `The store logo is provided as a separate input image. Place it in the upper-right corner at small-to-medium size. Use it EXACTLY as provided — never modify, recolor, distort, or redraw it. Render this logo ONCE only.`
    : `Generate a small professional emblem-style badge for the store "${input.clientName}" — render this brand emblem ONCE only, in the upper-right corner. Do NOT duplicate the logo anywhere else.`;

  const adjustmentBlock = input.adjustmentPrompt
    ? `\nADDITIONAL ADJUSTMENT REQUESTED BY USER: ${input.adjustmentPrompt}`
    : "";

  // ─── 4. Mapeamento slots → valores ─────────────────────────────────────
  const slots: Record<string, string> = {
    PROMOTION_NAME: input.promotionName || "OFERTA ESPECIAL",
    PRODUCT_NAME: input.productName,
    PRODUCT_SPEC_BLOCK: productSpecBlock,
    PRICE_BLOCK: input.priceBlock,
    CTA_TEXT: input.ctaText,
    PHONE_BLOCK: phoneBlock,
    CLIENT_NAME: input.clientName,
    STORE_ADDRESS_BLOCK: storeAddressBlock,
    VALIDITY_BLOCK: validityBlock,
    PRIMARY_COLOR: input.primaryColor,
    LOGO_INSTRUCTION: logoInstruction,
    STYLE_FAMILY_BLOCK: styleFamily.block,
    TYPOGRAPHY_SEAL_BLOCK: typoFamily.sealBlock,
    TYPOGRAPHY_BODY_BLOCK: typoFamily.bodyBlock,
    TYPOGRAPHY_FAMILY_BLOCK: typoFamily.globalBlock,
    RANDOM_SEED: String(seed),
    ADJUSTMENT_BLOCK: adjustmentBlock,
  };

  // ─── 5. Substituir slots ────────────────────────────────────────────────
  let prompt = MASTER_PROMPT_TEMPLATE;
  for (const [key, value] of Object.entries(slots)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }

  return prompt;
}

/**
 * Helper puro: monta o priceBlock formatado a partir dos campos
 * brutos do briefing (priceType, price, previousPrice, unit, condition).
 *
 * Substitui a lógica inline que estava em route.ts para ficar
 * testável e reutilizável.
 */
export function formatPriceBlock(opts: {
  priceType: string;
  price: string;
  previousPrice?: string;
  unit?: string;
  condition?: string;
}): string {
  const unit = opts.unit ? ` ${opts.unit}` : "";
  const condition = opts.condition ? ` ${opts.condition}` : "";

  if (opts.priceType === "de-por" && opts.previousPrice) {
    return `Render two price elements. First, smaller and positioned above: "De R$ ${opts.previousPrice}" struck through with a thick red diagonal line. Second, the giant dominant element: "Por R$ ${opts.price}"${unit}${condition} — massive, bold, with "R$" smaller leading the integer and the comma decimal as superscript. The price must be the largest element after the campaign seal.`;
  }

  const label =
    opts.priceType === "por-apenas"
      ? "POR APENAS"
      : opts.priceType === "a-partir-de"
      ? "A PARTIR DE"
      : "";

  const labelText = label ? `"${label}" in a small pill above, then ` : "";

  return `Render the price as ${labelText}"R$ ${opts.price}"${unit}${condition} — massive, bold, heavy typography, with "R$" smaller leading the integer and the comma decimal as superscript. Inside a yellow or red retail price tag block with thick border and hard drop shadow, cupom-style when appropriate.`;
}

/**
 * Helper puro: monta o bloco de validade a partir de startDate + endDate.
 */
export function formatValidityBlock(
  startDate: string | undefined,
  endDate: string | undefined
): string | undefined {
  if (!startDate || !endDate) return undefined;
  try {
    const start = new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    const end = new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    return `Ofertas válidas de ${start} a ${end} | IMAGEM MERAMENTE ILUSTRATIVA`;
  } catch {
    return undefined;
  }
}
