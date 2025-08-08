import { ChatMessage } from "@/types/chat";

const encoder = new TextEncoder();

// Keep a small in-memory log of recent messages
const MAX_RECENT_MESSAGES = 200;
const recentMessages: ChatMessage[] = [];

// Track active SSE clients (writers)
const sseClientWriters = new Set<WritableStreamDefaultWriter<Uint8Array>>();

function writeEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  eventName: string,
  data: unknown
): Promise<void> {
  const payload = `event: ${eventName}\n` +
    `data: ${JSON.stringify(data)}\n\n`;
  return writer.write(encoder.encode(payload));
}

export function addClient(
  writer: WritableStreamDefaultWriter<Uint8Array>
): void {
  sseClientWriters.add(writer);
}

export function removeClient(
  writer: WritableStreamDefaultWriter<Uint8Array>
): void {
  if (sseClientWriters.has(writer)) {
    sseClientWriters.delete(writer);
  }
  // Best-effort close; ignore errors if already closed
  try {
    writer.close();
  } catch {}
}

export function broadcastEvent(eventName: string, data: unknown): void {
  for (const writer of sseClientWriters) {
    writeEvent(writer, eventName, data).catch(() => {
      // On write error, drop the client
      sseClientWriters.delete(writer);
      try {
        writer.close();
      } catch {}
    });
  }
}

export function appendMessage(message: ChatMessage): void {
  recentMessages.push(message);
  if (recentMessages.length > MAX_RECENT_MESSAGES) {
    recentMessages.splice(0, recentMessages.length - MAX_RECENT_MESSAGES);
  }
}

export function getRecentMessages(): ChatMessage[] {
  return recentMessages.slice();
}

export function sendHistoryToWriter(
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  return writeEvent(writer, "history", getRecentMessages());
}

export function sendPing(
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  // SSE comment ping to keep connection alive
  const payload = `: ping ${Date.now()}\n\n`;
  return writer.write(encoder.encode(payload));
}

export function sendMessageToAll(message: ChatMessage): void {
  appendMessage(message);
  broadcastEvent("message", message);
}