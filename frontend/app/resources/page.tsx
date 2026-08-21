'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Download,
  ArrowRight,
  Filter,
  Search,
  Library,
  PlayCircle,
  Clock,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useT } from '@/lib/i18n/useT'
import { getResources, type Resource, type ResourceCategory } from '@/lib/api/client'
import {
  RESOURCE_CATEGORIES,
  CATEGORY_TRANSLATION_KEYS,
  CATEGORY_ICONS,
  CATEGORY_BADGE_COLOR,
  isPdfCategory,
  matchesResourceSearch,
} from '@/lib/resources/categories'
import { getResourceThumbnailUrl } from '@/lib/resources/thumbnail'
import {
  WELLNESS_VIDEOS,
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_BADGE_COLOR,
  matchesVideoSearch,
  youtubeThumbnail,
  youtubeWatchUrl,
  type VideoCategory,
} from '@/lib/resources/videos'

// Resources are fetched from the shared backend library (GET /api/resources)
// so the public site always reflects whatever the Admin has published from
// Dashboard -> Resources. Do NOT reintroduce static/mock data here.
// The backend already excludes unpublished (draft) resources from this
// endpoint, so everything returned here is safe to render publicly.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ResourcesPage() {
  const { t } = useT()
  const [activeTab, setActiveTab] = useState<'resources' | 'videos'>('resources')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'All'>('All')
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<VideoCategory | 'All'>('All')
  const [query, setQuery] = useState('')

  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getResources()
      setResources(res.data.resources)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredResources = useMemo(
    () =>
      resources.filter((r) => {
        const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory
        const categoryLabel = t(CATEGORY_TRANSLATION_KEYS[r.category])
        return matchesCategory && matchesResourceSearch(r, query, categoryLabel)
      }),
    [resources, selectedCategory, query, t],
  )

  // Distinguish "nothing in the library at all" from "nothing matches
  // the current category/search" so each gets the right empty-state copy.
  const hasAnyResources = resources.length > 0
  const hasNoMatches = filteredResources.length === 0

  // Videos tab: hardcoded today (see lib/resources/videos.ts), filtered
  // client-side the same way resources are. Swapping this for an API
  // later only means changing the import above, not this logic.
  const filteredVideos = useMemo(
    () =>
      WELLNESS_VIDEOS.filter((v) => {
        const matchesCategory = selectedVideoCategory === 'All' || v.category === selectedVideoCategory
        return matchesCategory && matchesVideoSearch(v, query)
      }),
    [selectedVideoCategory, query],
  )

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
          {/* Resources / Videos Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-full bg-muted p-1">
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'resources'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-foreground hover:bg-muted/80'
                }`}
              >
                {t('resources.tabResources')}
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'videos'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-foreground hover:bg-muted/80'
                }`}
              >
                {t('resources.tabVideos')}
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="relative mb-6 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('resources.searchPlaceholder')}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">{t('resources.filterByCategory')}</h2>
            </div>
            {activeTab === 'resources' ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t('resources.catAll')}
                </button>
                {RESOURCE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {t(CATEGORY_TRANSLATION_KEYS[category])}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedVideoCategory('All')}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedVideoCategory === 'All'
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t('resources.videoCatAll')}
                </button>
                {VIDEO_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedVideoCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      selectedVideoCategory === category
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Resources Grid */}
          {activeTab === 'resources' ? isLoading ? (
            <SkeletonRows rows={4} />
          ) : isError ? (
            <ErrorState onRetry={load} description={t('resources.errorDescription')} />
          ) : !hasAnyResources ? (
            <EmptyState
              icon={Library}
              title={t('emptyStates.noResourcesFoundTitle')}
              description={t('emptyStates.noResourcesFoundDescription')}
            />
          ) : hasNoMatches ? (
            <EmptyState
              icon={Library}
              title={t('emptyStates.noResourcesFoundTitle')}
              description={t('emptyStates.noResourcesInCategory')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource, index) => {
                const Icon = CATEGORY_ICONS[resource.category]
                const isPdf = isPdfCategory(resource.category)
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                  <GlassCard className="flex flex-col h-full hover:shadow-xl">
                      {getResourceThumbnailUrl(resource.thumbnailUrl) && (
                        <div className="relative -mx-6 -mt-6 mb-4 h-36 w-[calc(100%+3rem)] overflow-hidden rounded-t-2xl bg-muted">
                          <Image
                            src={getResourceThumbnailUrl(resource.thumbnailUrl)!}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className={`p-2 rounded-lg ${CATEGORY_BADGE_COLOR[resource.category]}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-foreground">
                            {t(CATEGORY_TRANSLATION_KEYS[resource.category])}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {isPdf ? t('resources.categoryPdf') : t('resources.categoryGuide')}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">
                        {resource.description || resource.fileName}
                      </p>

                      <div className="border-t border-border/50 pt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <span>{formatDate(resource.createdAt)}</span>
                          <span className="truncate max-w-[45%]">{resource.fileName}</span>
                        </div>

                        {/* Opens the file in a new tab. Browsers that can preview
                            the file type (e.g. PDF) render it inline; otherwise
                            the browser falls back to downloading it automatically —
                            no extra download logic needed on our side. */}
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors gap-1"
                        >
                          {isPdf ? t('resources.openPdf') : t('resources.readMore')}
                          {isPdf ? <Download size={14} /> : <ArrowRight size={14} />}
                        </a>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </div>
          ) : filteredVideos.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title={t('emptyStates.noResourcesFoundTitle')}
              description={t('emptyStates.noResourcesInCategory')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="flex flex-col h-full hover:shadow-xl">
                    <a
                      href={youtubeWatchUrl(video.youtubeId)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative -mx-6 -mt-6 mb-4 block h-36 w-[calc(100%+3rem)] overflow-hidden rounded-t-2xl bg-muted"
                    >
                      <Image
                        src={youtubeThumbnail(video.youtubeId)}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </a>

                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className={`p-2 rounded-lg ${VIDEO_CATEGORY_BADGE_COLOR[video.category]}`}>
                        <PlayCircle size={20} />
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-foreground">
                          {video.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{video.description}</p>

                    <div className="border-t border-border/50 pt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {video.duration}
                        </span>
                        <span className="truncate max-w-[45%]">{video.channel}</span>
                      </div>

                      <a
                        href={youtubeWatchUrl(video.youtubeId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors gap-1"
                      >
                        {t('resources.watchOnYoutube')}
                        <PlayCircle size={14} />
                      </a>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
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
