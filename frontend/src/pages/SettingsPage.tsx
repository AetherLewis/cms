import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../utils/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from 'react-hot-toast'
import { Building, FileText, Mail, Save, Settings2 } from 'lucide-react'

type SettingsForm = {
  company_name: string
  company_address: string
  company_email: string
  company_logo: string
  tax_pin: string
  invoice_prefix: string
  currency: string
  tax_rate: number
  payment_terms: string
}

const initialForm: SettingsForm = {
  company_name: '', company_address: '', company_email: '', company_logo: '', tax_pin: '',
  invoice_prefix: 'INV', currency: 'KES', tax_rate: 0, payment_terms: 'Net 30',
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'company' | 'billing'>('company')

  useEffect(() => {
    getSettings().then((data) => setForm((current) => ({ ...current, ...data }))).catch(() => undefined)
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await updateSettings(form)
      toast.success('Company settings saved')
    } catch (error: any) {
      toast.error(error.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const update = (key: keyof SettingsForm, value: string | number) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Workspace administration</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Company settings</h1><p className="mt-1 text-sm text-slate-500">Manage your organization profile, tax details, and invoice defaults.</p></header>
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
          <button type="button" aria-current={tab === 'company' ? 'page' : undefined} onClick={() => setTab('company')} className={`flex shrink-0 items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium ${tab === 'company' ? 'bg-indigo-50 text-indigo-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Building className="h-4 w-4" />Company profile</button>
          <button type="button" aria-current={tab === 'billing' ? 'page' : undefined} onClick={() => setTab('billing')} className={`flex shrink-0 items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium ${tab === 'billing' ? 'bg-indigo-50 text-indigo-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><FileText className="h-4 w-4" />Invoicing defaults</button>
        </nav>
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">{tab === 'company' ? 'Legal entity & business profile' : 'Invoice defaults & payment terms'}</h2><p className="mt-1 text-sm text-slate-500">{tab === 'company' ? 'These details appear on client facing documents.' : 'Choose the defaults used when new invoices are prepared.'}</p></div>
          {tab === 'company' ? <div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Legal company name<Input className="mt-1.5" value={form.company_name} onChange={(event) => update('company_name', event.target.value)} placeholder="StarCore Solutions Ltd" /></label>
            <label className="text-sm font-medium text-slate-700">Company email<div className="relative mt-1.5"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input type="email" className="pl-10" value={form.company_email} onChange={(event) => update('company_email', event.target.value)} placeholder="billing@company.com" /></div></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Registered address<Input className="mt-1.5" value={form.company_address} onChange={(event) => update('company_address', event.target.value)} placeholder="Street, city, country" /></label>
            <label className="text-sm font-medium text-slate-700">Tax PIN / VAT number<Input className="mt-1.5" value={form.tax_pin} onChange={(event) => update('tax_pin', event.target.value)} placeholder="Tax registration number" /></label>
            <label className="text-sm font-medium text-slate-700">Logo URL<Input className="mt-1.5" value={form.company_logo} onChange={(event) => update('company_logo', event.target.value)} placeholder="https://..." /></label>
          </div> : <div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Invoice number prefix<Input className="mt-1.5" value={form.invoice_prefix} onChange={(event) => update('invoice_prefix', event.target.value)} placeholder="INV" /></label>
            <label className="text-sm font-medium text-slate-700">Default currency<select className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5" value={form.currency} onChange={(event) => update('currency', event.target.value)}><option value="KES">KES · Kenyan Shilling</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option></select></label>
            <label className="text-sm font-medium text-slate-700">Default tax rate (%)<Input className="mt-1.5" type="number" step="0.1" min="0" value={form.tax_rate} onChange={(event) => update('tax_rate', Number(event.target.value))} /></label>
            <label className="text-sm font-medium text-slate-700">Payment terms<Input className="mt-1.5" value={form.payment_terms} onChange={(event) => update('payment_terms', event.target.value)} placeholder="Net 30" /></label>
            <div className="rounded-md bg-indigo-50 p-4 text-sm text-indigo-900 sm:col-span-2"><Settings2 className="mb-2 h-4 w-4" />These defaults are available when creating invoices. Existing invoices keep their saved terms and tax.</div>
          </div>}
          <footer className="flex justify-end border-t border-slate-100 px-6 py-4"><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save settings'}</Button></footer>
        </form>
      </div>
    </div>
  )
}
