'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, ArrowRight, Mail, Lock, User, Check } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'
import { useT } from '@/lib/i18n/useT'

export default function SignupPage() {
  const { signup } = useAuth()
  const { t } = useT()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('toast.passwordMismatch'))
      return
    }

    if (!agreeToTerms) {
      toast.error(t('toast.agreeRequired'))
      return
    }

    setIsLoading(true)

    try {
      await signup(formData.fullName, formData.email, formData.password, formData.confirmPassword)
      toast.success(t('toast.accountCreated'))
      window.location.href = '/dashboard/patient'
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('toast.signupFailed')
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
            <h1 className="text-2xl font-bold text-foreground">{t('auth.createYourAccount')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.joinCommunity')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth.fullName')}</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth.accountType')}</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="patient">{t('auth.patientType')}</option>
                <option value="psychologist" disabled>
                  {t('auth.psychologistType')}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 rounded accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                {t('auth.iAgreeToThe')}{' '}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  {t('auth.termsOfService')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  {t('auth.privacyPolicy')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreeToTerms}
              className="glass-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? t('buttons.creatingAccount') : t('buttons.createAccount')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gradient-to-br from-background to-background text-muted-foreground">
                {t('auth.alreadyHaveAccount')}
              </span>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="glass-button-outline w-full flex items-center justify-center gap-2"
          >
            {t('buttons.signIn')}
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
