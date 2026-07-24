// Mirrors the frontend's EmergencyContact interface
// (lib/mock-data/patients.ts) plus the optional email field the
// Prisma model also supports.
export interface EmergencyContactDTO {
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
}
