// API layer.
// Auth functions call the real backend (Phase 1).
// Phase 2 adds real backend calls for patient profile, medical
// history, emergency contact, availability, and appointments.
// Admin dashboard stats/revenue/patient-list metrics remain mocked —
// out of scope for Phase 2 (payments/financial reporting).

import {
  patientMetrics,
  patientMoodTrend,
  patientMoodScore,
  adminStats,
  adminRevenueTrend,
  type Patient,
} from '@/lib/mock-data'

const LATENCY = 700

function delay<T>(data: T, ms: number = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'patient' | 'admin'
  avatarInitials: string
}

// ---------- Auth helpers ----------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001/api'

// Origin of the backend server (API_BASE without the trailing /api), used to
// resolve server-relative asset paths (e.g. uploaded payment screenshots)
// returned by the API, such as "/uploads/payment-proofs/xxx.jpg". Without
// this, the browser would resolve those paths against the frontend's own
// origin instead of the backend's, resulting in a broken image.
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

/**
 * Resolve a possibly server-relative asset URL (as returned by the backend,
 * e.g. payment.screenshotUrl) into an absolute URL pointing at the backend.
 * Absolute URLs (http/https) are returned unchanged.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

/** Store the access token in memory (avoids XSS risk of localStorage). */
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

/**
 * Core fetch wrapper for auth endpoints.
 * Throws an Error whose message is the backend's error message string.
 */
async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data: T; message?: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send/receive httpOnly refresh-token cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
    },
  })

  const json = await res.json().catch(() => ({ success: false, message: 'Invalid response' }))

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `Request failed (${res.status})`)
  }

  return json as { success: boolean; data: T; message?: string }
}

// ---------- Auth API functions ----------

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<{ user: AuthUser; accessToken: string }>> {
  const json = await authFetch<{ user: AuthUser; accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function signup(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<ApiResponse<{ user: AuthUser; accessToken: string }>> {
  const json = await authFetch<{ user: AuthUser; accessToken: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, confirmPassword }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: AuthUser }>> {
  const json = await authFetch<{ user: AuthUser }>('/auth/me')
  return { success: json.success, data: json.data, message: json.message }
}

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  const json = await authFetch<null>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  return { success: json.success, data: json.data ?? null, message: json.message }
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<ApiResponse<null>> {
  const json = await authFetch<null>(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ password, confirmPassword }),
  })
  return { success: json.success, data: json.data ?? null, message: json.message }
}

export async function logoutApi(): Promise<void> {
  try {
    await authFetch<null>('/auth/logout', { method: 'POST' })
  } catch {
    // Swallow errors — local state will still be cleared.
  }
}

/**
 * Try to get a new access token using the httpOnly refresh-token cookie.
 * Returns the new access token string, or null if refresh fails.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const json = await authFetch<{ user: AuthUser; accessToken: string }>('/auth/refresh', { method: 'POST' })
    return json.data.accessToken ?? null
  } catch {
    return null
  }
}

// ---------- Authenticated fetch helper (shared by Phase 2 modules) ----------
// Same contract as authFetch but exported under a clearer name for
// non-auth modules, since "authFetch" elsewhere in this file is auth-
// specific by convention. Behavior is identical.
const apiFetch = authFetch

// ---------- Patient profile ----------

export interface PatientProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: 'patient' | 'admin'
  avatarInitials: string
  status: 'active' | 'inactive' | 'new'
  joinedDate: string
  primaryConcern: string | null
}

export async function getMyProfile(): Promise<ApiResponse<{ profile: PatientProfile }>> {
  const json = await apiFetch<{ profile: PatientProfile }>('/patient/me')
  return { success: json.success, data: json.data, message: json.message }
}

export async function updateMyProfile(payload: {
  name?: string
  email?: string
  phone?: string
  primaryConcern?: string
}): Promise<ApiResponse<{ profile: PatientProfile }>> {
  const json = await apiFetch<{ profile: PatientProfile }>('/patient/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getAdminPatientList(): Promise<ApiResponse<{ patients: PatientProfile[] }>> {
  const json = await apiFetch<{ patients: PatientProfile[] }>('/patient/admin')
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Medical history ----------

export interface MedicalHistory {
  conditions: string[]
  medications: string[]
  allergies: string[]
}

export async function getMyMedicalHistory(): Promise<ApiResponse<{ medicalHistory: MedicalHistory }>> {
  const json = await apiFetch<{ medicalHistory: MedicalHistory }>('/medical-history/me')
  return { success: json.success, data: json.data, message: json.message }
}

export async function saveMyMedicalHistory(
  payload: Partial<MedicalHistory>,
): Promise<ApiResponse<{ medicalHistory: MedicalHistory }>> {
  const json = await apiFetch<{ medicalHistory: MedicalHistory }>('/medical-history/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getPatientMedicalHistoryForAdmin(
  patientId: string,
): Promise<ApiResponse<{ medicalHistory: MedicalHistory }>> {
  const json = await apiFetch<{ medicalHistory: MedicalHistory }>(
    `/medical-history/admin/${patientId}`,
  )
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Emergency contact ----------

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email: string | null
}

export async function getMyEmergencyContact(): Promise<ApiResponse<{ emergencyContact: EmergencyContact | null }>> {
  const json = await apiFetch<{ emergencyContact: EmergencyContact | null }>('/emergency-contact/me')
  return { success: json.success, data: json.data, message: json.message }
}

export async function saveMyEmergencyContact(
  payload: EmergencyContact,
): Promise<ApiResponse<{ emergencyContact: EmergencyContact }>> {
  const json = await apiFetch<{ emergencyContact: EmergencyContact }>('/emergency-contact/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getPatientEmergencyContactForAdmin(
  patientId: string,
): Promise<ApiResponse<{ emergencyContact: EmergencyContact | null }>> {
  const json = await apiFetch<{ emergencyContact: EmergencyContact | null }>(
    `/emergency-contact/admin/${patientId}`,
  )
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Availability (admin) ----------

export interface TimeSlot {
  id: string
  start: string
  end: string
  enabled: boolean
}

export interface DayAvailability {
  day: string
  short: string
  dayOfWeek: string
  isWorking: boolean
  slots: TimeSlot[]
}

export interface BlockedDate {
  id: string
  date: string
  label: string
}

export async function getWeeklyAvailability(): Promise<ApiResponse<{ week: DayAvailability[] }>> {
  const json = await apiFetch<{ week: DayAvailability[] }>('/availability')
  return { success: json.success, data: json.data, message: json.message }
}

// `slots` should be the FULL desired list of weekly slots (existing
// ones carrying their `id`, new ones without one) — the backend
// reconciles creates/updates/deletes from this single list in one call.
export async function saveWeeklyAvailability(
  slots: { id?: string; dayOfWeek: string; startTime: string; endTime: string; isEnabled: boolean }[],
): Promise<ApiResponse<{ week: DayAvailability[] }>> {
  const json = await apiFetch<{ week: DayAvailability[] }>('/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getBlockedDates(): Promise<ApiResponse<{ blockedDates: BlockedDate[] }>> {
  const json = await apiFetch<{ blockedDates: BlockedDate[] }>('/availability/blocked-dates')
  return { success: json.success, data: json.data, message: json.message }
}

export async function addBlockedDate(
  date: string,
  label?: string,
): Promise<ApiResponse<{ blockedDate: BlockedDate }>> {
  const json = await apiFetch<{ blockedDate: BlockedDate }>('/availability/blocked-dates', {
    method: 'POST',
    body: JSON.stringify({ date, label }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function removeBlockedDate(id: string): Promise<ApiResponse<null>> {
  const json = await apiFetch<null>(`/availability/blocked-dates/${id}`, { method: 'DELETE' })
  return { success: json.success, data: json.data ?? null, message: json.message }
}

// Public — no auth required, used by the booking page's date/time pickers.
export async function getAvailableSlots(
  from: string,
  to: string,
): Promise<ApiResponse<{ slots: { date: string; start: string; end: string }[] }>> {
  const res = await fetch(
    `${API_BASE}/availability/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  )
  const json = await res.json().catch(() => ({ success: false, message: 'Invalid response' }))
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `Request failed (${res.status})`)
  }
  return json
}

// ---------- Appointments ----------

export type AppointmentStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled'
export type SessionType = 'online' | 'offline'

export interface Appointment {
  id: string
  patientId: string | null
  patientName: string
  patientInitials: string
  service: string
  therapist: string
  date: string
  day: string
  month: string
  dateTime: string
  time: string
  type: SessionType
  status: AppointmentStatus
  notes?: string
  guestEmail?: string | null
  guestPhone?: string | null
  isGuest: boolean
}

export interface BookAppointmentPayload {
  service: string
  date: string // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  mode: SessionType
  notes?: string
  // Guest-only — omit when the logged-in patient's token will be sent.
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

/**
 * Books an appointment. Works for both the public guest booking page
 * (no access token sent) and a logged-in patient's "new appointment"
 * flow (token attached automatically by authFetch if present) — the
 * backend links it to the patient when a valid token is included.
 */
export async function bookAppointment(
  payload: BookAppointmentPayload,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>('/appointments/book', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getMyAppointments(): Promise<ApiResponse<{ appointments: Appointment[] }>> {
  const json = await apiFetch<{ appointments: Appointment[] }>('/appointments/me')
  return { success: json.success, data: json.data, message: json.message }
}

export async function cancelAppointment(
  id: string,
  reason?: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  startTime: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ date, startTime }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Appointments (admin) ----------

export async function getAdminAppointments(
  status?: AppointmentStatus,
): Promise<ApiResponse<{ appointments: Appointment[] }>> {
  const query = status ? `?status=${status}` : ''
  const json = await apiFetch<{ appointments: Appointment[] }>(`/appointments/admin${query}`)
  return { success: json.success, data: json.data, message: json.message }
}

export async function confirmAppointmentAsAdmin(
  id: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/admin/${id}/confirm`, {
    method: 'POST',
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function markAppointmentComplete(
  id: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/admin/${id}/complete`, {
    method: 'POST',
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function cancelAppointmentAsAdmin(
  id: string,
  reason?: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/admin/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function rescheduleAppointmentAsAdmin(
  id: string,
  date: string,
  startTime: string,
): Promise<ApiResponse<{ appointment: Appointment }>> {
  const json = await apiFetch<{ appointment: Appointment }>(`/appointments/admin/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ date, startTime }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Notifications ----------

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'general_admin'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  relatedAppointmentId: string | null
  isRead: boolean
  createdAt: string
}

export async function getMyNotifications(): Promise<
  ApiResponse<{ notifications: AppNotification[]; unreadCount: number }>
> {
  const json = await apiFetch<{ notifications: AppNotification[]; unreadCount: number }>(
    '/notifications',
  )
  return { success: json.success, data: json.data, message: json.message }
}

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  const json = await apiFetch<{ count: number }>('/notifications/unread-count')
  return { success: json.success, data: json.data, message: json.message }
}

export async function markNotificationRead(
  id: string,
): Promise<ApiResponse<{ notification: AppNotification }>> {
  const json = await apiFetch<{ notification: AppNotification }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function markAllNotificationsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
  const json = await apiFetch<{ updatedCount: number }>('/notifications/read-all', {
    method: 'PATCH',
  })
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- AI Wellness Assistant (Phase 4.2) ----------
// Stateless — no conversation id, no history sent/stored server-side.
// The page keeps the chat history in component state only.

export async function sendWellnessChatMessage(
  message: string,
): Promise<ApiResponse<{ reply: string }>> {
  const json = await apiFetch<{ reply: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Resource Library (Phase 4.3) ----------

export type ResourceCategory = 'worksheet' | 'meditation' | 'exercise' | 'guide' | 'pdf'

export interface Resource {
  id: string
  title: string
  description: string | null
  category: ResourceCategory
  fileUrl: string
  fileName: string
  uploadedBy: string
  uploadedByName: string
  createdAt: string
}

export interface CreateResourceInput {
  title: string
  description?: string
  category: ResourceCategory
  fileUrl: string
  fileName: string
}

export type UpdateResourceInput = Partial<CreateResourceInput>

function resourceQueryString(params?: { search?: string; category?: ResourceCategory | 'all' }) {
  if (!params) return ''
  const usp = new URLSearchParams()
  if (params.search?.trim()) usp.set('search', params.search.trim())
  if (params.category && params.category !== 'all') usp.set('category', params.category)
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

// Patient

export async function getResources(params?: {
  search?: string
  category?: ResourceCategory | 'all'
}): Promise<ApiResponse<{ resources: Resource[] }>> {
  const json = await apiFetch<{ resources: Resource[] }>(`/resources${resourceQueryString(params)}`)
  return { success: json.success, data: json.data, message: json.message }
}

export async function getResourceById(id: string): Promise<ApiResponse<{ resource: Resource }>> {
  const json = await apiFetch<{ resource: Resource }>(`/resources/${id}`)
  return { success: json.success, data: json.data, message: json.message }
}

// Admin

export async function getAdminResources(params?: {
  search?: string
  category?: ResourceCategory | 'all'
}): Promise<ApiResponse<{ resources: Resource[] }>> {
  const json = await apiFetch<{ resources: Resource[] }>(
    `/resources/admin${resourceQueryString(params)}`,
  )
  return { success: json.success, data: json.data, message: json.message }
}

export async function createResource(
  input: CreateResourceInput,
): Promise<ApiResponse<{ resource: Resource }>> {
  const json = await apiFetch<{ resource: Resource }>('/resources', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function updateResource(
  id: string,
  input: UpdateResourceInput,
): Promise<ApiResponse<{ resource: Resource }>> {
  const json = await apiFetch<{ resource: Resource }>(`/resources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function deleteResource(id: string): Promise<ApiResponse<null>> {
  const json = await apiFetch<null>(`/resources/${id}`, { method: 'DELETE' })
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Session Notes (Phase 4.4) ----------

export interface SessionNote {
  id: string
  appointmentId: string
  therapistId: string
  therapistName: string
  patientId: string
  patientName: string
  diagnosisSummary: string | null
  observations: string | null
  recommendations: string | null
  homework: string | null
  nextGoals: string | null
  createdAt: string
  updatedAt: string
}

// Returned by GET /my-session-notes — adds the handful of appointment
// fields the patient's notes cards need, so that page doesn't have to
// cross-reference /appointments/me separately.
export interface SessionNoteWithAppointment extends SessionNote {
  appointmentService: string
  appointmentDate: string
  appointmentTime: string
}

export interface SessionNoteFormInput {
  diagnosisSummary?: string
  observations?: string
  recommendations?: string
  homework?: string
  nextGoals?: string
}

// Admin

export async function createSessionNote(
  appointmentId: string,
  input: SessionNoteFormInput,
): Promise<ApiResponse<{ sessionNote: SessionNote }>> {
  const json = await apiFetch<{ sessionNote: SessionNote }>('/session-notes', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, ...input }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function updateSessionNote(
  id: string,
  input: SessionNoteFormInput,
): Promise<ApiResponse<{ sessionNote: SessionNote }>> {
  const json = await apiFetch<{ sessionNote: SessionNote }>(`/session-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getSessionNoteByAppointmentId(
  appointmentId: string,
): Promise<ApiResponse<{ sessionNote: SessionNote | null }>> {
  const json = await apiFetch<{ sessionNote: SessionNote | null }>(`/session-notes/${appointmentId}`)
  return { success: json.success, data: json.data, message: json.message }
}

// Patient

export async function getMySessionNotes(): Promise<
  ApiResponse<{ sessionNotes: SessionNoteWithAppointment[] }>
> {
  const json = await apiFetch<{ sessionNotes: SessionNoteWithAppointment[] }>('/my-session-notes')
  return { success: json.success, data: json.data, message: json.message }
}

// ---------- Dashboard Analytics (Phase 4.5) ----------

export interface MonthlyPoint {
  month: string
  count: number
}

export interface AppointmentStatusBreakdown {
  pending: number
  upcoming: number
  completed: number
  cancelled: number
}

export interface ServiceWorkload {
  service: string
  count: number
}

export interface TherapistWorkload {
  therapistId: string
  therapistName: string
  totalSessions: number
  completedSessions: number
  pendingSessions: number
}

export interface AdminAnalytics {
  totalPatients: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  appointmentsPerMonth: MonthlyPoint[]
  patientRegistrationsPerMonth: MonthlyPoint[]
  appointmentStatusBreakdown: AppointmentStatusBreakdown
  mostBookedServices: ServiceWorkload[]
  therapistWorkload: TherapistWorkload[]
}

export interface RecentAppointmentItem {
  id: string
  service: string
  date: string
  time: string
  status: string
  mode: string
}

export interface LatestSessionNoteItem {
  id: string
  appointmentId: string
  appointmentService: string
  appointmentDate: string
  diagnosisSummary: string | null
  observations: string | null
  recommendations: string | null
  createdAt: string
}

export interface PatientAnalytics {
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  upcomingSessions: number
  recentAppointments: RecentAppointmentItem[]
  latestSessionNote: LatestSessionNoteItem | null
  notificationCount: number
  resourceCount: number
}

export async function getAdminAnalytics(): Promise<ApiResponse<{ analytics: AdminAnalytics }>> {
  const json = await apiFetch<{ analytics: AdminAnalytics }>('/dashboard/admin/analytics')
  return { success: json.success, data: json.data, message: json.message }
}

export async function getPatientAnalytics(): Promise<ApiResponse<{ analytics: PatientAnalytics }>> {
  const json = await apiFetch<{ analytics: PatientAnalytics }>('/dashboard/patient/analytics')
  return { success: json.success, data: json.data, message: json.message }
}
// and the patient directory are out of scope for Phase 2. appointments
// now comes from the real backend so "pending" counts etc. are accurate.

export interface PatientDashboardData {
  metrics: typeof patientMetrics
  moodTrend: typeof patientMoodTrend
  moodScore: number
  appointments: Appointment[]
}

export interface AdminDashboardData {
  stats: typeof adminStats
  revenueTrend: typeof adminRevenueTrend
  patients: Patient[]
  appointments: Appointment[]
}

export async function getDashboardData(
  role: 'patient' | 'admin' = 'patient',
): Promise<ApiResponse<PatientDashboardData | AdminDashboardData>> {
  if (role === 'admin') {
    const [statsAndRevenue, appointmentsRes] = await Promise.all([
      delay({ stats: adminStats, revenueTrend: adminRevenueTrend, patients: [] as Patient[] }),
      getAdminAppointments().catch(() => ({ data: { appointments: [] as Appointment[] } })),
    ])
    return {
      success: true,
      data: {
        ...statsAndRevenue,
        appointments: appointmentsRes.data.appointments,
      } as AdminDashboardData,
    }
  }

  const [metricsEtc, appointmentsRes] = await Promise.all([
    delay({ metrics: patientMetrics, moodTrend: patientMoodTrend, moodScore: patientMoodScore }),
    getMyAppointments().catch(() => ({ data: { appointments: [] as Appointment[] } })),
  ])
  return {
    success: true,
    data: {
      ...metricsEtc,
      appointments: appointmentsRes.data.appointments,
    } as PatientDashboardData,
  }
}

// ---------- Reports & PDF Export (Phase 4.6) ----------

/**
 * Downloads a PDF blob from a report endpoint and triggers a browser download.
 * All three report routes share the same blob-fetch pattern; only the path differs.
 */
async function downloadPDF(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({ message: `Request failed (${res.status})` }))
    throw new Error(json.message ?? `Request failed (${res.status})`)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Patient: download my own full report PDF. */
export async function downloadMyReport(): Promise<void> {
  await downloadPDF('/reports/my-report/pdf', 'my-report.pdf')
}

/** Admin: download a single patient's report PDF. */
export async function downloadPatientReport(patientId: string, patientName?: string): Promise<void> {
  const name = patientName ? patientName.replace(/\s+/g, '-').toLowerCase() : patientId
  await downloadPDF(`/reports/patient/${patientId}/pdf`, `patient-report-${name}.pdf`)
}

/** Admin: download all-appointments report PDF. */
export async function downloadAppointmentsReport(): Promise<void> {
  await downloadPDF('/reports/appointments/pdf', `appointments-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ---------- Payments (Phase 4.8) ----------

export type PaymentStatus = 'pending' | 'verified' | 'rejected'

export interface Payment {
  id: string
  appointmentId: string
  status: PaymentStatus
  screenshotUrl: string | null
  transactionReference: string | null
  remarks: string | null
  verifiedById: string | null
  verifiedByName: string | null
  verifiedAt: string | null
  createdAt: string
}

export interface AdminPayment extends Payment {
  patientName: string
  service: string
  date: string
}

export interface PaymentSettings {
  clinicName: string
  upiId: string
  qrImageUrl: string | null
  paymentInstructions: string | null
}

export async function getPaymentForAppointment(
  appointmentId: string,
): Promise<ApiResponse<{ payment: Payment }>> {
  const json = await apiFetch<{ payment: Payment }>(`/payments/appointment/${appointmentId}`)
  return { success: json.success, data: json.data, message: json.message }
}

/**
 * Upload payment proof image as multipart/form-data.
 * Replaces the old base64 submitPayment function.
 */
export async function uploadPaymentProof(
  appointmentId: string,
  screenshotFile: File,
  transactionReference?: string,
): Promise<ApiResponse<{ payment: Payment }>> {
  const formData = new FormData()
  formData.append('screenshot', screenshotFile)
  if (transactionReference) {
    formData.append('transactionReference', transactionReference)
  }

  // Use fetch directly — apiFetch sets Content-Type to JSON by default
  const res = await fetch(
    `${API_BASE}/payments/appointment/${appointmentId}/submit`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
        // Do NOT set Content-Type — browser sets it automatically with boundary for FormData
      },
      body: formData,
    },
  )

  const json = await res.json() as { success: boolean; data: { payment: Payment }; message?: string }
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? 'Failed to upload payment proof')
  }
  return { success: json.success, data: json.data, message: json.message }
}

/** @deprecated Use uploadPaymentProof instead */
export async function submitPayment(
  appointmentId: string,
  payload: { screenshotUrl: string; transactionReference?: string },
): Promise<ApiResponse<{ payment: Payment }>> {
  const json = await apiFetch<{ payment: Payment }>(`/payments/appointment/${appointmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function getPaymentSettings(): Promise<ApiResponse<{ settings: PaymentSettings }>> {
  const json = await apiFetch<{ settings: PaymentSettings }>('/payments/settings')
  return { success: json.success, data: json.data, message: json.message }
}

export async function updatePaymentSettings(
  payload: Partial<PaymentSettings>,
): Promise<ApiResponse<{ settings: PaymentSettings }>> {
  const json = await apiFetch<{ settings: PaymentSettings }>('/payments/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export interface RazorpayOrderResponse {
  orderId: string
  amount: number
  currency: string
  keyId: string
  clinicName: string
  description: string
  prefill: {
    name: string
    email: string
    phone: string
  }
}

export async function createRazorpayOrder(
  appointmentId: string,
): Promise<ApiResponse<{ order: RazorpayOrderResponse }>> {
  const json = await apiFetch<{ order: RazorpayOrderResponse }>(
    `/payments/appointment/${appointmentId}/razorpay/create-order`,
    { method: 'POST' },
  )
  return { success: json.success, data: json.data, message: json.message }
}

export async function verifyRazorpayPayment(
  appointmentId: string,
  payload: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  },
): Promise<ApiResponse<{ payment: Payment }>> {
  const json = await apiFetch<{ payment: Payment }>(
    `/payments/appointment/${appointmentId}/razorpay/verify`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  return { success: json.success, data: json.data, message: json.message }
}

export async function getAdminPayments(): Promise<ApiResponse<{ payments: AdminPayment[] }>> {
  const json = await apiFetch<{ payments: AdminPayment[] }>('/payments/admin')
  return { success: json.success, data: json.data, message: json.message }
}

export async function verifyPayment(
  paymentId: string,
  remarks?: string,
): Promise<ApiResponse<{ payment: Payment }>> {
  const json = await apiFetch<{ payment: Payment }>(`/payments/admin/${paymentId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  })
  return { success: json.success, data: json.data, message: json.message }
}

export async function rejectPayment(
  paymentId: string,
  remarks: string,
): Promise<ApiResponse<{ payment: Payment }>> {
  const json = await apiFetch<{ payment: Payment }>(`/payments/admin/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  })
  return { success: json.success, data: json.data, message: json.message }
}
