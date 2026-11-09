import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Mail, Phone, Play, RefreshCw, Sparkles } from 'lucide-react'
import { listOutreachLogs, runOutreach, type OutreachContact, type OutreachLog, toast } from '../../utils/api'
import { formatDate } from '../../utils/format'
import { Badge } from '../../components/ui/Badge'

const DEFAULT_PROMPT = 'Act as Miguel, a web developer. Offer a custom website redesign. Keep it under 2 paragraphs and friendly.'

function parseContacts(value: string): OutreachContact[] {
  return value.split(/[\n,;]+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\s*[|\t]\s*/)
    const identifier = (parts[0] || '').trim()
    const name = parts[1]?.trim()
    return { identifier, type: identifier.includes('@') ? 'email' : 'phone', ...(name ? { name } : {}) }
  })
}

export function AutomationsPage() {
  const [rawContacts, setRawContacts] = useState('')
  const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT)
  const [logs, setLogs] = useState<OutreachLog[]>([])
  const [loading, setLoading] = useState(false)
  const contacts = useMemo(() => parseContacts(rawContacts), [rawContacts])

  const refreshLogs = useCallback(async () => {
    try { setLogs(await listOutreachLogs() || []) } catch (error) { console.error('Failed to load outreach logs', error) }
  }, [])

  useEffect(() => {
    void refreshLogs()
    const timer = window.setInterval(() => void refreshLogs(), 10000)
    return () => window.clearInterval(timer)
  }, [refreshLogs])

  async function handleRun() {
    if (contacts.length === 0) return toast.error('Add at least one email or phone number')
    if (contacts.length > 20) return toast.error('A run can include up to 20 contacts')
    if (!basePrompt.trim()) return toast.error('Add system instructions for OmniRoute')
    setLoading(true)
    try {
      await runOutreach({ contacts, basePrompt })
      toast.success(`Outreach processed for ${contacts.length} contacts`)
      await refreshLogs()
    } catch (error: any) {
      toast.error(error.message || 'Could not run outreach')
    } finally { setLoading(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-indigo-700"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.16em]">AI workspace</span></div><h1 className="text-2xl font-bold text-star-900">Automations</h1><p className="mt-1 text-star-500">Personalize client outreach with OmniRoute and track every message.</p></div>
      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800"><Activity className="h-4 w-4" /> Batch limit: 20 contacts</div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <section className="rounded-xl border border-star-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4"><h2 className="font-semibold text-star-900">Contact list</h2><p className="mt-1 text-sm text-star-500">Paste one email or phone number per line. Add an optional name after a vertical bar.</p></div>
        <textarea value={rawContacts} onChange={(event) => setRawContacts(event.target.value)} rows={8} placeholder={'alex@example.com | Alex Morgan\n+1 555 010 0021 | Jordan Lee'} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <div className={`mt-2 text-right text-xs font-medium ${contacts.length > 20 ? 'text-red-600' : 'text-slate-500'}`}>{contacts.length} / 20 contacts</div>
      </section>

      <section className="rounded-xl border border-star-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4"><h2 className="font-semibold text-star-900">AI prompt configuration</h2><p className="mt-1 text-sm text-star-500">Tell OmniRoute how to write each personalized message.</p></div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="system-instructions">System instructions</label>
        <textarea id="system-instructions" value={basePrompt} onChange={(event) => setBasePrompt(event.target.value)} rows={5} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <button onClick={() => void handleRun()} disabled={loading || contacts.length === 0 || contacts.length > 20} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" />{loading ? 'Generating and processing…' : 'Run Outreach'}</button>
        <p className="mt-2 text-center text-xs text-slate-400">Messages use the configured OmniRoute model. Delivery is currently mocked.</p>
      </section>
    </div>

    <section className="overflow-hidden rounded-xl border border-star-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-star-900">Outreach results</h2><p className="mt-1 text-xs text-star-500">Latest 100 messages · refreshes every 10 seconds</p></div><button onClick={() => void refreshLogs()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
      {logs.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">No outreach messages yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Generated message</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Updated</th></tr></thead><tbody className="divide-y divide-slate-100">{logs.map((log) => <tr key={log.id} className="align-top hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-2 font-medium text-slate-800">{log.contact_type === 'email' ? <Mail className="h-4 w-4 text-slate-400" /> : <Phone className="h-4 w-4 text-slate-400" />}{log.contact_identifier}</div><p className="mt-1 text-xs text-slate-400">Run {log.run_id.slice(0, 8)}</p></td><td className="max-w-lg whitespace-pre-wrap px-5 py-4 text-xs leading-5 text-slate-600">{log.generated_message || 'No message generated'}</td><td className="px-5 py-4"><Badge status={log.status === 'sent' ? 'paid' : log.status === 'failed' ? 'overdue' : 'draft'} label={log.status} /></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(log.updated_at || log.created_at)}</td></tr>)}</tbody></table></div>}
    </section>
  </div>
}
