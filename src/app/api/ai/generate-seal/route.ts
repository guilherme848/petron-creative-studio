import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promotionName, colors } = body as {
      promotionName: string;
      colors: string[];
    };

    if (!promotionName) {
      return NextResponse.json(
        { error: "Nome da promoção é obrigatório" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY não configurada" },
        { status: 500 }
      );
    }

    const colorsStr = colors?.length ? colors.join(", ") : "#F97316, #FFFFFF";

    const prompt = `Create a 3D promotional badge/seal for a building materials store with the text "${promotionName}" in bold 3D metallic chrome letters. The text should be large, dramatic, and eye-catching with metallic reflections. Include decorative 3D elements around the text like ribbons, banners, or themed effects (fire for "queima", chains for "fecha mês", gifts for "aniversário", stars for "mega oferta"). Use these brand colors: ${colorsStr}. The badge should have dramatic studio lighting, floating perspective with slight shadow, on a completely transparent/white clean background. Ultra-realistic 3D render, professional retail promotional style, high quality, 1024x1024.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error?.message || `Erro na API: ${res.status}`;
      console.error("Imagen API error:", errMsg);
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json();

    if (!data.predictions || data.predictions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma imagem gerada" },
        { status: 500 }
      );
    }

    const imageBase64 = data.predictions[0].bytesBase64Encoded;
    const buffer = Buffer.from(imageBase64, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=selo.png",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Generate seal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
