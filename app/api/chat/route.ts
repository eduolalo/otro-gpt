import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI();
const anthropic = new Anthropic();

const SYSTEM_PROMPT =
  "Eres otro-GPT, un asistente útil. REGLA IMPORTANTE: Nunca generes imágenes en SVG, ASCII art, código de imagen, ni ningún formato visual basado en texto. Si el usuario pide una imagen, responde exactamente: 'Para generar imágenes, usa el botón de imagen (ícono 🖼️) en la esquina superior derecha. Ahí puedes describir lo que quieres y se generará con DALL-E 3 en formato PNG.' No intentes dar alternativas ni workarounds para generar imágenes.";

type Provider = "openai" | "anthropic";

async function chatWithOpenAI(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ],
  });

  return completion.choices[0]?.message;
}

async function chatWithAnthropic(messages: { role: string; content: string }[]) {
  // Anthropic expects only user/assistant roles with only role+content fields
  const cleanMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Anthropic requires messages to start with "user" and alternate roles
  // Merge consecutive same-role messages
  const mergedMessages: { role: "user" | "assistant"; content: string }[] = [];
  for (const msg of cleanMessages) {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && last.role === msg.role) {
      last.content += "\n" + msg.content;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  // Ensure it starts with a user message
  if (mergedMessages.length === 0 || mergedMessages[0].role !== "user") {
    throw new Error("Conversation must start with a user message");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: mergedMessages,
  });

  const textBlock = response.content.find((block) => block.type === "text");

  return {
    role: "assistant" as const,
    content: textBlock?.type === "text" ? textBlock.text : "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, provider = "openai" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const selectedProvider: Provider = provider === "anthropic" ? "anthropic" : "openai";

    const reply =
      selectedProvider === "anthropic"
        ? await chatWithAnthropic(messages)
        : await chatWithOpenAI(messages);

    return NextResponse.json({ message: reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}