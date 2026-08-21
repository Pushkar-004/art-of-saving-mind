import {
  FileText,
  BookOpen,
  Wind,
  Activity,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import type { ResourceCategory } from '@/lib/api/client'

// Single source of truth for the resource category list, mirroring the
// backend's Prisma `ResourceCategory` enum (backend/prisma/schema.prisma).
// Every page that lists/filters/creates resources should import from
// here instead of maintaining its own copy — keeps the public site,
// patient dashboard, and admin dashboard from drifting out of sync.
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  'worksheet',
  'meditation',
  'exercise',
  'guide',
  'pdf',
]

// Maps each category to its translation key in the shared `resources.*`
// i18n namespace.
export const CATEGORY_TRANSLATION_KEYS: Record<ResourceCategory, string> = {
  worksheet: 'resources.categoryWorksheet',
  meditation: 'resources.categoryMeditation',
  exercise: 'resources.categoryExercise',
  guide: 'resources.categoryGuide',
  pdf: 'resources.categoryPdf',
}

// Plain English labels for the admin dashboard, which (like the rest of
// the admin UI) isn't run through i18n.
export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  worksheet: 'Worksheet',
  meditation: 'Meditation',
  exercise: 'Exercise',
  guide: 'Guide',
  pdf: 'PDF',
}

export const CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  worksheet: ClipboardList,
  meditation: Wind,
  exercise: Activity,
  guide: BookOpen,
  pdf: FileText,
}

export const CATEGORY_BADGE_COLOR: Record<ResourceCategory, string> = {
  guide: 'bg-primary/10 dark:bg-primary/20 text-foreground',
  worksheet: 'bg-accent/10 dark:bg-accent/20 text-foreground',
  meditation: 'bg-secondary dark:bg-secondary/40 text-foreground',
  exercise: 'bg-secondary dark:bg-secondary/40 text-foreground',
  pdf: 'bg-muted dark:bg-muted/40 text-foreground',
}

// Whether this category renders as a downloadable/openable PDF rather
// than a "Read More" link — used to swap button label + icon.
export function isPdfCategory(category: ResourceCategory) {
  return category === 'pdf'
}

// Case-insensitive match against title, description, AND category —
// shared by every page's client-side search so the behavior can't
// drift between the public site, patient dashboard, and admin table.
export function matchesResourceSearch(
  resource: { title: string; description: string | null; category: ResourceCategory },
  rawQuery: string,
  categoryLabel: string,
): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  return (
    resource.title.toLowerCase().includes(q) ||
    (resource.description ?? '').toLowerCase().includes(q) ||
    resource.category.toLowerCase().includes(q) ||
    categoryLabel.toLowerCase().includes(q)
  )
}
