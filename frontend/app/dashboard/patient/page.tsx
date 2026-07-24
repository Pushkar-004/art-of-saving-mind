'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Heart, Calendar, TrendingUp, Clock, ArrowRight, Smile, Sparkles, Video, MapPin, NotebookPen, Lightbulb, FileDown, type LucideIcon } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useAuth } from '@/lib/context/AuthContext'
import { useT } from '@/lib/i18n/useT'
import {
  patientMoodTrend,
  patientMoodScore,
} from '@/lib/mock-data'
import {
  getMyAppointments,
  getMySessionNotes,
  getPatientAnalytics,
  downloadMyReport,
  type Appointment,
  type SessionNoteWithAppointment,
  type PatientAnalytics,
} from '@/lib/api/client'

const iconMap: Record<string, LucideIcon> = {
  Heart,
  TrendingUp,
  Calendar,
  Smile,
}

const moodData = patientMoodTrend

// Quick action links — href/icon are fixed; label is resolved via t()
// inside the component, following the SERVICE_KEYS/CATEGORY_KEYS
// pattern established in Phase B3/B4.
const QUICK_ACTION_KEYS = [
  { href: '/dashboard/patient/appointments', icon: 'Calendar', translationKey: 'dashboard.quickActionBookSession' },
  { href: '/dashboard/patient/mood-tracker', icon: 'Smile', translationKey: 'dashboard.quickActionLogMood' },
  { href: '/dashboard/patient/journal', icon: 'Heart', translationKey: 'dashboard.quickActionWriteJournal' },
]

// "Tips for Today" — translation keys resolved via t() inside the component.
const TIP_KEYS = ['dashboard.tipBreathing', 'dashboard.tipWalk', 'dashboard.tipJournal']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { t } = useT()
  const firstName = (user?.name ?? '').split(' ')[0] || 'there'
  const moodScore = patientMoodScore
  const moodPercent = Math.round((moodScore / 10) * 100)

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)

  const [latestNote, setLatestNote] = useState<SessionNoteWithAppointment | null>(null)
  const [noteLoading, setNoteLoading] = useState(true)

  const [analytics, setAnalytics] = useState<PatientAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const handleDownloadReport = async () => {
    setReportLoading(true)
    setReportError(null)
    try {
      await downloadMyReport()
    } catch (err) {
      setReportError(err instanceof Error ? err.message : t('toast.reportDownloadFailed'))
    } finally {
      setReportLoading(false)
    }
  }

  const loadAppointments = useCallback(async () => {
    setAppointmentsLoading(true)
    try {
      const res = await getMyAppointments()
      const upcoming = res.data.appointments.filter(
        (a) => a.status === 'upcoming' || a.status === 'pending',
      )
      setUpcomingAppointments(upcoming.slice(0, 4))
    } catch {
      // Non-fatal — dashboard still renders without appointments
      setUpcomingAppointments([])
    } finally {
      setAppointmentsLoading(false)
    }
  }, [])

  // Latest recommendation card — pulls the most recent session note
  // (already sorted newest-first by the backend) so the dashboard can
  // surface it without its own sorting logic.
  const loadLatestNote = useCallback(async () => {
    setNoteLoading(true)
    try {
      const res = await getMySessionNotes()
      setLatestNote(res.data.sessionNotes[0] ?? null)
    } catch {
      setLatestNote(null)
    } finally {
      setNoteLoading(false)
    }
  }, [])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await getPatientAnalytics()
      setAnalytics(res.data.analytics)
    } catch {
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAppointments()
    loadLatestNote()
    loadAnalytics()
  }, [loadAppointments, loadLatestNote, loadAnalytics])

  return (
    <motion.div
      className="mx-auto w-full max-w-6xl space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="space-y-1">
        <p className="text-sm font-medium text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="wellness-heading text-3xl sm:text-4xl">
          {t('dashboard.welcomeBack', { name: firstName })}
        </h1>
        <p className="text-muted-foreground text-pretty">
          {t('dashboard.progressMessage')}
        </p>
        <div className="pt-1 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadReport}
            disabled={reportLoading}
            className="glass-button-outline flex items-center gap-2 text-sm"
          >
            <FileDown size={15} />
            {reportLoading ? t('common.generating') : t('reports.downloadMyReport')}
          </button>
          {reportError && (
            <span className="text-xs text-destructive">{reportError}</span>
          )}
        </div>
      </motion.div>

      {/* Hero Mood Summary — Apple Health style */}
      <motion.div variants={itemVariants}>
        <GlassCard className="overflow-hidden p-0">
          <div className="wellness-wash flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              {/* Mood ring */}
              <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="9" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - moodPercent / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground sm:text-3xl">{moodScore}</span>
                  <span className="text-xs text-muted-foreground">{t('dashboard.of10')}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles size={13} />
                  {t('dashboard.improvingSteadily')}
                </div>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{t('dashboard.todaysMood')}</h2>
                <p className="max-w-xs text-sm text-muted-foreground text-pretty">
                  {t('dashboard.moodTrendMessage')}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/patient/mood-tracker"
              className="glass-button-accent self-start lg:self-auto"
            >
              {t('dashboard.logTodaysMood')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </GlassCard>
      </motion.div>

      {/* Metric Tiles */}
      <motion.section variants={itemVariants} className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('dashboard.atAGlance')}</h2>
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {analyticsLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
            ))
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Heart size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{t('analytics.totalSessions')}</p>
                      <p className="mt-0.5 text-2xl font-bold text-foreground">{analytics?.totalSessions ?? 0}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('analytics.completedSessionsCount', { count: analytics?.completedSessions ?? 0 })}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
              <motion.div variants={itemVariants}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Calendar size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{t('analytics.upcomingSessions')}</p>
                      <p className="mt-0.5 text-2xl font-bold text-foreground">{analytics?.upcomingSessions ?? 0}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('analytics.confirmedAndPending')}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
              <motion.div variants={itemVariants}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <TrendingUp size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{t('analytics.resourcesAvailable')}</p>
                      <p className="mt-0.5 text-2xl font-bold text-foreground">{analytics?.resourceCount ?? 0}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('analytics.wellnessLibrary')}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.section>

      {/* Mood Trend + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Mood Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <GlassCard className="h-full">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t('dashboard.weeklyMoodTrend')}</h2>
                  <p className="text-sm text-muted-foreground">{t('dashboard.last7Days')}</p>
                </div>
                <Link
                  href="/dashboard/patient/mood-tracker"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {t('dashboard.details')} <ArrowRight size={14} />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={moodData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={28} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--popover-foreground)',
                      boxShadow: 'var(--shadow-lift)',
                    }}
                    labelStyle={{ color: 'var(--muted-foreground)' }}
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fill="url(#moodFill)"
                    dot={{ fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions + Tips */}
        <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">
          <GlassCard>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
              <div className="space-y-2.5">
                {QUICK_ACTION_KEYS.map((action) => {
                  const Icon = iconMap[action.icon] ?? Calendar
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3.5 transition-all hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={18} />
                        </span>
                        <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                          {t(action.translationKey)}
                        </span>
                      </span>
                      <ArrowRight
                        size={16}
                        className="-translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t('dashboard.tipsForToday')}</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {TIP_KEYS.map((tipKey) => (
                  <li key={tipKey} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-pretty">{t(tipKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Upcoming Sessions */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('dashboard.upcomingSessions')}</h2>
          <Link
            href="/dashboard/patient/appointments"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t('common.seeAll')} <ArrowRight size={14} />
          </Link>
        </div>

        {appointmentsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('emptyStates.noUpcomingSessionsTitle')}
            description={t('emptyStates.noUpcomingSessionsDescription')}
            action={<a href="/appointment-booking" className="glass-button-outline">{t('buttons.bookAppointment')}</a>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {upcomingAppointments.map((apt, index) => {
              const isOnline = apt.type === 'online'
              return (
                <GlassCard key={index} hover>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-pretty">{apt.service}</p>
                        <p className="text-sm text-muted-foreground">{apt.therapist}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isOnline
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/15 text-secondary-foreground'
                        }`}
                      >
                        {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                        {isOnline ? t('appointment.online') : t('appointment.inPerson')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar size={15} className="text-primary" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={15} className="text-primary" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </motion.section>

      {/* Latest Recommendation — only shown once a session note with a
          recommendation actually exists; skipped entirely otherwise so
          the dashboard doesn't show an empty card for something most
          patients won't have on day one. */}
      {!noteLoading && latestNote?.recommendations && (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('dashboard.latestRecommendation')}</h2>
            <Link
              href="/dashboard/patient/session-notes"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t('common.seeAll')} <ArrowRight size={14} />
            </Link>
          </div>

          <GlassCard hover>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb size={20} />
              </span>
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.fromSessionOn', { service: latestNote.appointmentService, date: latestNote.appointmentDate })}
                </p>
                <p className="text-foreground text-pretty">{latestNote.recommendations}</p>
                <Link
                  href="/dashboard/patient/session-notes"
                  className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <NotebookPen size={14} />
                  {t('dashboard.viewFullNotes')}
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      )}
    </motion.div>
  )
}
