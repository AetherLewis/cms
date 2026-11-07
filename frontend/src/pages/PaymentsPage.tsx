import { useState, useEffect } from 'react'
import { listPayments, createPayment, listInvoices, deletePayment } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Plus, Trash2, CreditCard, X } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'

export function PaymentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ invoiceId: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'mpesa', reference: '' })

  useEffect(() => {
    loadPayments()
    listInvoices().then((data) => setInvoices(data || [])).catch(() => undefined)
  }, [])

  async function loadPayments() {
    setLoading(true)
    try {
      const data = await listPayments()
      setItems(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createPayment({ ...form, amount: Number(form.amount) })
      toast.success('Payment recorded')
      setModalOpen(false)
      setForm({ invoiceId: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'mpesa', reference: '' })
      await loadPayments()
    } catch (error: any) { toast.error(error.message || 'Could not record payment') }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this payment record?')) return
    try { await deletePayment(id); setItems((current) => current.filter((item) => item.id !== id)); toast.success('Payment removed') }
    catch (error: any) { toast.error(error.message || 'Could not remove payment') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Payments</h1>
          <p className="text-star-500 mt-1">Record payments against invoices and track cash flow.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Record Payment</Button>
      </div>

      <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-star-400">No payments recorded.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-star-50 border-b border-star-100">
              <tr>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Invoice</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Amount</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Date</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Method</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Reference</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {items.map((p: any) => (
                <tr key={p.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell font-medium text-star-900">{p.invoices?.invoice_number || '—'}</td>
                  <td className="table-cell font-semibold text-star-900">{formatCurrency(p.amount)}</td>
                  <td className="table-cell text-sm text-star-500">{formatDate(p.payment_date)}</td>
                  <td className="table-cell text-xs text-star-600">{p.payment_method || 'bank_transfer'}</td>
                  <td className="table-cell text-xs text-star-500">{p.reference || '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => handleDelete(p.id)} aria-label="Delete payment" className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="payment-modal-title" className="text-lg font-semibold text-slate-900">Record incoming payment</h2><p className="mt-1 text-sm text-slate-500">Reconcile a payment against an invoice.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></header><form onSubmit={handleCreate} className="space-y-4 p-6"><label className="block text-sm font-medium text-slate-700">Invoice<select required value={form.invoiceId} onChange={(e) => { const invoice = invoices.find((item) => item.id === e.target.value); setForm({ ...form, invoiceId: e.target.value, amount: invoice ? String(invoice.total) : form.amount }) }} className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2"><option value="">Select an invoice</option>{invoices.filter((invoice) => invoice.status !== 'paid').map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {invoice.clients?.name || invoice.clients?.[0]?.name || 'Client'} · {formatCurrency(invoice.total)}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Amount<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Payment date<input required type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label></div><label className="block text-sm font-medium text-slate-700">Payment method<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2"><option value="mpesa">M-Pesa</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option></select></label><label className="block text-sm font-medium text-slate-700">Reference<input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. M-Pesa transaction code" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label><footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" disabled={!form.invoiceId || !form.amount}>Save payment</Button></footer></form></section></div>}
    </div>
  )
}
