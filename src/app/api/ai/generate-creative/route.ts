import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente novamente em 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const dataRaw = formData.get("data") as string;
    const logoFile = formData.get("logo") as File | null;
    const productImageFile = formData.get("productImage") as File | null;

    if (!dataRaw) {
      return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    }

    const {
      clientName,
      clientColors,
      clientFonts,
      promotionName,
      productName,
      productSpec,
      priceType,
      price,
      previousPrice,
      unit,
      condition,
      startDate,
      endDate,
      format,
      cta,
      phone,
      storeAddress,
      clientId,
      promotionId,
      styleVariation,
    } = JSON.parse(dataRaw);

    const referenceImageFile = formData.get("referenceImage") as File | null;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY não configurada" },
        { status: 500 }
      );
    }

    const primaryColor = clientColors?.[0] || "#F97316";

    // Montar bloco de preço
    let priceBlock = "";
    if (priceType === "de-por" && previousPrice) {
      priceBlock = `Red strikethrough text: De R$${previousPrice}. Below: giant number ${price} in massive extra-bold black, cents as superscript. Below: ${unit} ${condition} in orange.`;
    } else {
      const label = priceType === "por-apenas" ? "POR APENAS" : "A PARTIR DE";
      priceBlock = `Orange/red badge: ${label}. Below: giant price ${price} in massive extra-bold black, cents as superscript. Below: ${unit} ${condition} in orange.`;
    }

    // Validade
    let validityBlock = "";
    if (startDate && endDate) {
      const start = new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      const end = new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      validityBlock = `Footer bar: Ofertas válidas de ${start} a ${end} | IMAGEM MERAMENTE ILUSTRATIVA`;
    }

    // Formato
    const isVertical = format === "1080x1350" || format === "1080x1920";

    // Adicionar referência de estilo se fornecida
    if (referenceImageFile) {
      const refBuffer = await referenceImageFile.arrayBuffer();
      const refB64 = Buffer.from(refBuffer).toString("base64");
      // referenceImage será adicionada como primeira imagem
      // com instrução explícita no prompt
    }

    // Variação de estilo
    const styleInstructions: Record<number, string> = {
      1: "STYLE VARIATION: Use a DIAGONAL SPLIT background with bold geometric shapes. Upper-left in brand color, lower-right in white/light. Add floating 3D confetti elements.",
      2: "STYLE VARIATION: Use a GRADIENT WAVE background flowing from brand color to dark. Place product on a subtle platform/pedestal. Use glassmorphism effects on price tags.",
      3: "STYLE VARIATION: Use a RADIAL BURST background centered behind the product. Starburst pattern in brand color. Add metallic ribbon accents and particle effects.",
    };
    const variationPrompt = styleVariation ? (styleInstructions[styleVariation] || "") : "";

    // Montar parts com imagens reais
    const parts: Array<Record<string, unknown>> = [];

    // Adicionar referência de estilo se fornecida
    if (referenceImageFile) {
      const refBuffer = await referenceImageFile.arrayBuffer();
      const refB64 = Buffer.from(refBuffer).toString("base64");
      parts.push({
        inlineData: {
          mimeType: referenceImageFile.type || "image/png",
          data: refB64,
        },
      });
    }

    // Adicionar logo se disponível
    if (logoFile) {
      const logoBuffer = await logoFile.arrayBuffer();
      const logoB64 = Buffer.from(logoBuffer).toString("base64");
      parts.push({
        inlineData: {
          mimeType: logoFile.type || "image/png",
          data: logoB64,
        },
      });
    }

    // Adicionar foto do produto se disponível
    if (productImageFile) {
      const prodBuffer = await productImageFile.arrayBuffer();
      const prodB64 = Buffer.from(prodBuffer).toString("base64");
      parts.push({
        inlineData: {
          mimeType: productImageFile.type || "image/png",
          data: prodB64,
        },
      });
    }

    // CTA text
    const ctaText = cta || "Clique e fale conosco";

    // Montar prompt
    // Montar instruções de imagem considerando referência
    const hasRef = !!referenceImageFile;
    const imageList: string[] = [];
    let imgIdx = 1;

    if (hasRef) {
      imageList.push(`IMAGE ${imgIdx} is a STYLE REFERENCE — match its exact visual style, layout composition, color treatment, and design elements`);
      imgIdx++;
    }
    if (logoFile) {
      imageList.push(`IMAGE ${imgIdx} is the store LOGO — use it EXACTLY without modification`);
      imgIdx++;
    }
    if (productImageFile) {
      imageList.push(`IMAGE ${imgIdx} is the REAL PRODUCT PHOTO — display it large with realistic shadow`);
    }

    let imageInstructions = "";
    if (imageList.length > 0) {
      imageInstructions = `I provided ${imageList.length} image(s):\n${imageList.map((s) => `- ${s}`).join("\n")}\nCRITICAL: Use EXACTLY the images I provided. Do NOT recreate or reinterpret them.`;
    }

    // Montar instruções de tipografia
    const fontTitle = clientFonts?.title || "Montserrat";
    const fontPrice = clientFonts?.price || "Oswald";
    const fontDesc = clientFonts?.description || "Open Sans";

    const prompt = `${imageInstructions}

Create a premium Brazilian retail promotional poster for a building materials store.
Format: ${isVertical ? "vertical 1080x1350" : "square 1080x1080"}.

MANDATORY TYPOGRAPHY:
- Titles and product names: use "${fontTitle}" font family, extra-bold/black weight
- Prices and numbers: use "${fontPrice}" font family, bold weight, large size
- Descriptions, conditions and footer: use "${fontDesc}" font family, regular/medium weight

MANDATORY TEXT RULES:
- ALL text in Brazilian Portuguese with correct accents
- For prices: use a small "R$" prefix followed by the number. Example: R$ 34,90
- NEVER use cent symbols (¢), euro (€), dollar ($), or ANY other currency symbol next to the numbers
- Use COMMA as decimal separator (Brazilian format): 34,90 NOT 34.90
- Every text must be fully spelled, complete, and legible

LAYOUT AND CONTENT:

TOP ZONE: Spectacular 3D promotional seal with the text "${promotionName}" in bold extruded metallic chrome letters with ${primaryColor} color accents. Dramatic studio lighting, floating confetti and metallic ribbons around it. Photorealistic 3D quality.

LOGO ZONE: ${logoFile ? "My EXACT logo (from the provided image) displayed clearly" : `Store name "${clientName}" in a professional badge`}

PRODUCT INFO (left side of body):
- "${productName}" in heavy bold black uppercase letters
${productSpec ? `- "${productSpec}" in medium gray below the product name` : ""}
- ${priceBlock}

PRODUCT IMAGE (right side, LARGE - 35-40% of poster width):
${productImageFile ? "The EXACT product photo I provided, displayed prominently with realistic drop shadow and slight perspective" : `A photorealistic ${productName} with shadow`}

CTA BUTTON: A bright green WhatsApp-style rounded button with bold white text: "${ctaText}". Positioned below the product area.
${phone ? `PHONE NUMBER: Display "${phone}" in small but legible text near the CTA button (below or beside it). Use a phone/WhatsApp icon next to it.` : ""}
${storeAddress ? `STORE ADDRESS: Display "${storeAddress}" in small text in the footer area, near the validity dates. Use a location pin icon next to it.` : ""}

FOOTER: ${validityBlock ? `A ${primaryColor} colored bar with white text: ${validityBlock}` : `Small text: IMAGEM MERAMENTE ILUSTRATIVA`}

BACKGROUND DESIGN:
- Create a visually harmonious background that complements the brand color ${primaryColor}
- Use creative composition: diagonal splits, gradients, geometric shapes, or contextual textures
- The background should feel premium and professional, not flat or generic
- Upper section in brand color, lower section lighter/white for product info readability
- Add floating decorative 3D elements (confetti, ribbons, geometric shapes) for energy

STYLE: Premium Brazilian retail advertising for building materials stores (like Leroy Merlin, C&C promotional flyers). Ultra high quality, bold, vibrant, commercial. The design should look like it was made by a professional graphic designer.

PROFESSIONAL QUALITY REQUIREMENTS:
- Ensure perfect visual hierarchy: promotion name > product name > price > details
- Use consistent spacing and alignment — nothing should look misaligned or cramped
- All text must have proper contrast against its background (use text shadows or backing shapes)
- Price must be the dominant visual element after the product photo
- Colors must harmonize with the brand palette — never clash or look amateur
- The overall composition must feel balanced, polished, and print-ready
${hasRef ? `
REFERENCE-BASED GENERATION (CRITICAL):
You MUST replicate the EXACT visual style from the reference image I provided:
- Same layout grid and element positioning (where the logo, product, price, and CTA are placed)
- Same background treatment (gradient direction, color zones, geometric shapes)
- Same typographic hierarchy and text sizing ratios
- Same decorative elements style (confetti, ribbons, shapes, shadows)
- Same color application pattern (which areas use the brand color vs neutral)
- ONLY change: the product photo, product name, price text, and specification text
- Everything else (composition, style, vibe) must be IDENTICAL to the reference` : ""}
${variationPrompt}`;

    parts.push({ text: prompt });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText.substring(0, 500));
      return NextResponse.json(
        { error: `Erro na API: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const responseParts = data.candidates?.[0]?.content?.parts || [];

    let imageBuffer: Buffer | null = null;
    for (const part of responseParts) {
      if (part.inlineData) {
        imageBuffer = Buffer.from(part.inlineData.data, "base64");
        break;
      }
    }

    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Nenhuma imagem gerada" },
        { status: 500 }
      );
    }

    // Salvar no Supabase Storage
    const fileName = `creative-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(fileName, imageBuffer, { contentType: "image/png" });

    let imageUrl: string | null = null;
    if (!uploadError) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/creatives/${fileName}`;

      await supabase.from("creatives").insert({
        client_id: clientId || null,
        promotion_id: promotionId || null,
        format: format || "1080x1080",
        image_url: imageUrl,
      });
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=criativo.png",
        "X-Image-Url": imageUrl || "",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Generate creative error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
