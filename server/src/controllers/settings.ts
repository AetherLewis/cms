import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created, noContent } from '../utils/response'
import { supabase } from '../config/supabase'

export async function getSettings(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !data) {
      notFound(res, 'Settings not found')
      return
    }
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function updateSettings(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const payload = {
      ...body,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('settings')
      .upsert(payload)
      .select()
      .single()
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}
