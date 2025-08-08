# SSE Chat (Next.js + TypeScript + Tailwind)

A minimal real-time chat application built with Next.js App Router, using Server-Sent Events (SSE) for live updates. The server holds a simple in-memory event bus to broadcast messages to all connected clients.

## Features
- Real-time message updates via SSE (no external services)
- Clean UI with Tailwind CSS
- In-memory message history (limited buffer)
- Simple REST endpoint to send messages

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Server-Sent Events (SSE)

## Getting Started

### Prerequisites
- Node.js 18+ (or the version supported by your environment)
- npm (comes with Node.js)

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```
Then open `http://localhost:3000` in your browser. Open multiple tabs to see realtime updates.

### Build and start (production)
```bash
npm run build
npm run start
```

## How it works
- Clients connect to `GET /api/events` which streams SSE events.
- Sending `POST /api/message` broadcasts a message to all connected SSE clients.
- A small in-memory buffer stores recent messages and is sent as a `history` event on connect.

This in-memory approach is stateless per process and not shared across instances. For production, replace the event bus with a shared pub/sub layer (e.g., Redis) or use a managed real-time service.

## API

### Stream events
- **Endpoint**: `GET /api/events`
- **Response**: `text/event-stream`
- **Events**:
  - `history`: array of `ChatMessage`
  - `message`: a single `ChatMessage`

Example:
```bash
curl -N http://localhost:3000/api/events
```

### Send a message
- **Endpoint**: `POST /api/message`
- **Body**: JSON `{ "user": string, "text": string }`
- **Response**: JSON `{ ok: true, message: ChatMessage }` on success

Example:
```bash
curl -sS -X POST http://localhost:3000/api/message \
  -H 'Content-Type: application/json' \
  -d '{"user":"Alice","text":"Hello world"}'
```

### Types
```ts
interface ChatMessage {
  id: string;
  user: string;    // defaults to "Anonymous" if omitted
  text: string;    // required, non-empty
  createdAt: number; // epoch ms
}
```

## Project Structure
- `src/app/page.tsx` — Client chat UI (connects to SSE and posts messages)
- `src/app/api/events/route.ts` — SSE stream endpoint
- `src/app/api/message/route.ts` — Message POST endpoint
- `src/lib/eventBus.ts` — In-memory SSE client registry and broadcast helpers
- `src/types/chat.ts` — Shared TypeScript types

## Customization
- Adjust history size in `src/lib/eventBus.ts` via `MAX_RECENT_MESSAGES`.
- Replace in-memory bus with Redis Pub/Sub (or similar) for durability and scale.
- Consider WebSockets if you need bi-directional, low-latency messaging or presence.

## Deploying
- The app can be deployed to any Node.js host. For serverless platforms, ensure streaming responses (SSE) are supported and not buffered by proxies.
- Disable response buffering and enable keep-alive; set appropriate timeouts.

## License
MIT
