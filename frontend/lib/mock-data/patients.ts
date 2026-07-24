// Centralized mock patient data — frontend only, no backend.

export interface MedicalHistory {
  conditions: string[]
  medications: string[]
  allergies: string[]
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  avatarInitials: string
  role: 'patient' | 'admin'
  joinedDate: string
  status: 'active' | 'inactive' | 'new'
  totalSessions: number
  lastSession: string | null
  nextSession: string | null
  primaryConcern: string
  medicalHistory: MedicalHistory
  emergencyContact: EmergencyContact
}

// The currently "logged in" demo patient. Replaces the old hardcoded "Sarah".
export const currentPatient: Patient = {
  id: 'pt-001',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  phone: '+91 98765 43210',
  avatarInitials: 'SJ',
  role: 'patient',
  joinedDate: '2024-01-12',
  status: 'active',
  totalSessions: 12,
  lastSession: '2024-03-15',
  nextSession: '2024-03-22T14:00',
  primaryConcern: 'Anxiety & Stress Management',
  medicalHistory: {
    conditions: ['Generalized Anxiety', 'Insomnia'],
    medications: ['Sertraline 50mg'],
    allergies: ['Penicillin'],
  },
  emergencyContact: {
    name: 'David Johnson',
    relationship: 'Spouse',
    phone: '+91 98765 11223',
  },
}

// Full patient list used by the admin dashboard.
export const patients: Patient[] = [
  currentPatient,
  {
    id: 'pt-002',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@example.com',
    phone: '+91 99887 66554',
    avatarInitials: 'RM',
    role: 'patient',
    joinedDate: '2024-02-03',
    status: 'active',
    totalSessions: 8,
    lastSession: '2024-03-18',
    nextSession: '2024-03-25T11:00',
    primaryConcern: 'Work Burnout',
    medicalHistory: {
      conditions: ['Burnout', 'Mild Depression'],
      medications: [],
      allergies: [],
    },
    emergencyContact: {
      name: 'Priya Mehta',
      relationship: 'Sister',
      phone: '+91 99887 00112',
    },
  },
  {
    id: 'pt-003',
    name: 'Aisha Khan',
    email: 'aisha.khan@example.com',
    phone: '+91 90123 45678',
    avatarInitials: 'AK',
    role: 'patient',
    joinedDate: '2024-02-20',
    status: 'active',
    totalSessions: 5,
    lastSession: '2024-03-12',
    nextSession: '2024-03-23T16:00',
    primaryConcern: 'Relationship Counseling',
    medicalHistory: {
      conditions: ['Adjustment Disorder'],
      medications: [],
      allergies: ['Sulfa drugs'],
    },
    emergencyContact: {
      name: 'Imran Khan',
      relationship: 'Brother',
      phone: '+91 90123 99887',
    },
  },
  {
    id: 'pt-004',
    name: 'Vikram Patel',
    email: 'vikram.patel@example.com',
    phone: '+91 98220 33445',
    avatarInitials: 'VP',
    role: 'patient',
    joinedDate: '2024-03-01',
    status: 'new',
    totalSessions: 2,
    lastSession: '2024-03-17',
    nextSession: '2024-03-24T10:00',
    primaryConcern: 'Grief & Loss',
    medicalHistory: {
      conditions: ['Acute Stress'],
      medications: ['Melatonin 5mg'],
      allergies: [],
    },
    emergencyContact: {
      name: 'Meera Patel',
      relationship: 'Mother',
      phone: '+91 98220 11000',
    },
  },
  {
    id: 'pt-005',
    name: 'Emily Carter',
    email: 'emily.carter@example.com',
    phone: '+91 97654 32100',
    avatarInitials: 'EC',
    role: 'patient',
    joinedDate: '2023-11-15',
    status: 'inactive',
    totalSessions: 18,
    lastSession: '2024-01-30',
    nextSession: null,
    primaryConcern: 'Self-esteem',
    medicalHistory: {
      conditions: ['Social Anxiety'],
      medications: [],
      allergies: ['Latex'],
    },
    emergencyContact: {
      name: 'James Carter',
      relationship: 'Father',
      phone: '+91 97654 00099',
    },
  },
  {
    id: 'pt-006',
    name: 'Sanya Gupta',
    email: 'sanya.gupta@example.com',
    phone: '+91 96543 21099',
    avatarInitials: 'SG',
    role: 'patient',
    joinedDate: '2024-03-10',
    status: 'new',
    totalSessions: 1,
    lastSession: '2024-03-19',
    nextSession: '2024-03-26T13:00',
    primaryConcern: 'Panic Attacks',
    medicalHistory: {
      conditions: ['Panic Disorder'],
      medications: [],
      allergies: [],
    },
    emergencyContact: {
      name: 'Anil Gupta',
      relationship: 'Father',
      phone: '+91 96543 00088',
    },
  },
]
