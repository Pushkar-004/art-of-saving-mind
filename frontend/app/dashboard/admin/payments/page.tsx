'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import { Skeleton } from '@/components/shared/Skeleton'
import {
  getAdminPayments,
  verifyPayment,
  rejectPayment,
  resolveAssetUrl,
  type AdminPayment,
} from '@/lib/api/client'
import { useNotifications } from '@/lib/context/NotificationContext'

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

function StatusBadge({ status }: { status: AdminPayment['status'] }) {
  const map = {
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
    verified: { label: 'Verified', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  }
  const { label, color, icon: Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

function PaymentProofImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>
        <CreditCard size={20} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

export default function AdminPaymentsPage() {
  const { refreshNotifications } = useNotifications()
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')

  // Screenshot preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  // Verify modal
  const [verifyTarget, setVerifyTarget] = useState<AdminPayment | null>(null)
  const [verifyRemarks, setVerifyRemarks] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<AdminPayment | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminPayments()
      setPayments(res.data.payments)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter)

  const counts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    verified: payments.filter((p) => p.status === 'verified').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  }

  const handleVerify = async () => {
    if (!verifyTarget) return
    setVerifying(true)
    try {
      const res = await verifyPayment(verifyTarget.id, verifyRemarks || undefined)
      setPayments((prev) => prev.map((p) => (p.id === verifyTarget.id ? { ...p, ...res.data.payment } : p)))
      void refreshNotifications()
      toast.success('Payment verified successfully')
      setVerifyTarget(null)
      setVerifyRemarks('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify payment')
    } finally {
      setVerifying(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectRemarks.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setRejecting(true)
    try {
      const res = await rejectPayment(rejectTarget.id, rejectRemarks)
      setPayments((prev) => prev.map((p) => (p.id === rejectTarget.id ? { ...p, ...res.data.payment } : p)))
      void refreshNotifications()
      toast.success('Payment rejected')
      setRejectTarget(null)
      setRejectRemarks('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject payment')
    } finally {
      setRejecting(false)
    }
  }

  const openPreview = (url: string) => {
    setPreviewFailed(false)
    setPreviewUrl(url)
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and verify patient payment screenshots</p>
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-1.5 flex gap-1">
          {(['all', 'pending', 'verified', 'rejected'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === s
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {s === 'pending' && <Clock size={13} />}
              {s === 'verified' && <CheckCircle2 size={13} />}
              {s === 'rejected' && <XCircle size={13} />}
              {s === 'all' && <Filter size={13} />}
              {s} ({counts[s]})
            </button>
          ))}
        </GlassCard>
      </motion.div>

      {/* Payments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments found" description="No payments match the current filter." />
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {filtered.map((payment) => (
            <GlassCard key={payment.id} className="p-5">
              <div className="flex items-start gap-4">
                {/* Screenshot thumbnail */}
                <div
                  className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border/50 bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => payment.screenshotUrl && openPreview(payment.screenshotUrl)}
                >
                  {payment.screenshotUrl ? (
                    <PaymentProofImage
                      src={resolveAssetUrl(payment.screenshotUrl)}
                      alt="Payment screenshot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{payment.patientName}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {payment.service} · {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {payment.transactionReference && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ref: <span className="font-mono">{payment.transactionReference}</span>
                    </p>
                  )}
                  {payment.remarks && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">Remarks: {payment.remarks}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-2">
                  {payment.screenshotUrl && (
                    <button
                      onClick={() => openPreview(payment.screenshotUrl!)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-all"
                    >
                      <Eye size={13} />
                      View
                    </button>
                  )}
                  {payment.status === 'pending' && payment.screenshotUrl && (
                    <>
                      <button
                        onClick={() => setVerifyTarget(payment)}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <CheckCircle2 size={13} />
                        Verify
                      </button>
                      <button
                        onClick={() => setRejectTarget(payment)}
                        className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <XCircle size={13} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* Screenshot preview modal */}
      <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Payment Screenshot">
        {previewUrl && (
          <div className="space-y-3">
            <div className="flex justify-center">
              {previewFailed ? (
                <div className="flex min-h-72 w-full max-w-lg flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/40 p-6 text-center">
                  <CreditCard size={28} className="mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Screenshot file could not be loaded.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The payment record has an image URL, but the backend did not return an image for it.
                  </p>
                </div>
              ) : (
                <img
                  src={resolveAssetUrl(previewUrl)}
                  alt="Payment screenshot"
                  className="max-h-[70vh] max-w-full rounded-xl object-contain"
                  onError={() => setPreviewFailed(true)}
                />
              )}
            </div>
            <div className="flex justify-center">
              <a
                href={resolveAssetUrl(previewUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                Open image in new tab
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Verify modal */}
      <Modal
        open={!!verifyTarget}
        onClose={() => { setVerifyTarget(null); setVerifyRemarks('') }}
        title="Verify Payment"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify payment from <strong>{verifyTarget?.patientName}</strong> for{' '}
            <strong>{verifyTarget?.service}</strong>? An email notification will be sent to the patient.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Remarks <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              placeholder="Add any notes for the patient..."
              rows={3}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setVerifyTarget(null); setVerifyRemarks('') }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {verifying ? 'Verifying…' : 'Confirm Verify'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectRemarks('') }}
        title="Reject Payment"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reject payment from <strong>{rejectTarget?.patientName}</strong>? The patient will be notified to re-upload.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Screenshot is unclear, amount doesn't match..."
              rows={3}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setRejectTarget(null); setRejectRemarks('') }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting || !rejectRemarks.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-all"
            >
              {rejecting ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
