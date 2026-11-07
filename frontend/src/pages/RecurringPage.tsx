import { useState, useEffect } from 'react'
import { listRecurring, createRecurring, toggleRecurring } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Plus, ToggleLeft, ToggleRight, X } from 'lucide-react'

export function RecurringPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), endDate: '' })

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
      const item = items.find((entry) => entry.id === id)
      const active = item?.active ?? item?.is_active ?? false
      await toggleRecurring(id, active)
      setItems(items.map((it) => (it.id === id ? { ...it, active: !active, is_active: !active } : it)))
      toast.success('Recurring updated')
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    try {
      await createRecurring({ ...form, endDate: form.endDate || null })
      toast.success('Recurring schedule created')
      setModalOpen(false)
      setForm({ name: '', frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10), endDate: '' })
      await loadRec()
    } catch (error: any) { toast.error(error.message || 'Could not create schedule') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Recurring Invoices</h1>
          <p className="text-star-500 mt-1">Schedule automatic billing — monthly, quarterly, annual.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Recurring</Button>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="recurring-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="recurring-title" className="text-lg font-semibold text-slate-900">Create recurring schedule</h2><p className="mt-1 text-sm text-slate-500">Set the cadence and start date for this retainer.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <label className="block text-sm font-medium text-slate-700">Schedule name<input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly infrastructure retainer" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Billing interval<select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annually">Annually</option></select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Starts<input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Ends (optional)<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label></div>
              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Create schedule</Button></footer>
            </form>
          </section>
        </div>
      )}

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
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Starts</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell font-medium text-star-900">{it.name || it.client_id || 'Recurring schedule'}</td>
                  <td className="table-cell text-sm text-star-600">{it.frequency || 'monthly'}</td>
                  <td className="table-cell text-sm text-star-500">{it.start_date ? new Date(it.start_date).toLocaleDateString() : '—'}</td>
                  <td className="table-cell"><Badge status={(it.active ?? it.is_active) ? 'active' : 'inactive'} /></td>
                  <td className="table-cell">
                    <button onClick={() => handleToggle(it.id)} className="p-2 text-star-600 hover:bg-star-100 rounded-lg" title="Toggle active">
                      {(it.active ?? it.is_active) ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-star-400" />}
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
