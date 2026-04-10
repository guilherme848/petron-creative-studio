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

WHATSAPP CTA BUTTON — bottom centered (the primary action element):
Text exactly reads: "{{CTA_TEXT}}"
Render as a rounded rectangular button in WhatsApp green (#25D366), centered horizontally in the lower fifth of the canvas, with white extra-bold sans-serif text and a subtle drop shadow. The button feels clickable and is the action focal point. The green CTA must remain prominent even in premium or minimal styles — never shrink, never fade, never desaturate.
IMPORTANT: Do NOT place the phone number next to the CTA button. Phone goes in the footer with the store info (see below). The CTA button stands alone — clicking it is what matters, not calling.

VALIDITY BADGE — dedicated element, not a disclaimer:
{{VALIDITY_BLOCK}}

STORE INFORMATION — elegant footer:
Store name: "{{CLIENT_NAME}}"
Render the footer as a clean horizontal strip at the very bottom of the canvas with TWO contact elements side by side (or stacked on two lines if space is tight), both in small but readable text, both using a light elegant weight:
{{STORE_CONTACT_BLOCK}}
The footer is elegant and secondary — small but legible, not shouting. Use neutral colors (white on dark background, dark gray on light background). The two contact items (address and phone) should be balanced visually, each with its own icon, not competing with the CTA button above.

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

{{USER_GUIDANCE_BLOCK}}

═══════════════════════════════════════════════════════════
OUTPUT SPECIFICATION
═══════════════════════════════════════════════════════════

Single static image. Aspect ratio 1:1. Resolution 1080x1080 pixels. Color space sRGB. Sharp, polished, commercial-grade, ready for Meta Ads (Instagram and Facebook feed). Indistinguishable from a creative made by a Brazilian retail design agency. The piece transmits: confidence, urgency, opportunity, real value, and commercial credibility.

(seed: {{RANDOM_SEED}})`;

/**
 * BATCH MODE PROMPT — usado na geração em lote (step 5) quando o objetivo é
 * clonar uma referência visual EXATAMENTE, substituindo apenas produto/preço/nome.
 *
 * Diferente do MASTER_PROMPT_TEMPLATE, este é curto e focado em PRESERVAÇÃO
 * total da base visual. O modelo recebe 2 imagens via /v1/images/edits:
 *   1. A referência visual (criativo aprovado do step 4)
 *   2. A nova foto do produto a ser substituída
 *
 * O modelo NÃO deve redesenhar, não deve variar estilo, não deve reinterpretar
 * layout. É substituição de conteúdo cirúrgica — content swap, não redesign.
 */
export const BATCH_MODE_PROMPT_TEMPLATE = `BATCH REGENERATION TASK — CONTENT SWAP ONLY (NOT REDESIGN).

You are given two input images:
1. REFERENCE IMAGE (first): an existing promotional creative for a Brazilian home improvement retailer that has been approved by the user. This creative defines the EXACT visual base that must be preserved.
2. NEW PRODUCT PHOTO (second): the new product that must replace the product in the reference image.

═══════════════════════════════════════════════════════════
YOUR JOB — SURGICAL CONTENT REPLACEMENT
═══════════════════════════════════════════════════════════

Reproduce the reference image EXACTLY, changing ONLY the following specific content fields:

1. PRODUCT PHOTOGRAPH: replace with the new product photo provided as input image #2. Use it EXACTLY as provided (never redraw, never stylize, never reinterpret). Size and position the new product to match the exact same scale, position, and drop shadow as the product in the reference image.

2. PRODUCT NAME TEXT: replace with "{{PRODUCT_NAME}}"
{{PRODUCT_SPEC_REPLACEMENT}}

3. PRICE BLOCK: replace with the new price content below, but keep the EXACT same visual treatment (same color, same shape, same size, same position, same typography style) as the price block in the reference image:
{{PRICE_BLOCK}}

═══════════════════════════════════════════════════════════
PRESERVE EXACTLY — DO NOT CHANGE
═══════════════════════════════════════════════════════════

You MUST preserve these elements from the reference image without ANY modification:
- Overall layout and composition
- Background color, gradient, and texture
- Campaign seal ("{{PROMOTION_NAME}}") — same text, same 3D treatment, same position, same size
- WhatsApp CTA button — same green color, same text, same position, same size (phone number must NOT be placed next to the button)
- Store logo — same logo, same position, same size (upper-right corner)
- Store name "{{CLIENT_NAME}}" and footer contact information
- Validity badge — same position, same size, same treatment (if present in the reference)
- Footer with address + phone elegantly positioned side by side with their icons — NOT next to the CTA button
- Decorative elements (hazard tape, coins, hearts, sparkles, etc.) — EXACT same placement
- Typography family (fonts, weights, colors for seal/body/price)
- Color palette and saturation levels
- Lighting, shadows, and mood
- Every pixel that is NOT specifically listed in the REPLACEMENT section above

═══════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════

- This is a CONTENT SWAP, not a redesign. Treat the reference image as a master template.
- The new creative must be visually indistinguishable from the reference EXCEPT for the 3 replacement fields listed above.
- Do NOT restyle, do NOT reinterpret, do NOT "improve" the design.
- Do NOT change the campaign seal text, colors, or treatment.
- Do NOT move elements around. Positions are fixed.
- Do NOT change the background.
- Do NOT change the CTA button.
- The new product photo (input image #2) must appear in the same position and same scale as the product in the reference image.
- Price format: "R$" symbol, comma decimal, superscript cents. Example: "R$ 159,90". NEVER "$", NEVER period as decimal.
- All text in Brazilian Portuguese, no English fragments, no broken characters.
- No mascots, cartoon characters, human figures, or anthropomorphic elements anywhere.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════

Single static image. 1080x1080 pixels. Sharp, polished, visually IDENTICAL to the reference except for the replaced product, product name, product spec, and price. Pixel-level fidelity to the reference base.

(seed: {{RANDOM_SEED}})`;
