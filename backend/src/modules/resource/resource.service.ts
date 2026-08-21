import { Resource, ResourceCategory } from '@prisma/client';
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
    thumbnailUrl: record.thumbnailUrl,
    isPublished: record.isPublished,
    uploadedBy: record.uploadedBy,
    uploadedByName: record.uploader.name,
    createdAt: record.createdAt.toISOString(),
  };
}

// Shared by both the admin and patient list endpoints — same search +
// category filter behavior either side of the role boundary, so the
// where-clause builder lives in one place. `publishedOnly` is set by the
// patient/public listing (never by admin) so drafts stay hidden from
// anyone but the admin managing the library.
function buildWhere(query: ListResourcesQuery, publishedOnly: boolean) {
  const search = query.search?.trim();
  // Search matches on title, description, AND category (case-insensitive)
  // per the resource search requirements — a search for "pdf" or "guide"
  // should surface resources in that category even if the word never
  // appears in the title/description.
  const matchingCategories = search
    ? (Object.values(ResourceCategory) as ResourceCategory[]).filter((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return {
    ...(publishedOnly ? { isPublished: true } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            ...(matchingCategories.length ? [{ category: { in: matchingCategories } }] : []),
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
      thumbnailUrl: input.thumbnailUrl?.trim() ? input.thumbnailUrl : null,
      isPublished: input.isPublished ?? true,
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
      ...(input.thumbnailUrl !== undefined
        ? { thumbnailUrl: input.thumbnailUrl.trim() ? input.thumbnailUrl : null }
        : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
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
  // Admin management view must show BOTH published and draft resources,
  // so drafts stay visible/editable there even though they're hidden
  // from the public site and patient dashboard.
  const records = await prisma.resource.findMany({
    where: buildWhere(query, false),
    include: { uploader: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toResourceDTO);
}

// ---------------- Patient ----------------

async function listForPatient(query: ListResourcesQuery): Promise<ResourceDTO[]> {
  // Public site + patient dashboard both call this — only ever
  // published resources should be visible here.
  const records = await prisma.resource.findMany({
    where: buildWhere(query, true),
    include: { uploader: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toResourceDTO);
}

async function getByIdForPatient(id: string): Promise<ResourceDTO> {
  const record = await getOrThrow(id);
  if (!record.isPublished) {
    // Draft resources are not addressable by id from the public/patient
    // side either — treat them as not found rather than leaking them
    // through a direct link.
    throw AppError.notFound('Resource not found');
  }
  return toResourceDTO(record);
}

export const resourceService = {
  createForAdmin,
  updateForAdmin,
  deleteForAdmin,
  listForAdmin,
  listForPatient,
  getByIdForPatient,
};
