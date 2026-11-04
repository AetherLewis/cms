import { useState, useEffect } from 'react'
import { listPayments, createPayment } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Plus, Trash2, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'

export function PaymentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPayments()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Payments</h1>
          <p className="text-star-500 mt-1">Record payments against invoices and track cash flow.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Record Payment</Button>
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
                    <button className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
