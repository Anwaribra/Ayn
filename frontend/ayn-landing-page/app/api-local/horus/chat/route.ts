import { GoogleGenerativeAI } from "@google/generative-ai";

type IncomingMessage = {
  role?: string;
  content?: unknown;
};

type GeminiPart = { text: string };

function toText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const textParts = content
      .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join(" ")
      .trim();
    return textParts;
  }
  return "";
}

function buildHistory(messages: IncomingMessage[]) {
  const normalized = messages
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: toText(m.content),
    }))
    .filter((m) => m.text.length > 0);

  // Gemini startChat is strict; ensure first turn is user and collapse invalid consecutive roles.
  while (normalized.length > 0 && normalized[0].role !== "user") {
    normalized.shift();
  }

  const collapsed: { role: "user" | "model"; text: string }[] = [];
  for (const item of normalized) {
    const prev = collapsed[collapsed.length - 1];
    if (!prev || prev.role !== item.role) {
      collapsed.push(item as { role: "user" | "model"; text: string });
    } else {
      prev.text = `${prev.text}\n${item.text}`.trim();
    }
  }

  return collapsed.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }] as GeminiPart[],
  }));
}

function localHorusReply(input: string): string {
  const q = input.toLowerCase();
  const greetingWords = ["hi", "hello", "hey", "مرحبا", "اهلا", "السلام"];

  if (greetingWords.some((w) => q.includes(w))) {
    return "Hi, I am Horus Support. I can help with evidence mapping, gap closure, standards checklist, or action workflow. What do you need first?";
  }

  if (q.includes("evidence") || q.includes("دليل") || q.includes("مستند")) {
    return "Sure. Start by uploading policy and process documents, then map each file to criteria. I can list the top missing evidence right after.";
  }
  if (q.includes("gap") || q.includes("فجوة")) {
    return "Great. Let us start with high-impact gaps first, assign owners, then set target dates. After that we can generate a remediation plan.";
  }
  if (q.includes("iso") || q.includes("ncaaa") || q.includes("standard") || q.includes("معيار")) {
    return "For standards readiness, we will align governance, evidence mapping, and periodic review. I can prepare a short checklist for your team.";
  }
  return `Got it. For "${input}", here is the fastest path:\n1) set the target standard\n2) link related evidence\n3) run a focused gap check\n\nIf you want, I can draft this as an action plan now.`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";

    const body = await req.json();
    const { messages } = body as { messages: IncomingMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    const latestText = toText(messages[messages.length - 1]?.content);
    if (!latestText) {
      return new Response(JSON.stringify({ error: "Latest message content is empty" }), { status: 400 });
    }

    // Fallback for local dev when key is not configured: return a useful Horus-style response, not HTTP 500.
    if (!apiKey) {
      const encoder = new TextEncoder();
      const fallback = localHorusReply(latestText);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(fallback));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction:
        "You are Horus (حورس), the central intelligence of the Ayn (عين) Platform. You assist with educational quality assurance, ISO 21001, NAQAAE, and NCAAA. Keep answers professional, concise, and structured with Markdown.",
    });

    // Build strict chat history for Gemini.
    const history = buildHistory(messages.slice(0, -1));
    const messageParts = [{ text: latestText }];

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
