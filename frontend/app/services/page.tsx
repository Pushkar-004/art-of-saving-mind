'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, Heart, Briefcase, Users, Baby, Clock, Target, Shield, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { useT } from '@/lib/i18n/useT'

export default function ServicesPage() {
  const { t } = useT()

  const services = [
    {
      icon: Brain,
      title: t('services.counsellingTitle'),
      shortDesc: t('services.counsellingShortDesc'),
      fullDesc: t('services.counsellingFullDesc'),
      benefits: [
        t('services.benefitEmotionalSupport'),
        t('services.benefitCopingStrategies'),
        t('services.benefitConfidentialSpace'),
        t('services.benefitPersonalGrowth'),
      ],
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Baby,
      title: t('services.childTitle'),
      shortDesc: t('services.childShortDesc'),
      fullDesc: t('services.childFullDesc'),
      benefits: [
        t('services.benefitEmotionalDevelopment'),
        t('services.benefitBehavioralSupport'),
        t('services.benefitSchoolPerformance'),
        t('services.benefitFamilyHarmony'),
      ],
      color: 'from-sky-400 to-blue-500',
    },
    {
      icon: Briefcase,
      title: t('services.careerTitle'),
      shortDesc: t('services.careerShortDesc'),
      fullDesc: t('services.careerFullDesc'),
      benefits: [
        t('services.benefitCareerClarity'),
        t('services.benefitTransitionSupport'),
        t('services.benefitConfidence'),
        t('services.benefitGoalAchievement'),
      ],
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Heart,
      title: t('services.maritalTitle'),
      shortDesc: t('services.maritalShortDesc'),
      fullDesc: t('services.maritalFullDesc'),
      benefits: [
        t('services.benefitBetterCommunication'),
        t('services.benefitConflictResolution'),
        t('services.benefitTrustBuilding'),
        t('services.benefitHealthyBoundaries'),
      ],
      color: 'from-rose-400 to-pink-500',
    },
    {
      icon: Users,
      title: t('services.relationshipTitle'),
      shortDesc: t('services.relationshipShortDesc'),
      fullDesc: t('services.relationshipFullDesc'),
      benefits: [
        t('services.benefitCommunicationSkills'),
        t('services.benefitEmotionalIntimacy'),
        t('services.benefitBoundarySetting'),
        t('services.benefitStrongerConnections'),
      ],
      color: 'from-violet-400 to-purple-500',
    },
  ]

  const features = [
    {
      icon: Shield,
      title: t('services.confidentialityTitle'),
      description: t('services.confidentialityDesc'),
    },
    {
      icon: Clock,
      title: t('services.flexibleSchedulingTitle'),
      description: t('services.flexibleSchedulingDesc'),
    },
    {
      icon: Target,
      title: t('services.personalizedApproachTitle'),
      description: t('services.personalizedApproachDesc'),
    },
  ]

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
            {t('services.heroHeading')}
          </motion.h1>
          <motion.p
            className="wellness-subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('services.heroSubheading')}
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="h-full flex flex-col hover:shadow-2xl">
                    <div className="space-y-4 flex-1">
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${service.color} text-white`}>
                        <Icon size={28} />
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground">{service.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{service.fullDesc}</p>

                      <div className="pt-4">
                        <h4 className="font-semibold text-foreground mb-3">{t('services.keyBenefits')}</h4>
                        <ul className="space-y-2">
                          {service.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Link
                      href="/appointment-booking"
                      className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors gap-1 pt-6"
                    >
                      {t('services.bookNow')}
                      <ArrowRight size={16} />
                    </Link>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="wellness-heading text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {t('services.whyChooseHeading')}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="text-center">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-primary/10">
                          <Icon size={32} className="text-primary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Session Details Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="wellness-heading mb-4">{t('services.sessionDetailsHeading')}</h2>
              <p className="wellness-subheading">{t('services.sessionDetailsSubheading')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('services.durationTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('services.durationDesc')}
                </p>
              </GlassCard>

              <GlassCard>
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('services.frequencyTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('services.frequencyDesc')}
                </p>
              </GlassCard>

              <GlassCard>
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('services.onlineSessionsTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('services.onlineSessionsDesc')}
                </p>
              </GlassCard>

              <GlassCard>
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('services.inPersonSessionsTitle')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('services.inPersonSessionsDesc')}
                </p>
              </GlassCard>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="wellness-heading">{t('services.ctaHeading')}</h2>
          <p className="wellness-subheading">
            {t('services.ctaSubheading')}
          </p>
          <Link
            href="/appointment-booking"
            className="glass-button inline-flex items-center gap-2 text-lg"
          >
            {t('services.scheduleSession')}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
