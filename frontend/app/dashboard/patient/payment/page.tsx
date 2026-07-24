'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  AlertCircle,
  ArrowLeft,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import { Skeleton } from '@/components/shared/Skeleton'
import { useT } from '@/lib/i18n/useT'
import {
  getPaymentForAppointment,
  getPaymentSettings,
  uploadPaymentProof,
  createRazorpayOrder,
  verifyRazorpayPayment,
  type Payment,
  type PaymentSettings,
} from '@/lib/api/client'
import { useNotifications } from '@/lib/context/NotificationContext'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

function StatusBadge({ status }: { status: Payment['status'] }) {
  const { t } = useT()
  const map = {
    pending: { label: t('payment.statusPendingReview'), color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    verified: { label: t('payment.statusVerified'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: t('payment.statusRejected'), color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  }
  const { label, color, icon: Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
      <Icon size={14} />
      {label}
    </span>
  )
}

export default function PaymentPage() {
  const { t } = useT()
  const { refreshNotifications } = useNotifications()
  const searchParams = useSearchParams()
  const router = useRouter()
  const appointmentId = searchParams.get('appointmentId')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [txRef, setTxRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [payingOnline, setPayingOnline] = useState(false)
  const [sandboxOrder, setSandboxOrder] = useState<{
    orderId: string
    amount: number
    clinicName: string
    description: string
  } | null>(null)

  const load = useCallback(async () => {
    if (!appointmentId) return
    setIsLoading(true)
    try {
      const [payRes, settingsRes] = await Promise.all([
        getPaymentForAppointment(appointmentId),
        getPaymentSettings(),
      ])
      setPayment(payRes.data.payment)
      setSettings(settingsRes.data.settings)
    } catch {
      toast.error(t('toast.paymentDetailsLoadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => { load() }, [load])

  const handleCopyUpi = async () => {
    if (!settings) return
    await navigator.clipboard.writeText(settings.upiId)
    setCopied(true)
    toast.success(t('toast.upiCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('toast.onlyImagesAllowed'))
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t('toast.imageTooLarge', { size: MAX_SIZE_MB }))
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    // Local preview using object URL (no base64, no storage)
    setUploadPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointmentId || !selectedFile) {
      toast.error(t('toast.uploadScreenshotRequired'))
      return
    }
    setSubmitting(true)
    try {
      const res = await uploadPaymentProof(appointmentId, selectedFile, txRef || undefined)
      setPayment(res.data.payment)
      void refreshNotifications()
      toast.success(t('toast.paymentSubmitted'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('toast.paymentSubmitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRazorpayPayment = async () => {
    if (!appointmentId) return
    setPayingOnline(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load Razorpay SDK. Please check your network connection.')
        setPayingOnline(false)
        return
      }

      const res = await createRazorpayOrder(appointmentId)
      const order = res.data.order

      // If server returned Sandbox mode mock order (API keys unset in backend/.env), show interactive Sandbox Simulator
      if (order.keyId === 'rzp_test_mock_sandbox') {
        setSandboxOrder({
          orderId: order.orderId,
          amount: order.amount,
          clinicName: order.clinicName,
          description: order.description,
        })
        setPayingOnline(false)
        return
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.clinicName,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: {
          color: '#3b82f6',
        },
        handler: async function (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) {
          try {
            const verifyRes = await verifyRazorpayPayment(appointmentId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setPayment(verifyRes.data.payment)
            void refreshNotifications()
            toast.success('Online payment verified successfully!')
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: function () {
            setPayingOnline(false)
          },
        },
      }

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay
      const rzp = new RazorpayConstructor(options)
      rzp.open()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not initiate Razorpay payment')
      setPayingOnline(false)
    }
  }

  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <GlassCard className="p-8 text-center max-w-md space-y-4">
          <AlertCircle className="mx-auto text-destructive" size={44} />
          <h2 className="text-lg font-semibold text-foreground">{t('payment.missingAppointmentTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('payment.missingAppointmentDesc')}</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/patient/appointments')}
            className="rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 text-sm hover:bg-primary/90 transition-colors inline-block"
          >
            {t('payment.viewAppointments')}
          </button>
        </GlassCard>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  const canResubmit = payment?.status === 'rejected' || payment?.status === 'pending'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Razorpay Sandbox Test Simulator Modal */}
      {sandboxOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-background border border-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                  Razorpay Dev Sandbox
                </span>
                <span className="text-sm opacity-90">Test Mode</span>
              </div>
              <h3 className="text-xl font-bold mt-2">{sandboxOrder.clinicName}</h3>
              <p className="text-sm opacity-90">{sandboxOrder.description}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Amount Payable</span>
                <span className="text-2xl font-bold text-foreground">
                  ₹{(sandboxOrder.amount / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-muted/60 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>Note:</strong> Real Razorpay API keys (<code className="bg-muted px-1 py-0.5 rounded">RAZORPAY_KEY_ID</code>) are not set in <code className="bg-muted px-1 py-0.5 rounded">backend/.env</code> right now. This simulator allows you to test the complete online payment verification & notification flow without real keys or money.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSandboxOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setPayingOnline(true)
                      const mockPaymentId = `pay_mock_${Date.now()}`
                      const verifyRes = await verifyRazorpayPayment(appointmentId, {
                        razorpay_order_id: sandboxOrder.orderId,
                        razorpay_payment_id: mockPaymentId,
                        razorpay_signature: 'mock_signature_sandbox_mode',
                      })
                      setPayment(verifyRes.data.payment)
                      void refreshNotifications()
                      toast.success('Online payment verified successfully (Sandbox Mode)!')
                      setSandboxOrder(null)
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Verification failed')
                    } finally {
                      setPayingOnline(false)
                    }
                  }}
                  disabled={payingOnline}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20 text-sm"
                >
                  {payingOnline ? 'Verifying...' : 'Simulate Success Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={t('common.goBack')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t('payment.completePayment')}</h1>
          <p className="text-sm text-muted-foreground">{t('payment.payViaUpiSubtitle')}</p>
        </div>
      </motion.div>

      {/* Status card — shown once a payment has been submitted */}
      {payment && payment.screenshotUrl && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                {t('payment.paymentStatus')}
              </h2>
              <StatusBadge status={payment.status} />
            </div>
            {payment.remarks && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="font-medium">{t('payment.remarks')}: </span>{payment.remarks}
              </p>
            )}
            {payment.verifiedAt && (
              <p className="text-xs text-muted-foreground">
                {t('payment.reviewedOn')} {new Date(payment.verifiedAt).toLocaleString()}
                {payment.verifiedByName ? ` ${t('payment.by')} ${payment.verifiedByName}` : ''}
              </p>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Payment details card */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {settings?.clinicName ?? t('nav.brandName')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t('payment.scanQrOrUseUpi')}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-black p-4 inline-block">
              {settings?.qrImageUrl ? (
                <Image
                  src={settings.qrImageUrl}
                  alt={t('payment.qrCodeAlt')}
                  width={220}
                  height={220}
                  className="rounded-lg"
                  unoptimized
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  {t('payment.qrNotConfigured')}
                </div>
              )}
            </div>
          </div>

          {/* UPI ID */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{t('payment.upiIdLabel')}</p>
              <p className="font-mono text-base font-semibold text-foreground truncate">
                {settings?.upiId ?? '8766804788@ybl'}
              </p>
            </div>
            <button
              onClick={handleCopyUpi}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? t('buttons.copied') : t('buttons.copy')}
            </button>
          </div>

          {/* Instructions */}
          {settings?.paymentInstructions && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {settings.paymentInstructions}
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Online Razorpay Payment card — shown if payment not yet verified */}
      {(payment?.status !== 'verified') && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 space-y-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Pay Online Instantly (Razorpay)
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pay securely via Cards, UPI, NetBanking, or Wallets and get instant confirmation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={payingOnline}
                className="rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shrink-0"
              >
                <CreditCard size={16} />
                {payingOnline ? 'Initiating Payment...' : 'Pay Online Now'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Upload form — shown if payment not yet verified */}
      {(payment?.status !== 'verified') && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 space-y-5">
            <h2 className="font-semibold text-foreground">{t('payment.uploadPaymentScreenshot')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('payment.paymentScreenshotLabel')} <span className="text-destructive">*</span>
                </label>
                <label
                  htmlFor="screenshot-upload"
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                    uploadPreview
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {uploadPreview ? (
                    <div className="space-y-2 text-center">
                      <Image
                        src={uploadPreview}
                        alt={t('payment.screenshotPreviewAlt')}
                        width={200}
                        height={120}
                        className="mx-auto rounded-lg object-contain max-h-32"
                        unoptimized
                      />
                      <p className="text-xs text-primary font-medium">{t('payment.screenshotSelected')}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        {t('payment.clickToUploadScreenshot')}<br />
                        <span className="text-xs">{t('payment.formatHint')}</span>
                      </p>
                    </>
                  )}
                </label>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>

              {/* Transaction reference */}
              <div>
                <label htmlFor="tx-ref" className="block text-sm font-medium text-foreground mb-2">
                  {t('payment.transactionReference')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
                </label>
                <input
                  id="tx-ref"
                  type="text"
                  placeholder={t('payment.transactionReferencePlaceholder')}
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? t('payment.uploadingAndSubmitting') : canResubmit && payment?.screenshotUrl ? t('payment.resubmitPayment') : t('payment.submitPayment')}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}

