export interface PatientReportData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    primaryConcern: string | null;
    status: string;
    joinedDate: string;
    language: string;
  };
  medicalHistory: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  } | null;
  appointments: {
    id: string;
    service: string;
    date: string;
    startTime: string;
    endTime: string;
    mode: string;
    status: string;
  }[];
  sessionNotes: {
    id: string;
    appointmentService: string;
    appointmentDate: string;
    diagnosisSummary: string | null;
    observations: string | null;
    recommendations: string | null;
    homework: string | null;
    nextGoals: string | null;
    createdAt: string;
  }[];
}

export interface AppointmentReportData {
  appointments: {
    id: string;
    patientName: string;
    patientEmail: string;
    service: string;
    date: string;
    startTime: string;
    endTime: string;
    mode: string;
    status: string;
  }[];
  generatedAt: string;
}
