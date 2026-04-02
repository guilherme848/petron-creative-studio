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
      clientId,
      promotionId,
    } = JSON.parse(dataRaw);

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

    // Montar parts com imagens reais
    const parts: Array<Record<string, unknown>> = [];

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
    let imageInstructions = "";
    if (logoFile && productImageFile) {
      imageInstructions = `I provided 2 images: IMAGE 1 is the store LOGO. IMAGE 2 is the REAL PRODUCT PHOTO.
CRITICAL RULES FOR IMAGES:
- Use MY EXACT LOGO from image 1 without any modification, recreation or reinterpretation
- Use the EXACT PRODUCT from image 2 as the main product visual, displayed large with realistic shadow
- Do NOT generate a different logo or product - use EXACTLY what I provided`;
    } else if (logoFile) {
      imageInstructions = `I provided the store LOGO image. CRITICAL: Use MY EXACT LOGO without modification.`;
    } else if (productImageFile) {
      imageInstructions = `I provided the REAL PRODUCT PHOTO. CRITICAL: Use this EXACT PRODUCT image large with shadow.`;
    }

    const prompt = `${imageInstructions}

Create a premium Brazilian retail promotional poster for a building materials store.
Format: ${isVertical ? "vertical 1080x1350" : "square 1080x1080"}.

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

FOOTER: ${validityBlock ? `A ${primaryColor} colored bar with white text: ${validityBlock}` : `Small text: IMAGEM MERAMENTE ILUSTRATIVA`}

BACKGROUND DESIGN:
- Create a visually harmonious background that complements the brand color ${primaryColor}
- Use creative composition: diagonal splits, gradients, geometric shapes, or contextual textures
- The background should feel premium and professional, not flat or generic
- Upper section in brand color, lower section lighter/white for product info readability
- Add floating decorative 3D elements (confetti, ribbons, geometric shapes) for energy

STYLE: Premium Brazilian retail advertising for building materials stores (like Leroy Merlin, C&C promotional flyers). Ultra high quality, bold, vibrant, commercial. The design should look like it was made by a professional graphic designer.`;

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
