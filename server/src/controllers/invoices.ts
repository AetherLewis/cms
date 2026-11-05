import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created, noContent } from '../utils/response'
import { Invoice, InvoiceItem } from '../types'
import { supabase } from '../config/supabase'

export async function listInvoices(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients!inner(name, email), contracts!inner(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    ok(res, data as Invoice[])
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createInvoice(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body

    if (!userId || !body?.invoiceNumber || !body?.clientId) {
      badRequest(res, 'invoiceNumber and clientId are required')
      return
    }

    // Compute from items
    const items: Partial<InvoiceItem>[] = body.items || []
    const subtotal = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    )
    const taxRate = body.taxRate || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const payload = {
      user_id: userId,
      client_id: body.clientId,
      contract_id: body.contractId || null,
      invoice_number: body.invoiceNumber,
      status: body.status || 'draft',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      due_date: body.dueDate || null,
      issued_date: body.issuedDate || new Date().toISOString().split('T')[0],
      paid_date: null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('invoices').insert(payload).select().single()
    if (error) throw error

    // Insert items
    if (items.length > 0 && data?.id) {
      const itemRows = items.map((item) => ({
        invoice_id: data.id,
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: (item.quantity || 0) * (item.unit_price || 0),
      }))
      await supabase.from('invoice_items').insert(itemRows)
    }

    created(res, data as Invoice)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getInvoice(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients!inner(name, email), contracts!inner(title)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      notFound(res, 'Invoice not found')
      return
    }

    const { data: itemsData } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)

    ok(res, { ...(data as Invoice), items: itemsData || [] })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function updateInvoice(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const body = req.body

    const { data, error } = await supabase
      .from('invoices')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    ok(res, data as Invoice)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function deleteInvoice(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    noContent(res)
  } catch (e: any) {
    serverError(res, e.message)
  }
}
