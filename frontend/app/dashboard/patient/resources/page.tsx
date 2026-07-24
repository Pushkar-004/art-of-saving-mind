'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Search,
  FileText,
  BookOpen,
  Wind,
  Activity,
  ClipboardList,
  Library,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { getResources, type Resource, type ResourceCategory } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

// Fixed internal values used for API filtering — never translated
const CATEGORY_VALUES: ResourceCategory[] = [
  'worksheet',
  'meditation',
  'exercise',
  'guide',
  'pdf',
]

const CATEGORY_ICONS: Record<ResourceCategory, typeof FileText> = {
  worksheet: ClipboardList,
  meditation: Wind,
  exercise: Activity,
  guide: BookOpen,
  pdf: FileText,
}

// Maps each category value to its translation key in the resources section
const CATEGORY_TRANSLATION_KEYS: Record<ResourceCategory, string> = {
  worksheet: 'resources.categoryWorksheet',
  meditation: 'resources.categoryMeditation',
  exercise: 'resources.categoryExercise',
  guide: 'resources.categoryGuide',
  pdf: 'resources.categoryPdf',
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
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [resources, query, categoryFilter])

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
          {(['all', ...CATEGORY_VALUES] as const).map((c) => (
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title={t('emptyStates.noResourcesFoundTitle')}
          description={t('emptyStates.noResourcesFoundDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((resource) => {
            const Icon = CATEGORY_ICONS[resource.category]
            return (
              <motion.div key={resource.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 text-pretty">
                          {resource.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {t(CATEGORY_TRANSLATION_KEYS[resource.category])} · {resource.fileName}
                      </p>
                    </div>
                  </div>
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t('resources.openResource')} ${resource.title}`}
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
