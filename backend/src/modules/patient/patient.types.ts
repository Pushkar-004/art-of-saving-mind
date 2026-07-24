import { PatientStatus, Role } from '@prisma/client';

// Shape returned to the frontend for "my profile" — extends the
// existing AuthUserDTO fields (name/email/role/avatarInitials) with
// the Patient-specific fields the frontend's mock Patient interface
// already expects (lib/mock-data/patients.ts): phone, joinedDate,
// status, primaryConcern. No DOB/gender/address fields are included
// because nothing in the current frontend forms collects them.
export interface PatientProfileDTO {
  id: string; // Patient.id
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatarInitials: string;
  status: PatientStatus;
  joinedDate: Date;
  primaryConcern: string | null;
}
