'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Check,
  CheckCheck,
  X,
  CalendarX2,
  CalendarClock,
  NotebookPen,
  FileDown,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Modal from '@/components/shared/Modal'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { toast } from 'sonner'
import {
  getAdminAppointments,
  confirmAppointmentAsAdmin,
  cancelAppointmentAsAdmin,
  rescheduleAppointmentAsAdmin,
  markAppointmentComplete,
  getAvailableSlots,
  type Appointment,
  type AppointmentStatus,
  downloadAppointmentsReport,
} from '@/lib/api/client'
import { useNotifications } from '@/lib/context/NotificationContext'

const filters: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const statusStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-accent/15 text-accent-foreground',
  upcoming: 'bg-primary/10 text-primary',
  completed: 'bg-secondary/15 text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

export default function AdminAppointmentsPage() {
  const { refreshNotifications } = useNotifications()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [activeFilter, setActiveFilter] = useState<AppointmentStatus | 'all'>('all')

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const handleExportPDF = async () => {
    setReportLoading(true)
    try {
      await downloadAppointmentsReport()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export appointments report')
    } finally {
      setReportLoading(false)
    }
  }
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
      const res = await getAdminAppointments()
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

  const filtered = useMemo(
    () =>
      activeFilter === 'all'
        ? appointments
        : appointments.filter((a) => a.status === activeFilter),
    [appointments, activeFilter],
  )

  const handleConfirm = async (apt: Appointment) => {
    try {
      await confirmAppointmentAsAdmin(apt.id)
      void refreshNotifications()
      toast.success(`Confirmed ${apt.patientName}'s session`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm appointment')
    }
  }

  const handleComplete = async (apt: Appointment) => {
    try {
      await markAppointmentComplete(apt.id)
      toast.success(`Marked ${apt.patientName}'s session as completed`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark appointment as completed')
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointmentAsAdmin(cancelTarget.id)
      void refreshNotifications()
      toast.success(`Cancelled ${cancelTarget.patientName}'s session`)
      setCancelTarget(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel appointment')
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
      toast.error('Could not load available slots')
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleTarget || !selectedSlot) return
    setRescheduling(true)
    try {
      await rescheduleAppointmentAsAdmin(rescheduleTarget.id, selectedSlot.date, selectedSlot.start)
      void refreshNotifications()
      toast.success(`Rescheduled ${rescheduleTarget.patientName}'s session`)
      setRescheduleTarget(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule appointment')
    } finally {
      setRescheduling(false)
    }
  }

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
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="wellness-heading text-3xl">Appointment Management</h1>
            <p className="text-muted-foreground">Review, confirm, and manage all patient sessions.</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={reportLoading}
            className="glass-button-outline flex items-center gap-2 text-sm shrink-0 mt-1"
          >
            <FileDown size={15} />
            {reportLoading ? 'Generating…' : 'Export Appointments PDF'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const count =
            f.value === 'all'
              ? appointments.length
              : appointments.filter((a) => a.status === f.value).length
          const isActive = activeFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
              <span className="text-xs opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No appointments here"
          description="There are no appointments matching this filter right now."
        />
      ) : (
        <motion.div layout className="space-y-4">
          {filtered.map((apt) => {
            const isOnline = apt.type === 'online'
            return (
              <motion.div
                key={apt.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard hover>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Patient */}
                    <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                        {apt.patientInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {apt.patientName}
                          {apt.isGuest && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(guest)</span>
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{apt.service}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-primary" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary" />
                        {apt.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {isOnline ? <Video size={14} /> : <MapPin size={14} />}
                        {isOnline ? 'Online' : 'In-Person'}
                      </span>
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[apt.status]}`}
                      >
                        {apt.status}
                      </span>

                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(apt)}
                          aria-label="Confirm appointment"
                          className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                        >
                          <Check size={16} />
                        </button>
                      )}

                      {apt.status === 'upcoming' && (
                        <button
                          onClick={() => handleComplete(apt)}
                          aria-label="Mark as completed"
                          className="inline-flex items-center justify-center rounded-lg border border-secondary/40 bg-secondary/10 p-2 text-secondary-foreground transition-colors hover:bg-secondary/20"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}

                      {(apt.status === 'pending' || apt.status === 'upcoming') && (
                        <button
                          onClick={() => openReschedule(apt)}
                          aria-label="Reschedule appointment"
                          className="inline-flex items-center justify-center rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                          <CalendarClock size={16} />
                        </button>
                      )}

                      {(apt.status === 'pending' || apt.status === 'upcoming') && (
                        <button
                          onClick={() => setCancelTarget(apt)}
                          aria-label="Cancel appointment"
                          className="inline-flex items-center justify-center rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {apt.status === 'completed' && (
                        <Link
                          href="/dashboard/admin/session-notes"
                          aria-label="Session notes"
                          className="glass-button-outline px-3 py-2 text-sm"
                        >
                          <NotebookPen size={16} />
                          Session Notes
                        </Link>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this appointment?"
        description={
          cancelTarget
            ? `${cancelTarget.patientName}'s ${cancelTarget.service} on ${cancelTarget.date} at ${cancelTarget.time} will be cancelled.`
            : ''
        }
        footer={
          <>
            <button onClick={() => setCancelTarget(null)} className="glass-button-outline">
              Keep it
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="glass-button border-destructive bg-destructive text-white hover:brightness-105 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling...' : 'Cancel appointment'}
            </button>
          </>
        }
      />

      {/* Reschedule */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule appointment"
        description={
          rescheduleTarget
            ? `Choose a new time for ${rescheduleTarget.patientName}'s ${rescheduleTarget.service} session.`
            : ''
        }
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button onClick={() => setRescheduleTarget(null)} className="glass-button-outline">
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={!selectedSlot || rescheduling}
              className="glass-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rescheduling ? 'Saving...' : 'Confirm new time'}
            </button>
          </>
        }
      >
        {slotsLoading ? (
          <p className="text-sm text-muted-foreground">Loading available times...</p>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <p className="text-sm text-muted-foreground">No available slots in the next 30 days.</p>
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
    </div>
  )
}
