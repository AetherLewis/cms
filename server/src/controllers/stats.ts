import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, serverError } from '../utils/response'
import { supabase } from '../config/supabase'

function numeric(value: unknown): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0 }

export async function getDashboardStats(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const [clientsResult, contractsResult, invoicesResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('contracts').select('id, title, value, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('id, invoice_number, total, status, due_date, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    if (clientsResult.error) throw clientsResult.error
    if (contractsResult.error) throw contractsResult.error
    if (invoicesResult.error) throw invoicesResult.error
    const contracts = contractsResult.data || [], invoices = invoicesResult.data || []
    const today = Date.now()
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + numeric(invoice.total), 0)
    const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.status === 'paid' ? numeric(invoice.total) : 0), 0)
    const totalOutstanding = invoices.reduce((sum, invoice) => sum + (invoice.status === 'paid' ? 0 : numeric(invoice.total)), 0)
    ok(res, {
      total_clients: clientsResult.count || 0,
      active_contracts: contracts.filter((contract) => contract.status === 'active').length,
      total_contract_value: contracts.reduce((sum, contract) => sum + numeric(contract.value), 0),
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_outstanding: totalOutstanding,
      overdue_count: invoices.filter((invoice) => invoice.status !== 'paid' && invoice.due_date && new Date(invoice.due_date).getTime() < today).length,
      recent_contracts: contracts.slice(0, 5),
      recent_invoices: invoices.slice(0, 5),
    })
  } catch (e: any) { serverError(res, e.message) }
}

export async function getMonthlyReport(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) { badRequest(res, 'Month must use YYYY-MM format'); return }
    const start = `${month}-01T00:00:00.000Z`
    const nextMonth = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString()
    const { data: invoices, error } = await supabase.from('invoices').select('total, status').eq('user_id', userId).gte('issued_date', start).lt('issued_date', nextMonth)
    if (error) throw error
    const rows = invoices || []
    const totalInvoiced = rows.reduce((sum, invoice) => sum + numeric(invoice.total), 0)
    const totalPaid = rows.reduce((sum, invoice) => sum + (invoice.status === 'paid' ? numeric(invoice.total) : 0), 0)
    ok(res, {
      month,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_outstanding: totalInvoiced - totalPaid,
      invoice_count: rows.length,
    })
  } catch (e: any) { serverError(res, e.message) }
}
