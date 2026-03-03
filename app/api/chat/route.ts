import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

// export async function POST(req: NextRequest) {
//   try {
//     const { messages } = await req.json();

//     if (!messages || !Array.isArray(messages)) {
//       return NextResponse.json(
//         { error: "Messages array is required" },
//         { status: 400 }
//       );
//     }

//     const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");

//     if (!lastUserMessage) {
//       return NextResponse.json(
//         { error: "No user message found" },
//         { status: 400 }
//       );
//     }

//     const response = await openai.responses.create({
//       model: "gpt-5",
//       input: lastUserMessage.content,
//     });

//     return NextResponse.json({
//       message: {
//         role: "assistant",
//         content: response.output_text,
//       },
//     });
//   } catch (error: unknown) {
//     console.error("Chat API error:", error);
//     const message =
//       error instanceof Error ? error.message : "Internal server error";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
    });

    const reply = completion.choices[0]?.message;

    return NextResponse.json({ message: reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}