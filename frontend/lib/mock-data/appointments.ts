// Centralized mock appointment data — frontend only, no backend.

export type AppointmentStatus =
  | 'upcoming'
  | 'completed'
  | 'pending'
  | 'cancelled'
export type SessionType = 'online' | 'offline'

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientInitials: string
  service: string
  therapist: string
  date: string // human readable, e.g. "Thursday, Mar 28"
  day: string // "28"
  month: string // "Mar"
  dateTime: string // ISO-ish string for sorting / inputs
  time: string // "3:00 PM"
  type: SessionType
  status: AppointmentStatus
  notes?: string
}

export const patientAppointments: Appointment[] = [
  {
    id: 'apt-001',
    patientId: 'pt-001',
    patientName: 'Sarah Johnson',
    patientInitials: 'SJ',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Tomorrow',
    day: '22',
    month: 'Mar',
    dateTime: '2024-03-22T14:00',
    time: '2:00 PM',
    type: 'online',
    status: 'upcoming',
  },
  {
    id: 'apt-002',
    patientId: 'pt-001',
    patientName: 'Sarah Johnson',
    patientInitials: 'SJ',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Thursday, Mar 28',
    day: '28',
    month: 'Mar',
    dateTime: '2024-03-28T15:00',
    time: '3:00 PM',
    type: 'offline',
    status: 'upcoming',
  },
  {
    id: 'apt-003',
    patientId: 'pt-001',
    patientName: 'Sarah Johnson',
    patientInitials: 'SJ',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Mar 15, 2024',
    day: '15',
    month: 'Mar',
    dateTime: '2024-03-15T14:00',
    time: '2:00 PM',
    type: 'online',
    status: 'completed',
    notes: 'Discussed breathing techniques and progress on coping strategies.',
  },
  {
    id: 'apt-004',
    patientId: 'pt-001',
    patientName: 'Sarah Johnson',
    patientInitials: 'SJ',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Mar 8, 2024',
    day: '08',
    month: 'Mar',
    dateTime: '2024-03-08T15:30',
    time: '3:30 PM',
    type: 'offline',
    status: 'completed',
    notes: 'Explored childhood patterns affecting current relationships.',
  },
]

// All appointments across patients — used by the admin dashboard.
export const allAppointments: Appointment[] = [
  ...patientAppointments,
  {
    id: 'apt-101',
    patientId: 'pt-002',
    patientName: 'Rahul Mehta',
    patientInitials: 'RM',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Monday, Mar 25',
    day: '25',
    month: 'Mar',
    dateTime: '2024-03-25T11:00',
    time: '11:00 AM',
    type: 'online',
    status: 'upcoming',
  },
  {
    id: 'apt-102',
    patientId: 'pt-003',
    patientName: 'Aisha Khan',
    patientInitials: 'AK',
    service: 'Marital Counselling',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Saturday, Mar 23',
    day: '23',
    month: 'Mar',
    dateTime: '2024-03-23T16:00',
    time: '4:00 PM',
    type: 'offline',
    status: 'upcoming',
  },
  {
    id: 'apt-103',
    patientId: 'pt-004',
    patientName: 'Vikram Patel',
    patientInitials: 'VP',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Sunday, Mar 24',
    day: '24',
    month: 'Mar',
    dateTime: '2024-03-24T10:00',
    time: '10:00 AM',
    type: 'online',
    status: 'pending',
  },
  {
    id: 'apt-104',
    patientId: 'pt-006',
    patientName: 'Sanya Gupta',
    patientInitials: 'SG',
    service: 'Counselling & Therapy',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Tuesday, Mar 26',
    day: '26',
    month: 'Mar',
    dateTime: '2024-03-26T13:00',
    time: '1:00 PM',
    type: 'online',
    status: 'pending',
  },
  {
    id: 'apt-105',
    patientId: 'pt-005',
    patientName: 'Emily Carter',
    patientInitials: 'EC',
    service: 'Follow-up Session',
    therapist: 'Miss. Pooja Sunil Ghadge',
    date: 'Wednesday, Mar 27',
    day: '27',
    month: 'Mar',
    dateTime: '2024-03-27T09:30',
    time: '9:30 AM',
    type: 'offline',
    status: 'pending',
  },
]
