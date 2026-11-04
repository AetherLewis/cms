import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, serverError, created, noContent } from '../utils/response'
import { Payment, PaymentMethod } from '../types'
import { supabase } from '../config/supabase'

export async function listPayments(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*, invoices!inner(invoice_number, total, status, clients!inner(name))')
      .eq('invoices.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    ok(res, data as Payment[])
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createPayment(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body

    if (!userId || !body?.invoiceId || !body?.amount) {
      badRequest(res, 'invoiceId and amount are required')
      return
    }

    // Verify invoice belongs to user
    const { data: inv } = await supabase
      .from('invoices')
      .select('total')
      .eq('id', body.invoiceId)
      .eq('user_id', userId)
      .single()

    if (!inv) {
      badRequest(res, 'Invoice not found or does not belong to user')
      return
    }

    const payload = {
      invoice_id: body.invoiceId,
      amount: body.amount,
      payment_date: body.paymentDate || new Date().toISOString().split('T')[0],
      payment_method: (body.paymentMethod || 'bank_transfer') as PaymentMethod,
      reference: body.reference || null,
      notes: body.notes || null,
    }

    const { data, error } = await supabase.from('payments').insert(payload).select().single()
    if (error) throw error

    // If this fully covers the invoice, update status
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', body.invoiceId)

    const totalPaid = allPayments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
    if (totalPaid >= inv.total) {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
        .eq('id', body.invoiceId)
    }

    created(res, data as Payment)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getPayment(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      badRequest(res, 'Payment not found')
      return
    }

    ok(res, data as Payment)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function deletePayment(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params

    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw error
    noContent(res)
  } catch (e: any) {
    serverError(res, e.message)
  }
}
