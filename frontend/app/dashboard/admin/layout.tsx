'use client'

import { ReactNode, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Clock,
  Library,
  NotebookPen,
  CreditCard,
  Settings2,
  Stethoscope,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import NotificationBell from '@/components/shared/NotificationBell'
import { useAuth } from '@/lib/context/AuthContext'
import { NotificationProvider } from '@/lib/context/NotificationContext'
import { useT } from '@/lib/i18n/useT'

function getNavItems(t: (key: string) => string) {
  return [
    { href: '/dashboard/admin', label: t('sidebar.adminOverview'), icon: LayoutDashboard },
    { href: '/dashboard/admin/appointments', label: t('sidebar.adminAppointments'), icon: CalendarCheck },
    { href: '/dashboard/admin/patients', label: t('sidebar.patients'), icon: Users },
    { href: '/dashboard/admin/psychologists', label: 'Psychologists', icon: Stethoscope },
    { href: '/dashboard/admin/availability', label: t('sidebar.availability'), icon: Clock },
    { href: '/dashboard/admin/resources', label: t('sidebar.adminResources'), icon: Library },
    { href: '/dashboard/admin/session-notes', label: t('sidebar.adminSessionNotes'), icon: NotebookPen },
    { href: '/dashboard/admin/payments', label: t('sidebar.payments'), icon: CreditCard },
    { href: '/dashboard/admin/payment-settings', label: t('sidebar.paymentSettings'), icon: Settings2 },
  ]
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading, isAuthenticated } = useAuth()
  const { t } = useT()
  const navItems = getNavItems(t)

  // Redirect unauthenticated users to login, and bounce non-admins
  // away — the appointments/patients/availability pages behind this
  // layout now call admin-only backend routes, so a logged-in patient
  // landing here would otherwise just see failed requests.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      router.push(user?.role === 'psychologist' ? '/dashboard/psychologist' : '/dashboard/patient')
    }
  }, [isLoading, isAuthenticated, user, router])

  const displayName = user?.role === 'admin' ? user.name : 'Miss. Pooja Sunil Ghadge'
  const initials = user?.role === 'admin' ? user.avatarInitials : 'PG'

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
          <div className="mb-2 px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('sidebar.adminPanel')}
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard/admin'
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

          <div className="flex-1" />

          <div className="space-y-2 pt-4 border-t border-border/50">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg hover:bg-muted p-2"
              aria-label={t('sidebar.toggleSidebar')}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {t('sidebar.adminDashboardTitle')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="w-10 h-10 rounded-full overflow-hidden relative border border-primary/20 bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                <Image src="/pooja-profile.jpg" alt={displayName} fill className="object-cover object-center" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{t('sidebar.administratorRole')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
    </NotificationProvider>
  )
}
