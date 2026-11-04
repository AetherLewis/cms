import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../utils/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from 'react-hot-toast'
import { Settings2, Building, Mail, CreditCard } from 'lucide-react'

export function SettingsPage() {
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    company_email: '',
    company_logo: '',
    invoice_prefix: 'INV',
    currency: 'USD',
    tax_rate: 0,
    payment_terms: 'Net 30',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getSettings()
        setForm({ ...form, ...data })
      } catch (e: any) {
        console.error('Failed to load settings:', e)
      }
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(form)
      toast.success('Settings saved')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-star-900">Settings</h1>
        <p className="text-star-500 mt-1">Business details, tax settings, and invoice defaults.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-star-100 bg-white p-6 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Company Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-star-400" />
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="pl-10" placeholder="StarCore Inc" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Company Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-star-400" />
              <Input type="email" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} className="pl-10" placeholder="hello@starcore.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Address</label>
            <Input value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} placeholder="123 Innovation Dr, San Francisco, CA" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Logo URL</label>
            <Input value={form.company_logo} onChange={(e) => setForm({ ...form, company_logo: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Invoice Number Prefix</label>
            <Input value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} placeholder="INV" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Currency</label>
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Tax Rate (%)</label>
            <Input type="number" step="0.1" min="0" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Payment Terms</label>
            <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-star-100">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-star-100 bg-gradient-to-br from-star-700 to-star-950 p-6 shadow-lg text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Settings2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Connect Supabase</h3>
            <p className="text-star-200 text-sm mb-3">Add your <code className="bg-white/10 px-1 rounded text-xs">SUPABASE_URL</code> and <code className="bg-white/10 px-1 rounded text-xs">SUPABASE_ANON_KEY</code> to <code className="bg-white/10 px-1 rounded text-xs">.env</code> in the server directory, then restart the app.</p>
            <Button variant="outline" className="bg-white text-star-900 border-white hover:bg-star-50" asChild>
              <a href="/settings">Go to Settings</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
