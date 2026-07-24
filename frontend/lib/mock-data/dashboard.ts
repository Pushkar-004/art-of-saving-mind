// Centralized mock dashboard data — frontend only, no backend.

// ---------- Patient dashboard ----------

export interface MoodPoint {
  date: string
  mood: number
}

export interface MetricTile {
  label: string
  value: string
  subtext: string
  icon: string // lucide icon name, resolved in the component
}

export const patientMoodTrend: MoodPoint[] = [
  { date: 'Mon', mood: 5 },
  { date: 'Tue', mood: 6 },
  { date: 'Wed', mood: 5 },
  { date: 'Thu', mood: 7 },
  { date: 'Fri', mood: 7 },
  { date: 'Sat', mood: 8 },
  { date: 'Sun', mood: 7 },
]

export const patientMoodScore = 7.2

export const patientMetrics: MetricTile[] = [
  {
    icon: 'Heart',
    label: 'Total Sessions',
    value: '12',
    subtext: '3 completed this month',
  },
  {
    icon: 'TrendingUp',
    label: 'Current Streak',
    value: '5 days',
    subtext: 'Keep the momentum going',
  },
  {
    icon: 'Calendar',
    label: 'Next Session',
    value: 'Tomorrow',
    subtext: '2:00 PM with Miss Pooja',
  },
]

export const patientQuickActions = [
  { href: '/dashboard/patient/appointments', label: 'Book New Session', icon: 'Calendar' },
  { href: '/dashboard/patient/mood-tracker', label: 'Log Your Mood', icon: 'Smile' },
  { href: '/dashboard/patient/journal', label: 'Write in Journal', icon: 'Heart' },
]

export const patientTodayTips = [
  'Practice deep breathing for 5 minutes',
  'Take a 20-minute walk outside',
  'Journal about how you feel today',
]

// ---------- Admin dashboard ----------

export interface AdminStat {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  icon: string // lucide icon name
}

export const adminStats: AdminStat[] = [
  {
    label: 'Total Patients',
    value: '148',
    delta: '+12 this month',
    trend: 'up',
    icon: 'Users',
  },
  {
    label: 'Upcoming Sessions',
    value: '32',
    delta: '+5 vs last week',
    trend: 'up',
    icon: 'CalendarClock',
  },
  {
    label: 'Pending Appointments',
    value: '7',
    delta: '3 need review',
    trend: 'down',
    icon: 'Clock',
  },
  {
    label: 'Monthly Revenue',
    value: '₹2,84,500',
    delta: '+18% MoM',
    trend: 'up',
    icon: 'IndianRupee',
  },
]

export interface RevenuePoint {
  month: string
  revenue: number
  sessions: number
}

export const adminRevenueTrend: RevenuePoint[] = [
  { month: 'Oct', revenue: 198000, sessions: 96 },
  { month: 'Nov', revenue: 214000, sessions: 104 },
  { month: 'Dec', revenue: 187000, sessions: 88 },
  { month: 'Jan', revenue: 232000, sessions: 118 },
  { month: 'Feb', revenue: 241000, sessions: 122 },
  { month: 'Mar', revenue: 284500, sessions: 141 },
]

export interface SessionTypeSplit {
  name: string
  value: number
}

export const adminSessionSplit: SessionTypeSplit[] = [
  { name: 'Online', value: 92 },
  { name: 'In-Person', value: 49 },
]

export interface ActivityItem {
  id: string
  text: string
  time: string
  type: 'booking' | 'cancellation' | 'patient' | 'payment'
}

export const adminRecentActivity: ActivityItem[] = [
  { id: 'ac-1', text: 'Sanya Gupta booked a Panic Management session', time: '12 min ago', type: 'booking' },
  { id: 'ac-2', text: 'Payment of ₹2,000 received from Rahul Mehta', time: '48 min ago', type: 'payment' },
  { id: 'ac-3', text: 'Vikram Patel registered as a new patient', time: '2 hours ago', type: 'patient' },
  { id: 'ac-4', text: 'Emily Carter cancelled her follow-up session', time: '5 hours ago', type: 'cancellation' },
  { id: 'ac-5', text: 'Aisha Khan booked a Couples Counseling session', time: 'Yesterday', type: 'booking' },
]
