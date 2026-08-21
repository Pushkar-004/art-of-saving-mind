'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import { getPsychologistDashboard, type PsychologistDashboard } from '@/lib/api/client'

const statusClass = { pending: 'bg-accent/15 text-accent-foreground', upcoming: 'bg-primary/10 text-primary', completed: 'bg-secondary/15 text-secondary-foreground', cancelled: 'bg-destructive/10 text-destructive' }

export default function PsychologistDashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<PsychologistDashboard | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { try { setDashboard((await getPsychologistDashboard()).data.dashboard) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load your appointments') } }, [])
  useEffect(() => { if (!isLoading && (!isAuthenticated || user?.role !== 'psychologist')) router.replace('/auth/login'); else if (user?.role === 'psychologist') load() }, [isLoading, isAuthenticated, user, router, load])
  if (isLoading || !user || user.role !== 'psychologist') return null
  const cards = [
    ['Assigned Patients', dashboard?.assignedPatients ?? 0, Users],
    ['Upcoming Appointments', dashboard?.upcomingAppointments ?? 0, Calendar],
    ["Today's Appointments", dashboard?.todayAppointments ?? 0, Clock],
    ['Completed Appointments', dashboard?.completedAppointments ?? 0, CheckCircle2],
  ] as const
  const active = dashboard?.appointments.filter((appointment) => appointment.status !== 'completed' && appointment.status !== 'cancelled') ?? []
  const patients = Array.from(new Map((dashboard?.appointments ?? []).filter((a) => a.patientId).map((a) => [a.patientId, a]))).map(([, a]) => a)
  return <main className="min-h-screen bg-background"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md sm:px-8"><div><p className="text-lg font-semibold text-foreground">Psychologist Dashboard</p><p className="text-xs text-muted-foreground">PPM Care Team</p></div><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:block">{user.name}</span><button onClick={async () => { await logout(); router.push('/auth/login') }} className="glass-button-outline px-3 py-2 text-sm">Log out</button></div></header><div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6"><div><p className="text-sm font-medium text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1 className="wellness-heading text-3xl">Welcome back, {user.name.split(' ')[0]}</h1><p className="text-muted-foreground">Your assigned client appointments and care workload.</p></div>{error ? <p className="text-destructive">{error}</p> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, Icon]) => <GlassCard key={label} hover><Icon className="mb-4 text-primary" size={22} /><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold text-foreground">{value}</p></GlassCard>)}</div><div className="grid gap-6 lg:grid-cols-2"><GlassCard><h2 className="mb-4 text-lg font-semibold">My Appointments</h2>{active.length === 0 ? <EmptyState icon={Calendar} title="No active appointments" description="Appointments assigned to you will appear here." /> : <div className="space-y-3">{active.map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 p-3"><div><p className="font-medium">{appointment.patientName}</p><p className="text-sm text-muted-foreground">{appointment.date} · {appointment.time}</p></div><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></div>)}</div>}</GlassCard><GlassCard><h2 className="mb-4 text-lg font-semibold">My Patients</h2>{patients.length === 0 ? <EmptyState icon={Users} title="No assigned patients" description="Patients become visible once the admin assigns an appointment." /> : <div className="space-y-3">{patients.map((appointment) => <div key={appointment.patientId} className="rounded-xl border border-border/50 p-3"><p className="font-medium">{appointment.patientName}</p><p className="text-sm text-muted-foreground">Next appointment: {appointment.date} at {appointment.time}</p></div>)}</div>}</GlassCard></div></>}</div></main>
}
