import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createClient, getClient, updateClient } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Mail, Phone, Building } from 'lucide-react'

export function ClientFormPage(props?: { clientId?: string; onSave?: () => void; onCancel?: () => void }) {
  const { id } = useParams<{ id?: string }>()
  const clientId = props?.clientId || id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    tax_id: '',
    status: 'active',
  })

  useEffect(() => {
    if (clientId) {
      // fetch existing client
      ;(async () => {
        try {
          const data = await getClient(clientId)
            setForm({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              company: data.company || '',
              tax_id: data.tax_id || '',
              status: data.status || 'active',
            })
        } catch {}
      })()
    }
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (clientId) {
        await updateClient(clientId, form)
      } else {
        await createClient(form)
      }
      toast.success(clientId ? 'Client updated' : 'Client created')
      if (props?.onSave) props.onSave()
      else navigate('/clients')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={props?.onCancel ? 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4' : 'max-w-2xl mx-auto'}>
      {props?.onCancel && <button className="absolute inset-0 cursor-default" aria-label="Close client form" onClick={props.onCancel} />}
      <div className={props?.onCancel ? 'relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#f8f9ff] p-4' : 'w-full'}>
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" type="button" onClick={() => props?.onCancel ? props.onCancel() : navigate('/clients')}>Back to clients</Button>
      </div>
      <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-star-900 mb-4">
          {clientId ? 'Edit Client' : 'New Client'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-star-700 mb-1">Full name</label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-star-400" />
              <Input
                value={form.email}
                required
                type="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-star-400" />
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="pl-10" />
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-star-700 mb-1">Address</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Business Ave, City, State" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Company</label>
            <Building className="absolute left-3 top-3 w-4 h-4 text-star-400" />
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" className="pl-10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Tax ID</label>
            <Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="Optional tax identifier" />
          </div>
          <div>
            <label className="block text-sm font-medium text-star-700 mb-1">Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => props?.onCancel ? props.onCancel() : navigate('/clients')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save client'}
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
