'use client'

/**
 * NotificationContext (Phase N6)
 *
 * Provides a shared notification state and a `refreshNotifications()`
 * function that any component can call after an action that generates
 * a new notification (booking, approve, reject, payment, logout/login).
 *
 * There is NO polling — notifications are refreshed only on demand,
 * which keeps the network quiet and avoids stale-count flickering.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead, type AppNotification } from '@/lib/api/client'

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  /** Call this after any action that may produce notifications. */
  refreshNotifications: () => Promise<void>
  handleMarkRead: (notification: AppNotification) => Promise<void>
  handleMarkAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await getMyNotifications()
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load once on mount (covers login/page refresh).
  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const handleMarkRead = useCallback(async (notification: AppNotification) => {
    if (notification.isRead) return
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await markNotificationRead(notification.id)
    } catch {
      // Roll back on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)),
      )
      setUnreadCount((prev) => prev + 1)
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0 || isMarkingAll) return
    setIsMarkingAll(true)
    const previous = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      setNotifications(previous)
      setUnreadCount(previous.filter((n) => !n.isRead).length)
    } finally {
      setIsMarkingAll(false)
    }
  }, [unreadCount, isMarkingAll, notifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refreshNotifications,
        handleMarkRead,
        handleMarkAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
