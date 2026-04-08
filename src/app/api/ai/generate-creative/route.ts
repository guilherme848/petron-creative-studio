import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(opts: {
  clientName: string;
  primaryColor: string;
  promotionName: string;
  productName: string;
  productSpec?: string;
  priceBlock: string;
  ctaText: string;
  phone?: string;
  storeAddress?: string;
  validityBlock?: string;
  styleVariation?: number;
  hasLogo: boolean;
  hasProductImage: boolean;
  hasRef: boolean;
  adjustmentPrompt?: string;
}): string {

  // Variações de estilo
  const styles: Record<number, string> = {
    1: `DIREÇÃO DE ESTILO — IMPACTO COMERCIAL:
Composição com fundo escuro/texturizado do universo da construção (concreto, canteiro de obras, luz dourada industrial).
Produto em destaque GRANDE à direita com iluminação de estúdio e composição de profundidade (produto na frente + empilhados atrás).
Nome do produto em tipografia 3D extrudada dourada/metálica no canto superior esquerdo, com peso visual forte.
Selo 3D premium no canto superior direito com acabamento metálico dourado, brilho, reflexo e profundidade realista.
Preço com fundo amarelo/dourado como etiqueta de varejo.
Incluir 3 bullet points de benefício do produto com ícones (durabilidade, rendimento, acabamento).
CTA em botão verde WhatsApp no rodapé.
Atmosfera: obra sofisticada, luz quente, partículas douradas.`,

    2: `DIREÇÃO DE ESTILO — PREMIUM MODERNO:
Background gradiente sólido na cor da marca para tons escuros, com texturas geométricas sutis.
Produto centralizado com iluminação dramática de estúdio, sombra pronunciada, reflexo no piso.
Nome do produto em tipografia sans-serif extra-bold branca, gigante, dominando o topo.
Selo 3D no topo com tratamento cromado/metálico, efeito de profundidade com brilho realista.
Preço em bloco limpo com badge "APENAS" ou "POR" em cor da marca.
Layout organizado com bastante respiro visual — nada apertado.
CTA em barra inferior full-width verde com ícone WhatsApp.
Atmosfera: catálogo premium, campanha de performance, sofisticado.`,

    3: `DIREÇÃO DE ESTILO — ENERGIA VAREJO:
Background vibrante na cor da marca com gradiente para preto, elementos 3D decorativos flutuando (cifrões dourados, moedas, confetes, fitas metálicas).
Selo 3D gigante no topo com letras extrudadas, sombras fortes e brilho metálico — deve parecer uma peça autoral de varejo brasileiro.
Produto à direita com iluminação quente e sombra realista.
Preço ENORME à esquerda com tipografia ultra-bold, centavos em superscript.
Badge de desconto circular 3D (XX% OFF) se aplicável.
Nome do produto em bold uppercase abaixo do selo.
CTA em botão verde arredondado com texto bold branco.
Atmosfera: Black Friday, feirão, mega oferta — urgência e oportunidade.`,
  };

  const randomSeed = Math.floor(Math.random() * 99999);
  const styleBlock = opts.styleVariation ? (styles[opts.styleVariation] || styles[1]) : styles[1];

  return `Crie uma arte promocional premium para uma loja de materiais de construção, com visual altamente profissional, moderno, impactante e comercialmente persuasivo. A peça deve parecer criada por um diretor de arte sênior especializado em varejo, performance e campanhas promocionais do setor de construção civil no Brasil.

A composição deve ser limpa, forte e organizada, com foco total em conversão e leitura rápida. O produto anunciado deve ser o protagonista visual da peça, com destaque absoluto para oferta, preço e condição de pagamento.

═══════════════════════════════════════
DADOS DA ARTE (inserir exatamente)
═══════════════════════════════════════

1. Nome do produto: "${opts.productName}"
   Tipografia forte, grande, legível e comercial.

${opts.productSpec ? `2. Descrição do produto: "${opts.productSpec}"
   Descrição curta, objetiva e vendedora.` : ""}

3. Preço em destaque:
   ${opts.priceBlock}
   A tipografia do preço deve ser EXTREMAMENTE chamativa, sólida, elegante e com sensação de oportunidade real.
   O preço é um dos maiores pontos visuais da arte. Formato brasileiro: R$, vírgula como decimal.
   NUNCA usar ¢, €, $ ou qualquer outro símbolo de moeda além de R$.

4. CTA: "${opts.ctaText}"
   Botão verde WhatsApp com texto bold branco, alto impacto comercial.

${opts.phone ? `5. Telefone/WhatsApp: "${opts.phone}" — exibir próximo ao CTA com ícone WhatsApp.` : ""}

${opts.storeAddress ? `6. Endereço: "${opts.storeAddress}" — texto pequeno no rodapé com ícone de localização.` : ""}

${opts.validityBlock ? `7. Validade: ${opts.validityBlock}` : "7. Rodapé: *IMAGEM MERAMENTE ILUSTRATIVA"}

8. Selo 3D promocional: "${opts.promotionName}"
   Criar selo 3D premium com aparência realista e acabamento de artista gráfico profissional.
   O selo deve ter profundidade, brilho, textura refinada, luz e sombra bem trabalhadas.
   NÃO pode parecer genérico ou amador. Deve transmitir valor, urgência e sofisticação comercial.

═══════════════════════════════════════
IMAGENS FORNECIDAS
═══════════════════════════════════════

${opts.hasRef ? "• IMAGEM DE REFERÊNCIA DE ESTILO: replique a composição, layout e estética visual dessa referência. Mude apenas produto, nome e preço." : ""}
${opts.hasLogo ? `• LOGO da loja "${opts.clientName}": usar EXATAMENTE como fornecida, sem modificação. Posicionar no canto superior ou próximo ao selo.` : `• Nome da loja: "${opts.clientName}" — criar badge/emblema profissional.`}
${opts.hasProductImage ? "• FOTO REAL DO PRODUTO: usar EXATAMENTE a foto fornecida, sem redesenhar. Exibir GRANDE (35-50% da área), com sombra realista e iluminação de estúdio." : `• Gerar imagem fotorealista do produto "${opts.productName}" com iluminação de estúdio profissional.`}

═══════════════════════════════════════
DIREÇÃO DE ARTE
═══════════════════════════════════════

${styleBlock}

Cor primária da marca: ${opts.primaryColor}

═══════════════════════════════════════
QUALIDADE PROFISSIONAL (OBRIGATÓRIO)
═══════════════════════════════════════

A arte deve ter linguagem visual típica de campanhas promocionais de lojas de materiais de construção brasileiras, com execução refinada, moderna e premium. Misturar apelo comercial forte com estética profissional de alto padrão.

Requisitos visuais:
• Composição publicitária de alta conversão
• Fundo sofisticado com textura ou elementos do universo da construção
• Contraste forte entre fundo e informações principais
• Uso estratégico de cores que transmitam força, confiança, preço bom e urgência
• Visual de encarte premium + anúncio digital de performance
• Acabamento polido, nítido e realista
• Iluminação publicitária bem resolvida
• Sombras e profundidade bem aplicadas
• Organização impecável da informação
• Hierarquia visual clara: Selo > Produto > Preço > Nome > CTA

Hierarquia tipográfica:
• Produto: tipografia 3D ou extra-bold, dominante
• Preço: MAIOR elemento textual, impossível não ver
• CTA: contraste máximo (verde + branco)
• Detalhes: legíveis mas não competem com preço/produto

═══════════════════════════════════════
RESTRIÇÕES (NÃO FAZER)
═══════════════════════════════════════

• NÃO infantilizar a arte
• NÃO usar excesso de elementos
• NÃO usar visual genérico de marketplace
• NÃO usar selo simples ou chapado (deve ser 3D premium)
• NÃO deixar o preço perdido ou pequeno
• NÃO comprometer leitura no mobile
• NÃO exagerar nos efeitos a ponto de parecer amador
• NÃO criar aparência de panfleto barato
• NÃO escrever texto em inglês — tudo em português brasileiro
• Tudo deve parecer profissional, comercial e altamente vendável

Formato: QUADRADO 1080x1080.
A peça final deve parecer criada por uma agência sênior especializada em varejo e tráfego pago, pronta para Instagram, Facebook Ads ou campanha promocional local de alto impacto.

(seed: ${randomSeed})
${opts.adjustmentPrompt ? `\nAJUSTE SOLICITADO: ${opts.adjustmentPrompt}` : ""}`;
}

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
      adjustmentPrompt,
    } = JSON.parse(dataRaw);

    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const primaryColor = clientColors?.[0] || "#F97316";

    // Montar bloco de preço
    let priceBlock = "";
    if (priceType === "de-por" && previousPrice) {
      priceBlock = `De R$${previousPrice} (riscado, vermelho) → Por R$${price} ${unit} ${condition} (GIGANTE, bold, destaque máximo)`;
    } else {
      const label = priceType === "por-apenas" ? "POR APENAS" : "A PARTIR DE";
      priceBlock = `${label} R$${price} ${unit} ${condition} — tipografia GIGANTE, bold, destaque máximo como etiqueta de preço de varejo`;
    }

    // Validade
    let validityBlock = "";
    if (startDate && endDate) {
      const start = new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      const end = new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
      validityBlock = `Ofertas válidas de ${start} a ${end} | IMAGEM MERAMENTE ILUSTRATIVA`;
    }

    const ctaText = cta || "Clique e fale conosco";
    const hasRef = !!referenceImageFile;

    // Construir prompt
    const prompt = buildPrompt({
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
      styleVariation,
      hasLogo: !!logoFile,
      hasProductImage: !!productImageFile,
      hasRef,
      adjustmentPrompt,
    });

    // Decidir modelo: variações 1 e 2 → gpt-image-1, variação 3 → Gemini
    const useOpenAI = (styleVariation === 1 || styleVariation === 2) && openaiKey;

    let imageBuffer: Buffer | null = null;

    if (useOpenAI) {
      // ─── OpenAI gpt-image-1 (Images API) ───────────────────────────
      try {
        // Preparar imagens para o prompt (gpt-image-1 aceita imagens via a API)
        const images: Array<{ url: string }> = [];

        if (referenceImageFile) {
          const refB64 = Buffer.from(await referenceImageFile.arrayBuffer()).toString("base64");
          images.push({ url: `data:${referenceImageFile.type || "image/png"};base64,${refB64}` });
        }
        if (logoFile) {
          const logoB64 = Buffer.from(await logoFile.arrayBuffer()).toString("base64");
          images.push({ url: `data:${logoFile.type || "image/png"};base64,${logoB64}` });
        }
        if (productImageFile) {
          const prodB64 = Buffer.from(await productImageFile.arrayBuffer()).toString("base64");
          images.push({ url: `data:${productImageFile.type || "image/png"};base64,${prodB64}` });
        }

        // Usar Images API com gpt-image-1
        const openaiBody: Record<string, unknown> = {
          model: "gpt-image-1",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "high",
        };

        // Se temos imagens, usar via chat completions com gpt-4o (gpt-image-1 não aceita input images)
        let openaiRes: Response;

        if (images.length > 0) {
          // Chat completions com imagens de entrada
          const content: Array<Record<string, unknown>> = [];
          for (const img of images) {
            content.push({ type: "image_url", image_url: { url: img.url } });
          }
          content.push({ type: "text", text: prompt });

          openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "Você é um diretor de arte sênior especializado em campanhas promocionais de varejo de materiais de construção no Brasil. Gere imagens de alta qualidade profissional.",
                },
                { role: "user", content },
              ],
              modalities: ["text", "image"],
            }),
          });

          if (openaiRes.ok) {
            const data = await openaiRes.json();
            const outputContent = data.choices?.[0]?.message?.content;
            if (Array.isArray(outputContent)) {
              for (const block of outputContent) {
                if (block.type === "image_url" && block.image_url?.url) {
                  const b64Match = block.image_url.url.match(/base64,(.+)/);
                  if (b64Match) {
                    imageBuffer = Buffer.from(b64Match[1], "base64");
                    break;
                  }
                }
              }
            }
          }
        } else {
          // Sem imagens de entrada — usar Images API direta com gpt-image-1
          openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(openaiBody),
          });

          if (openaiRes.ok) {
            const data = await openaiRes.json();
            const b64 = data.data?.[0]?.b64_json;
            if (b64) {
              imageBuffer = Buffer.from(b64, "base64");
            } else {
              const imgUrl = data.data?.[0]?.url;
              if (imgUrl) {
                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                  imageBuffer = Buffer.from(await imgRes.arrayBuffer());
                }
              }
            }
          }
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
