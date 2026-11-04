import { useState, useEffect } from 'react'
import { listDocuments, deleteDocument } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { FileArrowLeft, Plus, Trash2, Download, Eye } from 'lucide-react'
import { formatDate } from '../utils/format'

export function DocumentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadDocs()
  }, [])

  async function loadDocs() {
    setLoading(true)
    try {
      const data = await listDocuments()
      setItems(data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteDocument(id)
      setItems(items.filter((d) => d.id !== id))
      toast.success('Document deleted')
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  const filtered = items.filter((d) =>
    d.title?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-star-900">Documents &amp; Templates</h1>
          <p className="text-star-500 mt-1">Contract templates, exportable reports, and attachments.</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input type="text" placeholder="Search documents..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full md:w-72" />
      </div>

      <div className="rounded-xl border border-star-100 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-star-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-star-400">No documents found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-star-50 border-b border-star-100">
              <tr>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Title</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Type</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Status</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Client</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Created</th>
                <th className="table-cell font-semibold text-star-700 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-star-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-star-50 transition-colors">
                  <td className="table-cell font-medium text-star-900">{d.title || 'Untitled'}</td>
                  <td className="table-cell text-xs md:text-sm text-star-500">{d.document_type || 'pdf'}</td>
                  <td className="table-cell"><Badge status={d.status || 'active'} /></td>
                  <td className="table-cell text-xs text-star-500">{d.client_id ? 'Linked' : '—'}</td>
                  <td className="table-cell text-xs text-star-500">{formatDate(d.created_at)}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" title="View" onClick={() => window.open(d.file_url, '_blank')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" title="Download" onClick={() => window.open(d.file_url, '_blank')}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="danger" onClick={() => handleDelete(d.id)} title="Delete">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-star-100 bg-gradient-to-br from-star-600 to-star-800 p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-2">Document Export</h3>
          <p className="text-star-100 text-sm mb-4">Generate PDF reports, contract summaries, and invoice bundles from the dashboard.</p>
          <Button variant="outline" className="bg-white text-star-900 border-white hover:bg-star-50">Generate Report</Button>
        </div>
        <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-star-900 mb-2">Template Manager</h3>
          <p className="text-sm text-star-500 mb-4">Create reusable templates for contracts, invoices, and payment reminders.</p>
          <Button>Manage Templates</Button>
        </div>
      </div>
    </div>
  )
}
