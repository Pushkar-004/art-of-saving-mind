'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, ArrowRight, Mail } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { forgotPassword } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

export default function ForgotPasswordPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await forgotPassword(email)
      toast.success(t('toast.passwordResetEmailSent'))
      setIsSent(true)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('toast.resetEmailFailed')
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Logo */}
      <Link href="/" className="flex justify-center mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Heart size={24} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t('nav.brandName')}</p>
            <p className="text-xs text-muted-foreground">{t('nav.brandTagline')}</p>
          </div>
        </div>
      </Link>

      {/* Card */}
      <GlassCard>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t('auth.resetYourPassword')}</h1>
            <p className="text-sm text-muted-foreground">
              {isSent
                ? t('auth.checkEmailForInstructions')
                : t('auth.enterEmailForResetLink')}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="glass-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? t('auth.sendingLink') : t('buttons.sendResetLink')}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-foreground text-center">
                  {t('auth.weveSentResetLink')} <span className="font-semibold">{email}</span>
                </p>
              </div>
              <button
                onClick={() => setIsSent(false)}
                className="glass-button-outline w-full"
              >
                {t('buttons.tryAnotherEmail')}
              </button>
            </div>
          )}

          <Link
            href="/auth/login"
            className="glass-button-outline w-full flex items-center justify-center gap-2"
          >
            {t('buttons.backToSignIn')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </GlassCard>

      {/* Footer Link */}
      <p className="text-center text-xs text-muted-foreground">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/auth/signup" className="text-primary hover:text-primary/80 transition-colors">
          {t('buttons.signUpHere')}
        </Link>
      </p>
    </motion.div>
  )
}
