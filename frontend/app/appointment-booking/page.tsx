'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, MapPin, Video, CheckCircle, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/layout/Footer'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { useAuth } from '@/lib/context/AuthContext'
import { bookAppointment, getAvailableSlots } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'

// Internal English values are the source of truth for `formData.service`
// (sent to the backend as-is). `translationKey` resolves the on-screen
// label only — switching language never changes the submitted value.
const SERVICE_KEYS = [
  { key: 'Anxiety Counseling', translationKey: 'services.anxietyTitle' },
  { key: 'Stress Management', translationKey: 'services.stressTitle' },
  { key: 'Relationship Counseling', translationKey: 'services.relationshipTitle' },
  { key: 'Career Guidance', translationKey: 'services.careerTitle' },
  { key: 'Individual Therapy', translationKey: 'services.individualTitle' },
  { key: 'Child Psychology', translationKey: 'services.childTitle' },
] as const

type ApiSlot = {
  date: string
  start: string
  end: string
}

function formatTime12(time: string) {
  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

export default function AppointmentBookingPage() {
  const { user } = useAuth()
  const { t } = useT()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    sessionType: 'online' as 'online' | 'offline',
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  const [submitting, setSubmitting] = useState(false)

  // real slots from backend
  const [slots, setSlots] = useState<ApiSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const in30Days = format(addDays(new Date(), 30), 'yyyy-MM-dd')

    setSlotsLoading(true)

    getAvailableSlots(today, in30Days)
      .then((res) => {
        setSlots(res.data.slots || [])
      })
      .catch((err) => {
        console.error('Failed to fetch available slots:', err)
        toast.error(t('toast.slotsLoadFailed'))
      })
      .finally(() => {
        setSlotsLoading(false)
      })
  }, [])

  // prefill user info if logged in
  useEffect(() => {
    if (!user) return

    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
    }))
  }, [user])

  // unique available dates
  const availableDates = useMemo(() => {
    return Array.from(new Set(slots.map((slot) => slot.date))).sort()
  }, [slots])

  // all slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!formData.date) return []
    return slots.filter((slot) => slot.date === formData.date)
  }, [slots, formData.date])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNext = () => {
    if (step === 1 && !formData.service) {
      toast.error(t('toast.selectService'))
      return
    }

    if (step === 2 && (!formData.date || !formData.time)) {
      toast.error(t('toast.selectDateTime'))
      return
    }

    if (step === 3 && (!formData.name || !formData.email || !formData.phone)) {
      toast.error(t('toast.fillRequiredFields'))
      return
    }

    if (step < 4) setStep((prev) => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await bookAppointment({
        service: formData.service,
        date: formData.date,
        startTime: formData.time,
        mode: formData.sessionType,
        notes: formData.notes || undefined,
        guestName: formData.name,
        guestEmail: formData.email,
        guestPhone: formData.phone,
      })

      toast.success(t('toast.appointmentBooked'))

      setTimeout(() => {
        window.location.href = user
          ? '/dashboard/patient/appointments'
          : '/auth/login?redirect=/dashboard/patient/appointments'
      }, 1500)
    } catch (err) {
      console.error('Booking failed:', err)
      toast.error(err instanceof Error ? err.message : t('toast.bookingFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <motion.h1
            className="wellness-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('appointment.bookYourSession')}
          </motion.h1>

          <motion.p
            className="wellness-subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('appointment.takeFirstStep')}
          </motion.p>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-1 items-center">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold transition-all ${
                    step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  initial={false}
                  animate={{ scale: step === s ? 1.1 : 1 }}
                >
                  {s}
                </motion.div>

                {s < 4 && (
                  <div className={`mx-2 h-1 flex-1 transition-all ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs font-medium text-muted-foreground sm:text-sm">
            <span>{t('appointment.stepService')}</span>
            <span>{t('appointment.stepDateTime')}</span>
            <span>{t('appointment.stepDetails')}</span>
            <span>{t('appointment.stepConfirm')}</span>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h2 className="mb-6 text-2xl font-semibold text-foreground">{t('appointment.selectYourService')}</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SERVICE_KEYS.map(({ key, translationKey }) => (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, service: key }))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        formData.service === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{t(translationKey)}</span>
                        {formData.service === key && <CheckCircle size={20} className="text-primary" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h2 className="mb-6 text-2xl font-semibold text-foreground">{t('appointment.chooseDateAndTime')}</h2>

                {slotsLoading ? (
                  <p className="text-sm text-muted-foreground">{t('loading.availableDates')}</p>
                ) : availableDates.length === 0 ? (
                  <GlassCard>
                    <p className="text-sm text-muted-foreground">
                      {t('appointment.noSlotsAvailable')}
                    </p>
                  </GlassCard>
                ) : (
                  <>
                    {/* Date selection */}
                    <div>
                      <label className="mb-4 block text-sm font-medium text-foreground">{t('appointment.preferredDate')}</label>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availableDates.map((dateStr) => {
                          const dateObj = new Date(`${dateStr}T00:00:00`)
                          const isSelected = formData.date === dateStr

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  date: dateStr,
                                  time: '',
                                }))
                              }
                              className={`rounded-lg border-2 p-3 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="font-medium text-foreground">{format(dateObj, 'EEE')}</div>
                              <div className="text-xs text-muted-foreground">{format(dateObj, 'MMM d, yyyy')}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time selection */}
                    {formData.date && (
                      <div>
                        <label className="mb-4 block text-sm font-medium text-foreground">{t('appointment.preferredTime')}</label>

                        {slotsForSelectedDate.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t('appointment.noTimesLeftOnDate')}</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {slotsForSelectedDate.map((slot) => {
                              const isSelected = formData.time === slot.start
                              return (
                                <button
                                  key={`${slot.date}-${slot.start}`}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      time: slot.start,
                                    }))
                                  }
                                  className={`rounded-lg border-2 p-3 transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <Clock size={16} className="mx-auto mb-1" />
                                  <div className="text-sm font-medium text-foreground">
                                    {formatTime12(slot.start)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t('appointment.timeRangeTo')} {formatTime12(slot.end)}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h2 className="mb-6 text-2xl font-semibold text-foreground">
                  {t('appointment.sessionDetailsAndPersonalInfo')}
                </h2>

                <div>
                  <label className="mb-4 block text-sm font-medium text-foreground">{t('appointment.sessionType')}</label>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'online', translationKey: 'appointment.onlineVideoCall', icon: Video },
                      { value: 'offline', translationKey: 'appointment.inPersonMeeting', icon: MapPin },
                    ].map(({ value, translationKey, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            sessionType: value as 'online' | 'offline',
                          }))
                        }
                        className={`rounded-xl border-2 p-4 transition-all ${
                          formData.sessionType === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon size={24} className="mx-auto mb-2" />
                        <div className="text-sm font-medium">{t(translationKey)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t('appointment.fullNameRequired')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('contact.namePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t('appointment.emailAddressRequired')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('contact.emailPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t('appointment.phoneNumberRequired')}</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('contact.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t('appointment.additionalNotesOptional')}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('appointment.additionalNotesPlaceholder')}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="mb-8 text-center">
                  <CheckCircle size={64} className="mx-auto mb-4 text-primary" />
                  <h2 className="mb-2 text-2xl font-semibold text-foreground">{t('appointment.reviewYourBooking')}</h2>
                  <p className="text-muted-foreground">{t('appointment.verifyDetailsBeforeConfirming')}</p>
                </div>

                <div className="space-y-4">
                  <GlassCard>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('appointment.service')}</p>
                        <p className="font-semibold text-foreground">
                          {t(
                            SERVICE_KEYS.find((s) => s.key === formData.service)?.translationKey ??
                              'appointment.service',
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('appointment.sessionTypeLabel')}</p>
                        <p className="font-semibold capitalize text-foreground">
                          {formData.sessionType === 'online' ? t('appointment.online') : t('appointment.inPerson')}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('appointment.date')}</p>
                        <p className="font-semibold text-foreground">
                          <Calendar size={14} className="mr-1 inline text-primary" />
                          {formData.date
                            ? format(new Date(`${formData.date}T00:00:00`), 'PPP')
                            : ''}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('appointment.time')}</p>
                        <p className="font-semibold text-foreground">
                          {formData.time ? formatTime12(formData.time) : ''}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t('appointment.name')}:{' '}
                        <span className="font-medium text-foreground">{formData.name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('appointment.email')}:{' '}
                        <span className="font-medium text-foreground">{formData.email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('appointment.phone')}:{' '}
                        <span className="font-medium text-foreground">{formData.phone}</span>
                      </p>
                      {formData.notes && (
                        <p className="text-sm text-muted-foreground">
                          {t('appointment.notes')}:{' '}
                          <span className="font-medium text-foreground">{formData.notes}</span>
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="glass-button-outline flex-1"
                >
                  {t('appointment.previous')}
                </button>
              )}

              {step < 4 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="glass-button flex-1 flex items-center justify-center gap-2"
                >
                  {t('appointment.next')} <ArrowRight size={18} />
                </button>
              )}

              {step === 4 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="glass-button flex-1 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t('buttons.booking') : t('buttons.confirmBookingShort')}
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}