'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  BookOpen,
  Wind,
  Activity,
  ClipboardList,
  X,
  Link as LinkIcon,
  Library,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Modal from '@/components/shared/Modal'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import {
  getAdminResources,
  createResource,
  updateResource,
  deleteResource,
  type Resource,
  type ResourceCategory,
  type CreateResourceInput,
} from '@/lib/api/client'

const CATEGORY_OPTIONS: { value: ResourceCategory; label: string }[] = [
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'guide', label: 'Guide' },
  { value: 'pdf', label: 'PDF' },
]

const CATEGORY_ICONS: Record<ResourceCategory, typeof FileText> = {
  worksheet: ClipboardList,
  meditation: Wind,
  exercise: Activity,
  guide: BookOpen,
  pdf: FileText,
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  worksheet: 'Worksheet',
  meditation: 'Meditation',
  exercise: 'Exercise',
  guide: 'Guide',
  pdf: 'PDF',
}

const EMPTY_FORM: CreateResourceInput = {
  title: '',
  description: '',
  category: 'guide',
  fileUrl: '',
  fileName: '',
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateResourceInput>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await getAdminResources()
      setResources(res.data.resources)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Search/filter is done client-side against the already-fetched
  // list, matching how the admin patients page filters — the library
  // is small enough that a refetch per keystroke isn't needed.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [resources, query, categoryFilter])

  const openCreateForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEditForm = (resource: Resource) => {
    setEditingId(resource.id)
    setForm({
      title: resource.title,
      description: resource.description ?? '',
      category: resource.category,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return
    setIsFormOpen(false)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.fileUrl.trim() || !form.fileName.trim()) {
      toast.error('Title, file URL, and file name are required.')
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        const res = await updateResource(editingId, form)
        setResources((prev) => prev.map((r) => (r.id === editingId ? res.data.resource : r)))
        toast.success('Resource updated successfully')
      } else {
        const res = await createResource(form)
        setResources((prev) => [res.data.resource, ...prev])
        toast.success('Resource added successfully')
      }
      setIsFormOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save resource')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteResource(id)
      setResources((prev) => prev.filter((r) => r.id !== id))
      toast.success('Resource deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete resource')
    } finally {
      setDeletingId(null)
    }
  }

  if (isError) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="wellness-heading text-3xl">Resource Library</h1>
          <p className="text-muted-foreground">
            Manage worksheets, guides, and wellness materials for patients.
          </p>
        </div>

        <button onClick={openCreateForm} className="glass-button self-start sm:self-auto">
          <Plus size={18} />
          Add Resource
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...CATEGORY_OPTIONS.map((c) => c.value)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                categoryFilter === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No resources found"
          description="Try adjusting your search or filter, or add a new resource."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((resource) => {
            const Icon = CATEGORY_ICONS[resource.category]
            return (
              <motion.div key={resource.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-foreground">{resource.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground text-pretty">
                          {resource.description || 'No description'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 font-medium text-secondary-foreground">
                            {CATEGORY_LABELS[resource.category]}
                          </span>
                          <span>{resource.fileName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">
                      Added by {resource.uploadedByName}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(resource)}
                        aria-label="Edit resource"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        disabled={deletingId === resource.id}
                        aria-label="Delete resource"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={isFormOpen}
        onClose={closeForm}
        maxWidthClass="max-w-lg"
        title={editingId ? 'Edit Resource' : 'Add Resource'}
        description="Resource files are hosted externally — paste a link to where the file already lives."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Anxiety Management Guide"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short summary of what this resource covers"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as ResourceCategory }))
              }
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">File URL</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">File name</label>
            <input
              value={form.fileName}
              onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))}
              placeholder="e.g. anxiety-guide.pdf"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="glass-button flex-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Resource'}
            </button>
            <button onClick={closeForm} disabled={isSaving} className="glass-button-outline flex-1">
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
