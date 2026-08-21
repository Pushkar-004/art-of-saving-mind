'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ChatButtonProps {
  isOpen: boolean
  onClick: () => void
  label: string
  closeLabel: string
}

/**
 * A calm, hand-drawn meditating figure — used instead of a generic
 * robot/support icon so the assistant feels like a warm wellness
 * companion rather than a commercial help-desk bot.
 */
function MeditatingFigureIcon() {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* soft aura */}
      <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.12" />
      {/* head */}
      <circle cx="24" cy="15" r="5.2" fill="currentColor" />
      {/* body, sitting cross-legged */}
      <path
        d="M24 21c-3.4 0-6.2 2.4-6.9 5.6l-1.4 6.4c-.3 1.4.8 2.7 2.2 2.7h1.3l.9-4.4v4.4h7.8v-4.4l.9 4.4h1.3c1.4 0 2.5-1.3 2.2-2.7l-1.4-6.4C30.2 23.4 27.4 21 24 21z"
        fill="currentColor"
      />
      {/* crossed legs */}
      <path
        d="M13 33.5c2.6 1.6 6.2 2.5 11 2.5s8.4-.9 11-2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      {/* hands together in front */}
      <circle cx="24" cy="27.5" r="1.6" fill="var(--card, #fff)" />
    </svg>
  )
}

export default function ChatButton({ isOpen, onClick, label, closeLabel }: ChatButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? closeLabel : label}
      aria-expanded={isOpen}
      className="relative flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-lift)' }}
      animate={isOpen ? { scale: 1 } : { scale: [1, 1.05, 1] }}
      transition={isOpen ? { duration: 0.2 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      {isOpen ? <X size={26} /> : <MeditatingFigureIcon />}
    </motion.button>
  )
}
