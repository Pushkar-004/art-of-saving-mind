import OpenAI from 'openai';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

// -----------------------------------------------------------------
// System prompt — the single source of truth for what the assistant
// is and isn't allowed to do. Kept strict and explicit rather than
// relying on the model's default judgment, per the Phase 4.2 spec.
// -----------------------------------------------------------------
const SYSTEM_PROMPT = `You are "Mind Companion", a supportive AI wellness assistant embedded in a psychologist's patient portal.

Your ONLY purpose is to offer general, non-clinical wellness support on these topics:
- stress relief
- breathing exercises
- mindfulness
- relaxation techniques
- sleep hygiene
- motivation
- emotional wellness
- general mental health FAQs (in plain, educational terms)

You must STRICTLY follow these rules at all times, with no exceptions:
1. NEVER diagnose any disease, disorder, or condition — do not tell anyone what they "have" or label their experience with a clinical diagnosis.
2. NEVER prescribe, recommend, or suggest any medication, dosage, or medical treatment.
3. NEVER claim to replace a psychologist, therapist, doctor, or any licensed mental health professional. You are a supplementary wellness tool only.
4. NEVER give emergency advice or attempt to handle a crisis yourself. You are not equipped for emergencies.
5. NEVER claim certainty. Use careful, humble language ("this may help", "some people find", "it can sometimes be useful to") rather than absolute claims.

If the user asks for a diagnosis, medication or medical treatment advice, or mentions suicide, self-harm, wanting to die, or harming themselves or anyone else:
- Do NOT continue the wellness conversation as normal.
- Gently and warmly decline to address it yourself.
- Clearly and directly encourage them to reach out to a licensed mental health professional or, if they are in immediate danger, a local emergency service or crisis helpline right away.
- Keep this response short, warm, and non-judgmental. Do not lecture.

Stay warm, concise, and conversational. Use short paragraphs and occasional markdown (lists, **bold** for key phrases) where it improves clarity. Do not pretend to be human, and do not claim to remember previous separate conversations.`;

// -----------------------------------------------------------------
// Defense-in-depth: a lightweight keyword guard that intercepts
// clearly crisis-shaped messages BEFORE they ever reach the model,
// so a safe, consistent response is guaranteed even if a model
// response were to drift. This is intentionally narrow — it only
// short-circuits the obvious cases; everything else still goes
// through the model with the system prompt above doing the rest of
// the work.
// -----------------------------------------------------------------
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bkill\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bself[\s-]?harm/i,
  /\bhurt\s+myself\b/i,
  /\boverdose\b/i,
  /\bcut\s+myself\b/i,
];

function containsCrisisLanguage(message: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(message));
}

const CRISIS_RESPONSE =
  "I'm really glad you told me, and I want to take this seriously. I'm not able to support you safely with this myself — please reach out right now to a licensed mental health professional, or your local emergency services / crisis helpline if you're in immediate danger. You deserve real support from someone qualified to help, and you don't have to go through this alone.";

// Diagnosis / medication requests are also short-circuited with a
// consistent, on-brand refusal rather than leaving it entirely to
// the model's interpretation of the system prompt.
const RESTRICTED_PATTERNS: RegExp[] = [
  /\bdiagnos/i,
  /\bdo\s+i\s+have\b/i,
  /\bwhat\s+(disease|disorder|condition)\b/i,
  /\bprescri/i,
  /\bwhat\s+medicat/i,
  /\bdosage\b/i,
  /\bhow\s+much\s+(medicine|medication|pills?)\b/i,
];

function isRestrictedRequest(message: string): boolean {
  return RESTRICTED_PATTERNS.some((pattern) => pattern.test(message));
}

const RESTRICTED_RESPONSE =
  "That's something I'm not able to help with — I can't diagnose conditions or advise on medication or medical treatment. A licensed mental health professional or doctor is the right person to ask about this; Miss. Pooja Sunil Ghadge can help during your next session. In the meantime, I'm happy to talk through stress relief, sleep, mindfulness, or general emotional wellness if that would help.";

// -----------------------------------------------------------------
// OpenAI client — lazily constructed so the server can still boot
// (and every other module keeps working) even if OPENAI_API_KEY
// hasn't been set yet. The error only surfaces when /api/ai/chat is
// actually called.
// -----------------------------------------------------------------
let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw AppError.internal(
      'AI assistant is not configured. Set OPENAI_API_KEY in the backend environment.',
    );
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

/**
 * Stateless single-turn chat. No conversation history is sent or
 * stored server-side — the frontend owns the session-only history
 * and this function only ever sees the latest user message, matching
 * the "no AI memory, no database" requirement.
 */
async function chat(message: string): Promise<string> {
  if (containsCrisisLanguage(message)) {
    return CRISIS_RESPONSE;
  }
  if (isRestrictedRequest(message)) {
    return RESTRICTED_RESPONSE;
  }

  const openai = getClient();
  const model = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: 0.6,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    });
  } catch (err) {
    // IMPORTANT: the previous version of this catch block swallowed the
    // real OpenAI error entirely (`catch {}` with no binding), which is
    // why the chatbot silently "never worked" — an invalid/missing API
    // key, an unauthorized/wrong model name, a rate limit, or a network
    // problem all produced the exact same generic message, with nothing
    // in the server logs to tell you which one it actually was.
    //
    // Now: log the real error server-side (so `npm run dev` shows the
    // true cause) and return a specific, actionable message for the
    // most common misconfigurations, while still never leaking the key
    // itself to the client.
    // eslint-disable-next-line no-console
    console.error('[ai.service] OpenAI request failed:', err);

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        throw AppError.internal(
          'AI assistant is not configured correctly: OpenAI rejected the API key (invalid, expired, or revoked). Check OPENAI_API_KEY in the backend .env file.',
        );
      }
      if (err.status === 404) {
        throw AppError.internal(
          `AI assistant is not configured correctly: the model "${model}" is not available to this API key. Check OPENAI_MODEL in the backend .env file.`,
        );
      }
      if (err.status === 429) {
        throw AppError.internal(
          'The AI assistant is temporarily rate-limited or out of quota on the connected OpenAI account. Please try again shortly.',
        );
      }
    }

    throw AppError.internal('Failed to reach the AI assistant. Please try again.');
  }

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw AppError.internal('The AI assistant returned an empty response. Please try again.');
  }

  return reply;
}

export const aiService = {
  chat,
};
