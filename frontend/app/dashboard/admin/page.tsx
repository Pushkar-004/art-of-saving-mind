'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users,
  CalendarClock,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import GlassCard from '@/components/shared/GlassCard'
import { SkeletonStats, Skeleton } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import EmptyState from '@/components/shared/EmptyState'
import { getAdminAnalytics, type AdminAnalytics } from '@/lib/api/client'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

const PIE_COLORS = [
  'var(--primary)',
  'var(--secondary)',
  'hsl(142 71% 45%)',
  'hsl(0 72% 51%)',
]

interface StatTile {
  label: string
  value: string | number
  icon: LucideIcon
  sub?: string
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getAdminAnalytics()
      setData(res.data.analytics)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const statTiles: StatTile[] = data
    ? [
        {
          label: 'Total Patients',
          value: data.totalPatients,
          icon: Users,
          sub: `${data.totalAppointments} total appointments`,
        },
        {
          label: 'Confirmed Sessions',
          value: data.confirmedAppointments,
          icon: CalendarClock,
          sub: 'Upcoming sessions',
        },
        {
          label: 'Pending Review',
          value: data.pendingAppointments,
          icon: Clock,
          sub: 'Awaiting confirmation',
        },
        {
          label: 'Completed',
          value: data.completedAppointments,
          icon: CheckCircle,
          sub: `${data.cancelledAppointments} cancelled`,
        },
      ]
    : []

  const pieData = data
    ? [
        { name: 'Pending', value: data.appointmentStatusBreakdown.pending },
        { name: 'Upcoming', value: data.appointmentStatusBreakdown.upcoming },
        { name: 'Completed', value: data.appointmentStatusBreakdown.completed },
        { name: 'Cancelled', value: data.appointmentStatusBreakdown.cancelled },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="wellness-heading text-3xl">Practice Overview</h1>
        <p className="text-muted-foreground">A real-time snapshot of your therapy practice.</p>
      </div>

      {isError ? (
        <ErrorState onRetry={load} />
      ) : isLoading || !data ? (
        <div className="space-y-8">
          <SkeletonStats count={4} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Skeleton className="h-80 rounded-2xl lg:col-span-3" />
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      ) : (
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Stat tiles */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statTiles.map((stat) => {
              const Icon = stat.icon
              return (
                <GlassCard key={stat.label} hover className="h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-0.5 text-2xl font-bold text-foreground">{stat.value}</p>
                      {stat.sub && <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>}
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </motion.div>

          {/* Appointments per month + Status breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Appointments per month */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <GlassCard className="h-full">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Appointments per Month</h2>
                    <p className="text-sm text-muted-foreground">Last 12 months</p>
                  </div>
                  {data.appointmentsPerMonth.every((p) => p.count === 0) ? (
                    <EmptyState icon={CalendarClock} title="No appointments yet" description="Data will appear once appointments are booked." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data.appointmentsPerMonth} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={28} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: 'var(--popover-foreground)',
                          }}
                          labelStyle={{ color: 'var(--muted-foreground)' }}
                          cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Appointments"
                          stroke="var(--primary)"
                          strokeWidth={3}
                          fill="url(#apptFill)"
                          dot={{ fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: 'var(--primary)' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Status breakdown pie */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <GlassCard className="h-full">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Status Breakdown</h2>
                    <p className="text-sm text-muted-foreground">All appointments</p>
                  </div>
                  {pieData.length === 0 ? (
                    <EmptyState icon={XCircle} title="No data yet" description="Status breakdown will appear once appointments exist." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{value}</span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: 'var(--popover-foreground)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Patient registrations + Most booked services */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Patient registrations per month */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <GlassCard className="h-full">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">New Patient Registrations</h2>
                    <p className="text-sm text-muted-foreground">Last 12 months</p>
                  </div>
                  {data.patientRegistrationsPerMonth.every((p) => p.count === 0) ? (
                    <EmptyState icon={Users} title="No registrations yet" description="Patient data will appear once users sign up." />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.patientRegistrationsPerMonth} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={28} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            color: 'var(--popover-foreground)',
                          }}
                          cursor={{ fill: 'color-mix(in oklab, var(--primary) 10%, transparent)' }}
                        />
                        <Bar dataKey="count" name="Patients" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Most booked services */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <GlassCard className="h-full">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Top Services</h2>
                    <p className="text-sm text-muted-foreground">Most booked</p>
                  </div>
                  {data.mostBookedServices.length === 0 ? (
                    <EmptyState icon={CalendarClock} title="No bookings yet" description="Service data will appear once appointments are booked." />
                  ) : (
                    <ul className="space-y-3">
                      {data.mostBookedServices.map((s, i) => (
                        <li key={s.service} className="flex items-center gap-3">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{s.service}</p>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${Math.round((s.count / (data.mostBookedServices[0]?.count || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-foreground">{s.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Needs Attention */}
          <motion.div variants={itemVariants}>
            <GlassCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Needs Attention</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.pendingAppointments > 0
                      ? `${data.pendingAppointments} pending appointment${data.pendingAppointments !== 1 ? 's' : ''} require review.`
                      : 'All appointments are up to date.'}
                  </p>
                </div>
                <Link href="/dashboard/admin/appointments" className="glass-button-outline shrink-0">
                  Review appointments
                  <ArrowRight size={16} />
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
