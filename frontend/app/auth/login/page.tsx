'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, ArrowRight, Mail, Lock } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'
import { useT } from '@/lib/i18n/useT'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await login(email, password)
      toast.success(t('toast.loginSuccessful'))
      window.location.href =
        user.role === 'admin' ? '/dashboard/admin' : '/dashboard/patient'
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('toast.loginFailed')
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
            <h1 className="text-2xl font-bold text-foreground">{t('auth.welcomeBack')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.signInToContinue')}
            </p>
          </div>

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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">{t('auth.password')}</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="glass-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? t('buttons.signingIn') : t('buttons.signIn')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gradient-to-br from-background to-background text-muted-foreground">
                {t('auth.dontHaveAccount')}
              </span>
            </div>
          </div>

          <Link
            href="/auth/signup"
            className="glass-button-outline w-full flex items-center justify-center gap-2"
          >
            {t('buttons.createAccount')}
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
