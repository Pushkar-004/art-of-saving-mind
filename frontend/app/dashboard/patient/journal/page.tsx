'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { BookOpen, Plus, Trash2, Edit2, Heart, Sparkles, PenLine, X } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/useT'

const journalEntries = [
  {
    id: 1,
    type: 'gratitude',
    title: 'Grateful Today',
    content: 'I am grateful for my supportive family, good health, and the therapy sessions helping me grow.',
    date: '2024-03-20',
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 2,
    type: 'reflection',
    title: 'Overcoming My Fears',
    content: 'Today I realized that my anxiety often makes things seem worse than they are. I practiced breathing exercises and felt calmer.',
    date: '2024-03-19',
    createdAt: new Date('2024-03-19'),
  },
  {
    id: 3,
    type: 'daily',
    title: "Today's Thoughts",
    content: 'Had a productive day. Completed my tasks and took time for self-care. Feeling more confident.',
    date: '2024-03-18',
    createdAt: new Date('2024-03-18'),
  },
]

const tabs = ['all', 'gratitude', 'reflection', 'daily'] as const

export default function JournalPage() {
  const { t } = useT()

  const typeMeta: Record<string, { label: string; icon: typeof Heart; chip: string; dot: string }> = {
    gratitude: { label: t('journalPage.typeGratitude'), icon: Heart, chip: 'bg-accent/15 text-accent-foreground', dot: 'bg-accent' },
    reflection: { label: t('journalPage.typeReflection'), icon: Sparkles, chip: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    daily: { label: t('journalPage.typeDaily'), icon: PenLine, chip: 'bg-secondary/15 text-secondary-foreground', dot: 'bg-secondary' },
  }

  const tabLabel = (tab: typeof tabs[number]): string => {
    if (tab === 'all') return t('common.all')
    return typeMeta[tab]?.label ?? tab
  }

  const [entries, setEntries] = useState(journalEntries)
  const [selectedTab, setSelectedTab] = useState<'all' | 'gratitude' | 'reflection' | 'daily'>('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'daily',
    title: '',
    content: '',
  })

  const filteredEntries = selectedTab === 'all' ? entries : entries.filter((e) => e.type === selectedTab)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      toast.error(t('toast.fillAllFields'))
      return
    }

    const newEntry = {
      id: entries.length + 1,
      type: formData.type as 'daily' | 'gratitude' | 'reflection',
      title: formData.title,
      content: formData.content,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    }

    setEntries([newEntry, ...entries])
    toast.success(t('toast.entrySaved'))
    setFormData({ type: 'daily', title: '', content: '' })
    setShowForm(false)
  }

  const handleDelete = (id: number) => {
    setEntries(entries.filter((e) => e.id !== id))
    toast.success(t('toast.entryDeleted'))
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-2xl space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="wellness-heading text-3xl">{t('journalPage.title')}</h1>
          <p className="text-muted-foreground">{t('journalPage.subtitle')}</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="glass-button-accent self-start sm:self-auto">
            <Plus size={18} />
            {t('journalPage.newEntry')}
          </button>
        )}
      </div>

      {/* New Entry — writing canvas */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(['daily', 'gratitude', 'reflection'] as const).map((t_type) => {
                      const meta = typeMeta[t_type]
                      const Icon = meta.icon
                      const active = formData.type === t_type
                      return (
                        <button
                          key={t_type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t_type })}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                            active
                              ? `${meta.chip} ring-1 ring-inset ring-primary/20`
                              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon size={14} />
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    aria-label={t('shared.closeDialog')}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-0 bg-transparent p-0 font-serif text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                  placeholder={t('journalPage.titlePlaceholder')}
                  autoFocus
                />

                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                  rows={7}
                  placeholder={t('journalPage.contentPlaceholder')}
                />

                <div className="flex gap-3 border-t border-border/50 pt-4">
                  <button type="submit" className="glass-button-accent flex-1">
                    {t('journalPage.saveEntry')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="glass-button-outline flex-1">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border/50 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              selectedTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabLabel(tab)}
            {selectedTab === tab && (
              <motion.span
                layoutId="journalTab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <GlassCard className="py-16">
          <div className="flex flex-col items-center text-center">
            <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen size={28} />
            </span>
            <h3 className="text-lg font-semibold text-foreground">{t('emptyStates.journalBlankTitle')}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">
              {t('emptyStates.journalBlankDescription')}
            </p>
            <button onClick={() => setShowForm(true)} className="glass-button-accent mt-6">
              <Plus size={18} />
              {t('emptyStates.writeFirstEntry')}
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, index) => {
              const meta = typeMeta[entry.type] ?? typeMeta.daily
              const Icon = meta.icon
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GlassCard hover className="group">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.chip}`}>
                          <Icon size={12} />
                          {meta.label}
                        </span>
                        <h3 className="font-serif text-xl font-bold text-foreground text-pretty">{entry.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {entry.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button aria-label={t('journalPage.editEntryAriaLabel')} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          aria-label={t('journalPage.deleteEntryAriaLabel')}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="leading-relaxed text-muted-foreground text-pretty">{entry.content}</p>
                  </GlassCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
