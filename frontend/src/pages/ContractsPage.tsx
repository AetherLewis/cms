import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listContracts,
  createContract,
  deleteContract,
  getContract,
  getContractStats,
} from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { DollarSign, Plus, Search, FileText, Users, CreditCard } from 'lucide-react'
import { currency } from '../utils/format'

export function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statsByClient, setStatsByClient] = useState<Record<string, any>>({})
  const navigate = useNavigate()

  useEffect(() => {
    loadContracts()
  }, [])

  async function loadContracts() {
    setLoading(true)
    try {
      const data = await listContracts()
      setContracts(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats(id: string) {
    try {
      const stats = await getContractStats(id)
      setStatsByClient((prev) => ({ ...prev, [id]: stats }))
    } catch {}
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this contract?')) return
    deleteContract(id).then(() => {
      toast.success('Contract deleted')
      loadContracts()
    }).catch((e) => toast.error(e.message))
  }

  const statuses = ['all', 'draft', 'active', 'completed', 'cancelled', 'expired']
  const filtered = contracts.filter((c) =>
    c.title?.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || c.status === statusFilter)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Contracts</h1>
          <p className="text-star-500 mt-1">Track client agreements with terms, dates, and billing links.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/contracts/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Contract
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-star-400" />
        <Input
          type="text"
          placeholder="Search contracts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 w-full md:w-72"
        />
      </div>
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {statuses.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === status ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{status}{status === 'all' ? ` · ${contracts.length}` : ` · ${contracts.filter((contract) => contract.status === status).length}`}</button>)}
      </div>
      </div>

      <div className="rounded-xl border border-star-100 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-star-400">No contracts found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-star-50 border-b border-star-100">
              <tr>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Contract</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Type</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Value</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Start → End</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Invoices</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell">
                    <div className="font-medium text-star-900 flex items-center gap-2">
                      {c.title}
                      {c.file_url && <FileText className="w-3 h-3 text-star-400" />}
                    </div>
                    <div className="text-sm text-star-500">{c.description?.slice(0, 80)}</div>
                  </td>
                  <td className="table-cell text-sm text-star-600">
                    {c.contract_type || 'Standard'}
                  </td>
                  <td className="table-cell text-sm font-medium text-star-700">
                    {c.value ? currency(c.value) : '—'}
                  </td>
                  <td className="table-cell text-xs text-star-500">
                    {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                    {' → '}
                    {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="table-cell">
                    <Badge status={c.status} label={c.status.toUpperCase()} />
                  </td>
                  <td className="table-cell">
                    {c.invoices && c.invoices.length > 0 ? (
                      <CreditCard className="w-4 h-4 text-star-500" />
                    ) : (
                      <span className="text-star-300 italic">No invoices</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${c.id}`)} className="text-xs px-3 py-1.5">
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="text-xs px-3 py-1.5"
                      >
                        Delete
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
