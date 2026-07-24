'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Lock, LogOut, Activity, Pill, AlertCircle, ShieldAlert, Plus, X } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { toast } from 'sonner'
import { useAuth } from '@/lib/context/AuthContext'
import { useT } from '@/lib/i18n/useT'
import {
  getMyProfile,
  updateMyProfile,
  getMyMedicalHistory,
  saveMyMedicalHistory,
  getMyEmergencyContact,
  saveMyEmergencyContact,
  type MedicalHistory,
  type EmergencyContact,
} from '@/lib/api/client'

// Simple chip-list editor shared by conditions/medications/allergies —
// same visual language as the read-only chips on the admin patients
// page (DetailBlock in app/dashboard/admin/patients/page.tsx).
function TagListEditor({
  label,
  icon: Icon,
  items,
  onChange,
}: {
  label: string
  icon: typeof Activity
  items: string[]
  onChange: (items: string[]) => void
}) {
  const { t } = useT()
  const [draft, setDraft] = useState('')

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    if (items.includes(value)) {
      setDraft('')
      return
    }
    onChange([...items, value])
    setDraft('')
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Icon size={16} className="text-primary" />
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.none')}</p>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={t('profile.removeItem', { item })}
                className="text-secondary-foreground/60 hover:text-destructive"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder={t('profile.addItemPlaceholder', { label: label.toLowerCase() })}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center rounded-lg border border-border px-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('profile.addToLabel', { label })}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useT()
  const { user } = useAuth()

  // ---- Profile state ----
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // ---- Medical history state ----
  const [medicalLoading, setMedicalLoading] = useState(true)
  const [medicalSaving, setMedicalSaving] = useState(false)
  const [conditions, setConditions] = useState<string[]>([])
  const [medications, setMedications] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])

  // ---- Emergency contact state ----
  const [contactLoading, setContactLoading] = useState(true)
  const [contactSaving, setContactSaving] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactRelationship, setContactRelationship] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        setName(res.data.profile.name)
        setEmail(res.data.profile.email)
        setPhone(res.data.profile.phone ?? '')
      })
      .catch(() => {
        // Fall back to whatever AuthContext already has — keeps the
        // form usable even if this fetch fails for some reason.
        if (user) {
          setName(user.name)
          setEmail(user.email)
        }
      })
      .finally(() => setProfileLoading(false))

    getMyMedicalHistory()
      .then((res) => {
        setConditions(res.data.medicalHistory.conditions)
        setMedications(res.data.medicalHistory.medications)
        setAllergies(res.data.medicalHistory.allergies)
      })
      .catch(() => {
        // No record yet, or fetch failed — leave lists empty so the
        // patient can still start adding entries.
      })
      .finally(() => setMedicalLoading(false))

    getMyEmergencyContact()
      .then((res) => {
        const contact: EmergencyContact | null = res.data.emergencyContact
        if (contact) {
          setContactName(contact.name)
          setContactRelationship(contact.relationship)
          setContactPhone(contact.phone)
          setContactEmail(contact.email ?? '')
        }
      })
      .catch(() => {
        // No contact saved yet — leave fields blank.
      })
      .finally(() => setContactLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      await updateMyProfile({ name, email, phone })
      toast.success(t('toast.profileUpdated'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.profileUpdateFailed'))
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveMedicalHistory = async () => {
    setMedicalSaving(true)
    try {
      const payload: Partial<MedicalHistory> = { conditions, medications, allergies }
      await saveMyMedicalHistory(payload)
      toast.success(t('toast.medicalHistorySaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.medicalHistorySaveFailed'))
    } finally {
      setMedicalSaving(false)
    }
  }

  const handleSaveEmergencyContact = async () => {
    if (!contactName.trim() || !contactRelationship.trim() || !contactPhone.trim()) {
      toast.error(t('toast.emergencyContactRequired'))
      return
    }
    setContactSaving(true)
    try {
      await saveMyEmergencyContact({
        name: contactName,
        relationship: contactRelationship,
        phone: contactPhone,
        email: contactEmail || null,
      })
      toast.success(t('toast.emergencyContactSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.emergencyContactSaveFailed'))
    } finally {
      setContactSaving(false)
    }
  }

  const displayInitial = (name || user?.name || '?').charAt(0).toUpperCase()

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('profile.settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('profile.settingsSubtitle')}</p>
      </div>

      {/* Profile Section */}
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border/50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {displayInitial}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{name || t('profile.loadingName')}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('profile.fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={profileLoading}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('profile.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={profileLoading}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('profile.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={profileLoading}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={profileLoading || profileSaving}
              className="glass-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Medical History */}
      <GlassCard>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <Activity size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('profile.medicalHistory')}</h2>
          </div>

          {medicalLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <div className="space-y-5">
              <TagListEditor label={t('profile.conditions')} icon={Activity} items={conditions} onChange={setConditions} />
              <TagListEditor label={t('profile.medications')} icon={Pill} items={medications} onChange={setMedications} />
              <TagListEditor label={t('profile.allergies')} icon={AlertCircle} items={allergies} onChange={setAllergies} />

              <button
                onClick={handleSaveMedicalHistory}
                disabled={medicalSaving}
                className="glass-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {medicalSaving ? t('common.saving') : t('profile.saveMedicalHistory')}
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Emergency Contact */}
      <GlassCard>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <ShieldAlert size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('profile.emergencyContact')}</h2>
          </div>

          {contactLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('profile.contactName')}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('profile.contactNamePlaceholder')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('profile.relationship')}</label>
                <input
                  type="text"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  placeholder={t('profile.relationshipPlaceholder')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('profile.phone')}</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={t('profile.contactPhonePlaceholder')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('profile.contactEmailOptional')}</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={t('profile.contactEmailPlaceholder')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleSaveEmergencyContact}
                disabled={contactSaving}
                className="glass-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contactSaving ? t('common.saving') : t('profile.saveEmergencyContact')}
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Notification Settings */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <Bell size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('profile.notificationsSection')}</h2>
          </div>

          <div className="space-y-3">
            {[t('profile.appointmentReminders'), t('profile.weeklyProgressReports'), t('profile.wellnessTips')].map((setting) => (
              <div key={setting} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="font-medium text-foreground">{setting}</span>
                <input type="checkbox" defaultChecked className="rounded accent-primary" />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Privacy Settings */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <Lock size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('profile.privacyAndSecurity')}</h2>
          </div>

          <button className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground font-medium text-left">
            {t('buttons.changePassword')}
          </button>

          <div className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">
            <p>{t('profile.lastLogin')}</p>
          </div>
        </div>
      </GlassCard>

      {/* Logout */}
      <GlassCard>
        <button
          onClick={() => {
            toast.success(t('toast.loggedOut'))
            window.location.href = '/auth/login'
          }}
          className="glass-button-outline w-full flex items-center justify-center gap-2 text-destructive border-destructive"
        >
          <LogOut size={20} />
          {t('profile.logout')}
        </button>
      </GlassCard>
    </motion.div>
  )
}
