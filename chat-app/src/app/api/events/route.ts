import { addClient, removeClient, sendHistoryToWriter, sendPing } from "@/lib/eventBus";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  addClient(writer);

  // Send existing history to the newly connected client
  await sendHistoryToWriter(writer).catch(() => {});

  // Keep-alive pings
  const pingInterval = setInterval(() => {
    sendPing(writer).catch(() => {
      clearInterval(pingInterval);
      removeClient(writer);
    });
  }, 30000);

  // Handle client disconnect
  const abort = () => {
    clearInterval(pingInterval);
    removeClient(writer);
  };
  try {
    request.signal.addEventListener("abort", abort);
  } catch {}

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Allow CORS during local dev if needed
    "Access-Control-Allow-Origin": "*",
  });

  return new Response(stream.readable, { headers });
}