import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    } = body as {
      clientName: string;
      clientColors: string[];
      promotionName: string;
      productName: string;
      productSpec?: string;
      priceType: string;
      price: string;
      previousPrice?: string;
      unit: string;
      condition: string;
      startDate?: string;
      endDate?: string;
      format: string;
      clientId?: string;
      promotionId?: string;
    };

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY não configurada" },
        { status: 500 }
      );
    }

    // Montar aspectRatio baseado no formato
    let aspectRatio = "1:1";
    if (format === "1080x1350") aspectRatio = "3:4";
    else if (format === "1080x1920") aspectRatio = "9:16";

    const colorsStr = clientColors?.length ? clientColors.join(", ") : "#F97316, #FFFFFF";
    const primaryColor = clientColors?.[0] || "#F97316";

    // Montar bloco de preço
    let priceBlock = "";
    if (priceType === "de-por" && previousPrice) {
      priceBlock = `In a small red label with strikethrough text: De R$${previousPrice}. Below: large number ${price} in massive extra-bold black font with the cents as superscript. Below price: ${unit} ${condition} in orange.`;
    } else {
      const label = priceType === "por-apenas" ? "POR APENAS" : "A PARTIR DE";
      priceBlock = `In a bright red/orange rounded badge: ${label}. Below: giant price number ${price} in massive extra-bold black font with cents as superscript. Below price: ${unit} ${condition} in orange.`;
    }

    // Montar bloco de validade
    let validityBlock = "";
    if (startDate && endDate) {
      const start = new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      const end = new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      validityBlock = `At the bottom in a ${primaryColor} colored banner: Ofertas válidas de ${start} a ${end}.`;
    }

    const prompt = `A Brazilian building materials store promotional poster. ${aspectRatio === "3:4" ? "Vertical" : "Square"} format.

THIS IMAGE MUST CONTAIN THE FOLLOWING EXACT TEXTS, ALL CLEARLY VISIBLE AND LEGIBLE:

1. At the very top, in huge 3D metallic letters with chrome finish and dramatic lighting: ${promotionName}
2. Below that in a badge: ${clientName}
3. On the left middle area, bold black text: ${productName}
${productSpec ? `4. Below that in gray: ${productSpec}` : ""}
5. ${priceBlock}
${validityBlock ? `6. ${validityBlock}` : ""}
7. Very bottom small gray text: IMAGEM MERAMENTE ILUSTRATIVA

VISUAL DESIGN:
- Top 50%: Rich gradient background using brand color ${primaryColor} with 3D geometric angular shapes creating architectural depth
- The 3D text ${promotionName} has chrome metallic finish with reflections matching brand colors ${colorsStr}, floating with dramatic studio lighting, decorative ribbons and confetti around it
- Bottom 50%: Clean white background
- Dramatic diagonal cut between colored and white sections

PRODUCT IMAGE - VERY IMPORTANT: On the right side of the white area, a LARGE product image. The product must be PROMINENT and LARGE, taking up approximately 40% of the width and 35% of the height. Show the product at a slight angle with realistic drop shadow. The product is a building material item (tile, flooring, door, paint, etc.) matching the name "${productName}".

- Floating decorative 3D elements: metallic confetti, ribbons in the colored section

STYLE: Premium Brazilian retail advertising. Photorealistic 3D seal. Bold commercial design. Ultra high quality. ${format} format.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error?.message || `Erro na API Imagen: ${res.status}`;
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json();

    if (!data.predictions || data.predictions.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem gerada" }, { status: 500 });
    }

    const imageBase64 = data.predictions[0].bytesBase64Encoded;
    const buffer = Buffer.from(imageBase64, "base64");

    // Salvar no Supabase Storage
    const fileName = `creative-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(fileName, buffer, { contentType: "image/png" });

    let imageUrl: string | null = null;
    if (!uploadError) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/creatives/${fileName}`;

      // Salvar na tabela creatives
      await supabase.from("creatives").insert({
        client_id: clientId || null,
        promotion_id: promotionId || null,
        format,
        image_url: imageUrl,
      });
    }

    // Retornar imagem + URL
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=criativo.png",
        "X-Image-Url": imageUrl || "",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
