import { AuthRequest } from '../middleware/auth'
import { ok, badRequest, notFound, serverError, created, noContent } from '../utils/response'
import { supabase } from '../config/supabase'

export async function listDocuments(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      badRequest(res, 'User ID missing')
      return
    }
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function createDocument(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    const body = req.body
    if (!userId || !body?.title) {
      badRequest(res, 'Title is required')
      return
    }
    const payload = {
      user_id: userId,
      title: body.title,
      file_url: body.fileUrl || body.file_url || null,
      document_type: body.documentType || body.document_type || 'other',
      description: body.description || null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('documents').insert(payload).select().single()
    if (error) throw error
    created(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function getDocument(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) {
      notFound(res, 'Document not found')
      return
    }
    ok(res, data)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function deleteDocument(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    noContent(res)
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function exportDocument(req: AuthRequest, res: any): Promise<void> {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error || !data) {
      notFound(res, 'Document not found')
      return
    }
    ok(res, { exported_at: new Date().toISOString(), document: data })
  } catch (e: any) {
    serverError(res, e.message)
  }
}
