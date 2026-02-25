import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: "You are Horus (حورس), the central intelligence of the Ayn (عين) Platform. You assist with educational quality assurance, ISO 21001, NAQAAE, and NCAAA. Keep answers professional, concise, and structured with Markdown."
    });
    
    const body = await req.json();
    const { messages } = body as { messages: any[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    // Format history
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: Array.isArray(msg.content) ? msg.content : [{ text: msg.content }],
    }));
    
    // Format latest message
    const latestMessage = messages[messages.length - 1].content;
    const messageParts = Array.isArray(latestMessage) ? latestMessage : [{ text: latestMessage }];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(messageParts);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(chunkText));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      },
    });
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
