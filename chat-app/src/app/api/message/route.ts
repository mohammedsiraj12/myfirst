import { sendMessageToAll } from "@/lib/eventBus";
import { ChatMessage } from "@/types/chat";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const user = String(body?.user ?? "Anonymous").slice(0, 64);
    const text = String(body?.text ?? "").slice(0, 2000);

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      user,
      text,
      createdAt: Date.now(),
    };

    sendMessageToAll(message);

    return new Response(JSON.stringify({ ok: true, message }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}