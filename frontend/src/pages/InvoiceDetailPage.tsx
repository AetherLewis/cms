import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvoice } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatCurrency, formatDate } from '../utils/format'
import { Download, Mail, ArrowLeft, Edit, Clock, Calendar, DollarSign, CreditCard } from 'lucide-react'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const data = await getInvoice(id)
        setInvoice(data)
      } catch (e: any) {
        toast.error(e.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <div className="p-8 text-center text-star-400">Loading invoice…</div>
  if (!invoice) return <div className="p-8 text-center text-star-400">Invoice not found.</div>

  const client = invoice.clients?.[0]
  const contract = invoice.contracts?.[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="primary">
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status={invoice.status} label={invoice.status.toUpperCase()} />
              {contract && <Badge type={contract.contract_type} />}
            </div>
            <h1 className="text-2xl font-bold text-star-900">{invoice.invoice_number}</h1>
            <p className="text-star-500 mt-1">
              {client?.name || 'Unknown Client'} {client?.email && <span className="mx-2">•</span>} {client?.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-star-700">{formatCurrency(invoice.total)}</p>
            <p className="text-sm text-star-500">Total Amount</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-star-50 rounded-lg">
            <Calendar className="w-5 h-5 text-star-600" />
            <div>
              <p className="text-star-400">Issued</p>
              <p className="font-medium text-star-900">{formatDate(invoice.issued_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-star-50 rounded-lg">
            <Clock className="w-5 h-5 text-star-600" />
            <div>
              <p className="text-star-400">Due</p>
              <p className="font-medium text-star-900">{formatDate(invoice.due_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-star-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-star-600" />
            <div>
              <p className="text-star-400">Terms</p>
              <p className="font-medium text-star-900">{invoice.payment_terms}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-star-100 bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-star-50 border-b border-star-100">
            <tr>
              <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Description</th>
              <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider text-right">Qty</th>
              <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider text-right">Unit Price</th>
              <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-star-100">
            {(invoice.items || []).map((item: any) => (
              <tr key={item.id || item.description} className="hover:bg-star-50">
                <td className="table-cell text-star-700">{item.description}</td>
                <td className="table-cell text-right text-star-500">{item.quantity}</td>
                <td className="table-cell text-right text-star-500">{formatCurrency(item.unit_price)}</td>
                <td className="table-cell text-right font-medium text-star-900">{formatCurrency(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-star-50 border-t border-star-100">
            <tr>
              <td colSpan={3} className="table-cell text-right font-semibold text-star-700">Subtotal</td>
              <td className="table-cell text-right font-semibold text-star-900">{formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="table-cell text-right font-semibold text-star-700">Tax ({invoice.tax_rate}%)</td>
              <td className="table-cell text-right font-semibold text-star-900">{formatCurrency(invoice.tax_amount)}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={3} className="table-cell text-right text-lg text-star-900">Total</td>
              <td className="table-cell text-right text-lg text-star-700">{formatCurrency(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.paid_date && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-bold text-green-700">Paid on {formatDate(invoice.paid_date)}</p>
            <p className="text-sm text-green-600">This invoice has been fully paid.</p>
          </div>
        </div>
      )}
    </div>
  )
}

