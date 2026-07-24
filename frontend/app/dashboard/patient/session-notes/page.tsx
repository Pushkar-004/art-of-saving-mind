'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { NotebookText, Calendar, Clock, Lightbulb, ListChecks, Target } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { getMySessionNotes, type SessionNoteWithAppointment } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

export default function PatientSessionNotesPage() {
  const { t } = useT()

  const [notes, setNotes] = useState<SessionNoteWithAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getMySessionNotes()
      setNotes(res.data.sessionNotes)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (isError) {
    return <ErrorState onRetry={load} description={t('sessionNotes.errorDescription')} />
  }

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('sessionNotes.title')}</h1>
        <p className="text-muted-foreground">
          {t('sessionNotes.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title={t('emptyStates.noSessionNotesTitle')}
          description={t('emptyStates.noSessionNotesDescription')}
        />
      ) : (
        <div className="space-y-5">
          {notes.map((note) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{note.appointmentService}</h3>
                      <p className="text-sm text-muted-foreground">{t('sessionNotes.with')} {note.therapistName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-primary" />
                        {note.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary" />
                        {note.appointmentTime}
                      </span>
                    </div>
                  </div>

                  {note.diagnosisSummary && (
                    <div className="rounded-xl border border-border/50 bg-muted/40 p-3.5">
                      <p className="text-sm font-medium text-primary">{t('sessionNotes.diagnosisSummary')}</p>
                      <p className="mt-1 text-sm text-muted-foreground text-pretty">
                        {note.diagnosisSummary}
                      </p>
                    </div>
                  )}

                  {note.recommendations && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Lightbulb size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{t('sessionNotes.recommendations')}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                          {note.recommendations}
                        </p>
                      </div>
                    </div>
                  )}

                  {note.homework && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary-foreground">
                        <ListChecks size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{t('sessionNotes.homework')}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                          {note.homework}
                        </p>
                      </div>
                    </div>
                  )}

                  {note.nextGoals && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                        <Target size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{t('sessionNotes.nextGoals')}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                          {note.nextGoals}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
