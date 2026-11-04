import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created, noContent } from '../utils/response'
import { Client } from '../types'
import { supabase } from '../config/supabase'

/**
 * List clients for the authenticated user.
 */
export async function listClients(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    ok(res, data as Client[])
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Create a new client.
 */
export async function createClient(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body

    if (!userId || !body?.name || !body?.email) {
      badRequest(res, 'Name and email are required')
      return
    }

    const payload = {
      user_id: userId,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      company: body.company || null,
      tax_id: body.tax_id || null,
      status: body.status || 'active',
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    if (error) throw error
    created(res, data as Client)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Get a single client.
 */
export async function getClient(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      notFound(res, 'Client not found')
      return
    }
    ok(res, data as Client)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Update a client.
 */
export async function updateClient(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const body = req.body

    const { data, error } = await supabase
      .from('clients')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    ok(res, data as Client)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Delete a client.
 */
export async function deleteClient(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    noContent(res)
  } catch (e: any) {
    serverError(res, e.message)
  }
}
