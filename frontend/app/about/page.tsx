'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Award, Heart, Users, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { useT } from '@/lib/i18n/useT'

export default function AboutPage() {
  const { t } = useT()

  const qualifications = [
    {
      year: '2017',
      title: 'B.A. Psychology',
      description: 'Chh. Shivaji College, Satara — Bachelor’s degree in Psychology.',
    },
    {
      year: '2019',
      title: 'M.A. Psychology',
      description: 'Modern College, Shivaji Nagar, Pune — Master’s degree in Psychology.',
    },
    {
      year: 'Clinical Training',
      title: 'Clinical Psychology Internship – KEM Hospital, Pune',
      description: 'Clinical exposure to psychological assessment, interventions, and therapeutic practices.',
    },
    {
      year: '6 Years Experience',
      title: 'Counselling & Therapy Experience',
      description:
        'Six years of experience supporting individuals through emotional, psychological, and personal challenges using a compassionate and client-centred approach.',
    },
    {
      year: '3 Years',
      title: 'Engineering College Student Counselling',
      description:
        'Providing counselling and psychological support to engineering college students for academic stress, anxiety, relationships, emotional well-being, self-esteem, career concerns, and adjustment issues.',
    },
  ]

  const values = [
    {
      icon: Heart,
      title: t('about.valueEmpathyTitle'),
      description: t('about.valueEmpathyDesc'),
    },
    {
      icon: Users,
      title: t('about.valueTrustTitle'),
      description: t('about.valueTrustDesc'),
    },
    {
      icon: Lightbulb,
      title: t('about.valueGrowthTitle'),
      description: t('about.valueGrowthDesc'),
    },
    {
      icon: Award,
      title: t('about.valueExcellenceTitle'),
      description: t('about.valueExcellenceDesc'),
    },
  ]

  const specializations = [
    'Individual counselling and psychotherapy',
    'Student and young-adult counselling',
    'Stress and anxiety management',
    'Emotional well-being and personal growth',
    'Relationship and interpersonal concerns',
    'Self-esteem and confidence',
    'Academic and adjustment-related concerns',
    'Coping skills and emotional resilience',
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
            {t('about.heroHeading')}
          </motion.h1>
          <motion.p
            className="wellness-subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('about.heroSubheading')}
          </motion.p>
        </div>
      </section>

      {/* Professional Profile */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-lg border border-border/50 bg-card"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Image
                  src="/pooja-profile.jpg"
                  alt="Miss. Pooja Sunil Ghadge"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
              <div className="p-6 text-center space-y-1 bg-card">
                <p className="text-xl font-semibold text-foreground">Miss. Pooja Sunil Ghadge</p>
                <p className="text-primary font-medium">Clinical Psychologist</p>
                <p className="text-sm text-muted-foreground">6 years of experience in counselling and therapy</p>
                <p className="text-sm text-muted-foreground">Clinical Psychology Internship · KEM Hospital, Pune</p>
                <p className="text-sm text-muted-foreground">3 years of counselling experience with engineering college students</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-4">
                  {t('about.professionalBackgroundHeading')}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Miss. Pooja Sunil Ghatge is a Clinical Psychologist with six years' experience providing counselling and therapy for emotional and personal challenges.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  She creates a safe, empathetic, and non-judgmental space to help individuals build resilience and work towards meaningful personal growth.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Trained through a clinical internship at KEM Hospital, Pune, she has also spent three years supporting engineering college students with academic stress and adjustment concerns.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Her compassionate, client-centred approach combines professional psychological knowledge with practical strategies tailored to each person&apos;s needs.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">{t('about.specializationsHeading')}</h3>
                {specializations.map((spec) => (
                  <div key={spec} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{spec}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="wellness-heading mb-4">{t('about.philosophyHeading')}</h2>
            <div className="glass-card inline-block">
              <blockquote className="text-xl font-medium text-foreground italic leading-relaxed max-w-2xl">
                &quot;{t('about.philosophyQuote')}&quot;
              </blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="wellness-heading text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {t('about.journeyHeading')}
          </motion.h2>

          <div className="space-y-8">
            {qualifications.map((qual, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className={`flex gap-6 ${index % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0 w-24">
                  <div className="text-2xl font-bold text-primary">{qual.year}</div>
                </div>
                <GlassCard className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{qual.title}</h3>
                  <p className="text-muted-foreground">{qual.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="wellness-heading text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {t('about.valuesHeading')}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard>
                    <div className="space-y-4 text-center">
                      <div className="flex justify-center">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon size={32} className="text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
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
          <h2 className="wellness-heading">{t('about.ctaHeading')}</h2>
          <p className="wellness-subheading">
            {t('about.ctaSubheading')}
          </p>
          <Link
            href="/appointment-booking"
            className="glass-button inline-flex items-center gap-2"
          >
            {t('buttons.bookYourFirstSession')}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
