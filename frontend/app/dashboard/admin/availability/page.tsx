'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, CalendarOff, Plus, Trash2, Save, X } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { Skeleton } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import { toast } from 'sonner'
import {
  getWeeklyAvailability,
  saveWeeklyAvailability,
  getBlockedDates,
  addBlockedDate,
  removeBlockedDate,
  type DayAvailability,
  type TimeSlot,
  type BlockedDate,
} from '@/lib/api/client'

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function nextHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const nextH = (h + 1) % 24
  return `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function AdminAvailabilityPage() {
  const [week, setWeek] = useState<DayAvailability[]>([])
  const [blocked, setBlocked] = useState<BlockedDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedLabel, setNewBlockedLabel] = useState('')
  const [addingBlocked, setAddingBlocked] = useState(false)
  const [showBlockForm, setShowBlockForm] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const [weekRes, blockedRes] = await Promise.all([
        getWeeklyAvailability(),
        getBlockedDates(),
      ])

      setWeek(weekRes.data.week)
      setBlocked(blockedRes.data.blockedDates)
      setDirty(false)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleWorking = (dayOfWeek: string) => {
    setWeek((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              isWorking: !d.isWorking,
              slots: d.slots.map((s) => ({ ...s, enabled: !d.isWorking })),
            }
          : d,
      ),
    )
    setDirty(true)
  }

  const toggleSlot = (dayOfWeek: string, slotId: string) => {
    setWeek((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              slots: d.slots.map((s) =>
                s.id === slotId ? { ...s, enabled: !s.enabled } : s,
              ),
            }
          : d,
      ),
    )
    setDirty(true)
  }

  const removeSlot = (dayOfWeek: string, slotId: string) => {
    setWeek((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
          : d,
      ),
    )
    setDirty(true)
  }

  const addSlot = (dayOfWeek: string) => {
    setWeek((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d

        const lastSlot = d.slots[d.slots.length - 1]
        const start = lastSlot ? nextHour(lastSlot.start) : '09:00'

        const newSlot: TimeSlot = {
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          start,
          end: nextHour(start),
          enabled: true,
        }

        return {
          ...d,
          isWorking: true,
          slots: [...d.slots, newSlot],
        }
      }),
    )
    setDirty(true)
  }

  const updateSlotTime = (
    dayOfWeek: string,
    slotId: string,
    field: 'start' | 'end',
    value: string,
  ) => {
    setWeek((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              slots: d.slots.map((s) =>
                s.id === slotId ? { ...s, [field]: value } : s,
              ),
            }
          : d,
      ),
    )
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const slots = week.flatMap((d) =>
        d.slots.map((s) => ({
          id: s.id.startsWith('new-') ? undefined : s.id,
          dayOfWeek: d.dayOfWeek,
          startTime: s.start,
          endTime: s.end,
          isEnabled: s.enabled,
        })),
      )

      const res = await saveWeeklyAvailability(slots)
      setWeek(res.data.week)
      setDirty(false)
      toast.success('Availability saved successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) {
      toast.error('Please choose a date.')
      return
    }

    setAddingBlocked(true)

    try {
      const res = await addBlockedDate(newBlockedDate, newBlockedLabel || undefined)
      setBlocked((prev) =>
        [...prev, res.data.blockedDate].sort((a, b) => a.date.localeCompare(b.date)),
      )
      setNewBlockedDate('')
      setNewBlockedLabel('')
      setShowBlockForm(false)
      toast.success('Date blocked successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to block date')
    } finally {
      setAddingBlocked(false)
    }
  }

  const handleRemoveBlocked = async (id: string) => {
    try {
      await removeBlockedDate(id)
      setBlocked((prev) => prev.filter((b) => b.id !== id))
      toast.success('Blocked date removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove blocked date')
    }
  }

  if (isError) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="wellness-heading text-3xl">Availability Management</h1>
          <p className="text-muted-foreground">
            Set your weekly working hours and block off dates.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!dirty || saving || isLoading}
          className="glass-button self-start disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekly hours */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Weekly Hours</h2>
            </div>

            <div className="space-y-4">
              {week.map((d) => (
                <motion.div key={d.dayOfWeek} layout>
                  <GlassCard hover={false}>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-center justify-between gap-3 sm:w-40 sm:shrink-0">
                          <span className="font-semibold text-foreground">{d.day}</span>
                          <button
                            role="switch"
                            aria-checked={d.isWorking}
                            onClick={() => toggleWorking(d.dayOfWeek)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                              d.isWorking ? 'bg-primary' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                d.isWorking ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex-1 space-y-3">
                          {!d.isWorking ? (
                            <p className="text-sm text-muted-foreground">Not available</p>
                          ) : (
                            <>
                              {d.slots.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No slots configured
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {d.slots.map((s) => (
                                    <div
                                      key={s.id}
                                      className={`rounded-xl border p-3 transition-colors ${
                                        s.enabled
                                          ? 'border-primary/30 bg-primary/5'
                                          : 'border-border/60 bg-muted/30 opacity-70'
                                      }`}
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                          <div className="flex items-center gap-2">
                                            <label className="text-xs text-muted-foreground">
                                              Start
                                            </label>
                                            <input
                                              type="time"
                                              value={s.start}
                                              onChange={(e) =>
                                                updateSlotTime(
                                                  d.dayOfWeek,
                                                  s.id,
                                                  'start',
                                                  e.target.value,
                                                )
                                              }
                                              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <label className="text-xs text-muted-foreground">
                                              End
                                            </label>
                                            <input
                                              type="time"
                                              value={s.end}
                                              onChange={(e) =>
                                                updateSlotTime(
                                                  d.dayOfWeek,
                                                  s.id,
                                                  'end',
                                                  e.target.value,
                                                )
                                              }
                                              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => toggleSlot(d.dayOfWeek, s.id)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                              s.enabled
                                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                            title={
                                              s.enabled
                                                ? 'Click to disable slot'
                                                : 'Click to enable slot'
                                            }
                                          >
                                            {s.enabled ? 'Enabled' : 'Disabled'}
                                          </button>

                                          <button
                                            onClick={() => removeSlot(d.dayOfWeek, s.id)}
                                            aria-label="Remove slot"
                                            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Preview: {formatTime(s.start)} – {formatTime(s.end)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => addSlot(d.dayOfWeek)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                              >
                                <Plus size={14} />
                                Add slot
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Blocked dates */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarOff size={18} className="text-accent-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Blocked Dates</h2>
            </div>

            <GlassCard hover={false}>
              <div className="space-y-3">
                {blocked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No blocked dates. Add one to take time off.
                  </p>
                ) : (
                  blocked.map((b) => (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/40 p-3.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.date}</p>
                        {b.label && <p className="text-xs text-muted-foreground">{b.label}</p>}
                      </div>

                      <button
                        onClick={() => handleRemoveBlocked(b.id)}
                        aria-label={`Remove ${b.date}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))
                )}

                {showBlockForm ? (
                  <div className="space-y-3 rounded-xl border border-border/60 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Date
                        </label>
                        <input
                          type="date"
                          value={newBlockedDate}
                          onChange={(e) => setNewBlockedDate(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Label (optional)
                        </label>
                        <input
                          type="text"
                          value={newBlockedLabel}
                          onChange={(e) => setNewBlockedLabel(e.target.value)}
                          placeholder="e.g. Personal leave"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddBlockedDate}
                        disabled={addingBlocked}
                        className="glass-button flex-1 disabled:opacity-60"
                      >
                        {addingBlocked ? 'Adding...' : 'Add'}
                      </button>

                      <button
                        onClick={() => setShowBlockForm(false)}
                        className="glass-button-outline flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBlockForm(true)}
                    className="glass-button-outline w-full"
                  >
                    <Plus size={16} />
                    Block a date
                  </button>
                )}
              </div>
            </GlassCard>
          </section>
        </>
      )}
    </div>
  )
}