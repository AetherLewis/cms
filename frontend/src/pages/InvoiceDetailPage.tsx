import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvoice, getSettings } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatCurrency, formatDate } from '../utils/format'
import { Download, Mail, ArrowLeft, Edit, Clock, Calendar, DollarSign, CreditCard } from 'lucide-react'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>({})
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

  useEffect(() => {
    getSettings().then(setBusinessProfile).catch(() => undefined)
  }, [])

  if (loading) return <div className="p-8 text-center text-star-400">Loading invoice…</div>
  if (!invoice) return <div className="p-8 text-center text-star-400">Invoice not found.</div>

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients
  const contract = Array.isArray(invoice.contracts) ? invoice.contracts[0] : invoice.contracts
  const attachedDocument = Array.isArray(invoice.documents) ? invoice.documents[0] : invoice.documents

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6 print:hidden">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to invoices
        </Button>
        <div className="flex gap-2">
          {attachedDocument?.file_url && <Button variant="outline" onClick={() => window.open(attachedDocument.file_url, '_blank', 'noopener,noreferrer')}>View Supporting Document</Button>}
          <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
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

    <article className="invoice-print hidden bg-white text-slate-900 font-sans print:block">
      <header className="flex justify-between gap-8 border-b-2 border-slate-800 pb-6">
        <div className="min-w-0">
          {businessProfile.company_logo && <img src={businessProfile.company_logo} alt="Company logo" className="mb-4 max-h-16 max-w-48 object-contain object-left" />}
          <h1 className="text-xl font-bold">{businessProfile.company_name || 'StarCore'}</h1>
          {businessProfile.company_address && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{businessProfile.company_address}</p>}
          {businessProfile.company_email && <p className="text-sm text-slate-600">{businessProfile.company_email}</p>}
          {businessProfile.tax_pin && <p className="text-sm text-slate-600">Tax PIN: {businessProfile.tax_pin}</p>}
        </div>
        <div className="shrink-0 text-right">
          <h2 className="text-3xl font-extrabold tracking-tight">INVOICE</h2>
          <table className="mt-3 ml-auto text-left text-sm">
            <tbody>
              <tr><td className="pr-4 font-semibold text-slate-600">Invoice No:</td><td className="font-mono font-medium">{invoice.invoice_number}</td></tr>
              <tr><td className="pr-4 font-semibold text-slate-600">Date:</td><td>{formatDate(invoice.issued_date, false)}</td></tr>
              <tr><td className="pr-4 font-semibold text-slate-600">Due Date:</td><td>{formatDate(invoice.due_date, false)}</td></tr>
              <tr><td className="pr-4 font-semibold text-slate-600">Status:</td><td className="capitalize">{invoice.status}</td></tr>
            </tbody>
          </table>
        </div>
      </header>

      <section className="my-7">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Billed To</p>
        <p className="text-base font-bold">{client?.name || 'Unknown Client'}</p>
        {client?.address && <p className="whitespace-pre-line text-sm text-slate-600">{client.address}</p>}
        {client?.email && <p className="text-sm text-slate-600">{client.email}</p>}
        {client?.phone && <p className="text-sm text-slate-600">{client.phone}</p>}
      </section>

      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2.5 text-left font-semibold">DESCRIPTION</th>
            <th className="w-20 px-3 py-2.5 text-right font-semibold">QTY</th>
            <th className="w-32 px-3 py-2.5 text-right font-semibold">UNIT PRICE</th>
            <th className="w-32 px-3 py-2.5 text-right font-semibold">AMOUNT DUE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-b border-slate-300">
          {(invoice.items || []).map((item: any) => (
            <tr key={item.id || item.description} className="break-inside-avoid">
              <td className="px-3 py-3">{item.description}</td>
              <td className="px-3 py-3 text-right align-top">{item.quantity}</td>
              <td className="px-3 py-3 text-right align-top">{formatCurrency(item.unit_price)}</td>
              <td className="px-3 py-3 text-right align-top font-medium">{formatCurrency(item.total ?? item.quantity * item.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-6 flex justify-end">
        <table className="w-64 text-sm">
          <tbody>
            <tr><td className="py-1 text-slate-600">Subtotal</td><td className="py-1 text-right">{formatCurrency(invoice.subtotal)}</td></tr>
            <tr><td className="py-1 text-slate-600">Tax / VAT ({invoice.tax_rate}%)</td><td className="py-1 text-right">{formatCurrency(invoice.tax_amount)}</td></tr>
            <tr className="border-t-2 border-slate-900 text-base font-bold"><td className="pt-2">Total Due</td><td className="pt-2 text-right">{formatCurrency(invoice.total)}</td></tr>
          </tbody>
        </table>
      </section>

      <footer className="mt-12 space-y-1.5 border-t border-slate-200 pt-4 text-xs text-slate-700">
        <p className="text-sm font-bold text-slate-900">Payment Terms</p>
        <p>{invoice.payment_terms || businessProfile.payment_terms || 'Please use the invoice number as your payment reference.'}</p>
        {invoice.notes && <p className="pt-2 italic text-slate-600">Note: {invoice.notes}</p>}
      </footer>
    </article>
    </>
  )
}

