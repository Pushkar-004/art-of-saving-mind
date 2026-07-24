'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Video, Plus, X, CheckCircle2, CalendarClock, NotebookPen, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import { Skeleton } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { useT } from '@/lib/i18n/useT'
import {
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  type Appointment,
} from '@/lib/api/client'
import { useNotifications } from '@/lib/context/NotificationContext'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

function DateBlock({ day, month, accent = false }: { day: string; month: string; accent?: boolean }) {
  return (
    <div
      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border ${
        accent
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border/60 bg-card/50 text-muted-foreground'
      }`}
    >
      <span className="text-xl font-bold leading-none">{day}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide">{month}</span>
    </div>
  )
}

export default function AppointmentsPage() {
  const { t } = useT()
  const { refreshNotifications } = useNotifications()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [availableSlots, setAvailableSlots] = useState<{ date: string; start: string; end: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; start: string } | null>(null)
  const [rescheduling, setRescheduling] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getMyAppointments()
      setAppointments(res.data.appointments)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'upcoming' || a.status === 'pending',
  )
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled',
  )

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id)
      toast.success(t('toast.appointmentCancelled'))
      setCancelTarget(null)
      load()
      void refreshNotifications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.cancelFailed'))
    } finally {
      setCancelling(false)
    }
  }

  const openReschedule = async (apt: Appointment) => {
    setRescheduleTarget(apt)
    setSelectedSlot(null)
    setSlotsLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const in30 = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const res = await getAvailableSlots(today, in30)
      setAvailableSlots(res.data.slots)
    } catch {
      toast.error(t('toast.slotsLoadFailedShort'))
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleTarget || !selectedSlot) return
    setRescheduling(true)
    try {
      await rescheduleAppointment(rescheduleTarget.id, selectedSlot.date, selectedSlot.start)
      toast.success(t('toast.appointmentRescheduled'))
      setRescheduleTarget(null)
      load()
      void refreshNotifications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.rescheduleFailed'))
    } finally {
      setRescheduling(false)
    }
  }

  // Group available slots by date for a friendlier picker.
  const slotsByDate = availableSlots.reduce<Record<string, { date: string; start: string; end: string }[]>>(
    (acc, slot) => {
      acc[slot.date] = acc[slot.date] ?? []
      acc[slot.date].push(slot)
      return acc
    },
    {},
  )

  if (isError) {
    return <ErrorState onRetry={load} />
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-4xl space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="wellness-heading text-3xl">{t('myAppointments.title')}</h1>
          <p className="text-muted-foreground">{t('myAppointments.subtitle')}</p>
        </div>
        <Link href="/appointment-booking" className="glass-button-accent self-start sm:self-auto">
          <Plus size={18} />
          {t('buttons.newAppointment')}
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Upcoming — Timeline */}
          <motion.section variants={itemVariants} className="space-y-5">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('myAppointments.upcomingSessions')}</h2>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={t('emptyStates.noUpcomingSessionsTitle')}
                description={t('emptyStates.noUpcomingSessionsDescriptionShort')}
              />
            ) : (
              <div className="relative pl-5 sm:pl-6">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border sm:left-[9px]" aria-hidden />
                <div className="space-y-5">
                  {upcomingAppointments.map((apt) => {
                    const isOnline = apt.type === 'online'
                    return (
                      <motion.div key={apt.id} variants={itemVariants} className="relative">
                        <span className="absolute -left-5 top-6 h-3.5 w-3.5 rounded-full border-2 border-primary bg-card sm:-left-6" aria-hidden />
                        <GlassCard hover>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <DateBlock day={apt.day} month={apt.month} accent />

                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">{apt.service}</h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    isOnline ? 'bg-primary/10 text-primary' : 'bg-secondary/15 text-secondary-foreground'
                                  }`}
                                >
                                  {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                                  {isOnline ? t('myAppointments.onlineVideoCall') : t('myAppointments.inPerson')}
                                </span>
                                {apt.status === 'pending' && (
                                  <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                                    {t('myAppointments.awaitingConfirmation')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{t('myAppointments.with')} {apt.therapist}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-primary" />
                                  {apt.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} className="text-primary" />
                                  {apt.time}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                              <Link
                                href={`/dashboard/patient/payment?appointmentId=${apt.id}`}
                                className="glass-button-outline flex-1 px-4 py-2 text-sm sm:flex-none flex items-center justify-center gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                              >
                                <CreditCard size={14} />
                                {t('buttons.pay')}
                              </Link>
                              <button
                                onClick={() => openReschedule(apt)}
                                className="glass-button-outline flex-1 px-4 py-2 text-sm sm:flex-none"
                              >
                                {t('buttons.reschedule')}
                              </button>
                              <button
                                onClick={() => setCancelTarget(apt)}
                                aria-label={t('buttons.cancelAppointment')}
                                className="inline-flex items-center justify-center rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.section>

          {/* Past — Timeline */}
          <motion.section variants={itemVariants} className="space-y-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-secondary" />
              <h2 className="text-lg font-semibold text-foreground">{t('myAppointments.pastSessions')}</h2>
            </div>

            {pastAppointments.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={t('emptyStates.noPastSessionsTitle')}
                description={t('emptyStates.noPastSessionsDescription')}
              />
            ) : (
              <div className="relative pl-5 sm:pl-6">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border sm:left-[9px]" aria-hidden />
                <div className="space-y-5">
                  {pastAppointments.map((apt) => (
                    <motion.div key={apt.id} variants={itemVariants} className="relative">
                      <span className="absolute -left-5 top-6 h-3.5 w-3.5 rounded-full border-2 border-border bg-card sm:-left-6" aria-hidden />
                      <GlassCard hover>
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <DateBlock day={apt.day} month={apt.month} />
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">{apt.service}</h3>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  apt.status === 'completed'
                                    ? 'bg-secondary/15 text-secondary-foreground'
                                    : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                <CheckCircle2 size={12} />
                                {apt.status === 'completed' ? t('myAppointments.completed') : t('myAppointments.cancelled')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {apt.date}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                {apt.time}
                              </span>
                              <span>{t('myAppointments.with')} {apt.therapist}</span>
                            </div>
                            {apt.notes && (
                              <div className="rounded-xl border border-border/50 bg-muted/40 p-3.5">
                                <p className="text-sm text-foreground text-pretty">
                                  <span className="font-medium text-primary">{t('myAppointments.sessionNotesLink')}</span>
                                  <span className="mt-1 block text-muted-foreground">{apt.notes}</span>
                                </p>
                              </div>
                            )}
                            {apt.status === 'completed' && (
                              <Link
                                href="/dashboard/patient/session-notes"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                              >
                                <NotebookPen size={14} />
                                {t('myAppointments.sessionNotesLink')}
                              </Link>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        </>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={t('dialogs.cancelAppointmentTitle')}
        description={
          cancelTarget
            ? t('dialogs.cancelAppointmentDescription', {
                service: cancelTarget.service,
                date: cancelTarget.date,
                time: cancelTarget.time,
              })
            : ''
        }
        footer={
          <>
            <button onClick={() => setCancelTarget(null)} className="glass-button-outline">
              {t('buttons.keepIt')}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="glass-button border-destructive bg-destructive text-white hover:brightness-105 disabled:opacity-60"
            >
              {cancelling ? t('buttons.cancelling') : t('buttons.cancelAppointment')}
            </button>
          </>
        }
      />

      {/* Reschedule */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title={t('dialogs.rescheduleAppointmentTitle')}
        description={
          rescheduleTarget
            ? t('dialogs.rescheduleAppointmentDescription', { service: rescheduleTarget.service })
            : ''
        }
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button onClick={() => setRescheduleTarget(null)} className="glass-button-outline">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleReschedule}
              disabled={!selectedSlot || rescheduling}
              className="glass-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rescheduling ? t('common.saving') : t('buttons.confirmNewTime')}
            </button>
          </>
        }
      >
        {slotsLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading.availableTimes')}</p>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('myAppointments.noAvailableSlotsIn30Days')}</p>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {Object.entries(slotsByDate).map(([date, slots]) => (
              <div key={date}>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {format(new Date(`${date}T00:00:00`), 'EEEE, MMM d')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.date}_${slot.start}`}
                      onClick={() => setSelectedSlot({ date: slot.date, start: slot.start })}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedSlot?.date === slot.date && selectedSlot?.start === slot.start
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
