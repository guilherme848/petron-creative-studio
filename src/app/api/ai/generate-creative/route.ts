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
      adjustmentPrompt,
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

    // Variações de estilo — cada uma muda layout, composição e vibe completa
    const styleInstructions: Record<number, string> = {
      1: `STYLE: IMPACTO VAREJO
Layout: produto GIGANTE centralizado (50%+ da área), preço em banner diagonal no canto superior esquerdo com efeito ribbon/faixa.
Background: cor da marca sólida com textura sutil de concreto/tijolo. Elementos geométricos angulares nas bordas.
Vibe: agressivo, direto, estilo encarte de loja — o preço grita. Sombra dura no produto.
Selo da promoção: faixa lateral vertical na borda esquerda.
CTA: barra inferior full-width em verde WhatsApp.`,

      2: `STYLE: PREMIUM CLEAN
Layout: composição assimétrica — produto à direita em pedestal/superfície realista, informações à esquerda com muito espaço branco.
Background: gradiente suave de branco para cinza claro, com uma faixa fina na cor da marca no topo.
Vibe: sofisticado, minimalista, inspirado em catálogo de arquitetura. Tipografia elegante com muito tracking.
Selo da promoção: badge circular pequeno e refinado no canto superior.
CTA: botão arredondado com sombra suave, não gritante.`,

      3: `STYLE: ENERGIA TOTAL
Layout: composição dinâmica diagonal — tudo em ângulo de 15°. Produto flutuando com reflexo embaixo. Preço em explosão starburst.
Background: gradiente vibrante da cor da marca para preto, com partículas luminosas e linhas de velocidade.
Vibe: Black Friday, mega promoção, urgência. Efeitos de brilho, lens flare, neon glow na cor da marca.
Selo da promoção: 3D extrudado com brilho metálico e faíscas.
CTA: botão com borda neon pulsante.`,
    };

    // Adicionar seed aleatório pra garantir variação entre gerações do mesmo estilo
    const randomSeed = Math.floor(Math.random() * 10000);
    const randomAccents = [
      "Add subtle particle dust floating in the air.",
      "Include a thin decorative line pattern in the background.",
      "Add a subtle vignette effect on the edges.",
      "Include small geometric accent shapes scattered around.",
      "Add a subtle lens flare from the upper corner.",
      "Include a thin brand-colored border frame.",
    ];
    const randomAccent = randomAccents[Math.floor(Math.random() * randomAccents.length)];

    const variationPrompt = styleVariation
      ? `${styleInstructions[styleVariation] || ""}\nRANDOM ACCENT: ${randomAccent} (seed: ${randomSeed})`
      : `RANDOM ACCENT: ${randomAccent} (seed: ${randomSeed})`;

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

Generate a high-quality promotional poster for a Brazilian building materials store ("material de construção").
Format: ${isVertical ? "VERTICAL 1080x1350" : "SQUARE 1080x1080"}. Brand color: ${primaryColor}.

EXACT TEXT TO RENDER (Brazilian Portuguese, use COMMA for decimals):
• Promotion: "${promotionName}"
• Product: "${productName}"${productSpec ? ` — ${productSpec}` : ""}
• ${priceBlock}
• CTA button (green, WhatsApp style): "${ctaText}"
${phone ? `• Phone: "${phone}" (small, near CTA, with WhatsApp icon)` : ""}
${storeAddress ? `• Address: "${storeAddress}" (small, footer, with pin icon)` : ""}
${validityBlock ? `• ${validityBlock}` : "• Footer: IMAGEM MERAMENTE ILUSTRATIVA"}

IMAGES:
${logoFile ? "• Use my PROVIDED LOGO exactly as-is, no modifications" : `• Show store name "${clientName}" as a logo badge`}
${productImageFile ? "• Use my PROVIDED PRODUCT PHOTO exactly — display it LARGE and prominent with realistic shadow" : `• Show a realistic ${productName}`}

${variationPrompt}
${hasRef ? `
REFERENCE IMAGE (CRITICAL): Match the EXACT layout, composition, and visual style of the reference image I provided. Only swap the product, name, and price. Keep everything else identical.` : ""}
${adjustmentPrompt ? `\nADJUSTMENT: ${adjustmentPrompt}` : ""}

QUALITY: Professional retail advertising quality. Bold typography, clear hierarchy (price is king), balanced composition. Every text must be 100% legible and correctly spelled.`;

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
