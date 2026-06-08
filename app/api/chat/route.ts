import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { CARBON_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";

export const runtime = "edge";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

// Normalize AI SDK v6 UIMessage format to CoreMessage format for streamText
function normalizeMessages(messages: Array<Record<string, unknown>>): Array<{ role: string; content: string }> {
  return messages.map((msg) => {
    let content = "";

    // AI SDK v6: message has parts array
    if (Array.isArray(msg.parts)) {
      content = (msg.parts as Array<{ type?: string; text?: string }>)
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }

    // Fallback: content is a string (v5 compat or direct messages)
    if (!content && typeof msg.content === "string") {
      content = msg.content;
    }

    // Fallback: content is array of parts
    if (!content && Array.isArray(msg.content)) {
      content = (msg.content as Array<{ type?: string; text?: string }>)
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }

    return {
      role: (msg.role as string) === "user" ? "user" : "assistant",
      content: content || "",
    };
  });
}

import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.string().optional(), text: z.string().optional() }).passthrough())
  ]),
  parts: z.array(z.object({ type: z.string().optional(), text: z.string().optional() }).passthrough()).optional(),
}).passthrough();

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).max(50), // Prevent massive payloads
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    
    // Security: Strict validation of incoming payload
    const parsedBody = chatRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload format." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawMessages = parsedBody.data.messages;
    const normalized = normalizeMessages(rawMessages);

    // Filter to only valid user/assistant messages with content
    const messages = normalized.filter((m) => m.content.trim().length > 0);

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: CARBON_SYSTEM_PROMPT,
      messages: messages as any,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[CarbonPilot Chat Error]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "AI service error", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
