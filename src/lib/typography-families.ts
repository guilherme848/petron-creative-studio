/**
 * TYPOGRAPHY FAMILIES — Petron Creative Studio
 *
 * 6 famílias tipográficas observadas em criativos reais de varejo MatCon BR.
 * Cada família define 2 camadas:
 *   - sealBlock  → estilo da tipografia do SELO de campanha (hero 3D)
 *   - bodyBlock  → estilo da tipografia de PRODUTO e PREÇO (corpo comercial)
 *   - globalBlock → regras globais injetadas no slot {{TYPOGRAPHY_FAMILY_BLOCK}}
 *
 * Uso:
 *  - Injeção via buildMasterPrompt() em 3 slots diferentes do prompt mestre
 *  - Seleção opcional pelo usuário (default: Modern Heavy Sans = 4)
 */

export interface TypographyFamily {
  /** ID numérico usado na UI e no briefing */
  id: number;
  /** Nome curto para exibir ao usuário */
  name: string;
  /** Descrição de 1 linha para UI */
  tagline: string;
  /** Quando usar essa família */
  useWhen: string;
  /** Bloco injetado perto do SELO de campanha (slot {{TYPOGRAPHY_SEAL_BLOCK}}) */
  sealBlock: string;
  /** Bloco injetado perto do NOME DO PRODUTO (slot {{TYPOGRAPHY_BODY_BLOCK}}) */
  bodyBlock: string;
  /** Bloco global injetado na seção "TYPOGRAPHY — GLOBAL RULES" (slot {{TYPOGRAPHY_FAMILY_BLOCK}}) */
  globalBlock: string;
}

export const TYPOGRAPHY_FAMILIES: Record<number, TypographyFamily> = {
  1: {
    id: 1,
    name: "Industrial Chrome",
    tagline: "Letras cromadas metalizadas, letreiro industrial vintage",
    useWhen: "Campanhas agressivas hard-sell, industrial, queima de estoque",
    sealBlock: `SEAL TYPOGRAPHY: Heavy extruded letters with chromed metallic finish. Brushed steel or polished chrome surface, real metallic reflections, hard drop shadows, slight perspective tilt. Letters look like they were carved from solid metal — like a vintage industrial workshop sign or a hot rod logo. Accents in gold or hot red. Never flat, never glossy plastic, never balloon.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Ultra-heavy condensed sans-serif, all caps, in deep red or pure black. High weight, minimal letter-spacing, commanding presence.`,
    globalBlock: `Global typography: Industrial Chrome family. The seal evokes vintage workshop signage and hot rod culture. Body text is heavy condensed sans-serif. The contrast is metal-on-grit.`,
  },

  2: {
    id: 2,
    name: "Glossy Balloon 3D",
    tagline: "Letras balão infladas glossy, mood festivo premium",
    useWhen: "Datas comemorativas, campanhas sazonais, público jovem",
    sealBlock: `SEAL TYPOGRAPHY: Inflated balloon-style 3D letters with super glossy plastic finish. Letters look puffy, rounded, and premium-glossy — like high-fashion candy or a luxury cartoon logo. Strong specular highlights on each letter, soft inner shadows, vibrant saturated colors with thin contrasting outline. Modern, joyful, premium-cute.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Heavy geometric sans-serif (Futura-Black-style), all caps or sentence case, in saturated brand color or contrasting hue.`,
    globalBlock: `Global typography: Glossy Balloon 3D family. The seal is festive and youth-coded — inflated, glossy, vibrant. Body is geometric sans-serif. Mood: upbeat, modern retail, "Instagrammable".`,
  },

  3: {
    id: 3,
    name: "Cupom Varejo Clássico",
    tagline: "Slab serif vermelho tabloide, encarte de supermercado BR",
    useWhen: "Hard-sell tradicional, DE/POR, preço como protagonista absoluto",
    sealBlock: `SEAL TYPOGRAPHY: Smaller, secondary seal — slab-serif chunky letters with thick square serifs (Rockwell-style). Rendered as a paper coupon with serrated dotted edges, fold marks, and slight paper texture. Vintage retail catalog feel.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Compact heavy sans-serif. PRICE TYPOGRAPHY: Massive slab-serif in bright red, with tight letter-spacing, comma decimal as small superscript, percentage off rendered as a circular red starburst seal in the corner. The price dominates the canvas. Inspired by Brazilian supermarket weekly inserts (encarte de supermercado).`,
    globalBlock: `Global typography: Cupom Varejo Clássico family. The protagonist is the PRICE, not the seal. Slab-serif red prices, coupon aesthetic, traditional Brazilian retail tabloid mood.`,
  },

  4: {
    id: 4,
    name: "Modern Heavy Sans",
    tagline: "Sans-serif moderno pesado, premium comercial clean",
    useWhen: "Premium retail, ticket alto, mood contemporâneo (DEFAULT)",
    sealBlock: `SEAL TYPOGRAPHY: Plain heavy sans-serif, no extrusion or only very subtle 3D depth. Clean, modern, contemporary — like a minimal premium retail brand. Maximum legibility, no decoration, no metallic effect. Single solid color or very subtle gradient.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Heavy modern sans-serif (Inter Black, Söhne Heavy, or similar geometric sans), high weight, generous spacing. Editorial-clean retail.`,
    globalBlock: `Global typography: Modern Heavy Sans family. Everything is sans-serif and intentionally restrained — but BOLD and HEAVY, never thin or elegant. No 3D, no metallic, no italic, no decoration. Premium positioning for higher ticket items or clean modern retail. Premium feel comes from typography weight + composition discipline + saturated brand color, NOT from decorative fonts.`,
  },

  5: {
    id: 5,
    name: "Handwritten Chunky 3D",
    tagline: "Letras escritas à mão com profundidade, mood emocional",
    useWhen: "Mensagens emocionais ('chegou', 'só hoje', 'última chance')",
    sealBlock: `SEAL TYPOGRAPHY: Hand-drawn marker-style letters with strong 3D depth and soft inner shadow. Letters look like they were quickly painted with a fat premium brush marker — slightly irregular, energetic, organic, but rendered with real volume and craftsmanship. Earnest and warm rather than slick.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Straight heavy sans-serif to contrast with the hand-painted seal. Provides the commercial anchor.`,
    globalBlock: `Global typography: Handwritten Chunky 3D family. The seal feels emotional and spontaneous — "chegou", "última chance", "só hoje". Body text is straight sans-serif for commercial credibility. The contrast (hand vs. machine) is the point.`,
  },

  6: {
    id: 6,
    name: "Editorial Premium Italic",
    tagline: "Serif italic editorial premium, gold foil, ticket muito alto",
    useWhen: "Lojas de design alto, produtos importados, minoria do mercado",
    sealBlock: `SEAL TYPOGRAPHY: Refined italic display serif (Bodoni, Didone, or Playfair-style) with high-contrast strokes — thick verticals and hairline horizontals. Elegant, editorial, magazine-cover quality. Optional gold foil finish. Used for store positioning rather than aggressive offers.`,
    bodyBlock: `PRODUCT NAME TYPOGRAPHY: Modern heavy sans-serif (clean and contemporary) to contrast with the editorial italic of the seal.`,
    globalBlock: `Global typography: Editorial Premium Italic family. Suited for premium architectural finishes, high-ticket products, design-forward stores. Restrained and sophisticated. Used by a minority of MatCon retailers but exists. WARNING: combine only with Premium Comercial Brasileiro style (3) to avoid looking like a European luxury brand catalog.`,
  },
};

/** Default typography family when none is provided in the briefing */
export const DEFAULT_TYPOGRAPHY_ID = 4; // Modern Heavy Sans

/** Lista ordenada de typography families pra exibição em UI */
export const TYPOGRAPHY_FAMILIES_LIST: TypographyFamily[] = Object.values(TYPOGRAPHY_FAMILIES);

/**
 * Combinações recomendadas entre style + typography.
 * Usado como default quando o usuário escolhe apenas um style
 * e deixa o typography em automático.
 */
export const RECOMMENDED_TYPOGRAPHY_FOR_STYLE: Record<number, number> = {
  1: 1, // Industrial Hard-Sale → Industrial Chrome
  2: 4, // Sazonal Festivo 3D → Modern Heavy Sans (evita cara infantil do Balloon)
  3: 4, // Premium Comercial Brasileiro → Modern Heavy Sans
  4: 3, // Liquidação Gritante → Cupom Varejo Clássico
  5: 4, // Friendly Daily Deal → Modern Heavy Sans (era Balloon, ficava infantil)
  6: 4, // Modern Black & Gold → Modern Heavy Sans
  7: 4, // Sazonal Split Hot → Modern Heavy Sans (era Balloon)
  8: 4, // Soft Feminine Promo → Modern Heavy Sans (era Balloon — premium adulto)
  9: 4, // Warm Sunset Sazonal → Modern Heavy Sans (era Balloon)
};
