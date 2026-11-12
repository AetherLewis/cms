import { supabase } from '../../config/supabase'
import { computeNextRunAt } from './schedule'
import { executeWorkflow } from './runner'
import type { RunStatus, WorkflowRow } from './types'

export interface ScheduledWorkflowResult {
  workflowId: string
  name: string
  status: RunStatus | 'error'
  totals?: { total: number; succeeded: number; failed: number; skipped: number }
  error?: string
}

export interface SchedulerOutcome {
  checkedAt: string
  claimed: number
  results: ScheduledWorkflowResult[]
}

/**
 * Claim every workflow that is due and execute it server-side.
 * Claiming uses a compare-and-set on next_run_at so overlapping scheduler runs cannot execute the same
 * workflow twice; per-item idempotency keys cover the remaining retry window.
 */
export async function runDueWorkflows(options: { limit?: number; now?: Date } = {}): Promise<SchedulerOutcome> {
  const now = options.now || new Date()
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50)

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', now.toISOString())
    .order('next_run_at', { ascending: true })
    .limit(limit)
  if (error) throw error

  const results: ScheduledWorkflowResult[] = []
  for (const row of (data || []) as WorkflowRow[]) {
    const next = computeNextRunAt(row.frequency, row.run_time, row.timezone, now)
    let claim = supabase
      .from('workflows')
      .update({ next_run_at: next ? next.toISOString() : null })
      .eq('id', row.id)
      .eq('status', 'active')
    claim = row.next_run_at ? claim.eq('next_run_at', row.next_run_at) : claim.is('next_run_at', null)
    const { data: claimed, error: claimError } = await claim.select('id')

    if (claimError) {
      results.push({ workflowId: row.id, name: row.name, status: 'error', error: claimError.message })
      continue
    }
    if (!claimed || claimed.length === 0) continue

    try {
      const outcome = await executeWorkflow({
        workflow: { ...row, next_run_at: next ? next.toISOString() : null },
        trigger: 'schedule',
        now,
      })
      results.push({ workflowId: row.id, name: row.name, status: outcome.status, totals: outcome.totals })
    } catch (executionError) {
      const message = executionError instanceof Error ? executionError.message : 'Scheduled run failed'
      await supabase
        .from('workflows')
        .update({ last_run_at: now.toISOString(), last_run_status: 'failed', updated_at: now.toISOString() })
        .eq('id', row.id)
      results.push({ workflowId: row.id, name: row.name, status: 'error', error: message })
    }
  }

  return { checkedAt: now.toISOString(), claimed: results.length, results }
}
