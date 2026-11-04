import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created } from '../utils/response'
import { supabase } from '../config/supabase'

export async function listRecurring(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data, error } = await supabase
      .from('recurring')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createRecurring(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body
    if (!userId || !body?.name) {
      badRequest(res, 'Name is required')
      return
    }
    const payload = {
      user_id: userId,
      name: body.name,
      frequency: body.frequency || 'daily',
      start_date: body.startDate || new Date().toISOString().split('T')[0],
      end_date: body.endDate || null,
      active: body.active !== false,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('recurring').insert(payload).select().single()
    if (error) throw error
    created(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function toggleRecurring(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const { active } = req.body
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { error } = await supabase
      .from('recurring')
      .update({ active: !active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    ok(res, { active: !active })
  } catch (e: any) {
    serverError(res, e.message)
  }
}