'use client'

import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  Share2,
  MapPin,
  HeartHandshake,
  PhoneCall,
  ShieldCheck,
  HandHeart,
  UserCheck,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { useState } from 'react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/useT'

export default function ContactPage() {
  const { t } = useT()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(t('toast.messageSent'))
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      toast.error(t('toast.messageSendFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.h1
            className="wellness-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('contact.heroHeading')}
          </motion.h1>
          <motion.p
            className="wellness-subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('contact.heroSubheading')}
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <GlassCard className="h-full">
              <h2 className="text-2xl font-semibold text-foreground mb-6">{t('contact.sendMessageHeading')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('contact.nameLabel')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('contact.namePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('contact.emailLabel')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('contact.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('contact.phoneLabel')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('contact.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('contact.messageLabel')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('common.sending') : t('contact.sendButton')}
                </button>
              </form>
            </GlassCard>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">{t('contact.contactInfoHeading')}</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 h-fit">
                    <Mail size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('contact.emailContactLabel')}</h3>
                    <a
                      href="mailto:poojaghadge77@gmail.com"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      poojaghadge77@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 h-fit">
                    <Phone size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <a
                      href="tel:8766804788"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      8766804788
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 h-fit">
                    <Share2 size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('contact.instagramLabel')}</h3>
                    <a
                      href="https://instagram.com/artof_savingmind"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      @artof_savingmind
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 h-fit">
                    <MapPin size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('contact.locationLabel')}</h3>
                    <p className="text-muted-foreground">
                      {t('contact.locationDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <GlassCard>
              <h3 className="font-semibold text-foreground mb-3">{t('contact.confidentialityNoticeTitle')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('contact.confidentialityNoticeDesc')}
              </p>
            </GlassCard>
          </motion.div>

          {/* Suicidal Helpline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <GlassCard className="h-full flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 h-fit">
                  <HeartHandshake size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{t('contact.helplineHeading')}</h2>
                  <p className="text-sm font-medium text-primary">{t('contact.helplineSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{t('contact.helplineDesc1')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('contact.helplineDesc2')}</p>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{t('contact.orLabel')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* National Emergency Helpline */}
              <div
                className="rounded-xl border p-4 mb-5"
                style={{
                  borderColor: 'color-mix(in oklab, var(--destructive) 30%, transparent)',
                  background: 'color-mix(in oklab, var(--destructive) 8%, transparent)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-lg h-fit"
                    style={{ background: 'color-mix(in oklab, var(--destructive) 15%, transparent)' }}
                  >
                    <PhoneCall size={20} style={{ color: 'var(--destructive)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{t('contact.nationalHelplineTitle')}</h3>
                    <p className="text-2xl font-bold" style={{ color: 'var(--destructive)' }}>
                      {t('contact.nationalHelplineNumber')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('contact.nationalHelplineDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="mt-auto pt-4 border-t border-border/50 flex flex-wrap gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary" />
                  {t('contact.badgeFree')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary" />
                  {t('contact.badgeConfidential')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HandHeart size={14} className="text-primary" />
                  {t('contact.badgeCompassionate')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck size={14} className="text-primary" />
                  {t('contact.badgeProfessional')}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Quick Response Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50 border-t border-border/50">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="wellness-heading">{t('contact.urgentSupportHeading')}</h2>
          <p className="wellness-subheading">
            {t('contact.urgentSupportDesc')}
          </p>
          <GlassCard className="inline-block">
            <p className="text-foreground font-medium">
              {t('contact.emergencyText')} <span className="text-primary font-bold">{t('contact.emergencyNumber')}</span> {t('contact.emergencyAction')}
            </p>
          </GlassCard>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
