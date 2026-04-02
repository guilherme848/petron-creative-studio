import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promotionName, colors } = body as {
      promotionName: string;
      colors: string[];
    };

    if (!promotionName) {
      return NextResponse.json(
        { error: "Missing promotionName" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const colorsStr = colors?.length ? colors.join(", ") : "gold, red";

    const prompt = `Create a 3D promotional badge/seal with the text '${promotionName}' in bold 3D metallic letters. The badge should have dramatic lighting, perspective view, on a completely transparent background. Professional retail promotional style. Colors: ${colorsStr}. Ultra-realistic 3D render, high quality.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      },
    } as never);

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    // Look for inline image data in parts
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";

        // Return as binary image
        const buffer = Buffer.from(imageData!, "base64");
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": "inline; filename=seal.png",
          },
        });
      }
    }

    // If no inline image found, return the base64 data in JSON
    return NextResponse.json(
      { error: "No image data found in response" },
      { status: 500 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
