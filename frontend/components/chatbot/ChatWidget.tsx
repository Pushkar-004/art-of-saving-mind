'use client'

// ---------------------------------------------------------------------------
// Static Virtual Assistant (Chatbot)
//
// This entire feature is 100% static and client-side:
//   - No AI/LLM API calls (OpenAI, Gemini, Claude, etc.)
//   - No Dialogflow or any third-party chatbot service
//   - No backend requests of any kind
// All responses are predefined content resolved locally from `faq.ts`,
// `en.ts`, and `mr.ts`. Language is auto-detected from the site's existing
// LanguageContext (English / Marathi).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Send, Phone, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/lib/context/LanguageContext'
import ChatButton from './ChatButton'
import { en, quickActionsEn } from './en'
import { mr, quickActionsMr } from './mr'
import { detectCrisis, matchFaq, getFaqById, EMERGENCY_HELPLINE_NUMBER } from './faq'
import type { ChatLanguage, ChatMessage, FaqAction, QuickAction } from './types'

let messageIdCounter = 0
function nextId(): string {
  messageIdCounter += 1
  return `msg-${Date.now()}-${messageIdCounter}`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function ChatWidget() {
  const { language } = useLanguage()
  // The chatbot ships English and Marathi content, per the feature spec.
  // Any other site language (e.g. Hindi) falls back to English.
  const uiLanguage: ChatLanguage = language === 'mr' ? 'mr' : 'en'
  const copy = uiLanguage === 'mr' ? mr : en
  const quickActions: QuickAction[] = uiLanguage === 'mr' ? quickActionsMr : quickActionsEn

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Seed the welcome message the first time the widget is opened.
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: nextId(),
          sender: 'bot',
          textEn: en.welcome,
          textMr: mr.welcome,
          timestamp: Date.now(),
        },
      ])
    }
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping, isOpen])

  const respondTo = useCallback(
    (rawText: string, forcedFaqId?: string) => {
      setIsTyping(true)
      const delay = 550 + Math.random() * 400

      window.setTimeout(() => {
        const isCrisis = detectCrisis(rawText)
        const matched = forcedFaqId ? getFaqById(forcedFaqId) : matchFaq(rawText, uiLanguage)

        let botMessage: ChatMessage

        if (isCrisis || matched?.isEmergency) {
          botMessage = { id: nextId(), sender: 'bot', timestamp: Date.now(), isCrisis: true }
        } else if (matched) {
          botMessage = {
            id: nextId(),
            sender: 'bot',
            textEn: matched.answerEn,
            textMr: matched.answerMr,
            action: matched.action,
            timestamp: Date.now(),
          }
        } else {
          botMessage = {
            id: nextId(),
            sender: 'bot',
            textEn: en.fallback,
            textMr: mr.fallback,
            action: { labelEn: en.fallbackButton, labelMr: mr.fallbackButton, href: '/contact' },
            isFallback: true,
            timestamp: Date.now(),
          }
        }

        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, delay)
    },
    [uiLanguage],
  )

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: trimmed, timestamp: Date.now() }])
    setInputValue('')
    respondTo(trimmed)
  }, [inputValue, respondTo])

  const handleQuickAction = useCallback(
    (qa: QuickAction) => {
      const label = uiLanguage === 'mr' ? qa.labelMr : qa.labelEn
      setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text: label, timestamp: Date.now() }])
      respondTo(label, qa.id)
    },
    [uiLanguage, respondTo],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const renderAction = (action: FaqAction) => {
    const label = uiLanguage === 'mr' ? action.labelMr : action.labelEn
    const classes =
      'mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20'
    if (action.external) {
      return (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {label}
        </a>
      )
    }
    return (
      <Link href={action.href} className={classes} onClick={() => setIsOpen(false)}>
        {label}
      </Link>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={copy.assistantName}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex h-[min(70vh,600px)] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card sm:w-96"
            style={{ boxShadow: 'var(--shadow-lift)' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-primary-foreground">
                <MessageCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary-foreground">{copy.assistantName}</p>
                <p className="truncate text-xs text-primary-foreground/85">{copy.headerSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={copy.closeChat}
                className="rounded-full p-1.5 text-primary-foreground/90 transition-colors hover:bg-white/15"
              >
                <span className="block text-lg leading-none">×</span>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
              {messages.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex flex-col items-end">
                      <div
                        className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm text-primary-foreground"
                        style={{ background: 'var(--primary)' }}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                    </div>
                  )
                }

                if (msg.isCrisis) {
                  return (
                    <div key={msg.id} className="flex flex-col items-start">
                      <div
                        className="max-w-[92%] rounded-2xl rounded-tl-sm border px-4 py-3.5 text-sm"
                        style={{
                          borderColor: 'color-mix(in oklab, var(--destructive) 40%, transparent)',
                          background: 'color-mix(in oklab, var(--destructive) 8%, var(--card))',
                        }}
                      >
                        <p className="font-semibold text-foreground">{copy.crisisTitle}</p>
                        <p className="mt-1 text-muted-foreground">{copy.crisisBody}</p>

                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-card/70 px-3 py-2">
                          <Phone size={16} className="text-destructive" />
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.crisisHelplineLabel}</p>
                            <a href={`tel:${EMERGENCY_HELPLINE_NUMBER}`} className="text-base font-bold text-foreground">
                              {EMERGENCY_HELPLINE_NUMBER}
                            </a>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="/contact"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                          >
                            {copy.crisisContactButton}
                          </Link>
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{copy.crisisDisclaimer}</p>
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                    </div>
                  )
                }

                const text = uiLanguage === 'mr' ? msg.textMr : msg.textEn
                return (
                  <div key={msg.id} className="flex flex-col items-start">
                    <div className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
                      {text}
                      {msg.action && <div>{renderAction(msg.action)}</div>}
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 w-fit">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="border-t border-border/60 px-3 py-2.5">
              <p className="mb-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {copy.quickActionsLabel}
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                {quickActions.map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => handleQuickAction(qa)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    {uiLanguage === 'mr' ? qa.labelMr : qa.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2.5">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={copy.inputPlaceholder}
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleSend}
                aria-label={copy.send}
                disabled={!inputValue.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground disabled:opacity-40"
                style={{ background: 'var(--primary)' }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} label={copy.openChat} closeLabel={copy.closeChat} />
    </div>
  )
}
