import { MedicalHistory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { UpsertMedicalHistoryInput } from '@/modules/medical-history/medical-history.validation';
import { MedicalHistoryDTO } from '@/modules/medical-history/medical-history.types';

// Json columns round-trip as `unknown` through Prisma's generated
// types — these arrays are always string[] because the validation
// layer (medical-history.validation.ts) guarantees it on every write.
function toMedicalHistoryDTO(record: MedicalHistory): MedicalHistoryDTO {
  return {
    conditions: (record.conditions as string[]) ?? [],
    medications: (record.medications as string[]) ?? [],
    allergies: (record.allergies as string[]) ?? [],
  };
}

async function resolvePatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    throw AppError.notFound('Patient profile not found');
  }
  return patient.id;
}

async function getMine(userId: string): Promise<MedicalHistoryDTO> {
  const patientId = await resolvePatientId(userId);
  const record = await prisma.medicalHistory.findUnique({ where: { patientId } });

  // No record yet is a normal, expected state for a brand new
  // patient — return empty arrays rather than a 404 so the settings
  // page can render its form immediately.
  if (!record) {
    return { conditions: [], medications: [], allergies: [] };
  }

  return toMedicalHistoryDTO(record);
}

/**
 * Creates the record on first write, updates it on every write after
 * — true upsert, matching "Create if not exists / Update if exists"
 * from the Phase 2 spec. Fields omitted from the input are left as-is
 * on update, or default to [] on create.
 */
async function upsertMine(
  userId: string,
  input: UpsertMedicalHistoryInput,
): Promise<MedicalHistoryDTO> {
  const patientId = await resolvePatientId(userId);

  const record = await prisma.medicalHistory.upsert({
    where: { patientId },
    create: {
      patientId,
      conditions: input.conditions ?? [],
      medications: input.medications ?? [],
      allergies: input.allergies ?? [],
    },
    update: {
      ...(input.conditions !== undefined ? { conditions: input.conditions } : {}),
      ...(input.medications !== undefined ? { medications: input.medications } : {}),
      ...(input.allergies !== undefined ? { allergies: input.allergies } : {}),
    },
  });

  return toMedicalHistoryDTO(record);
}

/**
 * Admin-side read by Patient.id — used by the existing admin patients
 * page modal, which already displays this data from mock data today.
 */
async function getForAdmin(patientId: string): Promise<MedicalHistoryDTO> {
  const record = await prisma.medicalHistory.findUnique({ where: { patientId } });
  if (!record) {
    return { conditions: [], medications: [], allergies: [] };
  }
  return toMedicalHistoryDTO(record);
}

export const medicalHistoryService = {
  getMine,
  upsertMine,
  getForAdmin,
};
