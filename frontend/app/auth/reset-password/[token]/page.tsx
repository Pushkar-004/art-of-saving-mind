'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, ArrowRight, Lock, Check, CheckCircle2 } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params?.token ?? ''
  const { t } = useT()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // Lightweight client-side rules so the demo feels real.
  const rules = [
    { label: t('auth.atLeast8Characters'), valid: password.length >= 8 },
    { label: t('auth.oneUppercaseLetter'), valid: /[A-Z]/.test(password) },
    { label: t('auth.oneNumber'), valid: /[0-9]/.test(password) },
  ]
  const allValid = rules.every((r) => r.valid)
  const matches = password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allValid) {
      toast.error(t('toast.passwordRequirementsNotMet'))
      return
    }
    if (!matches) {
      toast.error(t('toast.passwordMismatch'))
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      toast.success(t('toast.passwordResetSuccess'))
      setIsDone(true)
      setTimeout(() => router.push('/auth/login'), 1800)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('toast.passwordResetFailed')
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
            <h1 className="text-2xl font-bold text-foreground">
              {isDone ? t('auth.passwordUpdated') : t('auth.setNewPassword')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDone
                ? t('auth.redirectingToSignIn')
                : t('auth.chooseStrongPassword')}
            </p>
          </div>

          {isDone ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 size={28} />
              </span>
              <Link
                href="/auth/login"
                className="glass-button w-full flex items-center justify-center gap-2"
              >
                {t('buttons.continueToSignIn')}
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('auth.newPassword')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {confirmPassword.length > 0 && !matches && (
                  <p className="mt-2 text-xs text-destructive">{t('auth.passwordMismatch')}</p>
                )}
              </div>

              {/* Live validation checklist */}
              <ul className="space-y-1.5 rounded-lg bg-secondary/50 p-3">
                {rules.map((rule) => (
                  <li key={rule.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                        rule.valid ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check size={11} />
                    </span>
                    <span className={rule.valid ? 'text-foreground' : 'text-muted-foreground'}>
                      {rule.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="submit"
                disabled={isLoading}
                className="glass-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? t('buttons.updating') : t('buttons.resetPassword')}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
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
        {t('auth.needHelp')}{' '}
        <Link href="/contact" className="text-primary hover:text-primary/80 transition-colors">
          {t('buttons.contactUs')}
        </Link>
      </p>
    </motion.div>
  )
}
