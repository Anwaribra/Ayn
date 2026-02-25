import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60; // Allow longer execution time for AI streams

/**
 * Horus AI Chat Endpoint (Next.js Edge Route)
 * We call the Gemini API directly from this route using @ai-sdk/google.
 * This is the simpler approach for assistant-ui integration since Vercel AI SDK 
 * natively handles message history, formatting, streaming constraints, and 
 * inline image/PDF parsing directly to Gemini via dataURIs without needing 
 * complex FormData translations and manual evidence upload proxying.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in .env.local" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `You are Horus (حورس), the central intelligence of the Ayn (عين) Platform. You assist with educational quality assurance, ISO 21001, NAQAAE, and NCAAA. Keep answers professional, concise, and structured with Markdown.`

    const result = await streamText({
      model: google("gemini-1.5-pro-latest"),
      system: systemPrompt,
      messages: messages as any[],
    });

    // Stream the responses back using standard Vercel AI data stream format
    // @ts-ignore - toDataStreamResponse is the correct method for AI SDK v3 data protocol
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Horus Chat Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate AI response." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
