import OpenAI from 'openai'
import { randomUUID } from 'node:crypto'
import { AuthRequest } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { badRequest, ok, serverError } from '../utils/response'

type Contact = { identifier: string; type: 'email' | 'phone'; name?: string }

const aiClient = new OpenAI({
  baseURL: process.env.OMNIROUTE_API_URL || 'http://localhost:20128/v1',
  apiKey: process.env.OMNIROUTE_API_KEY || 'sk-no-key-required',
})

async function mockDeliver(_payload: { contact: string; type: Contact['type']; message: string }): Promise<void> {
  // Replace this adapter with the configured email/SMS provider when one is selected.
}

export async function runOutreach(req: AuthRequest, res: any): Promise<void> {
  const userId = req.user?.id
  const { contacts, basePrompt } = req.body || {}
  if (!userId) { badRequest(res, 'User ID missing'); return }
  if (!Array.isArray(contacts) || contacts.length < 1 || contacts.length > 20) {
    badRequest(res, 'Provide between 1 and 20 contacts'); return
  }
  if (typeof basePrompt !== 'string' || !basePrompt.trim()) { badRequest(res, 'System instructions are required'); return }
  const valid = contacts.every((contact: Contact) => contact && typeof contact.identifier === 'string' && contact.identifier.trim() && ['email', 'phone'].includes(contact.type))
  if (!valid) { badRequest(res, 'Each contact needs an identifier and a type of email or phone'); return }
  const runId = randomUUID()
  try {
    const results = await Promise.all(contacts.map(async (contact: Contact) => {
      let generatedMessage: string | null = null
      let status = 'pending'
      try {
        const response = await aiClient.chat.completions.create({
          model: 'default',
          messages: [
            { role: 'system', content: basePrompt.trim() },
            { role: 'user', content: `Generate outreach for: ${contact.identifier.trim()}. Name: ${contact.name?.trim() || 'Unknown'}` },
          ],
        })
        generatedMessage = response.choices[0]?.message.content?.trim() || null
        if (!generatedMessage) throw new Error('OmniRoute returned an empty message')
      } catch (error) {
        status = 'failed'
      }

      const { data: inserted, error: insertError } = await supabase.from('automation_logs').insert({
        user_id: userId,
        run_id: runId,
        contact_identifier: contact.identifier.trim(),
        contact_type: contact.type,
        generated_message: generatedMessage,
        status,
      }).select('id, run_id, contact_identifier, contact_type, generated_message, status, created_at').single()
      if (insertError) throw insertError

      if (generatedMessage) {
        try {
          await mockDeliver({ contact: contact.identifier.trim(), type: contact.type, message: generatedMessage })
          const { data, error } = await supabase.from('automation_logs').update({ status: 'sent' }).eq('id', inserted.id)
            .select('id, run_id, contact_identifier, contact_type, generated_message, status, created_at').single()
          if (error) throw error
          return data
        } catch {
          const { data, error } = await supabase.from('automation_logs').update({ status: 'failed' }).eq('id', inserted.id)
            .select('id, run_id, contact_identifier, contact_type, generated_message, status, created_at').single()
          if (error) throw error
          return data
        }
      }
      return inserted
    }))
    ok(res, { runId, results })
  } catch (error: any) {
    serverError(res, error.message || 'Failed to process outreach')
  }
}

export async function listOutreachLogs(req: AuthRequest, res: any): Promise<void> {
  try {
    const { data, error } = await supabase.from('automation_logs')
      .select('id, run_id, contact_identifier, contact_type, generated_message, status, created_at')
      .eq('user_id', req.user?.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    ok(res, data)
  } catch (error: any) {
    serverError(res, error.message || 'Failed to load outreach logs')
  }
}
