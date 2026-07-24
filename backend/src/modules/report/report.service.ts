import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { PatientReportData, AppointmentReportData } from './report.types';

// ─── Data fetchers ────────────────────────────────────────────────

async function getPatientReportData(patientId: string): Promise<PatientReportData> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: true,
      medicalHistory: true,
      appointments: {
        orderBy: { date: 'desc' },
      },
      sessionNotes: {
        include: {
          appointment: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) throw AppError.notFound('Patient not found');

  return {
    profile: {
      id: patient.id,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      primaryConcern: patient.primaryConcern,
      status: patient.status,
      joinedDate: patient.joinedDate.toISOString(),
      language: patient.user.language,
    },
    medicalHistory: patient.medicalHistory
      ? {
          conditions: (patient.medicalHistory.conditions as string[]) ?? [],
          medications: (patient.medicalHistory.medications as string[]) ?? [],
          allergies: (patient.medicalHistory.allergies as string[]) ?? [],
        }
      : null,
    appointments: patient.appointments.map((a) => ({
      id: a.id,
      service: a.service,
      date: a.date.toISOString().split('T')[0],
      startTime: a.startTime,
      endTime: a.endTime,
      mode: a.mode,
      status: a.status,
    })),
    sessionNotes: patient.sessionNotes.map((n) => ({
      id: n.id,
      appointmentService: n.appointment.service,
      appointmentDate: n.appointment.date.toISOString().split('T')[0],
      diagnosisSummary: n.diagnosisSummary,
      observations: n.observations,
      recommendations: n.recommendations,
      homework: n.homework,
      nextGoals: n.nextGoals,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

async function getMyReportData(userId: string): Promise<PatientReportData> {
  const patient = await prisma.patient.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!patient) throw AppError.notFound('Patient profile not found');
  return getPatientReportData(patient.id);
}

async function getAppointmentReportData(): Promise<AppointmentReportData> {
  const appointments = await prisma.appointment.findMany({
    orderBy: { date: 'desc' },
    include: {
      patient: { include: { user: true } },
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    appointments: appointments.map((a) => ({
      id: a.id,
      patientName: a.patient?.user.name ?? a.guestName ?? 'Guest',
      patientEmail: a.patient?.user.email ?? a.guestEmail ?? '—',
      service: a.service,
      date: a.date.toISOString().split('T')[0],
      startTime: a.startTime,
      endTime: a.endTime,
      mode: a.mode,
      status: a.status,
    })),
  };
}

// ─── PDF helpers ─────────────────────────────────────────────────

const BRAND = '#7C3AED'; // purple-600, matches the app's --primary
const DARK = '#1E1B4B';
const MUTED = '#6B7280';
const LINE_COLOR = '#E5E7EB';
const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595; // A4 points
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

function initDoc(res: Response, filename: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  return doc;
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  // Brand stripe
  doc.rect(0, 0, PAGE_WIDTH, 70).fill(BRAND);
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('PPM', PAGE_MARGIN, 22);
  doc.fontSize(9).font('Helvetica').text('Practice Management System', PAGE_MARGIN, 46);

  // Title block
  doc.moveDown(2);
  doc.fillColor(DARK).fontSize(18).font('Helvetica-Bold').text(title, PAGE_MARGIN, 90);
  if (subtitle) {
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(subtitle, PAGE_MARGIN, 114);
  }

  doc.moveTo(PAGE_MARGIN, 132).lineTo(PAGE_WIDTH - PAGE_MARGIN, 132).strokeColor(LINE_COLOR).stroke();
  doc.y = 145;
}

function sectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.8);
  if (doc.y > 720) doc.addPage();
  doc
    .fillColor(BRAND)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(text.toUpperCase(), PAGE_MARGIN, doc.y);
  doc.moveTo(PAGE_MARGIN, doc.y + 2).lineTo(PAGE_WIDTH - PAGE_MARGIN, doc.y + 2).strokeColor(BRAND).lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function labelValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  if (doc.y > 740) doc.addPage();
  const x = PAGE_MARGIN;
  doc.fillColor(MUTED).fontSize(9).font('Helvetica-Bold').text(label, x, doc.y, { continued: false, width: 120 });
  doc.fillColor(DARK).fontSize(9).font('Helvetica').text(value || '—', x + 130, doc.y - 11, { width: CONTENT_WIDTH - 130 });
  doc.moveDown(0.3);
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return '#16A34A';
    case 'upcoming': return '#2563EB';
    case 'cancelled': return '#DC2626';
    default: return '#D97706'; // pending
  }
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor(MUTED)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Page ${i + 1} of ${pages.count}   •   Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}   •   Confidential`,
        PAGE_MARGIN,
        doc.page.height - 30,
        { align: 'center', width: CONTENT_WIDTH },
      );
  }
}

// ─── PDF generators ───────────────────────────────────────────────

function generatePatientPDF(res: Response, data: PatientReportData) {
  const doc = initDoc(res, `patient-report-${data.profile.id}.pdf`);

  drawHeader(doc, `Patient Report`, `${data.profile.name}  •  Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);

  // Profile
  sectionHeading(doc, 'Patient Profile');
  labelValue(doc, 'Full Name', data.profile.name);
  labelValue(doc, 'Email', data.profile.email);
  labelValue(doc, 'Phone', data.profile.phone ?? '—');
  labelValue(doc, 'Status', data.profile.status);
  labelValue(doc, 'Primary Concern', data.profile.primaryConcern ?? '—');
  labelValue(doc, 'Joined', new Date(data.profile.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
  labelValue(doc, 'Language', data.profile.language.toUpperCase());

  // Medical History
  sectionHeading(doc, 'Medical History');
  if (!data.medicalHistory) {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No medical history on record.', PAGE_MARGIN);
  } else {
    const mh = data.medicalHistory;
    labelValue(doc, 'Conditions', mh.conditions.length ? mh.conditions.join(', ') : 'None');
    labelValue(doc, 'Medications', mh.medications.length ? mh.medications.join(', ') : 'None');
    labelValue(doc, 'Allergies', mh.allergies.length ? mh.allergies.join(', ') : 'None');
  }

  // Appointment History
  sectionHeading(doc, 'Appointment History');
  if (data.appointments.length === 0) {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No appointments found.', PAGE_MARGIN);
  } else {
    for (const appt of data.appointments) {
      if (doc.y > 720) doc.addPage();
      const dateStr = new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`${appt.service}`, PAGE_MARGIN, doc.y);
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(
        `${dateStr}  •  ${appt.startTime}–${appt.endTime}  •  ${appt.mode}  •  ${appt.status}`,
        PAGE_MARGIN,
        doc.y,
      );
      doc.moveDown(0.5);
    }
  }

  // Session Notes & Recommendations
  sectionHeading(doc, 'Session Notes & Recommendations');
  if (data.sessionNotes.length === 0) {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No session notes on record.', PAGE_MARGIN);
  } else {
    for (const note of data.sessionNotes) {
      if (doc.y > 680) doc.addPage();
      const dateStr = new Date(note.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(`${note.appointmentService}  —  ${dateStr}`, PAGE_MARGIN, doc.y);
      doc.moveDown(0.2);

      if (note.diagnosisSummary) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text('Diagnosis Summary:', PAGE_MARGIN);
        doc.fillColor(DARK).fontSize(8).font('Helvetica').text(note.diagnosisSummary, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
        doc.moveDown(0.2);
      }
      if (note.recommendations) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text('Recommendations:', PAGE_MARGIN);
        doc.fillColor(DARK).fontSize(8).font('Helvetica').text(note.recommendations, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
        doc.moveDown(0.2);
      }
      if (note.homework) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text('Homework:', PAGE_MARGIN);
        doc.fillColor(DARK).fontSize(8).font('Helvetica').text(note.homework, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
        doc.moveDown(0.2);
      }
      if (note.nextGoals) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text('Next Goals:', PAGE_MARGIN);
        doc.fillColor(DARK).fontSize(8).font('Helvetica').text(note.nextGoals, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
      }
      doc.moveDown(0.8);
      doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_WIDTH - PAGE_MARGIN, doc.y).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }
  }

  drawFooter(doc);
  doc.end();
}

function generateAppointmentsPDF(res: Response, data: AppointmentReportData) {
  const doc = initDoc(res, `appointments-report-${new Date().toISOString().split('T')[0]}.pdf`);

  drawHeader(
    doc,
    'Appointments Report',
    `All appointments  •  ${data.appointments.length} record${data.appointments.length !== 1 ? 's' : ''}`,
  );

  if (data.appointments.length === 0) {
    sectionHeading(doc, 'Appointments');
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No appointments found.', PAGE_MARGIN);
  } else {
    // Table header
    const COL = {
      date: PAGE_MARGIN,
      patient: PAGE_MARGIN + 72,
      service: PAGE_MARGIN + 205,
      time: PAGE_MARGIN + 330,
      mode: PAGE_MARGIN + 400,
      status: PAGE_MARGIN + 455,
    };

    const drawTableHeader = () => {
      if (doc.y > 720) doc.addPage();
      doc.fillColor(BRAND).fontSize(8).font('Helvetica-Bold');
      doc.text('DATE', COL.date, doc.y, { width: 70 });
      doc.text('PATIENT', COL.patient, doc.y - 10, { width: 120 });
      doc.text('SERVICE', COL.service, doc.y - 10, { width: 120 });
      doc.text('TIME', COL.time, doc.y - 10, { width: 68 });
      doc.text('MODE', COL.mode, doc.y - 10, { width: 50 });
      doc.text('STATUS', COL.status, doc.y - 10, { width: 70 });
      doc.moveDown(0.2);
      doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_WIDTH - PAGE_MARGIN, doc.y).strokeColor(BRAND).lineWidth(0.8).stroke();
      doc.moveDown(0.3);
    };

    drawTableHeader();
    let rowCount = 0;

    for (const appt of data.appointments) {
      if (doc.y > 730) {
        doc.addPage();
        drawTableHeader();
      }

      const dateStr = new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const bg = rowCount % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
      doc.rect(PAGE_MARGIN - 4, doc.y - 2, CONTENT_WIDTH + 8, 16).fill(bg);

      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(dateStr, COL.date, doc.y, { width: 70 });
      doc.fillColor(DARK).font('Helvetica').text(appt.patientName, COL.patient, doc.y - 10, { width: 120, ellipsis: true });
      doc.text(appt.service, COL.service, doc.y - 10, { width: 120, ellipsis: true });
      doc.fillColor(MUTED).text(`${appt.startTime}`, COL.time, doc.y - 10, { width: 68 });
      doc.text(appt.mode, COL.mode, doc.y - 10, { width: 50 });
      doc.fillColor(statusColor(appt.status)).font('Helvetica-Bold').text(appt.status, COL.status, doc.y - 10, { width: 70 });

      doc.moveDown(0.15);
      rowCount++;
    }
  }

  drawFooter(doc);
  doc.end();
}

// ─── Public service ───────────────────────────────────────────────

export const reportService = {
  streamPatientReport: async (res: Response, patientId: string) => {
    const data = await getPatientReportData(patientId);
    generatePatientPDF(res, data);
  },

  streamMyReport: async (res: Response, userId: string) => {
    const data = await getMyReportData(userId);
    generatePatientPDF(res, data);
  },

  streamAppointmentsReport: async (res: Response) => {
    const data = await getAppointmentReportData();
    generateAppointmentsPDF(res, data);
  },
};
