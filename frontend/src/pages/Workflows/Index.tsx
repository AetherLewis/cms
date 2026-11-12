import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, History, Pause, Pencil, Play, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import {
  activateWorkflow,
  listWorkflows,
  pauseWorkflow,
  runWorkflowNow,
  toast,
  type ProviderReadiness,
  type WorkflowRecord,
} from '../../utils/api'
import { Button } from '../../components/ui/Button'
import {
  TEMPLATES,
  formatDateTime,
  formatSchedule,
  providerLabel,
  runStatusTone,
  workflowStatusTone,
} from './templates'

const PROVIDERS: Array<keyof ProviderReadiness> = ['ai', 'email', 'whatsapp']

export function WorkflowsPage() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([])
  const [readiness, setReadiness] = useState<ProviderReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listWorkflows()
      setWorkflows(data.workflows || [])
      setReadiness(data.readiness)
    } catch (error: any) {
      toast.error(error.message || 'Could not load workflows')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleToggle(workflow: WorkflowRecord) {
    setBusyId(workflow.id)
    try {
      if (workflow.status === 'active') {
        await pauseWorkflow(workflow.id)
        toast.success(`Paused “${workflow.name}”`)
      } else {
        await activateWorkflow(workflow.id)
        toast.success(`Activated “${workflow.name}”`)
      }
      await load()
    } catch (error: any) {
      toast.error(error.message || 'Could not update the workflow')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRun(workflow: WorkflowRecord) {
    setBusyId(workflow.id)
    try {
      const outcome = await runWorkflowNow(workflow.id)
      const { succeeded, failed, skipped } = outcome.totals
      if (failed > 0) toast.error(`${failed} item${failed === 1 ? '' : 's'} failed — open the run history for details`)
      else if (succeeded === 0) toast(`Nothing new to process (${skipped} skipped)`)
      else toast.success(`${succeeded} item${succeeded === 1 ? '' : 's'} completed`)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'Run failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="mt-1 text-slate-500">
            Guided outreach and billing automations that run on the server — no open browser needed.
          </p>
        </div>
        <Button onClick={() => navigate('/automations/new')}>
          <Plus className="mr-2 h-4 w-4" /> New workflow
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
            <h2 className="text-sm font-semibold text-slate-900">Provider readiness</h2>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROVIDERS.map((key) => {
            const ready = readiness ? readiness[key] : false
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {providerLabel(key)} {ready ? 'configured' : 'missing'}
              </span>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Email and WhatsApp send from your connected{' '}
          <Link to="/senders" className="font-semibold text-indigo-700 hover:text-indigo-900">sender profiles</Link>
          {' '}— access is granted through the provider and never stored in the CMS. AI writing uses deployment secrets.
          A workflow cannot be activated or run until it has a connected sender for every channel it uses.
        </p>
      </section>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">Loading workflows…</div>
      ) : workflows.length === 0 ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Choose a template to get started</h2>
            <p className="mt-1 text-sm text-slate-500">Each template asks only for the details it needs, previews the work, then runs on a schedule.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((type) => (
              <Link
                key={type}
                to={`/automations/new?template=${type}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                <h3 className="font-semibold text-slate-900">{TEMPLATES[type].label}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">{TEMPLATES[type].tagline}</p>
                <p className="mt-2 text-sm text-slate-600">{TEMPLATES[type].description}</p>
                <p className="mt-3 text-xs text-slate-500">Needs: {TEMPLATES[type].needs}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-slate-900">{workflow.name}</h2>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${workflowStatusTone(workflow.status)}`}>{workflow.status}</span>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {TEMPLATES[workflow.type]?.label || workflow.type}
                    </span>
                    {workflow.missingProviders.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> Provider missing
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatSchedule(workflow.frequency, workflow.run_time, workflow.timezone)}</span>
                    <span>Next run: {workflow.status === 'active' ? formatDateTime(workflow.next_run_at) : workflow.status === 'paused' ? 'paused' : 'not scheduled'}</span>
                    <span>
                      Last run: {workflow.last_run_at ? (
                        <span className="inline-flex items-center gap-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${runStatusTone(workflow.last_run_status || 'empty')}`}>{workflow.last_run_status || 'empty'}</span>
                          {formatDateTime(workflow.last_run_at)}
                        </span>
                      ) : 'never'}
                    </span>
                  </p>
                  {workflow.missingProviders.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">Missing: {workflow.missingProviders.join(', ')}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" disabled={busyId === workflow.id} onClick={() => void handleRun(workflow)} title="Run now">
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Run now
                  </Button>
                  <Button variant="outline" size="sm" disabled={busyId === workflow.id} onClick={() => void handleToggle(workflow)}>
                    {workflow.status === 'active' ? <><Pause className="mr-1.5 h-3.5 w-3.5" /> Pause</> : <><Play className="mr-1.5 h-3.5 w-3.5" /> Activate</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/automations/${workflow.id}`)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/automations/${workflow.id}/history`)}>
                    <History className="mr-1.5 h-3.5 w-3.5" /> History
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
