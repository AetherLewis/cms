import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createContract, updateContract, getContract, listClients, listDocuments } from '../utils/api'
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
  const [clients, setClients] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
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
    document_id: '',
  })

  useEffect(() => {
    listClients().then((data) => setClients(data || [])).catch((error) => toast.error(error.message || 'Could not load clients'))
    listDocuments().then((data) => setDocuments((data || []).filter((document: any) => document.document_type === 'contract'))).catch((error) => toast.error(error.message || 'Could not load documents'))
    if (id) {
      // fetch existing contract
      ;(async () => {
        try {
          const data = await getContract(id)
            setClientId(data.client_id || data.clients?.id || data.clients?.[0]?.id || '')
            setForm({
              ...data,
              value: String(data.value ?? ''),
              start_date: data.start_date?.split('T')[0] || '',
              end_date: data.end_date?.split('T')[0] || '',
            })
        } catch {}
      })()
    }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        contractType: form.contract_type,
        status: form.status,
        startDate: form.start_date ? new Date(form.start_date).toISOString() : undefined,
        endDate: form.end_date ? new Date(form.end_date).toISOString() : undefined,
        paymentTerms: form.payment_terms,
        clientId,
        value: Number(form.value) || undefined,
        currency: form.currency,
        fileUrl: form.file_url || undefined,
        documentId: form.document_id || undefined,
      }
      if (id) {
        await updateContract(id, {
          title: form.title,
          description: form.description,
          client_id: clientId,
          contract_type: form.contract_type,
          status: form.status,
          start_date: payload.startDate,
          end_date: payload.endDate,
          value: payload.value,
          currency: form.currency,
          payment_terms: form.payment_terms,
          file_url: form.file_url || null,
          document_id: form.document_id || null,
        })
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-star-700 mb-1">Attach Document</label>
            <Select value={form.document_id} onChange={(e) => setForm({ ...form, document_id: e.target.value })}>
              <option value="">— No document attached —</option>
              {documents.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Client *</label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="" disabled>Select a client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.email}</option>)}
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
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Lifecycle status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></Select>
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
