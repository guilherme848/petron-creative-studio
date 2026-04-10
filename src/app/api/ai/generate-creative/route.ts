import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildMasterPrompt,
  formatPriceBlock,
  formatValidityBlock,
} from "@/lib/build-master-prompt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ─── Route Handler ───────────────────────────────────────────────────────────

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
    const referenceImageFile = formData.get("referenceImage") as File | null;

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
      phone,
      storeAddress,
      clientId,
      promotionId,
      styleVariation,
      styleFamily,
      typographyFamily,
      adjustmentPrompt,
    } = JSON.parse(dataRaw);

    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const primaryColor = clientColors?.[0] || "#F97316";

    // Montar bloco de preço via helper reutilizável
    const priceBlock = formatPriceBlock({
      priceType,
      price,
      previousPrice,
      unit,
      condition,
    });

    // Validade via helper reutilizável
    const validityBlock = formatValidityBlock(startDate, endDate);

    const ctaText = cta || "Clique e fale conosco";

    // Construir prompt mestre compilado com style + typography family
    const prompt = buildMasterPrompt({
      clientName: clientName || "Loja",
      primaryColor,
      promotionName: promotionName || "OFERTA ESPECIAL",
      productName,
      productSpec,
      priceBlock,
      ctaText,
      phone,
      storeAddress,
      validityBlock: validityBlock || undefined,
      styleFamily,
      legacyStyleVariation: styleVariation,
      typographyFamily,
      hasLogo: !!logoFile,
      hasProductImage: !!productImageFile,
      adjustmentPrompt,
    });

    // Decidir modelo: variações 1 e 2 → gpt-image-1.5, variação 3 → Gemini
    const useOpenAI = (styleVariation === 1 || styleVariation === 2) && openaiKey;
    const hasInputImages = !!(logoFile || productImageFile || referenceImageFile);

    let imageBuffer: Buffer | null = null;

    if (useOpenAI) {
      // ─── OpenAI gpt-image-1.5 ────────────────────────────────────
      // Quando há imagens reais (logo/produto/referência), usa o endpoint
      // /v1/images/edits com multipart — ele aceita múltiplas imagens via image[]
      // e usa elas como input visual real (logo e foto do produto preservados).
      //
      // Quando não há imagens, usa /v1/images/generations (text-to-image puro).
      try {
        let openaiRes: Response;

        if (hasInputImages) {
          const openaiForm = new FormData();
          openaiForm.append("model", "gpt-image-1.5");
          openaiForm.append("prompt", prompt);
          openaiForm.append("n", "1");
          openaiForm.append("size", "1024x1024");

          // Ordem importa: produto primeiro (hero), depois logo, depois referência.
          if (productImageFile) {
            openaiForm.append("image[]", productImageFile, "product.png");
          }
          if (logoFile) {
            openaiForm.append("image[]", logoFile, "logo.png");
          }
          if (referenceImageFile) {
            openaiForm.append("image[]", referenceImageFile, "reference.png");
          }

          openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: {
              // NÃO setar Content-Type — fetch com FormData define automaticamente
              // o boundary correto do multipart.
              "Authorization": `Bearer ${openaiKey}`,
            },
            body: openaiForm,
          });
        } else {
          openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-image-1.5",
              prompt: prompt,
              n: 1,
              size: "1024x1024",
            }),
          });
        }

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const b64 = data.data?.[0]?.b64_json;
          if (b64) {
            imageBuffer = Buffer.from(b64, "base64");
          }
        } else {
          const errText = await openaiRes.text();
          console.error("OpenAI API error:", errText.substring(0, 500));
        }

        if (!imageBuffer) {
          console.error("OpenAI não gerou imagem, falling back to Gemini");
        }
      } catch (err) {
        console.error("OpenAI error:", err instanceof Error ? err.message : err);
      }
    }

    // ─── Gemini (variação 3 ou fallback) ─────────────────────────────
    if (!imageBuffer) {
      const parts: Array<Record<string, unknown>> = [];

      if (referenceImageFile) {
        const refB64 = Buffer.from(await referenceImageFile.arrayBuffer()).toString("base64");
        parts.push({ inlineData: { mimeType: referenceImageFile.type || "image/png", data: refB64 } });
      }
      if (logoFile) {
        const logoB64 = Buffer.from(await logoFile.arrayBuffer()).toString("base64");
        parts.push({ inlineData: { mimeType: logoFile.type || "image/png", data: logoB64 } });
      }
      if (productImageFile) {
        const prodB64 = Buffer.from(await productImageFile.arrayBuffer()).toString("base64");
        parts.push({ inlineData: { mimeType: productImageFile.type || "image/png", data: prodB64 } });
      }

      parts.push({ text: prompt });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Gemini API error:", errText.substring(0, 500));
        return NextResponse.json({ error: `Erro na API: ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const responseParts = data.candidates?.[0]?.content?.parts || [];

      for (const part of responseParts) {
        if (part.inlineData) {
          imageBuffer = Buffer.from(part.inlineData.data, "base64");
          break;
        }
      }
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: "Nenhuma imagem gerada" }, { status: 500 });
    }

    // ─── Salvar no Supabase ──────────────────────────────────────────
    const fileName = `creative-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(fileName, imageBuffer, { contentType: "image/png" });

    let imageUrl: string | null = null;
    let creativeId: string | null = null;
    if (!uploadError) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/creatives/${fileName}`;

      const { data: creativeRow } = await supabase.from("creatives").insert({
        client_id: clientId || null,
        promotion_id: promotionId || null,
        format: format || "1080x1080",
        image_url: imageUrl,
        status: "draft",
      }).select("id").single();

      creativeId = creativeRow?.id || null;
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=criativo.png",
        "X-Image-Url": imageUrl || "",
        "X-Creative-Id": creativeId || "",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("Generate creative error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
