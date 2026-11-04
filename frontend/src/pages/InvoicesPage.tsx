import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Search, Plus, Eye, Edit, Trash2, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    setLoading(true)
    try {
      const data = await listInvoices()
      setInvoices(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(id)
      setInvoices(invoices.filter((i) => i.id !== id))
      toast.success('Invoice deleted')
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  const filtered = invoices.filter((i) => {
    const matchesQuery =
      i.invoice_number?.toLowerCase().includes(query.toLowerCase()) ||
      i.clients?.[0]?.name?.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Invoices</h1>
          <p className="text-star-500 mt-1">Create, send, and track invoices from contract to payment.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-star-400" />
          <Input
            type="text"
            placeholder="Search invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="rounded-xl border border-star-100 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-star-400">No invoices found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-star-50 border-b border-star-100">
              <tr>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Invoice #</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Client</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Issued</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Due</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Total</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell font-mono text-sm text-star-700">{inv.invoice_number}</td>
                  <td className="table-cell text-sm text-star-600">
                    <div className="font-medium">{inv.clients?.[0]?.name || 'Unknown'}</div>
                    <div className="text-xs text-star-400">{inv.clients?.[0]?.email || ''}</div>
                  </td>
                  <td className="table-cell text-sm text-star-500">{formatDate(inv.issued_date)}</td>
                  <td className="table-cell text-sm text-star-500">{formatDate(inv.due_date)}</td>
                  <td className="table-cell font-semibold text-star-900">{formatCurrency(inv.total)}</td>
                  <td className="table-cell">
                    <Badge status={inv.status} label={inv.status.toUpperCase()} />
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${inv.id}/view`)} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)} title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="danger" size="icon" onClick={() => handleDelete(inv.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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