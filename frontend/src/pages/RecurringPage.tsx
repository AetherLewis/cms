import { useState, useEffect } from 'react'
import { listRecurring, createRecurring, toggleRecurring } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

export function RecurringPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRec()
  }, [])

  async function loadRec() {
    setLoading(true)
    try {
      const data = await listRecurring()
      setItems(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load recurring invoices')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleRecurring(id)
      setItems(items.map((it) => (it.id === id ? { ...it, is_active: !it.is_active } : it)))
      toast.success('Recurring updated')
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Recurring Invoices</h1>
          <p className="text-star-500 mt-1">Schedule automatic billing — monthly, quarterly, annual.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Create Recurring</Button>
      </div>

      <div className="rounded-xl border border-star-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-star-400">No recurring invoices set.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-star-50 border-b border-star-100">
              <tr>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Client</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Frequency</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Next Due</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell font-medium text-star-900">{it.client_id || 'Unknown'}</td>
                  <td className="table-cell text-sm text-star-600">{it.frequency || 'monthly'}</td>
                  <td className="table-cell text-sm text-star-500">{it.next_due_date ? new Date(it.next_due_date).toLocaleDateString() : '—'}</td>
                  <td className="table-cell"><Badge status={it.is_active ? 'active' : 'inactive'} /></td>
                  <td className="table-cell">
                    <button onClick={() => handleToggle(it.id)} className="p-2 text-star-600 hover:bg-star-100 rounded-lg" title="Toggle active">
                      {it.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-star-400" />}
                    </button>
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
