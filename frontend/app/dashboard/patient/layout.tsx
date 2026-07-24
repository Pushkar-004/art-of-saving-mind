'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Calendar,
  SmilePlus,
  BookOpen,
  Lightbulb,
  Download,
  History,
  NotebookText,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import NotificationBell from '@/components/shared/NotificationBell'
import { useAuth } from '@/lib/context/AuthContext'
import { NotificationProvider } from '@/lib/context/NotificationContext'
import { currentPatient } from '@/lib/mock-data'
import { useT } from '@/lib/i18n/useT'

function getNavItems(t: (key: string) => string) {
  return [
    { href: '/dashboard/patient', label: t('sidebar.patientOverview'), icon: Home },
    { href: '/dashboard/patient/appointments', label: t('sidebar.appointments'), icon: Calendar },
    { href: '/dashboard/patient/mood-tracker', label: t('sidebar.moodTracker'), icon: SmilePlus },
    { href: '/dashboard/patient/journal', label: t('sidebar.journal'), icon: BookOpen },
    { href: '/dashboard/patient/wellness-assistant', label: t('sidebar.wellnessAssistant'), icon: Lightbulb },
    { href: '/dashboard/patient/resources', label: t('sidebar.resources'), icon: Download },
    { href: '/dashboard/patient/session-history', label: t('sidebar.sessionHistory'), icon: History },
    { href: '/dashboard/patient/session-notes', label: t('sidebar.sessionNotes'), icon: NotebookText },
  ]
}

export default function PatientDashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoading, isAuthenticated } = useAuth()
  const { t } = useT()
  const navItems = getNavItems(t)

  // Redirect unauthenticated users to login; bounce admins to their own dashboard.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (!isLoading && isAuthenticated && user?.role !== 'patient') {
      router.push('/dashboard/admin')
    }
  }, [isLoading, isAuthenticated, user, router])

  // Fall back to the mock patient so the demo always shows a real identity.
  const displayName = user?.name ?? currentPatient.name
  const initials = user?.avatarInitials ?? currentPatient.avatarInitials
  const firstName = displayName.split(' ')[0]

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (isLoading) return null

  return (
    <NotificationProvider>
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        className={`fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-screen w-64 bg-background border-r border-border/50 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-300`}
      >
        <nav className="p-6 space-y-2 h-full flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard/patient'
                ? pathname === item.href
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Actions */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <Link
              href="/dashboard/patient/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all group"
            >
              <Settings size={20} className="group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{t('sidebar.settings')}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
            >
              <LogOut size={20} className="group-hover:text-destructive transition-colors" />
              <span className="text-sm font-medium">{t('sidebar.logout')}</span>
            </button>
          </div>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg hover:bg-muted p-2"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">{t('sidebar.patientDashboardTitle')}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{firstName}</p>
                <p className="text-xs text-muted-foreground">{t('sidebar.patientRole')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    </NotificationProvider>
  )
}
