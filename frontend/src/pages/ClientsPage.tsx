import { useEffect, useState } from 'react'
import { ClientFormPage } from './ClientFormPage'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Mail, Phone, Building, ShieldCheck, User } from 'lucide-react'

export function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    try {
      const data = await listClients()
      setClients(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this client?')) return
    try {
      await deleteClient(id)
      setClients(clients.filter((c) => c.id !== id))
      toast.success('Client deleted')
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  const filtered = clients.filter((c) => {
    const haystack = [c.name, c.company, c.email].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query.toLowerCase()) && (statusFilter === 'all' || c.status === statusFilter)
  })

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="border-l-4 border-indigo-600 pl-4">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Clients</h1>
          <p className="text-star-500">Manage your client relationships and billing contacts.</p>
        </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-white border border-star-200 rounded-lg text-star-900 focus:ring-2 focus:ring-star-600 outline-none"
          />
          <Select aria-label="Filter clients by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-36"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
          <Button onClick={() => setEditing('new')}>
            <User className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-star-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-star-400">No clients found.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-star-50 border-b border-star-100">
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Client</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Email</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Company</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell">
                    <div className="font-medium text-star-900">{c.name}</div>
                    <div className="text-sm text-star-500">{c.phone || '—'}</div>
                  </td>
                  <td className="table-cell text-sm text-star-600">{c.email}</td>
                  <td className="table-cell text-sm text-star-600">{c.company || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-star-100 text-star-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditing(c.id)}
                        size="sm"
                        className="text-xs px-3 py-1.5"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(c.id)}
                        size="sm"
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

      {editing && (
        <ClientFormPage
          clientId={editing === 'new' ? undefined : editing}
          onSave={() => { setEditing(null); void loadClients() }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
