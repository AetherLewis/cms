import { useState, useEffect } from 'react'
import { listDocuments, deleteDocument, createDocument } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { FolderOpen, Plus, Trash2, Download, Eye, X, Upload } from 'lucide-react'
import { formatDate } from '../utils/format'

export function DocumentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: '', documentType: 'contract', description: '' })

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

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!file) return toast.error('Choose a file to upload')
    if (file.size > 1024 * 1024) return toast.error('Files must be 1 MB or smaller in this workspace')
    try {
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read file'))
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsDataURL(file)
      })
      await createDocument({ ...form, title: form.title || file.name, fileUrl, description: form.description || file.name })
      toast.success('Document saved')
      setUploadOpen(false)
      setFile(null)
      setForm({ title: '', documentType: 'contract', description: '' })
      await loadDocs()
    } catch (error: any) { toast.error(error.message || 'Upload failed') }
  }

  function downloadReport() {
    const rows = [['Title', 'Type', 'Created', 'File URL'], ...filtered.map((item) => [item.title || '', item.document_type || '', item.created_at || '', item.file_url || ''])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'starcore-documents.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadDocument(item: any) {
    if (!item.file_url) return toast.error('This document has no downloadable file')
    const link = document.createElement('a')
    link.href = item.file_url
    link.download = item.title || 'starcore-document'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
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
          <Button onClick={() => setUploadOpen(true)}>
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
                      <Button size="icon" variant="outline" title="Download" onClick={() => downloadDocument(d)}>
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
          <Button variant="outline" onClick={downloadReport}>Generate Report</Button>
        </div>
        <div className="rounded-xl border border-star-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-star-900 mb-2">Template Manager</h3>
          <p className="text-sm text-star-500 mb-4">Create reusable templates for contracts, invoices, and payment reminders.</p>
          <Button onClick={() => toast('Contract and invoice templates are managed from their creation forms.')}>Manage Templates</Button>
        </div>
      </div>
      {uploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="upload-title" className="text-lg font-semibold text-slate-900">Upload document</h2><p className="mt-1 text-sm text-slate-500">Add a file to your secure document vault.</p></div><button type="button" onClick={() => setUploadOpen(false)} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header><form onSubmit={handleUpload} className="space-y-4 p-6"><label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50"><Upload className="mb-2 h-6 w-6 text-indigo-700" /><span className="text-sm font-medium text-slate-800">{file?.name || 'Choose a file or drop it here'}</span><span className="mt-1 text-xs text-slate-500">PDF, DOCX, PNG or JPG · up to 1 MB</span><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(event) => { const next = event.target.files?.[0] || null; setFile(next); if (next && !form.title) setForm((current) => ({ ...current, title: next.name })) }} /></label><label className="block text-sm font-medium text-slate-700">Document title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">File type<select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2"><option value="contract">Contract</option><option value="invoice">Invoice</option><option value="receipt">Receipt</option><option value="other">Other</option></select></label><label className="block text-sm font-medium text-slate-700">Notes<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2" /></label><footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button type="submit" disabled={!file}>Save document</Button></footer></form></section></div>}
    </div>
  )
}
