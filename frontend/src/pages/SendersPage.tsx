import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Link2, Mail, MessageCircle, RefreshCw, Trash2, UserRound } from 'lucide-react'
import {
  disconnectSender,
  listSenders,
  renameSender,
  startSenderAuthorization,
  toast,
  type SenderChannel,
  type SenderProfile,
  type SenderProviderInfo,
} from '../utils/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const CHANNEL_META: Record<SenderChannel, { title: string; description: string; icon: typeof Mail; cta: string }> = {
  email: {
    title: 'Gmail senders',
    description: 'Send outreach and invoice reminders from a connected Gmail account.',
    icon: Mail,
    cta: 'Connect Gmail',
  },
  whatsapp: {
    title: 'WhatsApp senders',
    description: 'Send WhatsApp outreach from a connected WhatsApp Business number.',
    icon: MessageCircle,
    cta: 'Connect WhatsApp',
  },
}

function statusTone(status: SenderProfile['status']): string {
  if (status === 'connected') return 'bg-emerald-50 text-emerald-700'
  if (status === 'expired') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function formatWhen(value: string | null): string {
  if (!value) return 'never'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function SendersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [senders, setSenders] = useState<SenderProfile[]>([])
  const [providers, setProviders] = useState<SenderProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSenders()
      setSenders(data.senders || [])
      setProviders(data.providers || [])
    } catch (error: any) {
      toast.error(error.message || 'Could not load sender profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Surface the result of the provider redirect, then clear the query string.
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) toast.success(connected === '1' ? 'Sender connected' : `Connected “${connected}”`)
    if (error) toast.error(error)
    if (connected || error) {
      const next = new URLSearchParams(searchParams)
      next.delete('connected')
      next.delete('error')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function connect(channel: SenderChannel, senderId?: string) {
    setBusy(senderId || channel)
    try {
      const { authorizationUrl } = await startSenderAuthorization({ channel, senderId })
      window.location.assign(authorizationUrl)
    } catch (error: any) {
      toast.error(error.message || 'Could not start the provider authorization')
      setBusy(null)
    }
  }

  async function saveName(sender: SenderProfile) {
    const name = draftName.trim()
    if (!name || name === sender.name) {
      setEditingId(null)
      return
    }
    setBusy(sender.id)
    try {
      const updated = await renameSender(sender.id, name)
      setSenders((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      setEditingId(null)
      toast.success('Sender renamed')
    } catch (error: any) {
      toast.error(error.message || 'Could not rename the sender')
    } finally {
      setBusy(null)
    }
  }

  async function disconnect(sender: SenderProfile) {
    if (!window.confirm(`Disconnect “${sender.name}”? Workflows using it will stop sending until you reconnect.`)) return
    setBusy(sender.id)
    try {
      const updated = await disconnectSender(sender.id)
      setSenders((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      toast.success(`Disconnected “${sender.name}”`)
    } catch (error: any) {
      toast.error(error.message || 'Could not disconnect the sender')
    } finally {
      setBusy(null)
    }
  }

  const providerFor = (channel: SenderChannel) => providers.find((provider) => provider.channel === channel)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sender profiles</h1>
          <p className="mt-1 text-slate-500">
            Connect the Gmail and WhatsApp identities your workflows send from. Access is granted through the provider and never shown in the CMS.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(CHANNEL_META) as SenderChannel[]).map((channel) => {
          const meta = CHANNEL_META[channel]
          const provider = providerFor(channel)
          const Icon = meta.icon
          const configured = provider?.configured !== false
          return (
            <section key={channel} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Icon className="h-4 w-4 text-indigo-700" /> {meta.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={() => void connect(channel)}
                disabled={!configured || busy === channel}
              >
                <Link2 className="mr-2 h-4 w-4" /> {busy === channel ? 'Opening provider…' : meta.cta}
              </Button>
              {!configured && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {meta.cta} needs the app's OAuth client configured in deployment secrets. Add it, then reload this page.
                </p>
              )}
            </section>
          )
        })}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">Loading sender profiles…</div>
      ) : senders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No senders connected yet</h2>
          <p className="mt-1 text-sm text-slate-500">Connect a Gmail or WhatsApp account above, then choose it on an outreach workflow.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {senders.map((sender) => (
              <li key={sender.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    {editingId === sender.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          aria-label="Sender name"
                          className="h-8 w-56"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => void saveName(sender)} disabled={busy === sender.id}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{sender.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusTone(sender.status)}`}>{sender.status}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {sender.provider === 'gmail' ? 'Gmail' : 'WhatsApp'}
                        </span>
                      </div>
                    )}
                    <p className="mt-0.5 text-sm text-slate-500">{sender.account}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {sender.status === 'connected' ? <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-600" /> : null}
                      Last connected {formatWhen(sender.last_connected_at)}
                      {sender.last_error ? <span className="text-amber-700"> · {sender.last_error}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(sender.id)
                      setDraftName(sender.name)
                    }}
                  >
                    Rename
                  </Button>
                  {sender.status === 'connected' ? (
                    <Button size="sm" variant="outline" onClick={() => void disconnect(sender)} disabled={busy === sender.id}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => void connect(sender.channel, sender.id)} disabled={busy === sender.id}>
                      {busy === sender.id ? 'Opening provider…' : 'Reconnect'}
                    </Button>
                  )}
                  {sender.status === 'disconnected' && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Trash2 className="h-3.5 w-3.5" /> credentials removed
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
