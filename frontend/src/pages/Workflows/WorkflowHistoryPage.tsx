import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { listWorkflowRuns, toast, type WorkflowRecord, type WorkflowRun } from '../../utils/api'
import { Button } from '../../components/ui/Button'
import { TEMPLATES, formatDateTime, formatSchedule, itemStatusTone, runStatusTone } from './templates'

export function WorkflowHistoryPage() {
  const { id } = useParams()
  const [workflow, setWorkflow] = useState<WorkflowRecord | null>(null)
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const data = await listWorkflowRuns(id)
      setWorkflow(data.workflow)
      setRuns(data.runs || [])
    } catch (error: any) {
      toast.error(error.message || 'Could not load run history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/automations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> All workflows
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{workflow?.name || 'Run history'}</h1>
          {workflow && (
            <p className="mt-1 text-sm text-slate-500">
              {TEMPLATES[workflow.type]?.label || workflow.type} · {formatSchedule(workflow.frequency, workflow.run_time, workflow.timezone)}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {workflow && workflow.missingProviders.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Missing provider configuration: {workflow.missingProviders.join(', ')}. Runs will report these items as failed until the
          deployment secrets are set.
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">Loading run history…</div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No runs yet. Use “Run now” on the workflow, or wait for the next scheduled execution.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <article key={run.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${runStatusTone(run.status)}`}>{run.status}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{run.trigger}</span>
                  <span className="text-sm text-slate-700">{run.summary || 'No summary recorded'}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDateTime(run.started_at)}
                  {run.finished_at ? ` → ${formatDateTime(run.finished_at)}` : ' · still running'}
                </p>
              </header>
              <div className="flex flex-wrap gap-4 border-b border-slate-50 px-5 py-3 text-xs text-slate-600">
                <span><strong className="font-semibold text-slate-900">{run.total_items}</strong> items</span>
                <span className="text-emerald-700"><strong className="font-semibold">{run.succeeded_items}</strong> succeeded</span>
                <span className="text-red-700"><strong className="font-semibold">{run.failed_items}</strong> failed</span>
                <span><strong className="font-semibold text-slate-900">{run.skipped_items}</strong> skipped</span>
              </div>
              {run.items.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">Nothing was due for this run.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Item</th>
                        <th className="px-5 py-3">Outcome</th>
                        <th className="px-5 py-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {run.items.map((item) => (
                        <tr key={item.id} className="align-top hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-medium text-slate-800">{item.label}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${itemStatusTone(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">{item.detail || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
