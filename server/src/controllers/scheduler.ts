import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { ok, sendJson, serverError } from '../utils/response'
import { runDueWorkflows } from '../services/workflows/scheduler'

function schedulerKey(req: Request): string {
  const header = req.header('x-scheduler-key') || req.header('authorization')?.replace(/^Bearer\s+/i, '') || ''
  return header.trim()
}

function keysMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  if (receivedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(receivedBuffer, expectedBuffer)
}

/**
 * Deployment cron entry point. Secured with the SCHEDULER_SECRET deployment secret,
 * never with a CMS-provided credential.
 */
export async function runScheduledWorkflows(req: Request, res: any): Promise<void> {
  try {
    const expected = process.env.SCHEDULER_SECRET?.trim()
    if (!expected) {
      sendJson(res, 503, { success: false, error: 'SCHEDULER_SECRET is not configured for this deployment' })
      return
    }
    if (!keysMatch(schedulerKey(req), expected)) {
      sendJson(res, 401, { success: false, error: 'Invalid scheduler key' })
      return
    }
    const limit = Number(req.query.limit)
    const outcome = await runDueWorkflows({ limit: Number.isFinite(limit) && limit > 0 ? limit : 10 })
    ok(res, outcome)
  } catch (e: any) {
    serverError(res, e.message || 'Scheduled run failed')
  }
}
