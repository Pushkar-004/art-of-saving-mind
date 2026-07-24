import { Patient, Role, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { UpdatePatientProfileInput } from '@/modules/patient/patient.validation';
import { PatientProfileDTO } from '@/modules/patient/patient.types';

// Same initials fallback used by auth.service so a profile fetched
// here never disagrees with what /api/auth/me would show.
function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || 'NA';
}

type PatientWithUser = Patient & { user: User };

function toPatientProfileDTO(patient: PatientWithUser): PatientProfileDTO {
  return {
    id: patient.id,
    userId: patient.userId,
    name: patient.user.name,
    email: patient.user.email,
    phone: patient.user.phone,
    role: patient.user.role,
    avatarInitials: patient.user.avatarInitials ?? getInitials(patient.user.name),
    status: patient.status,
    joinedDate: patient.joinedDate,
    primaryConcern: patient.primaryConcern,
  };
}

/**
 * Loads the Patient row (with its User) for a given authenticated
 * user id. Throws if the caller is not a patient — admins don't have
 * a Patient row and should not call this.
 */
async function getOwnPatientRecord(userId: string): Promise<PatientWithUser> {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!patient) {
    throw AppError.notFound('Patient profile not found');
  }

  return patient;
}

async function getMyProfile(userId: string): Promise<PatientProfileDTO> {
  const patient = await getOwnPatientRecord(userId);
  return toPatientProfileDTO(patient);
}

/**
 * Updates the current patient's own profile. name/phone live on User;
 * primaryConcern lives on Patient — both are updated in one
 * transaction so a partial failure never leaves them out of sync.
 * Email changes are checked for uniqueness against other users.
 */
async function updateMyProfile(
  userId: string,
  input: UpdatePatientProfileInput,
): Promise<PatientProfileDTO> {
  const patient = await getOwnPatientRecord(userId);

  if (input.email && input.email !== patient.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) {
      throw AppError.conflict('An account with this email already exists');
    }
  }

  const userData: { name?: string; email?: string; phone?: string } = {};
  if (input.name !== undefined) userData.name = input.name;
  if (input.email !== undefined) userData.email = input.email;
  if (input.phone !== undefined) userData.phone = input.phone;

  const patientData: { primaryConcern?: string } = {};
  if (input.primaryConcern !== undefined) patientData.primaryConcern = input.primaryConcern;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: userData }),
    ...(Object.keys(patientData).length > 0
      ? [prisma.patient.update({ where: { id: patient.id }, data: patientData })]
      : []),
  ]);

  // Re-fetch so the returned DTO always reflects the latest committed
  // state of both rows, regardless of which fields changed above.
  const refreshed = await getOwnPatientRecord(userId);
  return toPatientProfileDTO(refreshed);
}

/**
 * Admin-side read of any patient's profile by Patient.id. Role check
 * happens in the route (authorize('admin')) — this just does the
 * lookup once we know the caller is allowed to see it.
 */
async function getPatientProfileForAdmin(patientId: string): Promise<PatientProfileDTO> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: true },
  });

  if (!patient) {
    throw AppError.notFound('Patient not found');
  }

  return toPatientProfileDTO(patient);
}

async function listPatientsForAdmin(): Promise<PatientProfileDTO[]> {
  const patients = await prisma.patient.findMany({
    where: { user: { role: Role.patient } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return patients.map(toPatientProfileDTO);
}

export const patientService = {
  getMyProfile,
  updateMyProfile,
  getPatientProfileForAdmin,
  listPatientsForAdmin,
};
