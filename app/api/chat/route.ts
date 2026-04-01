import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, Content } from "@google/genai";

const openai = new OpenAI();
const anthropic = new Anthropic();
const genai = new GoogleGenAI({});

const SYSTEM_PROMPT =
  "Eres otro-GPT, un asistente útil. REGLA IMPORTANTE: Nunca generes imágenes en SVG, ASCII art, código de imagen, ni ningún formato visual basado en texto. Si el usuario pide una imagen, responde exactamente: 'Para generar imágenes, usa el botón de imagen (ícono 🖼️) en la esquina superior derecha. Ahí puedes describir lo que quieres y se generará con DALL-E 3 en formato PNG.' No intentes dar alternativas ni workarounds para generar imágenes.";

type Provider = "openai" | "anthropic" | "gemini";

type Message = {
  role: "user" | "assistant";
  content: string;
};

async function chatWithOpenAI(messages: Message[]): Promise<Message> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  return {
    role: "assistant" as const,
    content: completion.choices[0]?.message?.content || "",
  };
}

async function chatWithAnthropic(messages: Message[]): Promise<Message> {
  // Anthropic expects only user/assistant roles with only role+content fields
  const cleanMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Anthropic requires messages to start with "user" and alternate roles
  // Merge consecutive same-role messages
  const mergedMessages: Message[] = [];
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

async function chatWithGeminAI(messages: Message[]): Promise<Message> {
  // Gemini allowed roles are "user and "model

  const cleanMessages: Content[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map(
      (m) =>
        ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [
            {
              text: m.content,
            },
          ],
        }) as unknown as Content,
    );

  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0]?.content;

  if (!lastUserMessage) {
    throw new Error("At least one user message is required");
  }

  //remove last user message from history since it will be sent as the current message
  const historyWithoutLastUser = cleanMessages.slice(0, -1);

  const chat = genai.chats.create({
    model: "gemini-3.1-flash-lite-preview",
    history: [
      { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
      ...historyWithoutLastUser,
    ],
  });

  const response = await chat.sendMessage({
    message: lastUserMessage,
  });

  return {
    role: "assistant" as const,
    content: response.text || "No response from Gemini",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, provider = "openai" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const selectedProvider: Provider =
      provider === "anthropic"
        ? "anthropic"
        : provider === "gemini"
          ? "gemini"
          : "openai";

    const reply =
      selectedProvider === "anthropic"
        ? await chatWithAnthropic(messages)
        : selectedProvider === "gemini"
          ? await chatWithGeminAI(messages)
          : await chatWithOpenAI(messages);

    return NextResponse.json({ message: reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
