'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  ClipboardList,
  NotebookPen,
  Calendar,
  Clock,
  Pencil,
  X,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Modal from '@/components/shared/Modal'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import {
  getAdminAppointments,
  getSessionNoteByAppointmentId,
  createSessionNote,
  updateSessionNote,
  type Appointment,
  type SessionNote,
  type SessionNoteFormInput,
} from '@/lib/api/client'

const EMPTY_FORM: SessionNoteFormInput = {
  diagnosisSummary: '',
  observations: '',
  recommendations: '',
  homework: '',
  nextGoals: '',
}

export default function AdminSessionNotesPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notesByAppointmentId, setNotesByAppointmentId] = useState<Record<string, SessionNote>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [query, setQuery] = useState('')

  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [form, setForm] = useState<SessionNoteFormInput>(EMPTY_FORM)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Completed appointments are the only ones notes can be written
  // for — enforced again server-side, but filtering here keeps the
  // list focused on what's actually actionable.
  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getAdminAppointments('completed')
      setAppointments(res.data.appointments)

      // Fetch each completed appointment's existing note (if any) so
      // the list can show "Add notes" vs "Edit notes" without an
      // extra round trip when the modal opens.
      const entries = await Promise.all(
        res.data.appointments.map(async (apt) => {
          try {
            const noteRes = await getSessionNoteByAppointmentId(apt.id)
            return [apt.id, noteRes.data.sessionNote] as const
          } catch {
            return [apt.id, null] as const
          }
        }),
      )
      const map: Record<string, SessionNote> = {}
      for (const [id, note] of entries) {
        if (note) map[id] = note
      }
      setNotesByAppointmentId(map)
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
    if (!q) return appointments
    return appointments.filter(
      (a) => a.patientName.toLowerCase().includes(q) || a.service.toLowerCase().includes(q),
    )
  }, [appointments, query])

  const openModal = async (appointment: Appointment) => {
    setActiveAppointment(appointment)
    setForm(EMPTY_FORM)
    setEditingNoteId(null)
    setIsModalLoading(true)
    try {
      const res = await getSessionNoteByAppointmentId(appointment.id)
      const note = res.data.sessionNote
      if (note) {
        setEditingNoteId(note.id)
        setForm({
          diagnosisSummary: note.diagnosisSummary ?? '',
          observations: note.observations ?? '',
          recommendations: note.recommendations ?? '',
          homework: note.homework ?? '',
          nextGoals: note.nextGoals ?? '',
        })
      }
    } catch {
      toast.error('Could not load existing session notes')
    } finally {
      setIsModalLoading(false)
    }
  }

  const closeModal = () => {
    if (isSaving) return
    setActiveAppointment(null)
  }

  const handleSubmit = async () => {
    if (!activeAppointment) return
    const hasContent = Object.values(form).some((v) => (v ?? '').trim().length > 0)
    if (!hasContent) {
      toast.error('Add at least one note before saving.')
      return
    }

    setIsSaving(true)
    try {
      const note = editingNoteId
        ? (await updateSessionNote(editingNoteId, form)).data.sessionNote
        : (await createSessionNote(activeAppointment.id, form)).data.sessionNote

      setNotesByAppointmentId((prev) => ({ ...prev, [activeAppointment.id]: note }))
      toast.success(editingNoteId ? 'Session notes updated' : 'Session notes saved')
      setActiveAppointment(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save session notes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isError) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1">
        <h1 className="wellness-heading text-3xl">Session Notes</h1>
        <p className="text-muted-foreground">
          Add clinical notes for completed sessions and review what you&apos;ve written before.
        </p>
      </div>

      {/* Search */}
      <div className="relative sm:max-w-xs">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by patient or service..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No completed sessions yet"
          description="Once a session is marked completed, you can add notes for it here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const note = notesByAppointmentId[apt.id]
            return (
              <motion.div key={apt.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard hover>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                        {apt.patientInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{apt.patientName}</p>
                        <p className="truncate text-sm text-muted-foreground">{apt.service}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-primary" />
                            {apt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-primary" />
                            {apt.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openModal(apt)}
                      className={note ? 'glass-button-outline self-start sm:self-auto' : 'glass-button self-start sm:self-auto'}
                    >
                      {note ? <Pencil size={16} /> : <NotebookPen size={16} />}
                      {note ? 'Edit notes' : 'Add notes'}
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={!!activeAppointment}
        onClose={closeModal}
        maxWidthClass="max-w-lg"
        title={editingNoteId ? 'Edit Session Notes' : 'Add Session Notes'}
        description={
          activeAppointment
            ? `${activeAppointment.patientName} · ${activeAppointment.service} · ${activeAppointment.date}`
            : ''
        }
      >
        {isModalLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Diagnosis summary
              </label>
              <textarea
                value={form.diagnosisSummary}
                onChange={(e) => setForm((f) => ({ ...f, diagnosisSummary: e.target.value }))}
                placeholder="Brief summary of the diagnosis or presenting concern"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Observations</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                placeholder="What you noticed during the session"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Recommendations
              </label>
              <textarea
                value={form.recommendations}
                onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                placeholder="What you recommend going forward"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Homework</label>
              <textarea
                value={form.homework}
                onChange={(e) => setForm((f) => ({ ...f, homework: e.target.value }))}
                placeholder="Any exercises or homework for the patient"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Next goals</label>
              <textarea
                value={form.nextGoals}
                onChange={(e) => setForm((f) => ({ ...f, nextGoals: e.target.value }))}
                placeholder="Goals to focus on for the next session"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="glass-button flex-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : editingNoteId ? 'Save changes' : 'Save notes'}
              </button>
              <button onClick={closeModal} disabled={isSaving} className="glass-button-outline flex-1">
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
