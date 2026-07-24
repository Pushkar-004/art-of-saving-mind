'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, BookOpen, Download, ArrowRight, Filter } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { useState } from 'react'
import { useT } from '@/lib/i18n/useT'

// Static resource mock data – content values (titles, excerpts, dates, readTime)
// are intentionally untranslated: they are content/API data, not UI chrome.
const resources = [
  {
    id: 1,
    title: 'Understanding Anxiety: A Comprehensive Guide',
    type: 'guide',
    category: 'Anxiety',
    excerpt: 'Learn the root causes of anxiety and evidence-based strategies to manage it effectively.',
    date: 'March 15, 2024',
    readTime: '8 min read',
  },
  {
    id: 2,
    title: 'Stress Management Worksheet',
    type: 'worksheet',
    category: 'Stress',
    excerpt: 'Interactive worksheet to identify stressors and develop coping strategies.',
    date: 'March 10, 2024',
    readTime: 'Printable',
  },
  {
    id: 3,
    title: 'Building Healthy Relationships',
    type: 'article',
    category: 'Relationships',
    excerpt: 'Explore the foundations of healthy relationships and improve communication.',
    date: 'March 8, 2024',
    readTime: '10 min read',
  },
  {
    id: 4,
    title: 'Career Transitions: A Step-by-Step Guide',
    type: 'guide',
    category: 'Career',
    excerpt: 'Navigate career changes with confidence and clarity.',
    date: 'March 1, 2024',
    readTime: '12 min read',
  },
  {
    id: 5,
    title: 'Mindfulness and Meditation Practices',
    type: 'guide',
    category: 'Wellness',
    excerpt: 'Beginner-friendly mindfulness exercises for daily practice.',
    date: 'February 28, 2024',
    readTime: '6 min read',
  },
  {
    id: 6,
    title: 'Self-Esteem Building Worksheet',
    type: 'worksheet',
    category: 'Personal Growth',
    excerpt: 'Practical exercises to boost confidence and self-worth.',
    date: 'February 25, 2024',
    readTime: 'Printable',
  },
  {
    id: 7,
    title: 'Sleep and Mental Health Connection',
    type: 'article',
    category: 'Wellness',
    excerpt: 'Understand how sleep impacts mental health and learn better sleep habits.',
    date: 'February 20, 2024',
    readTime: '7 min read',
  },
  {
    id: 8,
    title: 'Emotional Regulation Techniques',
    type: 'guide',
    category: 'Mental Health',
    excerpt: 'Master techniques to manage emotions and respond thoughtfully.',
    date: 'February 18, 2024',
    readTime: '9 min read',
  },
]

// Internal category keys – used for filter logic (must match resource.category values)
const CATEGORY_KEYS = [
  { key: 'All', translationKey: 'resources.catAll' },
  { key: 'Anxiety', translationKey: 'resources.catAnxiety' },
  { key: 'Stress', translationKey: 'resources.catStress' },
  { key: 'Relationships', translationKey: 'resources.catRelationships' },
  { key: 'Career', translationKey: 'resources.catCareer' },
  { key: 'Wellness', translationKey: 'resources.catWellness' },
  { key: 'Mental Health', translationKey: 'resources.catMentalHealth' },
  { key: 'Personal Growth', translationKey: 'resources.catPersonalGrowth' },
] as const

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'article':
      return FileText
    case 'guide':
      return BookOpen
    default:
      return Download
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'article':
      return 'bg-secondary dark:bg-secondary/40 text-foreground'
    case 'guide':
      return 'bg-primary/10 dark:bg-primary/20 text-foreground'
    case 'worksheet':
      return 'bg-accent/10 dark:bg-accent/20 text-foreground'
    default:
      return 'bg-muted dark:bg-muted/40 text-foreground'
  }
}

export default function ResourcesPage() {
  const { t } = useT()
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredResources =
    selectedCategory === 'All'
      ? resources
      : resources.filter((r) => r.category === selectedCategory)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return t('resources.typeArticle')
      case 'guide':
        return t('resources.typeGuide')
      case 'worksheet':
        return t('resources.typeWorksheet')
      default:
        return type
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
            {t('resources.publicHeroHeading')}
          </motion.h1>
          <motion.p
            className="wellness-subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('resources.publicHeroSubheading')}
          </motion.p>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">{t('resources.filterByCategory')}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_KEYS.map(({ key, translationKey }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === key
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t(translationKey)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = getTypeIcon(resource.type)
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="flex flex-col h-full hover:shadow-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${getTypeBadgeColor(resource.type)}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-foreground">
                        {getTypeLabel(resource.type)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{resource.excerpt}</p>

                    <div className="border-t border-border/50 pt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>{resource.date}</span>
                        <span>{resource.readTime}</span>
                      </div>

                      <Link
                        href={`/resources/${resource.id}`}
                        className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors gap-1"
                      >
                        {t('resources.readMore')}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {t('emptyStates.noResourcesInCategory')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Personalized Resources CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50 border-t border-border/50">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="wellness-heading">{t('resources.publicCtaHeading')}</h2>
          <p className="wellness-subheading">
            {t('resources.publicCtaSubheading')}
          </p>
          <Link
            href="/appointment-booking"
            className="glass-button inline-flex items-center gap-2"
          >
            {t('resources.publicCtaButton')}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
