'use client'

import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import GlassCard from '@/components/shared/GlassCard'
import Modal from '@/components/shared/Modal'
import EmptyState from '@/components/shared/EmptyState'
import { createPsychologist, getPsychologists, setPsychologistActive, type Psychologist } from '@/lib/api/client'

export default function PsychologistsPage() {
  const [team, setTeam] = useState<Psychologist[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const load = useCallback(async () => {
    try { setTeam((await getPsychologists()).data.psychologists) } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load psychologists') }
  }, [])
  useEffect(() => { load() }, [load])
  const submit = async () => {
    setSaving(true)
    try {
      await createPsychologist(form)
      toast.success('Psychologist added')
      setOpen(false); setForm({ name: '', email: '', phone: '', password: '' }); load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not add psychologist') } finally { setSaving(false) }
  }
  const toggle = async (person: Psychologist) => {
    try { await setPsychologistActive(person.id, !person.isActive); load() } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update psychologist') }
  }
  return <div className="mx-auto w-full max-w-5xl space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="wellness-heading text-3xl">Psychologist Team</h1><p className="text-muted-foreground">Manage team access and appointment workload.</p></div><button onClick={() => setOpen(true)} className="glass-button"><UserPlus size={17} /> Add Psychologist</button></div>
    {team.length === 0 ? <EmptyState icon={Users} title="No psychologists yet" description="Add a team member to begin assigning appointments." /> : <div className="grid gap-4 sm:grid-cols-2">{team.map((person) => <GlassCard key={person.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">{person.name}</h2><p className="text-sm text-muted-foreground">{person.email}</p>{person.phone && <p className="text-sm text-muted-foreground">{person.phone}</p>}</div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${person.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{person.isActive ? 'Active' : 'Inactive'}</span></div><div className="mt-5 flex gap-5 text-sm"><span><b>{person.assignedAppointmentCount}</b> appointments</span><span><b>{person.assignedPatientCount}</b> patients</span></div><button onClick={() => toggle(person)} className="glass-button-outline mt-5 text-sm">{person.isActive ? 'Deactivate' : 'Activate'}</button></GlassCard>)}</div>}
    <Modal open={open} onClose={() => setOpen(false)} title="Add psychologist" description="This creates a psychologist account using the existing secure login system." footer={<><button className="glass-button-outline" onClick={() => setOpen(false)}>Cancel</button><button className="glass-button" disabled={saving || !form.name || !form.email || form.password.length < 8} onClick={submit}>{saving ? 'Adding...' : 'Add psychologist'}</button></>}><div className="space-y-3">{(['name','email','phone','password'] as const).map((key) => <input key={key} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} placeholder={key === 'password' ? 'Temporary password (8+ characters)' : key[0].toUpperCase() + key.slice(1)} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />)}</div></Modal>
  </div>
}
