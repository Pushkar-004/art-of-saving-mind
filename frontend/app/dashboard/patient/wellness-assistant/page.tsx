'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Sparkles, Heart, Wind, Moon, Activity, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { sendWellnessChatMessage } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

// Fixed English values sent to the AI backend — must never be translated
const QUICK_PROMPT_KEYS = [
  { message: "I'm feeling anxious",       translationKey: 'wellnessAssistant.promptFeelingAnxious', icon: Heart },
  { message: 'Stress relief techniques',  translationKey: 'wellnessAssistant.promptStressRelief',   icon: Activity },
  { message: 'Sleep improvement tips',    translationKey: 'wellnessAssistant.promptSleepTips',      icon: Moon },
  { message: 'Breathing exercises',       translationKey: 'wellnessAssistant.promptBreathingExercises', icon: Wind },
]

const WELCOME_TEXT =
  "Hello! I'm your wellness support assistant. I'm here to help with stress relief, relaxation techniques, and emotional support. How can I help you today? (Note: I provide wellness support only, not clinical diagnosis)"

interface ChatMessage {
  type: 'user' | 'assistant'
  text: string
}

// Renders assistant replies with basic markdown support (bold, lists,
// links, inline code) using the same type scale/colors as the rest of
// the chat bubble — no new design system, just mapping markdown nodes
// onto the existing text classes.
function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline text-primary hover:no-underline"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-background/60 px-1 py-0.5 text-xs">{children}</code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

export default function WellnessAssistantPage() {
  const { t } = useT()

  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: 'assistant', text: WELCOME_TEXT },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isWelcome = messages.length <= 1

  // Auto-scroll to the latest message/typing indicator.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, error])

  const sendToBackend = useCallback(async (text: string, isRetry: boolean) => {
    if (!isRetry) {
      setMessages((prev) => [...prev, { type: 'user', text }])
    }
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const res = await sendWellnessChatMessage(text)
      setMessages((prev) => [...prev, { type: 'assistant', text: res.data.reply }])
      setLastFailedMessage(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('wellnessAssistant.couldNotReach'),
      )
      setLastFailedMessage(text)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isLoading) return
    void sendToBackend(text.trim(), false)
  }

  const handleRetry = () => {
    if (!lastFailedMessage || isLoading) return
    void sendToBackend(lastFailedMessage, true)
  }

  return (
    <motion.div
      className="mx-auto flex w-full max-w-3xl flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col overflow-hidden p-0">
        {/* Soft gradient header */}
        <div className="wellness-wash flex items-center gap-3 border-b border-border/50 px-5 py-4">
          <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles size={20} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-secondary" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-foreground">{t('wellnessAssistant.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('wellnessAssistant.subtitle')}</p>
          </div>
        </div>

        {/* Messages / Welcome */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {isWelcome ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart size={30} />
              </span>
              <h2 className="text-xl font-semibold text-foreground">{t('wellnessAssistant.welcomeHeading')}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
                {WELCOME_TEXT}
              </p>

              <div className="mt-7 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                {QUICK_PROMPT_KEYS.map((prompt, i) => {
                  const Icon = prompt.icon
                  return (
                    <motion.button
                      key={prompt.message}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.07 }}
                      onClick={() => handleSendMessage(prompt.message)}
                      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-soft"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-medium text-foreground">{t(prompt.translationKey)}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isUser = message.type === 'user'
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <span className="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Sparkles size={15} />
                        </span>
                      )}
                      <div
                        className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed shadow-soft ${
                          isUser
                            ? 'rounded-3xl rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-3xl rounded-bl-md bg-muted/70 text-foreground'
                        }`}
                      >
                        {isUser ? message.text : <MarkdownMessage text={message.text} />}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Typing / loading state */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2.5"
                >
                  <span className="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles size={15} />
                  </span>
                  <div className="rounded-3xl rounded-bl-md bg-muted/70 px-4 py-3.5">
                    <div className="flex gap-1.5">
                      {[0, 0.2, 0.4].map((d) => (
                        <motion.span
                          key={d}
                          className="h-2 w-2 rounded-full bg-primary/60"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error + retry */}
              {error && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <RotateCcw size={12} />
                      {t('wellnessAssistant.tryAgain')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer strip */}
        <div className="flex items-center gap-2 border-t border-border/50 bg-muted/30 px-4 py-2 sm:px-6">
          <ShieldCheck size={14} className="shrink-0 text-secondary" />
          <p className="text-[11px] leading-snug text-muted-foreground text-pretty">
            {t('wellnessAssistant.disclaimer')}
          </p>
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-3 sm:p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-2 py-1.5 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(input)}
              placeholder={t('wellnessAssistant.inputPlaceholder')}
              className="flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage(input)}
              disabled={isLoading || !input.trim()}
              aria-label={t('wellnessAssistant.sendMessage')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
