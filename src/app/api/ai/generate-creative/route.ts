import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(request: Request) {
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

    // Montar prompt
    let imageInstructions = "";
    if (logoFile && productImageFile) {
      imageInstructions = `I provided 2 images above: 1) The store LOGO 2) The PRODUCT PHOTO. CRITICAL: Use MY EXACT LOGO from image 1 - do not recreate or modify it. Use the EXACT PRODUCT from image 2 - show it large with realistic shadow.`;
    } else if (logoFile) {
      imageInstructions = `I provided the store LOGO above. CRITICAL: Use MY EXACT LOGO - do not recreate or modify it.`;
    } else if (productImageFile) {
      imageInstructions = `I provided the PRODUCT PHOTO above. CRITICAL: Use this EXACT PRODUCT image - show it large with shadow.`;
    }

    const prompt = `${imageInstructions}

Create a professional Brazilian retail promotional poster (${isVertical ? "vertical 1080x1350" : "square 1080x1080"} format) for a building materials store called ${clientName}.

ALL TEXT MUST BE IN BRAZILIAN PORTUGUESE, CORRECT AND LEGIBLE:

1) TOP: Spectacular 3D metallic chrome text "${promotionName}" with ${primaryColor} accents, floating confetti and ribbons, dramatic lighting
2) BELOW: ${logoFile ? "MY EXACT LOGO as provided" : `Store name ${clientName} in a badge`}
3) LEFT SIDE: "${productName}" in heavy bold black uppercase${productSpec ? `, "${productSpec}" in gray below` : ""}
4) ${priceBlock}
5) RIGHT SIDE: ${productImageFile ? "MY EXACT PRODUCT PHOTO as provided, displayed LARGE (40% width) with realistic shadow" : `A large realistic ${productName} product image with shadow`}
6) ${validityBlock || `Footer: ${primaryColor} bar with IMAGEM MERAMENTE ILUSTRATIVA`}

BACKGROUND: Rich ${primaryColor} gradient top with 3D geometric angular shapes, clean white bottom, dramatic diagonal split. Floating metallic confetti and ribbons.

STYLE: Premium Brazilian retail advertising. Ultra high quality. Bold, vibrant, commercial.`;

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
