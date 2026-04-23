/**
 * PROMPT COMPILER — Petron Creative Studio
 *
 * Função única buildMasterPrompt() que compila o prompt final pro gpt-image-2
 * a partir de um BriefingInput (dados do form /criar + cadastro de cliente/produto).
 *
 * Fluxo:
 *   Briefing → buildMasterPrompt → String final → gpt-image-2 / Gemini fallback
 *
 * Arquitetura:
 *   1. Seleciona STYLE_FAMILY e TYPOGRAPHY_FAMILY (com fallbacks)
 *   2. Resolve legacyStyleVariation (1-3) → styleFamily (1-9)
 *   3. Monta blocos condicionais (phone, address, validity, logo, spec, adjustment)
 *   4. Substitui todos os slots {{KEY}} no template mestre
 *   5. Retorna string pronta pra API de imagem
 */

import { MASTER_PROMPT_TEMPLATE, BATCH_MODE_PROMPT_TEMPLATE } from "./master-prompt";
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
  /**
   * Modo batch: quando true, ignora master prompt normal e usa um template
   * específico focado em CONTENT SWAP cirúrgico — clona a referência visual
   * exatamente, substituindo apenas produto/preço/nome/spec. Usado no
   * step 5 (geração em lote) onde há sempre uma referenceImage.
   */
  batchMode?: boolean;
}

/**
 * Compila o prompt mestre final a partir do briefing.
 * Função pura — mesma entrada sempre produz a mesma saída (exceto pelo seed).
 */
export function buildMasterPrompt(input: BriefingInput): string {
  // ─── BATCH MODE: usa template cirúrgico de content swap ──────────────
  if (input.batchMode) {
    return buildBatchPrompt(input);
  }

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

  const productImageInstruction = input.hasProductImage
    ? `CRITICAL — PRODUCT PHOTOGRAPH FROM INPUT: A real product photograph is provided as an input image. Use it EXACTLY as provided. Do NOT redraw, do NOT reinterpret, do NOT stylize, do NOT change the packaging, label, or colors. The product in the final creative must be visually IDENTICAL to the uploaded photo — the exact same brand, label text, packaging design, proportions, and colors. Only composite it into the scene: size it at 30-45% of the canvas area, add a realistic drop shadow to ground it on the background, and position it per the layout rules. Preserve every visual detail of the original product photograph. This is non-negotiable — the uploaded product image is authoritative.`
    : `PRODUCT RENDERING: Generate the product with the aesthetic of a real catalog or PDV photograph — sharp focus, realistic lighting, natural drop shadow, authentic packaging with readable labels. Never a 3D render, never plastic-looking, never AI-styled.`;

  // Footer contact block — endereço + telefone lado a lado, elegantes
  const hasAddress = !!input.storeAddress;
  const hasPhone = !!input.phone;

  let storeContactBlock = "";
  if (hasAddress && hasPhone) {
    storeContactBlock = `Render two contact elements in the footer, balanced side by side (or stacked on two lines if tight):
  1. ADDRESS: a small location pin icon followed by the text "${input.storeAddress}"
  2. PHONE: a small WhatsApp icon (green rounded speech bubble) followed by the text "${input.phone}"
Both in the same small elegant weight, both in neutral color (white on dark bg, dark gray on light bg), both at the very bottom of the canvas. The phone is visual-only here — the WhatsApp icon signals "also reachable via WhatsApp" but does NOT duplicate or compete with the green CTA button above.`;
  } else if (hasAddress) {
    storeContactBlock = `Render the address with a small location pin icon followed by the text "${input.storeAddress}" in small elegant weight, neutral color, at the very bottom of the canvas.`;
  } else if (hasPhone) {
    storeContactBlock = `Render a small WhatsApp icon (green rounded speech bubble) followed by the phone number "${input.phone}" in small elegant weight, neutral color, at the very bottom of the canvas. NOT next to the green CTA button — this is a secondary contact display in the footer.`;
  } else {
    storeContactBlock = `(No address or phone provided — footer shows only store name.)`;
  }

  // Validity block — agora é um badge proeminente, não mais disclaimer vertical sutil
  // Quando há datas, renderiza um selo horizontal com destaque visual real.
  // Quando não há, fica apenas o disclaimer legal "*IMAGEM MERAMENTE ILUSTRATIVA".
  let validityBlock = "";
  if (input.validityBlock && input.validityBlock.toUpperCase().includes("VÁLID")) {
    // Extrai só a parte de validade (sem o "IMAGEM MERAMENTE ILUSTRATIVA" se vier junto)
    const validityText = input.validityBlock.split("|")[0].trim();
    validityBlock = `VALIDITY BADGE — this is a PROMINENT and highly visible element, not a small disclaimer. Render it as a horizontal pill or ribbon badge with strong visual presence, positioned between the price block and the CTA button (or immediately above the CTA), with its own distinct background color that contrasts with the main background (white pill on dark bg, or yellow/red pill on light bg). The pill has a small calendar icon on the left followed by the text in bold.
Badge text exactly reads: "${validityText.toUpperCase()}"
Typography: heavy sans-serif, bold, all caps. Make it CLEARLY legible — the user must not miss that this offer has a time limit. If the validity range is short (1-5 days), treat this with even more visual urgency.
Additionally, render a small italic disclaimer "*IMAGEM MERAMENTE ILUSTRATIVA" in the very bottom edge, low-contrast.`;
  } else if (input.validityBlock) {
    // Fallback — tem validity mas em formato diferente
    validityBlock = `VALIDITY BADGE: Render a horizontal pill with a calendar icon and the text: "${input.validityBlock}". Position between price and CTA, prominent and clearly legible, heavy sans-serif bold all caps, with a distinct background color.`;
  } else {
    validityBlock = `(No validity dates provided.) Render a small italic disclaimer "*IMAGEM MERAMENTE ILUSTRATIVA" in the very bottom edge of the canvas, low-contrast, secondary.`;
  }

  const logoInstruction = input.hasLogo
    ? `CRITICAL — STORE LOGO FROM INPUT: The store logo is provided as a separate input image. Use it EXACTLY as provided — never modify, recolor, distort, redraw, or stylize it. Place it in the upper-right corner of the canvas at small-to-medium size with clean margins. Render this logo ONCE only — do NOT duplicate it anywhere else in the composition.`
    : `Generate a small professional emblem-style badge for the store "${input.clientName}" — render this brand emblem ONCE only, in the upper-right corner. Do NOT duplicate the logo anywhere else.`;

  // USER GUIDANCE BLOCK — orientações livres do usuário injetadas com
  // alta prioridade ANTES do OUTPUT SPECIFICATION. Essas instruções têm
  // precedência sobre regras de layout, composição e estilo — mas NÃO
  // sobrescrevem as ANTI-AI CHECKS (que são absolutas).
  const userGuidanceBlock = input.adjustmentPrompt?.trim()
    ? `═══════════════════════════════════════════════════════════
USER GUIDANCE — HIGH PRIORITY INSTRUCTIONS
═══════════════════════════════════════════════════════════

The user has provided the following specific guidance for THIS creative. Apply these instructions with HIGH PRIORITY — they override the default layout, composition, and style decisions above. However, they do NOT override the ANTI-AI CHECKS (those remain absolute) or the CONTENT section (product name, price, CTA, store info must still appear exactly as specified).

USER INSTRUCTIONS (in Brazilian Portuguese, apply their intent):
"${input.adjustmentPrompt.trim()}"

Apply these instructions while preserving:
- The chosen visual style family
- All text content in the CONTENT section (product name, price, CTA, etc.)
- The ANTI-AI CHECKS
- The brand color and store logo positioning`
    : "";

  // ─── 4. Mapeamento slots → valores ─────────────────────────────────────
  const slots: Record<string, string> = {
    PROMOTION_NAME: input.promotionName || "OFERTA ESPECIAL",
    PRODUCT_NAME: input.productName,
    PRODUCT_SPEC_BLOCK: productSpecBlock,
    PRODUCT_IMAGE_INSTRUCTION: productImageInstruction,
    PRICE_BLOCK: input.priceBlock,
    CTA_TEXT: input.ctaText,
    CLIENT_NAME: input.clientName,
    STORE_CONTACT_BLOCK: storeContactBlock,
    VALIDITY_BLOCK: validityBlock,
    PRIMARY_COLOR: input.primaryColor,
    LOGO_INSTRUCTION: logoInstruction,
    STYLE_FAMILY_BLOCK: styleFamily.block,
    TYPOGRAPHY_SEAL_BLOCK: typoFamily.sealBlock,
    TYPOGRAPHY_BODY_BLOCK: typoFamily.bodyBlock,
    TYPOGRAPHY_FAMILY_BLOCK: typoFamily.globalBlock,
    RANDOM_SEED: String(seed),
    USER_GUIDANCE_BLOCK: userGuidanceBlock,
  };

  // ─── 5. Substituir slots ────────────────────────────────────────────────
  let prompt = MASTER_PROMPT_TEMPLATE;
  for (const [key, value] of Object.entries(slots)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }

  return prompt;
}

/**
 * Compila o prompt BATCH MODE — usado na geração em lote (step 5).
 * Template cirúrgico focado em CONTENT SWAP, não em redesign.
 *
 * Preserva pixel a pixel a imagem de referência e substitui APENAS:
 *   - Foto do produto (via input image #2 no multipart)
 *   - Nome do produto (texto)
 *   - Spec do produto (texto)
 *   - Bloco de preço (texto, mas mantendo o visual treatment da referência)
 *
 * Outros campos (promoção, cliente, endereço) são usados APENAS para
 * referência contextual — eles NÃO devem mudar visualmente se já estavam
 * na referência.
 */
function buildBatchPrompt(input: BriefingInput): string {
  const seed = Math.floor(Math.random() * 99999);

  const productSpecReplacement = input.productSpec
    ? `2b. PRODUCT SPEC TEXT: replace with "${input.productSpec}" in the same position and style as the reference.`
    : "";

  const slots: Record<string, string> = {
    PRODUCT_NAME: input.productName,
    PRODUCT_SPEC_REPLACEMENT: productSpecReplacement,
    PRICE_BLOCK: input.priceBlock,
    PROMOTION_NAME: input.promotionName || "OFERTA ESPECIAL",
    CLIENT_NAME: input.clientName,
    RANDOM_SEED: String(seed),
  };

  let prompt = BATCH_MODE_PROMPT_TEMPLATE;
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
 * Agora retorna um texto compacto só com as datas (ex: "Válido de 10 a 15
 * de abril") — o disclaimer legal "IMAGEM MERAMENTE ILUSTRATIVA" é renderizado
 * separadamente pelo compilador no rodapé.
 *
 * Também detecta promoções curtas (<=5 dias) e usa "HOJE", "AMANHÃ" ou
 * "SÓ HOJE E AMANHÃ" quando aplicável para dar urgência extra.
 */
export function formatValidityBlock(
  startDate: string | undefined,
  endDate: string | undefined
): string | undefined {
  if (!startDate || !endDate) return undefined;
  try {
    const start = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((end.getTime() - start.getTime()) / dayMs);

    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

    // Promoção de 1 dia
    if (diffDays === 0) {
      return `Válido apenas em ${fmt(start)}`;
    }
    // Promoção de 2 dias
    if (diffDays === 1) {
      return `Válido ${fmt(start)} e ${fmt(end)}`;
    }
    // Promoção curta (até 5 dias) — mais urgência
    if (diffDays <= 5) {
      return `Oferta relâmpago: ${fmt(start)} a ${fmt(end)}`;
    }
    // Promoção normal
    return `Válido de ${fmt(start)} a ${fmt(end)}`;
  } catch {
    return undefined;
  }
}
