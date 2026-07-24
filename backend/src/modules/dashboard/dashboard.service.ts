import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  AdminAnalyticsDTO,
  PatientAnalyticsDTO,
  MonthlyPoint,
  AppointmentStatusBreakdown,
  ServiceWorkload,
  TherapistWorkload,
  RecentAppointmentDTO,
  LatestSessionNoteDTO,
} from '@/modules/dashboard/dashboard.types';

// Returns "Jan 2025" label for a given Date
function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

// Builds a full 12-month spine (newest month last) so charts always
// show all 12 ticks even when some months have zero data.
function buildMonthSpine(): { label: string; date: Date }[] {
  const spine: { label: string; date: Date }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    spine.push({ label: monthLabel(d), date: d });
  }
  return spine;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

async function getAdminAnalytics(): Promise<AdminAnalyticsDTO> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    totalAppointments,
    statusCounts,
    appointmentsByMonth,
    patientsByMonth,
    serviceGroups,
    adminUser,
  ] = await Promise.all([
    // total patients
    prisma.patient.count(),

    // total appointments
    prisma.appointment.count(),

    // status breakdown
    prisma.appointment.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    // appointments per month (last 12 months)
    prisma.appointment.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),

    // patient registrations per month (last 12 months)
    prisma.patient.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),

    // most booked services
    prisma.appointment.groupBy({
      by: ['service'],
      _count: { _all: true },
      orderBy: { _count: { service: 'desc' } },
      take: 5,
    }),

    // find admin user(s) for therapist workload
    prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, name: true },
    }),
  ]);

  // Build status breakdown
  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = row._count._all;
  }
  const appointmentStatusBreakdown: AppointmentStatusBreakdown = {
    pending: statusMap[AppointmentStatus.pending] ?? 0,
    upcoming: statusMap[AppointmentStatus.upcoming] ?? 0,
    completed: statusMap[AppointmentStatus.completed] ?? 0,
    cancelled: statusMap[AppointmentStatus.cancelled] ?? 0,
  };

  // Build monthly spine and fill counts
  const spine = buildMonthSpine();

  const apptMonthMap: Record<string, number> = {};
  for (const a of appointmentsByMonth) {
    const label = monthLabel(a.createdAt);
    apptMonthMap[label] = (apptMonthMap[label] ?? 0) + 1;
  }

  const patientMonthMap: Record<string, number> = {};
  for (const p of patientsByMonth) {
    const label = monthLabel(p.createdAt);
    patientMonthMap[label] = (patientMonthMap[label] ?? 0) + 1;
  }

  const appointmentsPerMonth: MonthlyPoint[] = spine.map((s) => ({
    month: s.label,
    count: apptMonthMap[s.label] ?? 0,
  }));

  const patientRegistrationsPerMonth: MonthlyPoint[] = spine.map((s) => ({
    month: s.label,
    count: patientMonthMap[s.label] ?? 0,
  }));

  // Most booked services
  const mostBookedServices: ServiceWorkload[] = serviceGroups.map((g: { service: string; _count: { _all: number } }) => ({
    service: g.service,
    count: g._count._all,
  }));

  // Therapist workload — in this single-practitioner practice, admin
  // users are the therapists. We derive workload from appointments
  // linked to the admin (via session notes they authored, or by total
  // since there's only one therapist).
  const therapistWorkload: TherapistWorkload[] = await Promise.all(
    adminUser.map(async (therapist: { id: string; name: string }) => {
      const [completed, pending] = await Promise.all([
        prisma.sessionNote.count({ where: { therapistId: therapist.id } }),
        prisma.appointment.count({
          where: { status: { in: [AppointmentStatus.pending, AppointmentStatus.upcoming] } },
        }),
      ]);
      return {
        therapistId: therapist.id,
        therapistName: therapist.name,
        totalSessions: completed + pending,
        completedSessions: completed,
        pendingSessions: pending,
      };
    }),
  );

  return {
    totalPatients,
    totalAppointments,
    completedAppointments: appointmentStatusBreakdown.completed,
    cancelledAppointments: appointmentStatusBreakdown.cancelled,
    pendingAppointments: appointmentStatusBreakdown.pending,
    confirmedAppointments: appointmentStatusBreakdown.upcoming,
    appointmentsPerMonth,
    patientRegistrationsPerMonth,
    appointmentStatusBreakdown,
    mostBookedServices,
    therapistWorkload,
  };
}

async function getPatientAnalytics(userId: string): Promise<PatientAnalyticsDTO> {
  // Resolve patient row from userId
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!patient) {
    // Return zeroed analytics for edge-case where patient row doesn't exist
    return {
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      upcomingSessions: 0,
      recentAppointments: [],
      latestSessionNote: null,
      notificationCount: 0,
      resourceCount: 0,
    };
  }

  const patientId = patient.id;

  const [
    statusCounts,
    recentAppointmentsRaw,
    latestNoteRaw,
    notificationCount,
    resourceCount,
  ] = await Promise.all([
    // appointment status counts
    prisma.appointment.groupBy({
      by: ['status'],
      where: { patientId },
      _count: { _all: true },
    }),

    // 5 most recent appointments
    prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        service: true,
        date: true,
        startTime: true,
        status: true,
        mode: true,
      },
    }),

    // latest session note
    prisma.sessionNote.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: {
          select: { service: true, date: true },
        },
      },
    }),

    // unread notifications
    prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }),

    // total resources available
    prisma.resource.count(),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = row._count._all;
  }

  const completedSessions = statusMap[AppointmentStatus.completed] ?? 0;
  const cancelledSessions = statusMap[AppointmentStatus.cancelled] ?? 0;
  const upcomingSessions =
    (statusMap[AppointmentStatus.upcoming] ?? 0) + (statusMap[AppointmentStatus.pending] ?? 0);
  const totalSessions = completedSessions + cancelledSessions + upcomingSessions;

  const recentAppointments: RecentAppointmentDTO[] = recentAppointmentsRaw.map((a: { id: string; service: string; date: Date; startTime: string; status: string; mode: string }) => ({
    id: a.id,
    service: a.service,
    date: formatDateLabel(a.date),
    time: formatTime(a.startTime),
    status: a.status,
    mode: a.mode,
  }));

  let latestSessionNote: LatestSessionNoteDTO | null = null;
  if (latestNoteRaw) {
    latestSessionNote = {
      id: latestNoteRaw.id,
      appointmentId: latestNoteRaw.appointmentId,
      appointmentService: latestNoteRaw.appointment.service,
      appointmentDate: formatDateLabel(latestNoteRaw.appointment.date),
      diagnosisSummary: latestNoteRaw.diagnosisSummary,
      observations: latestNoteRaw.observations,
      recommendations: latestNoteRaw.recommendations,
      createdAt: latestNoteRaw.createdAt.toISOString(),
    };
  }

  return {
    totalSessions,
    completedSessions,
    cancelledSessions,
    upcomingSessions,
    recentAppointments,
    latestSessionNote,
    notificationCount,
    resourceCount,
  };
}

export const dashboardService = {
  getAdminAnalytics,
  getPatientAnalytics,
};
