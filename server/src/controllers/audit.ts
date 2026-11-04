import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created } from '../utils/response'
import { supabase } from '../config/supabase'

export async function listAuditLogs(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createAuditLog(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body
    if (!userId || !body?.action) {
      badRequest(res, 'Action is required')
      return
    }
    const payload = {
      user_id: userId,
      action: body.action,
      resource_type: body.resourceType || body.resource_type || null,
      resource_id: body.resourceId || body.resource_id || null,
      details: body.details || null,
      created_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('audit_logs').insert(payload).select().single()
    if (error) throw error
    created(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}
