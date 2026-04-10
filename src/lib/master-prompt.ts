/**
 * MASTER PROMPT TEMPLATE — Petron Creative Studio
 *
 * Template único em inglês (com conteúdo PT-BR entre aspas) compilado dinamicamente
 * pela função buildMasterPrompt() com dados do briefing + style + typography family.
 *
 * Arquitetura: 10 camadas, 16 slots variáveis ({{SLOT}}).
 * - Camadas 1-3 e 8-10: constantes (DNA imutável)
 * - Camadas 4-7: slots preenchidos pelo compilador
 *
 * Ver também:
 *  - style-families.ts       (9 famílias visuais)
 *  - typography-families.ts  (6 famílias tipográficas)
 *  - build-master-prompt.ts  (função compiladora)
 */

export const MASTER_PROMPT_TEMPLATE = `A high-converting 1080x1080 promotional creative for a Brazilian home improvement retailer (materiais de construção / home center), designed in the visual language of professional Brazilian retail advertising agencies. Reference benchmark brands: Simplifique Home Center, Santa Cruz Casa & Construção, Leroy Merlin Brasil, C&C, Telhanorte, Renovar, Lediô, Morada Nova, Rei dos Pisos. The creative must look like it was crafted by a senior retail art director with 15+ years of experience designing for Brazilian construction retail — never like an AI generation, NEVER like a European luxury brand catalog.

═══════════════════════════════════════════════════════════
PERSONA & ROLE
═══════════════════════════════════════════════════════════

You are creating a Meta Ads creative for a Brazilian construction materials store. The audience is middle-class Brazilian homeowners and contractors who scroll Instagram and Facebook on mobile, in Brazilian Portuguese. The creative must stop the scroll, communicate the offer in under 2 seconds, and drive a WhatsApp click. The aesthetic is loud, commercial, urgent, but never cheap or amateur.

═══════════════════════════════════════════════════════════
CONTENT THAT MUST APPEAR (text in Brazilian Portuguese, exactly as written)
═══════════════════════════════════════════════════════════

CAMPAIGN SEAL — top hero element, occupying 25-35% of the upper area:
Text exactly reads: "{{PROMOTION_NAME}}"
Render as a large 3D promotional seal with extruded letters, metallic finish, real depth, glossy highlights, hard drop shadow, and premium retail craftsmanship. The seal is the dominant visual element of the upper third.
{{TYPOGRAPHY_SEAL_BLOCK}}

PRODUCT NAME — main product label:
Text exactly reads: "{{PRODUCT_NAME}}"
{{PRODUCT_SPEC_BLOCK}}
{{PRODUCT_IMAGE_INSTRUCTION}}
{{TYPOGRAPHY_BODY_BLOCK}}

PRICE BLOCK — largest commercial element after the seal:
{{PRICE_BLOCK}}
Format strictly: "R$" symbol followed by integer, comma as decimal separator, superscript cents. Example: "R$ 159,90". NEVER use "$" alone. NEVER use period as decimal separator (period is only allowed as thousands separator in values above R$ 1.000). The price must be the largest text element after the campaign seal. The "% OFF" starburst seal (if present) MUST keep at least 40 pixels of clearance from the product photograph and must NOT overlap with it.

WHATSAPP CTA BUTTON — bottom centered:
Text exactly reads: "{{CTA_TEXT}}"
Render as a rounded rectangular button in WhatsApp green (#25D366), centered horizontally in the lower fifth of the canvas, with white extra-bold sans-serif text and a subtle drop shadow. The button feels clickable and is the action focal point. The green CTA must remain prominent even in premium or minimal styles — never shrink, never fade, never desaturate.
{{PHONE_BLOCK}}

STORE INFORMATION — footer:
Store name: "{{CLIENT_NAME}}"
{{STORE_ADDRESS_BLOCK}}

VALIDITY DISCLAIMER:
{{VALIDITY_BLOCK}}
Render as small italic text. Position: rotated 90° on the right edge of the canvas (vertical), or as a thin horizontal strip at the very bottom. Color: light gray on dark background, or dark gray on light background — always low-contrast and secondary.

═══════════════════════════════════════════════════════════
BRAND ELEMENTS
═══════════════════════════════════════════════════════════

Brand primary color: {{PRIMARY_COLOR}} — use as dominant accent in backgrounds, blocks, and decorative elements.
{{LOGO_INSTRUCTION}}

═══════════════════════════════════════════════════════════
VISUAL STYLE FAMILY
═══════════════════════════════════════════════════════════

{{STYLE_FAMILY_BLOCK}}

═══════════════════════════════════════════════════════════
COMPOSITION & VISUAL HIERARCHY
═══════════════════════════════════════════════════════════

Visual hierarchy from highest to lowest visual weight:
1. Campaign seal (3D, hero of the top)
2. Product photograph (real-photo aesthetic, occupies 30-45% of canvas)
3. Price block (oversized retail tag)
4. Product name (heavy sans-serif, supporting role)
5. WhatsApp CTA button (green, centered low, action focal point)
6. Brand logo + address (small, secondary, footer)
7. Validity disclaimer (smallest, edge or footer)

Layout rules:
- Product photo positioned right or center
- Commercial info (price, name) positioned left or below product
- No dead space — every area serves a commercial function
- High contrast between background and every text element
- Mobile-first legibility — readable in Instagram feed at 320px wide
- Diagonal or asymmetric balance is acceptable and often preferred over symmetry

Product photography treatment:
- Looks like a professional packshot or PDV photo
- Realistic studio or contextual lighting
- Soft drop shadow grounding the product
- Sharp focus on product, slight bokeh on background only if contextual
- NOT a 3D render, NOT plastic, NOT AI-looking

═══════════════════════════════════════════════════════════
ANTI-AI CHECKS — CRITICAL (the image must NOT look AI-generated)
═══════════════════════════════════════════════════════════

DO NOT render any of the following:
- Replace, redraw, restyle, or reinterpret the uploaded product photograph when one is provided. If a product image is given as input, use it EXACTLY as provided — only composite it into the scene, never regenerate it.
- Plastic-looking or 3D-rendered product (use real photo aesthetic only)
- Letters with wrong shape, missing accents, or English fragments
- "$" symbol anywhere visible. Only "R$" for currency
- Period (.) as decimal separator. Only comma (,)
- Excessive glow, lens flare, or impossible reflections
- Generic stock background unrelated to construction retail
- Decorative or script fonts on product name or price (only on the campaign seal if the typography family allows)
- Pastel or washed-out colors (unless the chosen style explicitly calls for them)
- White-on-white or low-contrast areas where text becomes illegible
- Multiple competing focal points
- Distorted, modified, or duplicated brand logo — the logo must appear EXACTLY ONCE in the upper-right corner
- Fake review stars, fake ratings, fake testimonials
- Any text content not specified above
- Futuristic, sci-fi, or sci-fantasy aesthetic
- Editorial luxury magazine aesthetic (this is Brazilian RETAIL, not Vogue)
- European luxury brand catalog aesthetic (Roca, Deca, Hansgrohe, Villeroy & Boch)
- Empty / dead space without commercial function
- Watermarks, signatures, or unrequested branding
- The "% OFF" starburst overlapping with the product photograph
- Mascots, cartoon characters, human figures, humanoid shapes, construction workers, or personified tools (hammers with faces, paint cans with eyes, etc.). NO characters of any kind — only abstract retail iconography is allowed
- Infantile, childish, candy, cartoon, or toy-packaging aesthetic. This is adult commercial retail, not children's TV
- Inflated balloon-style 3D letters that look puffy or cartoonish (unless the typography family explicitly asks for them, AND the style supports it)

═══════════════════════════════════════════════════════════
TYPOGRAPHY — GLOBAL RULES
═══════════════════════════════════════════════════════════

{{TYPOGRAPHY_FAMILY_BLOCK}}

═══════════════════════════════════════════════════════════
OUTPUT SPECIFICATION
═══════════════════════════════════════════════════════════

Single static image. Aspect ratio 1:1. Resolution 1080x1080 pixels. Color space sRGB. Sharp, polished, commercial-grade, ready for Meta Ads (Instagram and Facebook feed). Indistinguishable from a creative made by a Brazilian retail design agency. The piece transmits: confidence, urgency, opportunity, real value, and commercial credibility.

(seed: {{RANDOM_SEED}})
{{ADJUSTMENT_BLOCK}}`;
