// Mirrors the SessionNote model 1:1 so the DTO can be dropped straight
// into the admin notes editor and the patient's read-only notes page
// without reshaping. appointmentId/therapistId/patientId are included
// so the frontend can correlate a note back to its appointment (and,
// on the admin side, render "by <therapist>") without a second fetch.
export interface SessionNoteDTO {
  id: string;
  appointmentId: string;
  therapistId: string;
  therapistName: string;
  patientId: string;
  patientName: string;
  diagnosisSummary: string | null;
  observations: string | null;
  recommendations: string | null;
  homework: string | null;
  nextGoals: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Shape returned alongside an appointment-flavored summary for the
// patient's own list — includes the handful of appointment fields
// the "session notes" cards need (date/time/service) so the patient
// page doesn't have to cross-reference /appointments/me separately.
export interface SessionNoteWithAppointmentDTO extends SessionNoteDTO {
  appointmentService: string;
  appointmentDate: string; // human-readable label, matches AppointmentDTO.date
  appointmentTime: string; // matches AppointmentDTO.time
}
