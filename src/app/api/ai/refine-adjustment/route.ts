/**
 * REFINE ADJUSTMENT PROMPT — Petron Creative Studio
 *
 * Endpoint que recebe um texto cru do usuário pedindo ajuste em um criativo
 * já gerado, e refina esse texto num prompt estruturado, detalhado e
 * diretamente injetável no master prompt do gpt-image-1.5.
 *
 * Usa gpt-4o-mini (text) pra fazer o refinement — barato, rápido, preciso.
 *
 * Por exemplo:
 *   Input  cru: "mais vermelho"
 *   Output:     "1. Aumente a saturação da cor primária vermelha ao redor
 *                do selo e do bloco de preço. 2. Reforce o contraste entre
 *                o fundo e os elementos comerciais. 3. Mantenha todos os
 *                outros elementos (produto, logo, CTA, endereço) inalterados."
 */

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const REFINE_SYSTEM_PROMPT = `You are a senior creative director at a Brazilian retail advertising agency specializing in home improvement store (materiais de construção) promotional creatives. The user has generated a creative image using gpt-image-1.5 and wants to make specific visual adjustments to it via a second generation pass.

Your job: take the user's rough adjustment request (in Brazilian Portuguese, often short and imprecise) and refine it into a PRECISE, DETAILED, WELL-STRUCTURED adjustment prompt that will be injected into a master prompt sent to gpt-image-1.5 for regeneration.

RULES FOR REFINEMENT:
1. Preserve the user's INTENT exactly. Never change what they want. Never add things they didn't ask for.
2. Add specificity where the user was vague. If they say "mais vermelho", specify WHERE (fundo? selo? preço? todos?), HOW MUCH (aumente saturação em 20%?), and which reference to use (cor da marca).
3. Add visual details the user implied but didn't spell out. If they say "mude o fundo", suggest what TYPE of background (textured? solid? gradient?).
4. Structure the output as 1-4 numbered points in Brazilian Portuguese.
5. Keep the refined prompt under 400 characters total.
6. Always end with: "Mantenha todos os outros elementos visuais do criativo atual inalterados (produto, logo, CTA, endereço, selo de campanha)."
7. Focus on what should CHANGE, not on what stays — the "preserve" instruction at the end covers that.
8. Do NOT suggest changes the user didn't ask for.
9. Do NOT remove any commercial content (product, price, CTA, store info).
10. Do NOT add legal disclaimers, watermarks, or new text content.

OUTPUT FORMAT:
Return ONLY the refined prompt text in Brazilian Portuguese. No preamble, no explanation, no markdown. Just the numbered list.`;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente novamente em 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const { rawPrompt, productName, promotionName } = await request.json();

    if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
      return NextResponse.json({ error: "rawPrompt obrigatório" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    const userMessage = `Contexto do criativo:
- Produto: "${productName || "não especificado"}"
- Campanha: "${promotionName || "não especificada"}"

Pedido de ajuste cru do usuário (em português):
"${rawPrompt.trim()}"

Refine esse pedido num prompt estruturado e detalhado seguindo as regras do sistema.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: REFINE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI refine error:", errText.substring(0, 500));
      // Fallback: retorna o prompt cru sem refinar pra não bloquear o usuário
      return NextResponse.json({
        refinedPrompt: rawPrompt.trim(),
        wasRefined: false,
        error: "Refinement falhou, usando texto original",
      });
    }

    const data = await res.json();
    const refinedPrompt = data.choices?.[0]?.message?.content?.trim() || rawPrompt.trim();

    return NextResponse.json({
      refinedPrompt,
      wasRefined: refinedPrompt !== rawPrompt.trim(),
    });
  } catch (err) {
    console.error("Refine adjustment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao refinar prompt" },
      { status: 500 }
    );
  }
}
