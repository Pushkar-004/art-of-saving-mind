import { EmergencyContact } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { UpsertEmergencyContactInput } from '@/modules/emergency-contact/emergency-contact.validation';
import { EmergencyContactDTO } from '@/modules/emergency-contact/emergency-contact.types';

function toEmergencyContactDTO(record: EmergencyContact): EmergencyContactDTO {
  return {
    name: record.name,
    relationship: record.relationship,
    phone: record.phone,
    email: record.email,
  };
}

async function resolvePatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    throw AppError.notFound('Patient profile not found');
  }
  return patient.id;
}

async function getMine(userId: string): Promise<EmergencyContactDTO | null> {
  const patientId = await resolvePatientId(userId);
  const record = await prisma.emergencyContact.findUnique({ where: { patientId } });
  return record ? toEmergencyContactDTO(record) : null;
}

/**
 * Single-contact upsert — the schema supports exactly one emergency
 * contact per patient (1:1, matching the current frontend, which only
 * ever shows one). Create on first save, update on every save after.
 */
async function upsertMine(
  userId: string,
  input: UpsertEmergencyContactInput,
): Promise<EmergencyContactDTO> {
  const patientId = await resolvePatientId(userId);

  const record = await prisma.emergencyContact.upsert({
    where: { patientId },
    create: {
      patientId,
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email || null,
    },
    update: {
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email || null,
    },
  });

  return toEmergencyContactDTO(record);
}

async function getForAdmin(patientId: string): Promise<EmergencyContactDTO | null> {
  const record = await prisma.emergencyContact.findUnique({ where: { patientId } });
  return record ? toEmergencyContactDTO(record) : null;
}

export const emergencyContactService = {
  getMine,
  upsertMine,
  getForAdmin,
};
