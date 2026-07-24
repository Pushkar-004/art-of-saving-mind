'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { History, Calendar, Clock, FileText } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { getMyAppointments, type Appointment } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

export default function SessionHistoryPage() {
  const { t } = useT()

  const [sessions, setSessions] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getMyAppointments()
      const completed = res.data.appointments.filter((a) => a.status === 'completed')
      setSessions(completed)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('sessionHistory.title')}</h1>
        <p className="text-muted-foreground">{t('sessionHistory.subtitle')}</p>
      </div>

      {isError ? (
        <ErrorState onRetry={load} />
      ) : isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title={t('emptyStates.noCompletedSessionsTitle')}
          description={t('emptyStates.noCompletedSessionsDescription')}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <GlassCard key={session.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <History size={20} />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">{session.service}</p>
                    <p className="text-sm text-muted-foreground">{t('sessionHistory.with')} {session.therapist}</p>
                    {session.notes && (
                      <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText size={14} className="mt-0.5 shrink-0 text-primary" />
                        <span className="text-pretty">{session.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    {session.time}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </motion.div>
  )
}
