import { streamText, type CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import type { UserProfile } from "@/lib/types";

export const runtime = "edge";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

// ---- Input Validation Schema ----

const messagePart = z.object({
  type: z.string().optional(),
  text: z.string().optional(),
}).passthrough();

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(messagePart)]),
  parts: z.array(messagePart).optional(),
}).passthrough();

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  // Optional user profile for personalized AI responses
  profileContext: z.object({
    name: z.string().optional(),
    primaryTransport: z.string().optional(),
    dietType: z.string().optional(),
    sustainabilityGoal: z.string().optional(),
    householdSize: z.number().optional(),
    monthlyElectricityKwh: z.number().optional(),
  }).optional(),
});

// ---- Message Normalization ----

/** Converts AI SDK v6 UIMessage format into CoreMessage format for streamText */
function normalizeMessages(
  messages: z.infer<typeof messageSchema>[]
): CoreMessage[] {
  const normalized: CoreMessage[] = [];

  for (const msg of messages) {
    let content = "";

    // AI SDK v6: message has a parts array
    if (Array.isArray(msg.parts)) {
      content = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }

    // Fallback: content is a string
    if (!content && typeof msg.content === "string") {
      content = msg.content;
    }

    // Fallback: content is an array of parts
    if (!content && Array.isArray(msg.content)) {
      content = (msg.content as z.infer<typeof messagePart>[])
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }

    if (!content.trim()) continue;

    normalized.push({
      role: msg.role === "user" ? "user" : "assistant",
      content,
    });
  }

  return normalized;
}

// ---- Route Handler ----

export async function POST(req: Request): Promise<Response> {
  try {
    const rawBody = await req.json();

    // Security: Strict schema validation of all incoming data
    const parsed = chatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload.", issues: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages: rawMessages, profileContext } = parsed.data;
    const messages = normalizeMessages(rawMessages);

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build a personalized system prompt if user profile context is provided
    const systemPrompt = buildSystemPrompt(profileContext as UserProfile | null);

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
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
