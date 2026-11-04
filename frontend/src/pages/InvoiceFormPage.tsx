import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createInvoice, updateInvoice } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { InvoiceItemRow } from '../components/InvoiceItemRow'
import { Add, Trash2 } from 'lucide-react'
import { formatCurrency } from '../utils/format'

export function InvoiceFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    invoice_number: '',
    client_id: '',
    contract_id: '',
    status: 'draft',
    issued_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 0,
    payment_terms: 'Net 30',
    items: [
      { description: '', quantity: 1, unit_price: 0 },
    ],
  })

  useEffect(() => {
    if (id) {
      ;(async () => {
        try {
          const res = await fetch(`/api/invoices/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('starcore_token')}` },
          })
          if (res.ok) {
            const data = await res.json()
            setForm({
              ...data,
              issued_date: data.issued_date?.split('T')[0] || '',
              due_date: data.due_date?.split('T')[0] || '',
              items: data.items?.map((it: any) => ({
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
              })) || [{ description: '', quantity: 1, unit_price: 0 }],
            })
          }
        } catch {}
      })()
    }
  }, [id])

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] })
  }

  function removeItem(index: number) {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  function subtotal() {
    return form.items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  }
  function tax() {
    return subtotal() * (form.tax_rate / 100)
  }
  function total() {
    return subtotal() + tax()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        client_id: form.client_id,
        contract_id: form.contract_id || undefined,
        tax_rate: Number(form.tax_rate) || 0,
        items: form.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
        })),
      }
      if (id) {
        await updateInvoice(id, payload)
      } else {
        await createInvoice(payload)
      }
      toast.success(id ? 'Invoice updated' : 'Invoice created')
      navigate('/invoices')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" asChild>
          <a href="/invoices">Back to invoices</a>
        </Button>
      </div>
      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-star-900">{id ? 'Edit Invoice' : 'New Invoice'}</h2>
          <Badge status={form.status} label={form.status.toUpperCase()} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Invoice Number *</label>
              <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="INV-2024-001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Client *</label>
              <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
                <option value="">Select client</option>
                <option value="client1">Acme Corp</option>
                <option value="client2">Globex Inc</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Contract</label>
              <Select value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })}>
                <option value="">— Link to contract —</option>
                <option value="contract1">CRM Module — Q3 License</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Status</label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Issued date</label>
              <input type="date" className="input" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Due date</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Tax rate (%)</label>
              <Input type="number" step="0.1" min="0" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-star-700 mb-1">Payment terms</label>
              <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" />
            </div>
          </div>

          <div className="border-t border-star-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-star-700">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Add className="w-4 h-4 mr-1" /> Add item
              </Button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <InvoiceItemRow key={idx} item={item} index={idx} onUpdate={updateItem} onRemove={removeItem} />
              ))}
            </div>

            <div className="mt-6 ml-auto w-full max-w-xs bg-star-50 rounded-lg p-4 border border-star-200">
              <div className="flex justify-between text-sm">
                <span className="text-star-600">Subtotal</span>
                <span className="font-medium text-star-900">{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-star-600">Tax ({form.tax_rate}%)</span>
                <span className="font-medium text-star-900">{formatCurrency(tax())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-star-200 pt-2">
                <span className="text-star-900">Total</span>
                <span className="text-star-700">{formatCurrency(total())}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-star-100">
            <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}