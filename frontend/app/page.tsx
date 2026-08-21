'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Brain, Users, Briefcase, Baby, Star, ArrowRight } from 'lucide-react'
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
      title: t('home.serviceCounsellingTitle'),
      description: t('home.serviceCounsellingDesc'),
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Baby,
      title: t('home.serviceChildTitle'),
      description: t('home.serviceChildDesc'),
      color: 'from-sky-400 to-blue-500',
    },
    {
      icon: Briefcase,
      title: t('home.serviceCareerTitle'),
      description: t('home.serviceCareerDesc'),
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Heart,
      title: t('home.serviceMaritalTitle'),
      description: t('home.serviceMaritalDesc'),
      color: 'from-rose-400 to-pink-500',
    },
    {
      icon: Users,
      title: t('home.serviceRelationshipTitle'),
      description: t('home.serviceRelationshipDesc'),
      color: 'from-violet-400 to-purple-500',
    },
  ]

  const testimonialTexts = [
    'Miss. Pooja Sunil Ghadge helped me overcome anxiety in just a few sessions. Her approach is warm and non-judgmental.',
    'The best therapy experience I\'ve had. Professional, compassionate, and truly transformative.',
    'Highly recommend for anyone looking for genuine therapy support.',
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20 pb-32">
        {/* Animated Background Blobs (both modes) */}
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

        {/* Premium meditation visual — Light Mode only, tablet & desktop (right half) */}
        <div
          className="absolute inset-y-0 right-0 z-0 hidden w-[42%] md:block lg:w-1/2 dark:hidden pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="relative h-full w-full">
            <Image
              src="/hero-meditation.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 50vw, (min-width: 768px) 42vw, 0px"
              className="object-cover object-top"
              style={{
                opacity: 0.82,
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 20%, black 42%, black 100%)',
                maskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 20%, black 42%, black 100%)',
              }}
            />
            {/* Warm sage/cream tint so the photo matches the palette */}
            <div
              className="absolute inset-0 mix-blend-soft-light"
              style={{
                background:
                  'linear-gradient(150deg, color-mix(in oklab, var(--secondary) 40%, transparent) 0%, color-mix(in oklab, var(--accent) 25%, transparent) 55%, transparent 100%)',
              }}
            />
            {/* Left-to-right fade into the hero background (no hard edge) */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, var(--background) 0%, transparent 38%)' }}
            />
            {/* Soft bottom fade so the image settles into the section */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/90 to-transparent" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col items-center space-y-8 text-center md:items-start md:text-left md:w-[52%] lg:w-[48%] dark:md:items-center dark:md:text-center dark:md:w-full dark:md:max-w-4xl dark:md:mx-auto"
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
              className="wellness-subheading max-w-2xl mx-auto md:mx-0 dark:md:mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('home.heroSubheading')}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 md:justify-start dark:md:justify-center"
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

            {/* Mobile-only meditation visual — Light Mode only, subtle faded card below the CTAs */}
            <motion.div
              className="w-full pt-2 md:hidden dark:hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              aria-hidden="true"
            >
              <div className="relative mx-auto h-64 w-full max-w-xs overflow-hidden rounded-3xl">
                <Image
                  src="/hero-meditation.webp"
                  alt=""
                  fill
                  sizes="(max-width: 767px) 90vw, 320px"
                  className="object-cover object-top opacity-90"
                />
                <div
                  className="absolute inset-0 mix-blend-soft-light"
                  style={{
                    background:
                      'linear-gradient(150deg, color-mix(in oklab, var(--secondary) 35%, transparent) 0%, color-mix(in oklab, var(--accent) 20%, transparent) 60%, transparent 100%)',
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, var(--background) 0%, transparent 45%)' }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
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
