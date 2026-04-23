import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildMasterPrompt,
  formatPriceBlock,
  formatValidityBlock,
} from "@/lib/build-master-prompt";
import { getAuthUserOrNull } from "@/lib/auth";
import { logUsageEvent } from "@/lib/tracking";
import { estimateImageCost } from "@/lib/pricing";

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

  const startMs = Date.now();
  const authUser = await getAuthUserOrNull();

  // Modelo da OpenAI — default gpt-image-2 (lançado 21/04/2026).
  // Override via env var pra reverter pra gpt-image-1.5 sem redeploy caso
  // a conta ainda esteja em rollout gradual do image-2.
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

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
      batchMode,
    } = JSON.parse(dataRaw);

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
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
      batchMode: !!batchMode,
    });

    const hasInputImages = !!(logoFile || productImageFile || referenceImageFile);

    let imageBuffer: Buffer | null = null;

    // ─── OpenAI gpt-image-2 (default, override via OPENAI_IMAGE_MODEL) ─
    // Quando há imagens reais (logo/produto/referência), usa /v1/images/edits
    // com multipart — aceita múltiplas imagens via image[] e usa como input
    // visual real (logo e foto do produto preservados).
    //
    // Quando não há imagens, usa /v1/images/generations (text-to-image puro).
    try {
      let openaiRes: Response;

      if (hasInputImages) {
        const openaiForm = new FormData();
        openaiForm.append("model", imageModel);
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
            model: imageModel,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
          }),
        });
      }

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        console.error("OpenAI API error:", errText.substring(0, 500));
        return NextResponse.json(
          { error: `Erro na API OpenAI: ${openaiRes.status}` },
          { status: openaiRes.status }
        );
      }

      const data = await openaiRes.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) {
        imageBuffer = Buffer.from(b64, "base64");
      }
    } catch (err) {
      console.error("OpenAI error:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro ao chamar OpenAI" },
        { status: 500 }
      );
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

    // ─── Track usage event (fire-and-forget, nunca bloqueia a resposta) ──
    if (authUser) {
      // Classifica o tipo do evento:
      //   - adjust_creative: quando há referenceImage (usuário está ajustando)
      //   - generate_batch_item: quando está no modo batch (lote step 5)
      //   - generate_single: default (wave do step 4)
      let eventType: "generate_single" | "generate_batch_item" | "adjust_creative" = "generate_single";
      if (adjustmentPrompt && referenceImageFile) {
        eventType = "adjust_creative";
      } else if (batchMode) {
        eventType = "generate_batch_item";
      }

      await logUsageEvent({
        userId: authUser.localUserId,
        eventType,
        clientId: clientId || null,
        creativeId,
        styleFamily: styleFamily ?? styleVariation ?? null,
        typographyFamily: typographyFamily ?? null,
        waveIndex: typeof styleVariation === "number" ? styleVariation - 1 : null,
        batchMode: !!batchMode,
        model: imageModel,
        costUsd: estimateImageCost(hasInputImages),
        durationMs: Date.now() - startMs,
        outcome: "success",
        metadata: {
          productName,
          promotionName,
          hasLogo: !!logoFile,
          hasProductImage: !!productImageFile,
          hasReference: !!referenceImageFile,
        },
      });
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

    // Track erro também
    if (authUser) {
      await logUsageEvent({
        userId: authUser.localUserId,
        eventType: "generate_single",
        model: imageModel,
        costUsd: 0,
        durationMs: Date.now() - startMs,
        outcome: "error",
        errorMessage: message,
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
