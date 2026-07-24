'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Calendar, CheckCircle2, XCircle, Clock3, Info, RotateCcw } from 'lucide-react'
import { useNotifications } from '@/lib/context/NotificationContext'
import type { AppNotification, NotificationType } from '@/lib/api/client'
import { useT } from '@/lib/i18n/useT'
import type { Language } from '@/lib/i18n/config'
import { translate } from '@/lib/i18n/index'

const ICONS: Record<NotificationType, typeof Calendar> = {
  appointment_booked: Calendar,
  appointment_confirmed: CheckCircle2,
  appointment_cancelled: XCircle,
  appointment_rescheduled: Clock3,
  general_admin: Info,
}

function timeAgo(iso: string, language: Language): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return translate(language, 'shared.justNow')
  if (minutes < 60) return translate(language, 'shared.minutesAgo', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return translate(language, 'shared.hoursAgo', { count: hours })
  const days = Math.round(hours / 24)
  return translate(language, 'shared.daysAgo', { count: days })
}

export default function NotificationBell() {
  const { t, language } = useT()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    const opening = !isOpen
    setIsOpen(opening)
    // Refresh on open so list is fresh
    if (opening) void refreshNotifications()
  }

  const handleNotificationClick = async (notification: AppNotification) => {
    await handleMarkRead(notification)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        aria-label={t('shared.notifications')}
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <h3 className="text-sm font-semibold text-foreground">{t('shared.notifications')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {t('shared.markAllRead')}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-2.5 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => void refreshNotifications()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <RotateCcw size={12} />
                {t('common.tryAgain')}
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={22} className="mx-auto text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">{t('shared.allCaughtUp')}</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const Icon = ICONS[notification.type] ?? Info
                return (
                  <li key={notification.id}>
                    <button
                      onClick={() => void handleNotificationClick(notification)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0 transition-colors hover:bg-muted ${
                        notification.isRead ? '' : 'bg-primary/5'
                      }`}
                    >
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5 text-pretty">
                          {notification.message}
                        </span>
                        <span className="block text-[11px] text-muted-foreground/70 mt-1">
                          {timeAgo(notification.createdAt, language)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
