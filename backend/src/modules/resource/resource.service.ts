import { Resource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { ResourceDTO } from '@/modules/resource/resource.types';
import {
  CreateResourceInput,
  ListResourcesQuery,
  UpdateResourceInput,
} from '@/modules/resource/resource.validation';

type ResourceWithUploader = Resource & { uploader: { name: string } };

function toResourceDTO(record: ResourceWithUploader): ResourceDTO {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    fileUrl: record.fileUrl,
    fileName: record.fileName,
    uploadedBy: record.uploadedBy,
    uploadedByName: record.uploader.name,
    createdAt: record.createdAt.toISOString(),
  };
}

// Shared by both the admin and patient list endpoints — same search +
// category filter behavior either side of the role boundary, so the
// where-clause builder lives in one place.
function buildWhere(query: ListResourcesQuery) {
  const search = query.search?.trim();
  return {
    ...(query.category ? { category: query.category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };
}

async function getOrThrow(id: string): Promise<ResourceWithUploader> {
  const record = await prisma.resource.findUnique({
    where: { id },
    include: { uploader: { select: { name: true } } },
  });
  if (!record) {
    throw AppError.notFound('Resource not found');
  }
  return record;
}

// ---------------- Admin ----------------

async function createForAdmin(
  adminUserId: string,
  input: CreateResourceInput,
): Promise<ResourceDTO> {
  const record = await prisma.resource.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      uploadedBy: adminUserId,
    },
    include: { uploader: { select: { name: true } } },
  });
  return toResourceDTO(record);
}

async function updateForAdmin(
  id: string,
  input: UpdateResourceInput,
): Promise<ResourceDTO> {
  await getOrThrow(id);
  const record = await prisma.resource.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
      ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
    },
    include: { uploader: { select: { name: true } } },
  });
  return toResourceDTO(record);
}

async function deleteForAdmin(id: string): Promise<void> {
  await getOrThrow(id);
  await prisma.resource.delete({ where: { id } });
}

async function listForAdmin(query: ListResourcesQuery): Promise<ResourceDTO[]> {
  const records = await prisma.resource.findMany({
    where: buildWhere(query),
    include: { uploader: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toResourceDTO);
}

// ---------------- Patient ----------------

async function listForPatient(query: ListResourcesQuery): Promise<ResourceDTO[]> {
  const records = await prisma.resource.findMany({
    where: buildWhere(query),
    include: { uploader: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toResourceDTO);
}

async function getByIdForPatient(id: string): Promise<ResourceDTO> {
  return toResourceDTO(await getOrThrow(id));
}

export const resourceService = {
  createForAdmin,
  updateForAdmin,
  deleteForAdmin,
  listForAdmin,
  listForPatient,
  getByIdForPatient,
};
