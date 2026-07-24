// DTOs for Phase 4.5 Dashboard Analytics

export interface MonthlyPoint {
  month: string; // e.g. "Jan 2025"
  count: number;
}

export interface ServiceWorkload {
  service: string;
  count: number;
}

export interface TherapistWorkload {
  therapistId: string;
  therapistName: string;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
}

export interface AppointmentStatusBreakdown {
  pending: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

// ---------- Admin ----------

export interface AdminAnalyticsDTO {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number; // upcoming
  appointmentsPerMonth: MonthlyPoint[];
  patientRegistrationsPerMonth: MonthlyPoint[];
  appointmentStatusBreakdown: AppointmentStatusBreakdown;
  mostBookedServices: ServiceWorkload[];
  therapistWorkload: TherapistWorkload[];
}

// ---------- Patient ----------

export interface RecentAppointmentDTO {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  mode: string;
}

export interface LatestSessionNoteDTO {
  id: string;
  appointmentId: string;
  appointmentService: string;
  appointmentDate: string;
  diagnosisSummary: string | null;
  observations: string | null;
  recommendations: string | null;
  createdAt: string;
}

export interface PatientAnalyticsDTO {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  upcomingSessions: number;
  recentAppointments: RecentAppointmentDTO[];
  latestSessionNote: LatestSessionNoteDTO | null;
  notificationCount: number;
  resourceCount: number;
}
