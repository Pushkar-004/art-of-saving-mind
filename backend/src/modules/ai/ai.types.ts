// Phase 4.2 — AI Wellness Assistant.
// Deliberately minimal: the API is stateless (no server-side
// conversation memory, no database table) — the frontend keeps the
// session-only chat history in component state and only ever sends
// the single latest user message here.

export interface ChatRequestBody {
  message: string;
}

export interface ChatResponseDTO {
  reply: string;
}
