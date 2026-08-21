import bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { CreatePsychologistInput } from './psychologist.validation';

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'PS';
}

function toDTO(user: User & { _count?: { assignedAppointments: number } }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarInitials: user.avatarInitials ?? initials(user.name),
    isActive: user.isActive,
    assignedAppointmentCount: user._count?.assignedAppointments ?? 0,
  };
}

async function list() {
  const users = await prisma.user.findMany({
    where: { role: Role.psychologist },
    include: { _count: { select: { assignedAppointments: true } } },
    orderBy: { name: 'asc' },
  });
  const patientCounts = await prisma.appointment.groupBy({
    by: ['assignedPsychologistId', 'patientId'],
    where: { assignedPsychologistId: { not: null }, patientId: { not: null }, status: { not: 'cancelled' } },
  });
  return users.map((user) => ({
    ...toDTO(user),
    assignedPatientCount: patientCounts.filter((item) => item.assignedPsychologistId === user.id).length,
  }));
}

async function create(input: CreatePsychologistInput) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw AppError.conflict('An account with this email already exists');
  }
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      passwordHash: await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS),
      role: Role.psychologist,
      avatarInitials: initials(input.name),
    },
    include: { _count: { select: { assignedAppointments: true } } },
  });
  return { ...toDTO(user), assignedPatientCount: 0 };
}

async function setActive(id: string, isActive: boolean) {
  const existing = await prisma.user.findFirst({ where: { id, role: Role.psychologist } });
  if (!existing) throw AppError.notFound('Psychologist not found');
  const user = await prisma.user.update({
    where: { id }, data: { isActive }, include: { _count: { select: { assignedAppointments: true } } },
  });
  return { ...toDTO(user), assignedPatientCount: 0 };
}

export const psychologistService = { list, create, setActive };
