'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Download, Search, Library } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { getResources, type Resource, type ResourceCategory } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'
import {
  RESOURCE_CATEGORIES,
  CATEGORY_TRANSLATION_KEYS,
  CATEGORY_ICONS,
  isPdfCategory,
  matchesResourceSearch,
} from '@/lib/resources/categories'
import { getResourceThumbnailUrl } from '@/lib/resources/thumbnail'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ResourcesPage() {
  const { t } = useT()

  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all')

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

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const categoryLabel = t(CATEGORY_TRANSLATION_KEYS[r.category])
      const matchesQuery = matchesResourceSearch(r, query, categoryLabel)
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [resources, query, categoryFilter, t])

  const hasAnyResources = resources.length > 0

  if (isError) {
    return <ErrorState onRetry={load} description={t('resources.errorDescription')} />
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('resources.titlePatient')}</h1>
        <p className="text-muted-foreground">{t('resources.subtitlePatient')}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('resources.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...RESOURCE_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                categoryFilter === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {c === 'all' ? t('resources.catAll') : t(CATEGORY_TRANSLATION_KEYS[c])}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : !hasAnyResources ? (
        <EmptyState
          icon={Library}
          title={t('emptyStates.noResourcesFoundTitle')}
          description={t('emptyStates.noResourcesFoundDescription')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title={t('emptyStates.noResourcesFoundTitle')}
          description={t('emptyStates.noResourcesInCategory')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((resource) => {
            const Icon = CATEGORY_ICONS[resource.category]
            const isPdf = isPdfCategory(resource.category)
            const thumbnailUrl = getResourceThumbnailUrl(resource.thumbnailUrl)
            return (
              <motion.div key={resource.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {thumbnailUrl ? (
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={thumbnailUrl} alt="" fill unoptimized className="object-cover" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                        <Icon size={20} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold text-foreground truncate">{resource.title}</h3>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {t(CATEGORY_TRANSLATION_KEYS[resource.category])}
                        </span>
                        {isPdf && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {t('resources.categoryPdf')}
                          </span>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-pretty">
                          {resource.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDate(resource.createdAt)} · {resource.fileName}
                      </p>
                    </div>
                  </div>
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${isPdf ? t('resources.openPdf') : t('resources.openResource')} ${resource.title}`}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                  >
                    <Download size={18} className="text-primary" />
                  </a>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
