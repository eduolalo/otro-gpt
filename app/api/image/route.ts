// =============================================================
// API Route: Image Generation (DALL-E)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0];
    const b64 = imageData?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "No image data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: {
        b64,
        mimeType: "image/png",
        revisedPrompt: imageData.revised_prompt ?? null,
      },
    });
  } catch (error: unknown) {
    console.error("Image generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
