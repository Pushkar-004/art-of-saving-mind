'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Upload, Save, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import { Skeleton } from '@/components/shared/Skeleton'
import { getPaymentSettings, updatePaymentSettings, type PaymentSettings } from '@/lib/api/client'

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [clinicName, setClinicName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [instructions, setInstructions] = useState('')
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getPaymentSettings()
        const s = res.data.settings
        setSettings(s)
        setClinicName(s.clinicName)
        setUpiId(s.upiId)
        setInstructions(s.paymentInstructions ?? '')
        setQrImageUrl(s.qrImageUrl)
        setQrPreview(s.qrImageUrl)
      } catch {
        toast.error('Failed to load payment settings')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setQrPreview(dataUrl)
      setQrImageUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updatePaymentSettings({
        clinicName: clinicName || undefined,
        upiId: upiId || undefined,
        qrImageUrl: qrImageUrl,
        paymentInstructions: instructions || null,
      })
      setSettings(res.data.settings)
      toast.success('Payment settings updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Payment Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure UPI details shown to patients after booking</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Clinic Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Art of Saving Mind"
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="8766804788@ybl"
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {/* QR Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">QR Code Image</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border/50 bg-black flex items-center justify-center">
                  {qrPreview ? (
                    <Image
                      src={qrPreview}
                      alt="QR Preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <QrCode size={32} className="text-muted-foreground" />
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                  <label
                    htmlFor="qr-upload"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-all text-sm text-muted-foreground"
                  >
                    <Upload size={16} />
                    {qrPreview ? 'Change QR image' : 'Upload QR image'}
                  </label>
                  <input
                    id="qr-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleQrChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">PNG or JPG recommended · 500×500px or larger</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Payment Instructions <span className="text-muted-foreground font-normal">(shown to patient)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions for completing the UPI payment..."
                rows={4}
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
