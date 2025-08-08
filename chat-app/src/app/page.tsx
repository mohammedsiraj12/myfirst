"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Load and persist user name in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat_user_name");
      if (stored) setUserName(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (userName) localStorage.setItem("chat_user_name", userName);
    } catch {}
  }, [userName]);

  // Connect to SSE events
  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    const onHistory = (event: MessageEvent) => {
      try {
        const history: ChatMessage[] = JSON.parse(event.data);
        setMessages(history);
      } catch {}
    };

    const onMessage = (event: MessageEvent) => {
      try {
        const msg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch {}
    };

    eventSource.addEventListener("history", onHistory);
    eventSource.addEventListener("message", onMessage);

    eventSource.onerror = () => {
      // Let browser auto-reconnect
    };

    return () => {
      eventSource.removeEventListener("history", onHistory);
      eventSource.removeEventListener("message", onMessage);
      eventSource.close();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  async function sendMessage() {
    if (!canSend) return;
    const payload = {
      user: userName || "Anonymous",
      text: text.trim(),
    };
    setText("");
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("Failed to send message");
      }
    } catch (e) {
      console.error("Network error", e);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">SSE Chat</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70" htmlFor="name">Name</label>
          <input
            id="name"
            className="h-9 rounded-md border px-3 bg-transparent outline-none focus:ring-2 ring-offset-1 ring-offset-background ring-foreground/20"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 grid grid-rows-[1fr_auto] max-w-3xl w-full mx-auto px-4">
        <div className="overflow-y-auto py-4 space-y-3">
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} selfName={userName} />
          ))}
          <div ref={listEndRef} />
        </div>

        <div className="border-t py-3 flex items-center gap-2">
          <input
            className="flex-1 h-11 rounded-md border px-3 bg-transparent outline-none focus:ring-2 ring-offset-1 ring-offset-background ring-foreground/20"
            placeholder="Type a message and press Enter"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="h-11 px-4 rounded-md bg-foreground text-background disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </main>

      <footer className="px-4 py-3 text-xs opacity-60 text-center border-t">
        Built with Next.js + SSE
      </footer>
    </div>
  );
}

function MessageItem({ message, selfName }: { message: ChatMessage; selfName: string }) {
  const isSelf = selfName && message.user === selfName;
  const date = new Date(message.createdAt);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-lg border px-3 py-2 ${isSelf ? "bg-foreground text-background" : "bg-transparent"}`}>
        <div className="text-xs opacity-70 mb-1">
          {message.user || "Anonymous"} · {time}
        </div>
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
      </div>
    </div>
  );
}
