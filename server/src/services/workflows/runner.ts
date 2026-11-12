import { randomUUID } from 'node:crypto'
import { supabase } from '../../config/supabase'
import type {
  InvoiceReminderConfig,
  OutreachConfig,
  OutreachTarget,
  RecurringInvoiceConfig,
  RunItem,
  RunStatus,
  RunTrigger,
  WorkflowRow,
  WorkflowTarget,
} from './types'
import { computeNextRunAt, dateKeyInZone, periodKeyInZone } from './schedule'
import { getProviderReadiness, missingProviderLabels } from './readiness'
import { connectedChannels, resolveSenderAssignments } from '../senders/store'
import { buildReminderTargets, formatDate, recurringInvoiceTarget, type ReminderInvoice } from './targets'
import {
  runOutreachItems,
  runRecurringInvoiceItem,
  runReminderItems,
  type ItemContext,
  type WorkflowDeps,
} from './executors'
import { buildWorkflowDeps, loadWorkflowSenders } from './deps'

export interface WorkflowDefinition {
  id?: string
  user_id: string
  type: WorkflowRow['type']
  timezone: string
  frequency: WorkflowRow['frequency']
  run_time: string
  config: any
}

interface LoadedTargets {
  targets: WorkflowTarget[]
  outreach: OutreachTarget[]
  reminders: ReminderInvoice[]
}

async function emptyTargets(): Promise<LoadedTargets> {
  return { targets: [], outreach: [], reminders: [] }
}

/**
 * Load and ownership-check everything a run will touch for the workflow's owner.
 */
export async function loadWorkflowTargets(
  workflow: WorkflowDefinition,
  trigger: RunTrigger,
  now: Date,
): Promise<LoadedTargets> {
  if (workflow.type === 'outreach') {
    const config = workflow.config as OutreachConfig
    const dayKey = trigger === 'schedule' ? dateKeyInZone(now, workflow.timezone) : null
    const outreach: OutreachTarget[] = (config.contacts || []).map((contact) => ({
      itemKey: `contact:${contact.type}:${contact.identifier}`,
      label: contact.name ? `${contact.name} (${contact.identifier})` : contact.identifier,
      detail: contact.type === 'email' ? 'Email outreach' : 'WhatsApp outreach',
      dedupeKey: dayKey ? `outreach:${contact.type}:${contact.identifier}:${dayKey}` : null,
      contact,
    }))
    return { targets: outreach, outreach, reminders: [] }
  }

  if (workflow.type === 'invoice_reminder') {
    const config = workflow.config as InvoiceReminderConfig
    let query = supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, status, client_id, clients!inner(name, email)')
      .eq('user_id', workflow.user_id)
      .in('status', ['sent', 'overdue'])
      .order('due_date', { ascending: true })
    if (config.clientId) query = query.eq('client_id', config.clientId)
    const { data, error } = await query
    if (error) throw error

    const invoices: ReminderInvoice[] = (data || []).map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      total: Number(row.total) || 0,
      dueDate: row.due_date,
      status: row.status,
      clientName: row.clients?.name || 'Client',
      clientEmail: row.clients?.email || null,
    }))
    const due = buildReminderTargets(config, invoices, now)
    const dayKey = dateKeyInZone(now, workflow.timezone)
    return {
      targets: due.map((invoice) => ({
        itemKey: `invoice:${invoice.id}`,
        label: `Reminder for ${invoice.invoiceNumber}`,
        detail: `${invoice.clientName} · due ${formatDate(invoice.dueDate)}`,
        dedupeKey: `reminder:${invoice.id}:${dayKey}`,
      })),
      outreach: [],
      reminders: due,
    }
  }

  if (workflow.type === 'recurring_invoice') {
    const config = workflow.config as RecurringInvoiceConfig
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', config.clientId)
      .eq('user_id', workflow.user_id)
      .maybeSingle()
    if (error) throw error
    if (!client) throw new Error('The configured client no longer belongs to this account')

    const period = periodKeyInZone(now, workflow.timezone)
    const target = recurringInvoiceTarget(
      { clientId: config.clientId, clientName: client.name, ...config.invoice },
      period,
      `invoice-create:${config.clientId}:${period}`,
    )
    return { targets: [target], outreach: [], reminders: [] }
  }

  return emptyTargets()
}

export interface PreviewOutcome {
  items: Array<{ label: string; detail: string }>
  missingProviders: string[]
  readyToRun: boolean
  nextRunAt: string | null
}

/** Provider blockers for a workflow: missing AI configuration plus unusable sender assignments. */
export async function workflowBlockers(workflow: { user_id: string; type: string; config: any }): Promise<string[]> {
  const connected = await connectedChannels(workflow.user_id)
  const missing = missingProviderLabels(workflow.type, workflow.config, getProviderReadiness(connected))
  const senders = await resolveSenderAssignments(workflow.user_id, workflow.type, workflow.config)
  const senderIssues = Object.values(senders.issues).filter((issue): issue is string => Boolean(issue))
  return [...missing, ...senderIssues]
}

export async function previewWorkflow(workflow: WorkflowDefinition, now = new Date()): Promise<PreviewOutcome> {
  const loaded = await loadWorkflowTargets(workflow, 'manual', now)
  const next = computeNextRunAt(workflow.frequency, workflow.run_time, workflow.timezone, now)
  const missingProviders = await workflowBlockers(workflow)
  const items = loaded.targets.map((target) => {
    if (workflow.type === 'outreach') return { label: target.label, detail: 'AI writes a personalised message, then sends it' }
    if (workflow.type === 'invoice_reminder') return { label: target.label, detail: `${target.detail} · reminder email` }
    return { label: target.label, detail: `${target.detail} · creates a draft invoice` }
  })
  return { items, missingProviders, readyToRun: missingProviders.length === 0, nextRunAt: next ? next.toISOString() : null }
}

export interface RunTotals {
  total: number
  succeeded: number
  failed: number
  skipped: number
}

export interface RunOutcome {
  runId: string
  status: RunStatus
  totals: RunTotals
  items: RunItem[]
}

export function summariseTotals(totals: RunTotals): RunStatus {
  const { total, succeeded, failed } = totals
  if (total === 0) return 'empty'
  if (failed > 0) return succeeded > 0 ? 'partial' : 'failed'
  if (succeeded === 0) return 'empty'
  return 'succeeded'
}

function summaryText(totals: RunTotals): string {
  if (totals.total === 0) return 'Nothing was due for this workflow'
  return `${totals.succeeded} succeeded · ${totals.failed} failed · ${totals.skipped} skipped`
}

/**
 * Execute a workflow and persist accurate per-item outcomes.
 * Idempotency keys are reserved in the database, so concurrent runs cannot double-send or double-create.
 */
export async function executeWorkflow(options: {
  workflow: WorkflowRow
  trigger: RunTrigger
  deps?: WorkflowDeps
  now?: Date
}): Promise<RunOutcome> {
  const { workflow, trigger } = options
  const now = options.now || new Date()
  const deps =
    options.deps ||
    buildWorkflowDeps(workflow.user_id, await loadWorkflowSenders(workflow.user_id, workflow.type, workflow.config))
  const runId = randomUUID()

  const loaded = await loadWorkflowTargets(workflow, trigger, now)
  const { error: runError } = await supabase.from('workflow_runs').insert({
    id: runId,
    workflow_id: workflow.id,
    user_id: workflow.user_id,
    trigger,
    status: 'running',
    total_items: loaded.targets.length,
    started_at: now.toISOString(),
  })
  if (runError) throw runError

  const reserved = new Set<string>()
  const ctx: ItemContext = {
    claim: async (item) => {
      const { error } = await supabase.from('workflow_run_items').insert({
        run_id: runId,
        workflow_id: workflow.id,
        user_id: workflow.user_id,
        item_key: item.itemKey,
        label: item.label,
        detail: item.detail,
        status: 'skipped',
        dedupe_key: item.dedupeKey ?? null,
      })
      if (!error) {
        reserved.add(item.itemKey)
        return true
      }
      if (error.code === '23505') return false
      throw error
    },
    record: async (item, opts) => {
      if (reserved.has(item.itemKey)) {
        const { error } = await supabase
          .from('workflow_run_items')
          .update({ status: item.status, detail: item.detail })
          .eq('run_id', runId)
          .eq('item_key', item.itemKey)
        if (error) throw error
        return
      }
      const { error } = await supabase.from('workflow_run_items').insert({
        run_id: runId,
        workflow_id: workflow.id,
        user_id: workflow.user_id,
        item_key: item.itemKey,
        label: item.label,
        detail: item.detail,
        status: item.status,
        dedupe_key: opts?.reserve === false ? null : item.dedupeKey ?? null,
      })
      if (error && error.code !== '23505') throw error
      if (!error) reserved.add(item.itemKey)
    },
  }

  let items: RunItem[] = []
  let fatal: string | null = null
  try {
    if (workflow.type === 'outreach') {
      items = await runOutreachItems(loaded.outreach, workflow.config as OutreachConfig, deps, ctx)
    } else if (workflow.type === 'invoice_reminder') {
      const config = workflow.config as InvoiceReminderConfig
      items = await runReminderItems(loaded.reminders, config, deps, ctx, now, (invoice) => {
        return `reminder:${invoice.id}:${dateKeyInZone(now, workflow.timezone)}`
      })
    } else if (workflow.type === 'recurring_invoice') {
      const target = loaded.targets[0]
      items = target ? [await runRecurringInvoiceItem(target, workflow.config as RecurringInvoiceConfig, deps, ctx)] : []
    }
  } catch (error) {
    fatal = error instanceof Error ? error.message : 'Workflow execution failed'
  }

  const totals: RunTotals = {
    total: items.length,
    succeeded: items.filter((item) => item.status === 'sent' || item.status === 'created').length,
    failed: items.filter((item) => item.status === 'failed').length,
    skipped: items.filter((item) => item.status === 'skipped').length,
  }
  const status: RunStatus = fatal ? 'failed' : summariseTotals(totals)
  const isDuplicateSkipOnly = !fatal && totals.total > 0 && totals.succeeded === 0 && totals.failed === 0
  const summary = fatal || (isDuplicateSkipOnly ? 'Already handled for this period — nothing new was sent' : summaryText(totals))

  await supabase
    .from('workflow_runs')
    .update({
      status,
      total_items: totals.total,
      succeeded_items: totals.succeeded,
      failed_items: totals.failed,
      skipped_items: totals.skipped,
      summary,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId)

  await supabase
    .from('workflows')
    .update({ last_run_at: now.toISOString(), last_run_status: status, last_run_id: runId, updated_at: now.toISOString() })
    .eq('id', workflow.id)

  return { runId, status, totals, items }
}
