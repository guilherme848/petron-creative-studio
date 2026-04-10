/**
 * STYLE FAMILIES — Petron Creative Studio
 *
 * 9 famílias visuais extraídas e validadas contra referências reais
 * do varejo MatCon brasileiro (Simplifique, Santa Cruz, Lediô, Rei dos Pisos,
 * Morada Nova, Renovar, Construfácil, etc.).
 *
 * Cada família define: mood, paleta, fundo, decoração, tipo de selo,
 * densidade visual, e benchmark real.
 *
 * Uso:
 *  - Injeção via buildMasterPrompt() no slot {{STYLE_FAMILY_BLOCK}}
 *  - Apresentação ao usuário na tela /criar (step 4)
 *
 * Densidade visual:
 *  - HIGH: cenas densas, industrial, fundo texturizado, muitos elementos
 *  - LOW : composição respirada, produto isolado, fundo limpo, split layouts
 */

export type StyleDensity = "high" | "low";

export interface StyleFamily {
  /** ID numérico usado na UI e no briefing */
  id: number;
  /** Nome curto para exibir ao usuário */
  name: string;
  /** Descrição de 1 linha para UI (tooltip, badge, etc.) */
  tagline: string;
  /** Densidade visual da composição */
  density: StyleDensity;
  /** Quando usar esse estilo (orientação para o usuário) */
  useWhen: string;
  /** Bloco de texto injetado no prompt mestre (slot {{STYLE_FAMILY_BLOCK}}) */
  block: string;
}

export const STYLE_FAMILIES: Record<number, StyleFamily> = {
  1: {
    id: 1,
    name: "Industrial Hard-Sale",
    tagline: "Cenário industrial, concreto, fita amarela de obra",
    density: "high",
    useWhen: "Campanhas agressivas de desconto alto, hard-sell, queima de estoque",
    block: `Family: INDUSTRIAL HARD-SALE.
Background: dark textured surface — rough concrete, raw construction site, dirty steel plate, or hexagonal metal grid. Warm industrial golden lighting from upper left, with soft dust particles in the air. Bottom corner has yellow-and-black hazard tape diagonal stripes.
Color palette: deep black, industrial gold, hot red, warning yellow, chromed silver. Saturated, high contrast, hard shadows.
Decorative elements: heavy chains, metal screws, wrenches, clamps, or construction tape — placed at edges, never competing with product or price.
Mood: aggressive, urgent, "queima de estoque", hard discount, "só hoje", masculine retail.
Reference benchmarks: Simplifique Home Center "72H E SURRA DE PREÇO BAIXO" campaigns.`,
  },

  2: {
    id: 2,
    name: "Sazonal Festivo 3D",
    tagline: "Gradiente vibrante, selo 3D temático, moedas/cifrões flutuando",
    density: "high",
    useWhen: "Datas comemorativas (Mulher, Mães, Consumidor, Black Friday, Natal)",
    block: `Family: SAZONAL FESTIVO 3D (festivo adulto comercial — nunca infantil).
Background: vibrant saturated gradient in the brand primary color, fading to a darker shade. Smooth, modern, slightly glossy.
Decorative elements: floating 3D ABSTRACT OBJECTS ONLY — coins, dollar signs (cifrões), percentage symbols, gift boxes, sparkle accents, confetti, ribbon arcs, calendar date numbers, shopping bag icons. All rendered in glossy 3D with realistic lighting and soft drop shadows. Elements are placed around the seal and edges, never on top of the product.
CRITICAL — NEVER render: mascots, cartoon characters, human figures, humanoid shapes, personified tools (hammers with faces, paint cans with eyes, etc.), construction workers, animals, toys, or any anthropomorphic elements. NO characters of any kind. The decoration is purely abstract retail iconography.
Color palette: vibrant saturated colors — hot pink, electric purple, bright orange, sunshine yellow, sky blue. High glossy finish.
Mood: festive adult commercial retail, sazonal campaign (Mother's Day, Consumer Week, Black Friday, Easter, Christmas). Energetic and joyful but professional — NEVER youth-cute, NEVER cartoon, NEVER childish, NEVER Instagrammable-candy. Think: modern Brazilian retail agency campaign, not children's TV or toy packaging.
Reference benchmarks: Renovar "Chegou Abril Preço Caiu", Lediô "Hoje tem Ofertão", Rei dos Pisos "Especial Semana da Mulher" — all adult commercial, all abstract decoration.`,
  },

  3: {
    id: 3,
    name: "Premium Comercial Brasileiro",
    tagline: "Vermelho saturado, produto isolado em curva branca, tipografia clean",
    density: "low",
    useWhen: "Produtos de ticket alto, lojas premium de varejo MatCon (Santa Cruz-style)",
    block: `Family: PREMIUM COMERCIAL BRASILEIRO.
Background: solid saturated brand primary color covering 60-70% of the canvas (NOT burgundy or muted wine — use the actual brand color, fully saturated). Soft white or cream curved/rounded shape on the lower right or center where the product sits. Optional very subtle brand pattern or texture in the background at low opacity.
Decorative elements: minimal but present — a thin gold or white horizontal accent line, small geometric badge "OFERTA EXCLUSIVA" or "OPORTUNIDADE", and the campaign seal at the top. NO heavy 3D objects, NO chains, NO confetti, NO floating hearts. But also NOT empty — every area still has a commercial purpose.
Color palette: brand primary color (saturated) + white + black + a single accent (gold or contrasting color). Three-color discipline.
Mood: premium retail, ticket alto, design-forward but still loud and commercial. The store is selling expensive products but is STILL a Brazilian retailer, not a European luxury brand. Confident, refined, but unmistakably comercial varejo MatCon BR.
Reference benchmark: Santa Cruz Casa & Construção "Cuba Porcelana" — vermelho saturado, preço grande preto, cuba isolada, CTA verde, endereço. Premium feel BUT still loud commercial Brazilian retail.
NEVER look like: a European luxury brand catalog (Roca, Deca, Hansgrohe). NEVER look like Vogue.`,
  },

  4: {
    id: 4,
    name: "Liquidação Gritante",
    tagline: "Amarelo + vermelho + preto, tabloide, starbursts, MEGA OFERTA",
    density: "high",
    useWhen: "Saldão, queima total, clearance, final de coleção",
    block: `Family: LIQUIDAÇÃO GRITANTE.
Background: massive saturated yellow color block covering 60-70% of the canvas, with bold black diagonal stripes at the edges. A red color band covers the upper area where the campaign seal sits. Optionally a darker red strip on the bottom for the CTA contrast.
Decorative elements: huge starbursts, exploding shapes, "MEGA OFERTA" badges, percentage burst seals, repeating "%" symbols floating at low opacity in the background. Heavy, loud, almost overwhelming but organized with clear hierarchy.
Color palette: yellow + red + black + white only. Maximum saturation, maximum contrast, no gradients, no pastel.
Mood: clearance, blowout sale, "saldão", "queima total", "tudo deve sair", final hours, panic-buy urgency, masculine hardware retail.
Reference benchmarks: Morada Nova "Semana do Consumidor", popular hard-sell weekly newspaper inserts, Brazilian supermarket tabloid encartes.`,
  },

  5: {
    id: 5,
    name: "Friendly Daily Deal",
    tagline: "Split limpo, selo 3D com cifrões dourados, mood amigável",
    density: "low",
    useWhen: "Ofertas diárias, postagem semanal, mood friendly/acessível (Lediô-style)",
    block: `Family: WHATSAPP FRIENDLY DAILY DEAL.
Background: split layout — upper 40% in commercial blue or the brand primary color where the campaign seal sits, lower 60% in clean light yellow or white where the product and price sit. The split is clean and modern with a soft horizontal divider or curve. Optionally a subtle dotted texture or bokeh light spots at very low opacity.
Decorative elements: only thematic 3D objects around the campaign seal — golden cifrões ("$"), golden coins, sparkle accents. NO chains, NO industrial elements, NO confetti spread across the canvas, NO floating decorations near the product or price.
Color palette: brand color + yellow + white + gold. Saturated but not aggressive. Modern friendly retail.
Mood: friendly, joyful, daily offer, "ofertão" feel, accessible commercial, scroll-stopping but calm. Clearly Brazilian retail Instagram aesthetic.
Reference benchmark: Lediô "Hoje tem Ofertão" — clean split layout, glossy 3D campaign seal with floating golden elements, isolated product on clean background, prominent price pill, green CTA, footer info.
Composition density: LOW — generous whitespace between elements, isolated product, mobile-first breathing room.`,
  },

  6: {
    id: 6,
    name: "Modern Black & Gold",
    tagline: "Fundo preto, moedas douradas 3D, tipografia moderna",
    density: "low",
    useWhen: "Campanhas mensais premium-populares (abril, outubro, Black Friday)",
    block: `Family: MODERN BLACK & GOLD.
Background: solid deep black or very dark charcoal across the entire canvas. Optional subtle radial gradient with a soft golden glow behind the campaign seal at the top. NO heavy texture, NO concrete, NO industrial.
Decorative elements: floating 3D golden coins of various sizes around the campaign seal at the top. NO coins or decorations near the product or price. Optional thin gold accent lines as dividers.
Color palette: deep black + premium gold + white + warm gold accents. Sophisticated but still commercial.
Mood: monthly campaign, premium-popular, modern, sophisticated, but still loud commercial Brazilian retail. Black-tie meets street fair.
Reference benchmark: Rei dos Pisos "Ofertas de Abril" — black background, golden 3D coins floating around the seal, isolated product on clean dark, prominent green CTA.
Composition density: LOW — generous whitespace, product isolated on clean dark background.`,
  },

  7: {
    id: 7,
    name: "Sazonal Split Hot",
    tagline: "Split laranja + navy, selo 3D com moedas e fitas, calor sazonal",
    density: "low",
    useWhen: "Campanhas sazonais quentes (abril, outubro, chegada de estação)",
    block: `Family: SAZONAL SPLIT HOT.
Background: split layout — upper 50% in warm orange where the campaign seal sits, lower 50% in deep navy or dark contrast where the product and price sit. The split is a clean horizontal divider, possibly with a soft curve or slight diagonal. Optional very subtle bokeh light spots on the orange side.
Decorative elements: floating 3D golden coins, small petals, and thematic ribbon ONLY around the campaign seal at the top. NO decorations near the product or price. Optional small diagonal stripes at the very bottom edge.
Color palette: warm orange + deep navy + white + gold accents. Saturated, energetic, warm.
Mood: seasonal monthly campaign, "chegou abril", joyful warmth, energetic but calm composition, friendly Brazilian retail.
Reference benchmark: Renovar "Chegou Abril Preço Caiu" — split warm color layout, glossy 3D seasonal seal with floating decorations, isolated product on clean lower zone, prominent green CTA.
Composition density: LOW — generous whitespace, isolated product, 2 clear color zones.`,
  },

  8: {
    id: 8,
    name: "Soft Feminine Promo",
    tagline: "Gradiente rosa/roxo, corações 3D, feminino premium",
    density: "low",
    useWhen: "Semana da Mulher, Dia das Mães, produtos voltados ao público feminino",
    block: `Family: SOFT FEMININE PROMO.
Background: smooth gradient from vibrant purple at the top to hot pink at the bottom, with a soft white curved or rounded shape on the lower right where the product sits. Optional very subtle bokeh light spots or sparkle accents.
Decorative elements: floating 3D purple and pink hearts of various sizes around the campaign seal at the top. NO decorations near the product or price. Optional thin gold accent lines.
Color palette: vibrant purple + hot pink + white + gold accents. Saturated, feminine, premium.
Mood: women's week campaign, feminine, premium-cute, celebratory, joyful, modern Brazilian retail.
Reference benchmark: Rei dos Pisos "Especial Semana da Mulher" — gradient feminine layout, glossy 3D seal with floating hearts, isolated product on clean curved background, prominent green CTA.
Composition density: LOW — generous whitespace, isolated product, calm elegant layout.`,
  },

  9: {
    id: 9,
    name: "Warm Sunset Sazonal",
    tagline: "Gradiente laranja quente, selo 3D com carrinhos e %, acessível",
    density: "low",
    useWhen: "Semanas especiais (Consumidor, aniversário da loja), campanhas acessíveis",
    block: `Family: WARM SUNSET SAZONAL.
Background: smooth gradient from vibrant warm orange at the top fading to deep dark orange or charcoal at the bottom. Optional subtle bokeh light spots or warm dust particles at very low opacity. The composition feels warm and energetic but clean.
Decorative elements: floating 3D mini shopping carts, percentage symbols, and small thematic icons ONLY around the campaign seal at the top. NO decorations near the product or price.
Color palette: vibrant warm orange + white + deep charcoal + yellow accents. Saturated, energetic, accessible.
Mood: weekly seasonal campaign, "semana do consumidor", warm and friendly, accessible commercial Brazilian retail.
Reference benchmark: Morada Nova "Semana do Consumidor" — warm orange gradient layout, glossy 3D seasonal seal with floating thematic icons, isolated product on clean lower zone, prominent green CTA.
Composition density: LOW — generous whitespace, isolated product on warm gradient.`,
  },
};

/** Default style ID when none is provided in the briefing */
export const DEFAULT_STYLE_ID = 1;

/**
 * Mapeamento legado: styleVariation 1-3 (o que a tela /criar envia hoje)
 * para 3 dos 9 novos style families. Isso permite que o fluxo atual
 * "Gerar 3 estilos diferentes" continue funcionando sem mudanças na UI,
 * mas usando os novos prompts mestre.
 *
 * Objetivo: cada variação cobre uma vibe visual MUITO distinta das outras
 * para dar ao usuário uma comparação real entre estilos.
 *
 *  - Variação 1 → Industrial Hard-Sale (denso, agressivo, cenário industrial)
 *  - Variação 2 → Sazonal Festivo 3D   (denso, festivo, colorido, 3D temático)
 *  - Variação 3 → Modern Black & Gold  (respirado, sofisticado, preto+dourado)
 */
export const LEGACY_STYLE_VARIATION_MAP: Record<number, number> = {
  1: 1, // Industrial Hard-Sale
  2: 2, // Sazonal Festivo 3D
  3: 6, // Modern Black & Gold
};

/**
 * STYLE WAVES — agrupamento dos 9 styles em 3 ondas de 3 estilos cada.
 *
 * O usuário clica "Gerar 3 estilos" para disparar a Wave 1 (styles visualmente
 * mais impactantes), e pode clicar "Gerar mais 3 estilos" para disparar a
 * Wave 2 e depois a Wave 3. No final, todos os 9 styles ficam acumulados na
 * tela lado a lado para o usuário escolher qual usar como referência no lote.
 *
 * Cada wave cobre vibes distintas entre si:
 *   Wave 1: [Industrial, Sazonal Festivo, Black & Gold] — hard-sell + festivo + premium moderno
 *   Wave 2: [Premium BR, Liquidação, Friendly Daily]    — premium varejo + tabloide + friendly
 *   Wave 3: [Split Hot, Feminine, Sunset]                — sazonais respirados
 *
 * As 3 waves juntas cobrem todo o espectro de estilos sem repetição.
 */
export const STYLE_WAVES: number[][] = [
  [1, 2, 6], // Wave 1: Industrial Hard-Sale · Sazonal Festivo 3D · Modern Black & Gold
  [3, 4, 5], // Wave 2: Premium Comercial BR · Liquidação Gritante · Friendly Daily Deal
  [7, 8, 9], // Wave 3: Sazonal Split Hot · Soft Feminine Promo · Warm Sunset Sazonal
];

/** Nome curto pra exibir no badge do card de cada variação gerada */
export const STYLE_SHORT_NAMES: Record<number, string> = {
  1: "Industrial",
  2: "Festivo 3D",
  3: "Premium BR",
  4: "Liquidação",
  5: "Friendly",
  6: "Black & Gold",
  7: "Split Hot",
  8: "Feminine",
  9: "Sunset",
};

/** Lista ordenada de styles pra exibição em UI (grid, dropdown, etc.) */
export const STYLE_FAMILIES_LIST: StyleFamily[] = Object.values(STYLE_FAMILIES);
