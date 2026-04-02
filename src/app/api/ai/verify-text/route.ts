import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const expectedTextsRaw = formData.get("expectedTexts") as string | null;

    if (!imageFile || !expectedTextsRaw) {
      return NextResponse.json(
        { error: "Imagem e textos esperados são obrigatórios" },
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

    const expectedTexts = JSON.parse(expectedTextsRaw) as string[];
    const expectedList = expectedTexts.map((t, i) => `${i + 1}. ${t}`).join("\n");

    // Converter imagem para base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: imageFile.type || "image/png",
                    data: base64,
                  },
                },
                {
                  text: `Analise esta imagem publicitária brasileira. Liste TODOS os textos visíveis exatamente como aparecem. Compare com os textos esperados abaixo e identifique erros.

Textos esperados:
${expectedList}

Responda APENAS em JSON válido (sem markdown), formato:
{"textos_encontrados": ["..."], "erros": [{"esperado": "...", "encontrado": "...", "tipo": "ortografia|incompleto|ilegível|ausente"}], "nota": 0-10}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro na API Gemini: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Limpar markdown se presente
    text = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();

    try {
      const result = JSON.parse(text);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        textos_encontrados: [],
        erros: [],
        nota: 0,
        raw: text,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
