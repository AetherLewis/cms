import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContract, getContractStats } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Badge } from '../components/ui/Badge'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { DetailRow } from '../components/SummaryCard'
import { Button } from '../components/ui/Button'
import { User, Building, Calendar, DollarSign, PlusCircle, History } from 'lucide-react'
import { formatDate, formatCurrency } from '../utils/format'

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const [c, s] = await Promise.all([
          getContract(id),
          getContractStats(id).catch(() => null),
        ])
        setContract(c)
        setStats(s)
      } catch (e: any) {
        toast.error(e.message || 'Failed to load contract')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <div className="p-8 text-center text-star-400">Loading contract details…</div>
  if (!contract) return <div className="p-8 text-center text-star-400">Contract not found.</div>

  return (
    <div className="space-y-6">
      <Breadcrumbs path={[{ label: 'Contracts' }, { label: contract.title }]} onHome={() => navigate('/contracts')} />

      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status={contract.status} label={contract.status.toUpperCase()} />
              <Badge type={contract.contract_type} />
            </div>
            <h1 className="text-2xl font-bold text-star-900">{contract.title}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${contract.id}`)}>Edit</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${contract.id}/new`)}>
              <PlusCircle className="w-4 h-4 mr-1" /> Add invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailRow icon={<Calendar className="w-4 h-4 text-star-600" />} label="Start date" value={formatDate(contract.start_date)} />
          <DetailRow icon={<Calendar className="w-4 h-4 text-star-600" />} label="End date" value={formatDate(contract.end_date)} />
          <DetailRow icon={<User className="w-4 h-4 text-star-600" />} label="Client" value={contract.clients?.[0]?.name || '—'} sub={`${contract.clients?.[0]?.email || ''}`} />
          <DetailRow icon={<DollarSign className="w-4 h-4 text-star-600" />} label="Value" value={contract.value ? formatCurrency(contract.value) : '—'} />
          <DetailRow icon={<DollarSign className="w-4 h-4 text-star-600" />} label="Invoiced" value={stats ? formatCurrency(stats.total_invoiced) : '—'} />
          <DetailRow icon={<DollarSign className="w-4 h-4 text-star-600" />} label="Paid" value={stats ? formatCurrency(stats.total_paid) : '—'} />
        </div>
      </div>

      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-star-900 mb-3">Description</h2>
        <p className="text-star-600 whitespace-pre-wrap">{contract.description || 'No description'}</p>
      </div>

      {stats && stats.overdue_count > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-bold text-red-700">N overdue invoices</p>
              <p className="text-sm text-red-600">Some invoices may need attention.</p>
            </div>
          </div>
          <Button variant="danger" size="sm">Check now</Button>
        </div>
      )}

      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-star-900 mb-4">Invoice History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-star-100">
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Invoice #</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Due</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Total</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {(contract.invoices || []).slice(-5).map((inv: any) => (
                <tr key={inv.id} className="border-b border-star-100 hover:bg-star-50">
                  <td className="table-cell font-mono text-sm text-star-700">{inv.invoice_number}</td>
                  <td className="table-cell text-sm text-star-500">{formatDate(inv.due_date)}</td>
                  <td className="table-cell font-medium text-star-900">{formatCurrency(inv.total)}</td>
                  <td className="table-cell"><Badge status={inv.status} /></td>
                </tr>
              ))}
              {!contract.invoices?.length && (
                <tr><td colSpan={4} className="table-cell text-center text-star-400 py-4">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
