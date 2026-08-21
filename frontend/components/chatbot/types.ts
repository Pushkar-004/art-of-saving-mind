// Shared types for the static, rule-based virtual assistant.
// No AI/LLM/backend is involved anywhere in this feature — every
// response below is predefined content resolved entirely on the client.

export type ChatLanguage = 'en' | 'mr'

/** A follow-up action button that can be attached to a bot answer. */
export interface FaqAction {
  labelEn: string
  labelMr: string
  /** Internal route (uses next/link) or external URL (mailto:, tel:, https:) */
  href: string
  external?: boolean
}

/** A single predefined question/answer entry in the knowledge base. */
export interface FaqEntry {
  id: string
  keywordsEn: string[]
  keywordsMr: string[]
  answerEn: string
  answerMr: string
  action?: FaqAction
  /** Marks entries that should be treated with extra care (no diagnosis, just signposting). */
  isEmergency?: boolean
}

/** A quick-reply suggestion chip shown in the chat window. */
export interface QuickAction {
  id: string
  labelEn: string
  labelMr: string
}

export interface ChatMessage {
  id: string
  sender: 'bot' | 'user'
  textEn?: string
  textMr?: string
  /** Pre-resolved text, used for user messages which aren't translated. */
  text?: string
  timestamp: number
  action?: FaqAction
  isCrisis?: boolean
  isFallback?: boolean
}
