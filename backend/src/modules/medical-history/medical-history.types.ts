// Mirrors the frontend's MedicalHistory interface exactly
// (lib/mock-data/patients.ts) so the DTO can be dropped straight into
// existing UI without reshaping.
export interface MedicalHistoryDTO {
  conditions: string[];
  medications: string[];
  allergies: string[];
}
