import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created } from '../utils/response'
import { supabase } from '../config/supabase'

export async function getDashboardStats(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data: stats, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error || !stats) {
      notFound(res, 'Dashboard stats not found')
      return
    }
    ok(res, stats)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getMonthlyReport(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data: report, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('month', req.query.month || '2026-10') // Default to current month
      .single()
    if (error || !report) {
      notFound(res, 'Monthly report not found')
      return
    }
    ok(res, report)
  } catch (e: any) {
    serverError(res, e.message)
  }
}