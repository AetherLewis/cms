import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, Loader2, Save, Zap } from 'lucide-react'
import {
  createWorkflow,
  getWorkflow,
  getWorkflowReadiness,
  listClients,
  listSenders,
  previewWorkflow,
  toast,
  updateWorkflow,
  type ProviderReadiness,
  type SenderProfile,
  type WorkflowDefinitionInput,
  type WorkflowFrequency,
  type WorkflowPreview,
  type WorkflowStatus,
  type WorkflowType,
} from '../../utils/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  DEFAULT_OUTREACH_PROMPT,
  DEFAULT_REMINDER_MESSAGE,
  DEFAULT_REMINDER_SUBJECT,
  FREQUENCY_LABELS,
  TEMPLATES,
  TIMEZONE_OPTIONS,
  browserTimeZone,
  formatDateTime,
  parseContactsText,
  providerLabel,
} from './templates'

interface FormState {
  name: string
  type: WorkflowType
  timezone: string
  frequency: WorkflowFrequency
  runTime: string
  contactsText: string
  systemPrompt: string
  subject: string
  clientId: string
  daysBeforeDue: string
  message: string
  senderEmail: string
  senderWhatsapp: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
  dueInDays: string
  numberPrefix: string
}

const TEMPLATE_TYPES: WorkflowType[] = ['outreach', 'invoice_reminder', 'recurring_invoice']

function initialState(type: WorkflowType): FormState {
  return {
    name: '',
    type,
    timezone: browserTimeZone(),
    frequency: type === 'invoice_reminder' ? 'daily' : 'monthly',
    runTime: '09:00',
    contactsText: '',
    systemPrompt: DEFAULT_OUTREACH_PROMPT,
    subject: type === 'outreach' ? 'A quick note from our team' : DEFAULT_REMINDER_SUBJECT,
    clientId: '',
    daysBeforeDue: '0',
    message: DEFAULT_REMINDER_MESSAGE,
    senderEmail: '',
    senderWhatsapp: '',
    description: '',
    quantity: '1',
    unitPrice: '',
    taxRate: '0',
    dueInDays: '30',
    numberPrefix: 'INV',
  }
}

function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children} {required && <span className="text-red-600">*</span>}
    </label>
  )
}

export function WorkflowFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const requestedTemplate = searchParams.get('template') as WorkflowType | null
  const [form, setForm] = useState<FormState>(initialState(requestedTemplate && TEMPLATE_TYPES.includes(requestedTemplate) ? requestedTemplate : 'outreach'))
  const [status, setStatus] = useState<WorkflowStatus>('draft')
  const [clients, setClients] = useState<any[]>([])
  const [senders, setSenders] = useState<SenderProfile[]>([])
  const [readiness, setReadiness] = useState<ProviderReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'draft' | 'activate' | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<WorkflowPreview | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [clientList, readinessData, senderData] = await Promise.all([
          listClients(),
          getWorkflowReadiness(),
          listSenders(),
        ])
        if (cancelled) return
        setClients(clientList || [])
        setReadiness(readinessData.readiness)
        setSenders(senderData.senders || [])
        if (id) {
          const workflow = await getWorkflow(id)
          if (cancelled) return
          const config = workflow.config || {}
          setStatus(workflow.status)
          setForm({
            ...initialState(workflow.type),
            name: workflow.name,
            type: workflow.type,
            timezone: workflow.timezone,
            frequency: workflow.frequency,
            runTime: workflow.run_time,
            contactsText: (config.contacts || []).map((contact: any) => (contact.name ? `${contact.identifier} | ${contact.name}` : contact.identifier)).join('\n'),
            systemPrompt: config.systemPrompt || DEFAULT_OUTREACH_PROMPT,
            subject: config.subject || DEFAULT_REMINDER_SUBJECT,
            clientId: config.clientId || '',
            daysBeforeDue: String(config.daysBeforeDue ?? 0),
            message: config.message || DEFAULT_REMINDER_MESSAGE,
            description: config.invoice?.description || '',
            quantity: String(config.invoice?.quantity ?? 1),
            unitPrice: config.invoice?.unitPrice != null ? String(config.invoice.unitPrice) : '',
            taxRate: String(config.invoice?.taxRate ?? 0),
            dueInDays: String(config.invoice?.dueInDays ?? 30),
            senderEmail: config.senderIds?.email || '',
            senderWhatsapp: config.senderIds?.whatsapp || '',
            numberPrefix: config.invoice?.numberPrefix || 'INV',
          })
        }
      } catch (error: any) {
        toast.error(error.message || 'Could not load the workflow')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const contacts = useMemo(() => parseContactsText(form.contactsText), [form.contactsText])

  const requiredProviders = useMemo<Array<keyof ProviderReadiness>>(() => {
    if (form.type === 'invoice_reminder') return ['email']
    if (form.type === 'outreach') {
      const keys: Array<keyof ProviderReadiness> = ['ai']
      if (contacts.some((contact) => contact.type === 'email')) keys.push('email')
      if (contacts.some((contact) => contact.type === 'phone')) keys.push('whatsapp')
      return keys
    }
    return []
  }, [form.type, contacts])

  const missingProviders = readiness ? requiredProviders.filter((key) => !readiness[key]) : []

  // Channels this definition sends from; each needs a connected sender profile.
  const senderChannels = useMemo<Array<'email' | 'whatsapp'>>(() => {
    if (form.type === 'invoice_reminder') return ['email']
    if (form.type !== 'outreach') return []
    const channels: Array<'email' | 'whatsapp'> = []
    if (contacts.some((contact) => contact.type === 'email')) channels.push('email')
    if (contacts.some((contact) => contact.type === 'phone')) channels.push('whatsapp')
    return channels
  }, [form.type, contacts])

  const connectedSenders = (channel: 'email' | 'whatsapp') =>
    senders.filter((sender) => sender.channel === channel && sender.status === 'connected')

  const missingSenderChannels = senderChannels.filter((channel) =>
    channel === 'email' ? !form.senderEmail : !form.senderWhatsapp,
  )

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setPreview(null)
  }

  function senderIds() {
    const ids: Record<string, string> = {}
    if (form.senderEmail) ids.email = form.senderEmail
    if (form.senderWhatsapp) ids.whatsapp = form.senderWhatsapp
    return Object.keys(ids).length > 0 ? ids : undefined
  }

  function buildDefinition(activate = false): WorkflowDefinitionInput {
    const config =
      form.type === 'outreach'
        ? {
            contacts,
            systemPrompt: form.systemPrompt,
            subject: form.subject,
            senderIds: senderIds(),
          }
        : form.type === 'invoice_reminder'
          ? {
              clientId: form.clientId || null,
              daysBeforeDue: Number(form.daysBeforeDue || 0),
              subject: form.subject,
              message: form.message,
              senderIds: senderIds(),
            }
          : {
              clientId: form.clientId,
              invoice: {
                description: form.description,
                quantity: Number(form.quantity || 1),
                unitPrice: Number(form.unitPrice || 0),
                taxRate: Number(form.taxRate || 0),
                dueInDays: Number(form.dueInDays || 30),
                numberPrefix: form.numberPrefix || 'INV',
              },
            }
    return {
      name: form.name,
      type: form.type,
      timezone: form.timezone,
      frequency: form.frequency,
      runTime: form.runTime,
      config,
      activate,
    }
  }

  async function handlePreview() {
    setErrors([])
    setPreviewing(true)
    try {
      setPreview(await previewWorkflow(buildDefinition()))
    } catch (error: any) {
      setPreview(null)
      setErrors(String(error.message || 'Could not build a preview').split('. ').filter(Boolean))
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSave(activate: boolean) {
    setErrors([])
    setSaving(activate ? 'activate' : 'draft')
    try {
      const payload = buildDefinition(activate)
      if (isEdit && id) await updateWorkflow(id, payload)
      else await createWorkflow(payload)
      toast.success(activate ? 'Workflow activated' : 'Workflow saved as draft')
      navigate('/automations')
    } catch (error: any) {
      setErrors(String(error.message || 'Could not save the workflow').split('. ').filter(Boolean))
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">Loading workflow…</div>
  }

  const activateBlocked = missingProviders.length > 0 || missingSenderChannels.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/automations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> All workflows
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{isEdit ? 'Edit workflow' : 'New workflow'}</h1>
          <p className="mt-1 text-slate-500">Configure what runs, when it runs, and confirm the plan before activating.</p>
        </div>
        {isEdit && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{status}</span>
        )}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Please fix the following</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="space-y-6">
          {!isEdit && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Template</h2>
              <p className="mt-1 text-sm text-slate-500">Pick the workflow you want to run.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {TEMPLATE_TYPES.map((type) => {
                  const selected = form.type === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({
                          ...initialState(type),
                          name: current.name,
                          timezone: current.timezone,
                          runTime: current.runTime,
                          clientId: current.clientId,
                        }))
                        setPreview(null)
                      }}
                      aria-pressed={selected}
                      className={`rounded-lg border p-3 text-left transition-colors ${selected ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="block text-sm font-semibold text-slate-900">{TEMPLATES[type].label}</span>
                      <span className="mt-1 block text-xs text-slate-500">{TEMPLATES[type].tagline}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Basics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="workflow-name" required>Workflow name</Label>
                <Input id="workflow-name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Monthly retainer invoicing" className="w-full" />
              </div>
              <div>
                <Label htmlFor="workflow-timezone">Timezone</Label>
                <Select id="workflow-timezone" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} className="w-full">
                  {TIMEZONE_OPTIONS.includes(form.timezone) ? null : <option value={form.timezone}>{form.timezone}</option>}
                  {TIMEZONE_OPTIONS.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="workflow-frequency">Frequency</Label>
                <Select id="workflow-frequency" value={form.frequency} onChange={(event) => update('frequency', event.target.value as WorkflowFrequency)} className="w-full">
                  {(Object.keys(FREQUENCY_LABELS) as WorkflowFrequency[]).map((frequency) => (
                    <option key={frequency} value={frequency}>{FREQUENCY_LABELS[frequency]}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="workflow-runtime">Run at (local time)</Label>
                <Input id="workflow-runtime" type="time" value={form.runTime} onChange={(event) => update('runTime', event.target.value)} className="w-full" />
              </div>
            </div>
          </section>

          {senderChannels.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900">Send from</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose a connected sender for each channel this workflow uses.</p>
                </div>
                <Link to="/senders" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                  Manage sender profiles
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {senderChannels.map((channel) => {
                  const options = connectedSenders(channel)
                  const label = channel === 'email' ? 'Gmail sender' : 'WhatsApp sender'
                  const field = channel === 'email' ? 'senderEmail' : 'senderWhatsapp'
                  return (
                    <div key={channel}>
                      <Label htmlFor={`workflow-sender-${channel}`} required>{label}</Label>
                      <Select
                        id={`workflow-sender-${channel}`}
                        value={form[field]}
                        onChange={(event) => update(field, event.target.value)}
                        className="w-full"
                      >
                        <option value="">{options.length === 0 ? `No connected ${label.toLowerCase()}` : `Choose a ${label.toLowerCase()}`}</option>
                        {options.map((sender) => (
                          <option key={sender.id} value={sender.id}>{sender.name} · {sender.account}</option>
                        ))}
                      </Select>
                      {options.length === 0 && (
                        <p className="mt-1.5 text-xs text-amber-700">
                          Connect a {label.toLowerCase()} in <Link to="/senders" className="font-semibold underline">Sender profiles</Link> first.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{TEMPLATES[form.type].label} details</h2>
            <p className="mt-1 text-sm text-slate-500">{TEMPLATES[form.type].description}</p>

            {form.type === 'outreach' && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="workflow-contacts" required>Contacts</Label>
                  <Textarea
                    id="workflow-contacts"
                    rows={6}
                    value={form.contactsText}
                    onChange={(event) => update('contactsText', event.target.value)}
                    placeholder={'alex@example.com | Alex Morgan\n+1 555 010 0021 | Jordan Lee'}
                    className="w-full font-mono text-xs"
                  />
                  <p className="mt-1 text-xs text-slate-500">{contacts.length} contact{contacts.length === 1 ? '' : 's'} · one per line, optional name after a vertical bar · up to 50</p>
                </div>
                <div>
                  <Label htmlFor="workflow-prompt" required>System instructions for the AI writer</Label>
                  <Textarea id="workflow-prompt" rows={5} value={form.systemPrompt} onChange={(event) => update('systemPrompt', event.target.value)} className="w-full" />
                </div>
                <div>
                  <Label htmlFor="workflow-subject">Email subject</Label>
                  <Input id="workflow-subject" value={form.subject} onChange={(event) => update('subject', event.target.value)} className="w-full" />
                </div>
              </div>
            )}

            {form.type === 'invoice_reminder' && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="workflow-client">Client scope</Label>
                    <Select id="workflow-client" value={form.clientId} onChange={(event) => update('clientId', event.target.value)} className="w-full">
                      <option value="">All clients</option>
                      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workflow-window">Include invoices due within (days)</Label>
                    <Input id="workflow-window" type="number" min={0} max={90} value={form.daysBeforeDue} onChange={(event) => update('daysBeforeDue', event.target.value)} className="w-full" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="workflow-reminder-subject" required>Subject</Label>
                  <Input id="workflow-reminder-subject" value={form.subject} onChange={(event) => update('subject', event.target.value)} className="w-full" />
                </div>
                <div>
                  <Label htmlFor="workflow-message" required>Message</Label>
                  <Textarea id="workflow-message" rows={7} value={form.message} onChange={(event) => update('message', event.target.value)} className="w-full" />
                  <p className="mt-1 text-xs text-slate-500">Placeholders: {'{{client_name}}'}, {'{{invoice_number}}'}, {'{{amount}}'}, {'{{due_date}}'}, {'{{days_overdue}}'}</p>
                </div>
              </div>
            )}

            {form.type === 'recurring_invoice' && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="workflow-recurring-client" required>Client</Label>
                  <Select id="workflow-recurring-client" value={form.clientId} onChange={(event) => update('clientId', event.target.value)} className="w-full">
                    <option value="">Choose a client…</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.email ? ` (${client.email})` : ''}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workflow-description" required>Invoice line description</Label>
                  <Input id="workflow-description" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Monthly infrastructure retainer" className="w-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="workflow-quantity" required>Quantity</Label>
                    <Input id="workflow-quantity" type="number" min={1} value={form.quantity} onChange={(event) => update('quantity', event.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-unit-price" required>Unit price</Label>
                    <Input id="workflow-unit-price" type="number" min={0} step="0.01" value={form.unitPrice} onChange={(event) => update('unitPrice', event.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-tax">Tax rate (%)</Label>
                    <Input id="workflow-tax" type="number" min={0} max={100} step="0.01" value={form.taxRate} onChange={(event) => update('taxRate', event.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-due">Payment terms (days)</Label>
                    <Input id="workflow-due" type="number" min={0} max={365} value={form.dueInDays} onChange={(event) => update('dueInDays', event.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-prefix">Invoice number prefix</Label>
                    <Input id="workflow-prefix" value={form.numberPrefix} onChange={(event) => update('numberPrefix', event.target.value)} className="w-full" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Invoices are created as drafts and never charged automatically.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Preview</h2>
              <Button variant="outline" size="sm" onClick={() => void handlePreview()} disabled={previewing}>
                {previewing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                {previewing ? 'Checking…' : 'Preview'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Nothing is sent when you preview — the server lists exactly what a run would do.</p>

            {preview ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{preview.items.length} item{preview.items.length === 1 ? '' : 's'}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Next run {formatDateTime(preview.nextRunAt)}</span>
                </div>
                {preview.items.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Nothing matches right now. The scheduled run will pick up new matches automatically.</p>
                ) : (
                  <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {preview.items.map((item, index) => (
                      <li key={`${item.label}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {preview.missingProviders.length > 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Needs setup before it can run</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                      {preview.missingProviders.map((provider) => <li key={provider}>{provider}</li>)}
                    </ul>
                    <p className="mt-1">Connect the missing senders in Sender profiles, and set any deployment secrets listed above.</p>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> All required providers are configured</p>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Run a preview to see the exact recipients and invoices this workflow will handle.</p>
            )}
          </section>

          {activateBlocked && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" /> Activation needs provider setup</p>
              <p className="mt-1 text-xs text-amber-800">
                {missingProviders.length > 0 && <>Missing: {missingProviders.map(providerLabel).join(', ')}. </>}
                {missingSenderChannels.length > 0 && <>Choose a connected {missingSenderChannels.map((channel) => (channel === 'email' ? 'Gmail' : 'WhatsApp')).join(' and ')} sender. </>}
                Save as a draft now and activate once everything is connected.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Schedule</h2>
            <p className="mt-1 text-sm text-slate-600">{FREQUENCY_LABELS[form.frequency]} at {form.runTime} ({form.timezone})</p>
            <p className="mt-2 text-xs text-slate-500">The server checks for due workflows on its cron cadence, so runs happen without an open browser.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => void handleSave(true)} disabled={saving !== null || activateBlocked}>
                {saving === 'activate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {saving === 'activate' ? 'Activating…' : 'Save & activate'}
              </Button>
              <Button variant="outline" onClick={() => void handleSave(false)} disabled={saving !== null}>
                {saving === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving === 'draft' ? 'Saving…' : 'Save as draft'}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
