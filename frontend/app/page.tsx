'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Brain, Users, Briefcase, Baby, TrendingUp, Star, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { useT } from '@/lib/i18n/useT'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

const testimonialNames = ['Rajesh K.', 'Priya M.', 'Arjun S.']
const testimonialRatings = [5, 5, 5]

export default function Home() {
  const { t } = useT()

  const services = [
    {
      icon: Brain,
      title: t('home.serviceAnxietyTitle'),
      description: t('home.serviceAnxietyDesc'),
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: TrendingUp,
      title: t('home.serviceStressTitle'),
      description: t('home.serviceStressDesc'),
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Heart,
      title: t('home.serviceRelationshipTitle'),
      description: t('home.serviceRelationshipDesc'),
      color: 'from-rose-400 to-pink-500',
    },
    {
      icon: Briefcase,
      title: t('home.serviceCareerTitle'),
      description: t('home.serviceCareerDesc'),
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Users,
      title: t('home.serviceIndividualTitle'),
      description: t('home.serviceIndividualDesc'),
      color: 'from-violet-400 to-purple-500',
    },
    {
      icon: Baby,
      title: t('home.serviceChildTitle'),
      description: t('home.serviceChildDesc'),
      color: 'from-sky-400 to-blue-500',
    },
  ]

  const testimonialTexts = [
    'Miss Pooja helped me overcome anxiety in just a few sessions. Her approach is warm and non-judgmental.',
    'The best therapy experience I\'ve had. Professional, compassionate, and truly transformative.',
    'Highly recommend for anyone looking for genuine therapy support.',
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        {/* Content */}
        <motion.div
          className="relative max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Heart size={16} className="text-primary mr-2" />
            <span className="text-sm font-medium text-primary">{t('home.heroBadge')}</span>
          </motion.div>

          <motion.h1
            className="wellness-heading leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {t('home.heroHeading')}{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('home.heroHeadingHighlight')}
            </span>
          </motion.h1>

          <motion.p
            className="wellness-subheading max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('home.heroSubheading')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link
              href="/appointment-booking"
              className="glass-button inline-flex items-center gap-2"
            >
              {t('buttons.bookYourSession')}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/about"
              className="glass-button-outline"
            >
              {t('common.learnMore')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="wellness-heading mb-4">{t('home.servicesSectionHeading')}</h2>
            <p className="wellness-subheading max-w-2xl mx-auto">
              {t('home.servicesSectionSubheading')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div key={index} variants={itemVariants}>
                  <GlassCard>
                    <div className="space-y-4">
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${service.color} text-white`}>
                        <Icon size={24} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{service.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                      <Link
                        href="/services"
                        className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors gap-1 pt-2"
                      >
                        {t('common.learnMore')}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="wellness-heading mb-4">{t('home.testimonialsSectionHeading')}</h2>
            <p className="wellness-subheading max-w-2xl mx-auto">
              {t('home.testimonialsSectionSubheading')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonialTexts.map((text, index) => (
              <motion.div key={index} variants={itemVariants}>
                <GlassCard>
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonialRatings[index])].map((_, i) => (
                        <Star key={i} size={16} className="fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-foreground leading-relaxed italic">&quot;{text}&quot;</p>
                    <p className="text-sm font-semibold text-primary pt-2">— {testimonialNames[index]}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="wellness-heading">{t('home.ctaHeading')}</h2>
          <p className="wellness-subheading">
            {t('home.ctaSubheading')}
          </p>
          <Link
            href="/appointment-booking"
            className="glass-button inline-flex items-center gap-2 text-lg"
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
