import { ResourceCategory } from '@prisma/client';

export interface ResourceDTO {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string; // ISO timestamp
}
