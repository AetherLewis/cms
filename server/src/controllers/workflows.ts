import { AuthRequest } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { badRequest, created, noContent, notFound, ok, serverError } from '../utils/response'
import { validateWorkflowInput } from '../services/workflows/validation'
import { computeNextRunAt } from '../services/workflows/schedule'
import { getProviderReadiness, missingProviderLabels } from '../services/workflows/readiness'
import { connectedChannels, listSenders, senderProblems } from '../services/senders/store'
import { executeWorkflow, previewWorkflow, workflowBlockers } from '../services/workflows/runner'
import type { InvoiceReminderConfig, RecurringInvoiceConfig, WorkflowRow } from '../services/workflows/types'

async function clientBelongsToUser(userId: string, clientId: string): Promise<boolean> {
  const { data, error } = await supabase.from('clients').select('id').eq('id', clientId).eq('user_id', userId).maybeSingle()
  return !error && Boolean(data)
}

function linkedClientId(type: string, config: any): string | null {
  if (type === 'recurring_invoice') return (config as RecurringInvoiceConfig)?.clientId || null
  if (type === 'invoice_reminder') return (config as InvoiceReminderConfig)?.clientId || null
  return null
}

function paramId(req: AuthRequest): string {
  return String((req.params as Record<string, unknown>).id || '')
}

function nextRunAtFor(row: { frequency: any; run_time: string; timezone: string }) {
  const next = computeNextRunAt(row.frequency, row.run_time, row.timezone, new Date())
  return next ? next.toISOString() : null
}

async function findOwnedWorkflow(userId: string, id: string): Promise<WorkflowRow | null> {
  const { data, error } = await supabase.from('workflows').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data as WorkflowRow) || null
}

export async function listWorkflows(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const senders = await listSenders(userId)
    const readiness = getProviderReadiness({
      email: senders.some((sender) => sender.channel === 'email' && sender.status === 'connected'),
      whatsapp: senders.some((sender) => sender.channel === 'whatsapp' && sender.status === 'connected'),
    })
    const workflows = (data || []).map((row: WorkflowRow) => ({
      ...row,
      missingProviders: [
        ...missingProviderLabels(row.type, row.config, readiness),
        ...senderProblems(row.type, row.config, senders),
      ],
    }))
    ok(res, { workflows, readiness })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getWorkflowReadiness(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    ok(res, { readiness: getProviderReadiness(await connectedChannels(userId)) })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const workflow = await findOwnedWorkflow(userId, paramId(req))
    if (!workflow) { notFound(res, 'Workflow not found'); return }
    ok(res, {
      ...workflow,
      missingProviders: await workflowBlockers({ user_id: userId, type: workflow.type, config: workflow.config }),
    })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const body = req.body || {}
    const validation = validateWorkflowInput(body)
    if (!validation.ok || !validation.value) { badRequest(res, validation.errors.join('. ')); return }
    const value = validation.value

    const clientId = linkedClientId(value.type, value.config)
    if (clientId && !(await clientBelongsToUser(userId, clientId))) {
      badRequest(res, 'Choose a client that belongs to your account'); return
    }

    const activate = body.activate === true
    if (activate) {
      const missing = await workflowBlockers({ user_id: userId, type: value.type, config: value.config })
      if (missing.length > 0) {
        badRequest(res, `Activation blocked. ${missing.join('. ')}`); return
      }
    }

    const now = new Date()
    const payload = {
      user_id: userId,
      name: value.name,
      type: value.type,
      status: activate ? 'active' : 'draft',
      timezone: value.timezone,
      frequency: value.frequency,
      run_time: value.runTime,
      config: value.config,
      next_run_at: activate ? nextRunAtFor({ frequency: value.frequency, run_time: value.runTime, timezone: value.timezone }) : null,
      updated_at: now.toISOString(),
    }
    const { data, error } = await supabase.from('workflows').insert(payload).select().single()
    if (error) throw error
    created(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function updateWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const existing = await findOwnedWorkflow(userId, paramId(req))
    if (!existing) { notFound(res, 'Workflow not found'); return }

    const validation = validateWorkflowInput(req.body || {})
    if (!validation.ok || !validation.value) { badRequest(res, validation.errors.join('. ')); return }
    const value = validation.value

    const clientId = linkedClientId(value.type, value.config)
    if (clientId && !(await clientBelongsToUser(userId, clientId))) {
      badRequest(res, 'Choose a client that belongs to your account'); return
    }

    const activate = req.body?.activate === true
    if (activate) {
      const missing = await workflowBlockers({ user_id: userId, type: value.type, config: value.config })
      if (missing.length > 0) {
        badRequest(res, `Activation blocked. ${missing.join('. ')}`); return
      }
    }

    const status = activate ? 'active' : existing.status === 'active' ? 'active' : 'draft'
    const { data, error } = await supabase
      .from('workflows')
      .update({
        name: value.name,
        type: value.type,
        status,
        timezone: value.timezone,
        frequency: value.frequency,
        run_time: value.runTime,
        config: value.config,
        next_run_at: nextRunAtFor({ frequency: value.frequency, run_time: value.runTime, timezone: value.timezone }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function activateWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const workflow = await findOwnedWorkflow(userId, paramId(req))
    if (!workflow) { notFound(res, 'Workflow not found'); return }

    const validation = validateWorkflowInput({
      name: workflow.name,
      type: workflow.type,
      timezone: workflow.timezone,
      frequency: workflow.frequency,
      runTime: workflow.run_time,
      config: workflow.config,
    })
    if (!validation.ok) { badRequest(res, `Workflow is incomplete: ${validation.errors.join('. ')}`); return }

    const missing = await workflowBlockers({ user_id: userId, type: workflow.type, config: workflow.config })
    if (missing.length > 0) {
      badRequest(res, `Activation blocked. ${missing.join('. ')}`); return
    }

    const { data, error } = await supabase
      .from('workflows')
      .update({ status: 'active', next_run_at: nextRunAtFor(workflow), updated_at: new Date().toISOString() })
      .eq('id', workflow.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function pauseWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const { data, error } = await supabase
      .from('workflows')
      .update({ status: 'paused', next_run_at: null, updated_at: new Date().toISOString() })
      .eq('id', paramId(req))
      .eq('user_id', userId)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) { notFound(res, 'Workflow not found'); return }
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function deleteWorkflow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const { error } = await supabase.from('workflows').delete().eq('id', paramId(req)).eq('user_id', userId)
    if (error) throw error
    noContent(res)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/** Preview unsaved or saved configuration without sending anything. */
export async function previewWorkflowHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const id = paramId(req)
    let definition: any = req.body || {}

    if (id) {
      const existing = await findOwnedWorkflow(userId, id)
      if (!existing) { notFound(res, 'Workflow not found'); return }
      definition = {
        name: definition.name || existing.name,
        type: definition.type || existing.type,
        timezone: definition.timezone || existing.timezone,
        frequency: definition.frequency || existing.frequency,
        runTime: definition.runTime || existing.run_time,
        config: definition.config || existing.config,
      }
    }

    const validation = validateWorkflowInput(definition)
    if (!validation.ok || !validation.value) { badRequest(res, validation.errors.join('. ')); return }
    const value = validation.value

    const clientId = linkedClientId(value.type, value.config)
    if (clientId && !(await clientBelongsToUser(userId, clientId))) {
      badRequest(res, 'Choose a client that belongs to your account'); return
    }

    const preview = await previewWorkflow({
      user_id: userId,
      type: value.type,
      timezone: value.timezone,
      frequency: value.frequency,
      run_time: value.runTime,
      config: value.config,
    })
    ok(res, preview)
  } catch (e: any) {
    badRequest(res, e.message)
  }
}

export async function runWorkflowNow(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const workflow = await findOwnedWorkflow(userId, paramId(req))
    if (!workflow) { notFound(res, 'Workflow not found'); return }

    const missing = await workflowBlockers({ user_id: userId, type: workflow.type, config: workflow.config })
    if (missing.length > 0) {
      badRequest(res, `Cannot run. ${missing.join('. ')}`); return
    }

    const outcome = await executeWorkflow({ workflow, trigger: 'manual' })
    ok(res, outcome)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function listWorkflowRuns(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const workflow = await findOwnedWorkflow(userId, paramId(req))
    if (!workflow) { notFound(res, 'Workflow not found'); return }

    const { data: runs, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', workflow.id)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(25)
    if (error) throw error

    const runIds = (runs || []).map((run: any) => run.id)
    let itemsByRun: Record<string, any[]> = {}
    if (runIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('workflow_run_items')
        .select('id, run_id, label, status, detail, created_at')
        .in('run_id', runIds)
        .order('created_at', { ascending: true })
      if (itemsError) throw itemsError
      itemsByRun = (items || []).reduce((acc: Record<string, any[]>, item: any) => {
        acc[item.run_id] = [...(acc[item.run_id] || []), item]
        return acc
      }, {})
    }

    ok(res, {
      workflow: {
        ...workflow,
        missingProviders: await workflowBlockers({ user_id: userId, type: workflow.type, config: workflow.config }),
      },
      runs: (runs || []).map((run: any) => ({ ...run, items: itemsByRun[run.id] || [] })),
    })
  } catch (e: any) {
    serverError(res, e.message)
  }
}
