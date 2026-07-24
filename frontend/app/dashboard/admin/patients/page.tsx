'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Mail,
  Phone,
  Calendar,
  UserX,
  X,
  Activity,
  Pill,
  AlertCircle,
  ShieldAlert,
  FileDown,
} from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import Modal from '@/components/shared/Modal'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonRows } from '@/components/shared/Skeleton'
import ErrorState from '@/components/shared/ErrorState'
import {
  getAdminPatientList,
  getAdminAppointments,
  getPatientMedicalHistoryForAdmin,
  getPatientEmergencyContactForAdmin,
  downloadPatientReport,
  type PatientProfile,
  type MedicalHistory,
  type EmergencyContact,
  type Appointment,
} from '@/lib/api/client'

const statusStyles: Record<PatientProfile['status'], string> = {
  active: 'bg-primary/10 text-primary',
  new: 'bg-accent/15 text-accent-foreground',
  inactive: 'bg-muted text-muted-foreground',
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientProfile['status'] | 'all'>('all')
  const [selected, setSelected] = useState<PatientProfile | null>(null)

  const [detailLoading, setDetailLoading] = useState(false)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        getAdminPatientList(),
        getAdminAppointments(),
      ])
      setPatients(patientsRes.data.patients)
      setAppointments(appointmentsRes.data.appointments)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const apt of appointments) {
      if (apt.status === 'completed' && apt.patientId) {
        counts[apt.patientId] = (counts[apt.patientId] ?? 0) + 1
      }
    }
    return counts
  }, [appointments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.primaryConcern ?? '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [patients, query, statusFilter])

  const openPatient = async (patient: PatientProfile) => {
    setSelected(patient)
    setDetailLoading(true)
    setMedicalHistory(null)
    setEmergencyContact(null)
    setReportError(null)
    try {
      const [medicalRes, contactRes] = await Promise.all([
        getPatientMedicalHistoryForAdmin(patient.id),
        getPatientEmergencyContactForAdmin(patient.id),
      ])
      setMedicalHistory(medicalRes.data.medicalHistory)
      setEmergencyContact(contactRes.data.emergencyContact)
    } catch {
      // Leave panels empty — DetailBlock/EmptyState below handle no data gracefully.
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExportPatientReport = async () => {
    if (!selected) return
    setReportLoading(true)
    setReportError(null)
    try {
      await downloadPatientReport(selected.id, selected.name)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setReportLoading(false)
    }
  }

  if (isError) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-1">
        <h1 className="wellness-heading text-3xl">Patient List</h1>
        <p className="text-muted-foreground">Manage and review your {patients.length} patients.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'new', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No patients found"
          description="Try adjusting your search or filter to find who you're looking for."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <motion.button
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openPatient(p)}
              className="text-left"
            >
              <GlassCard hover className="h-full">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                        {p.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{p.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{p.primaryConcern || 'No concern noted'}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      {sessionCounts[p.id] ?? 0} sessions
                    </span>
                    <span className="text-primary">View details</span>
                  </div>
                </div>
              </GlassCard>
            </motion.button>
          ))}
        </div>
      )}

      {/* Patient detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidthClass="max-w-lg"
        title={selected?.name}
        description={selected?.primaryConcern ?? undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail size={15} className="text-primary" />
                {selected.email}
              </span>
              {selected.phone && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={15} className="text-primary" />
                  {selected.phone}
                </span>
              )}
            </div>

            {detailLoading ? (
              <p className="text-sm text-muted-foreground">Loading medical details...</p>
            ) : (
              <>
                <DetailBlock icon={Activity} label="Conditions" items={medicalHistory?.conditions ?? []} />
                <DetailBlock icon={Pill} label="Medications" items={medicalHistory?.medications ?? []} />
                <DetailBlock icon={AlertCircle} label="Allergies" items={medicalHistory?.allergies ?? []} />

                <div className="rounded-xl border border-border/50 bg-muted/40 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldAlert size={15} className="text-accent-foreground" />
                    Emergency Contact
                  </p>
                  {emergencyContact ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {emergencyContact.name} ({emergencyContact.relationship})
                      <br />
                      {emergencyContact.phone}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No emergency contact on file</p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handleExportPatientReport}
              disabled={reportLoading || detailLoading}
              className="glass-button flex w-full items-center justify-center gap-2 text-sm"
            >
              <FileDown size={15} />
              {reportLoading ? 'Generating…' : 'Export Patient Report'}
            </button>
            {reportError && (
              <span className="text-xs text-destructive">{reportError}</span>
            )}

            <button onClick={() => setSelected(null)} className="glass-button-outline w-full">
              <X size={16} />
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailBlock({
  icon: Icon,
  label,
  items,
}: {
  icon: typeof Activity
  label: string
  items: string[]
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon size={15} className="text-primary" />
        {label}
      </p>
      {items.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">None reported</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
