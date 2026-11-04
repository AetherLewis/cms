import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createContract, updateContract } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { Loader2 } from 'lucide-react'

export function ContractFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientId, setClientId] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    contract_type: 'Fixed Price',
    status: 'draft',
    start_date: '',
    end_date: '',
    value: '',
    currency: 'USD',
    payment_terms: 'Net 30',
    file_url: '',
  })

  useEffect(() => {
    if (id) {
      // fetch existing contract
      ;(async () => {
        try {
          const res = await fetch(`/api/contracts/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('starcore_token')}` },
          })
          if (res.ok) {
            const data = await res.json()
            setForm({
              ...data,
              value: String(data.value ?? ''),
              start_date: data.start_date?.split('T')[0] || '',
              end_date: data.end_date?.split('T')[0] || '',
            })
          }
        } catch {}
      })()
    }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        ...form,
        value: Number(form.value) || undefined,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
        currency: form.currency,
      }
      delete payload.file_url
      if (id) {
        await updateContract(id, payload)
      } else {
        await createContract(payload)
      }
      toast.success(id ? 'Contract updated' : 'Contract created')
      navigate('/contracts')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" asChild>
          <a href="/contracts">Back to contracts</a>
        </Button>
      </div>
      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-star-900 mb-4">
          {id ? 'Edit Contract' : 'New Contract'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="CRM Module — Q3 License Agreement" required />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-star-700 mb-1">Description</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope of work, deliverables..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Client *</label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="" disabled>Select a client</option>
              {/* fetch clients */}
              <option value="client1">Acme Corp</option>
              <option value="client2">Globex Inc</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Contract Type</label>
            <Select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
              <option>Fixed Price</option>
              <option>Time &amp; Materials</option>
              <option>Subscription / SaaS</option>
              <option>Royalty / Revenue Share</option>
            </Select>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Start date</label>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">End date</label>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-star-700 mb-1">Value</label>
            <Input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Currency</label>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Payment Terms</label>
            <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>Cancel</Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
