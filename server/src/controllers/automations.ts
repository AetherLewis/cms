import { GoogleGenerativeAI } from '@google/generative-ai'
import { randomUUID } from 'node:crypto'
import { AuthRequest } from '../middleware/auth'
import { supabase } from '../config/supabase'
import { badRequest, ok, serverError } from '../utils/response'

type Contact = { identifier: string; type: 'email' | 'phone'; name?: string }

export async function runOutreach(req: AuthRequest, res: any): Promise<void> {
  const userId = req.user?.id
  const { contacts, basePrompt, serviceConfig = {} } = req.body || {}
  if (!userId) return badRequest(res, 'User ID missing')
  if (!Array.isArray(contacts) || contacts.length < 1 || contacts.length > 20) {
    return badRequest(res, 'Provide between 1 and 20 contacts')
  }
  if (typeof basePrompt !== 'string' || !basePrompt.trim()) return badRequest(res, 'System instructions are required')
  const valid = contacts.every((contact: Contact) => contact && typeof contact.identifier === 'string' && contact.identifier.trim() && ['email', 'phone'].includes(contact.type))
  if (!valid) return badRequest(res, 'Each contact needs an identifier and a type of email or phone')
  if (!process.env.GEMINI_API_KEY) return serverError(res, 'Gemini is not configured. Set GEMINI_API_KEY to enable outreach.')

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const runId = randomUUID()
  try {
    const results = await Promise.all(contacts.map(async (contact: Contact) => {
      let generatedMessage: string | null = null
      let status = 'failed'
      try {
        const prompt = `${basePrompt.trim()}\n\nWrite a personalized outreach message for ${contact.name?.trim() || 'this prospective client'}. Their contact is ${contact.identifier.trim()} (${contact.type}). Return only the message.`
        const result = await model.generateContent(prompt)
        generatedMessage = result.response.text().trim()
        if (!generatedMessage) throw new Error('Gemini returned an empty message')

        // Delivery adapter placeholder: this records the payload as mock-sent until a provider is configured.
        // serviceConfig is accepted for future Omniroute/SMTP routing preferences.
        void serviceConfig
        status = 'sent (mock)'
      } catch (error) {
        status = `failed: ${error instanceof Error ? error.message : 'message generation failed'}`
      }

      const { data, error } = await supabase.from('automation_logs').insert({
        user_id: userId,
        run_id: runId,
        contact: contact.identifier.trim(),
        type: contact.type,
        generated_message: generatedMessage,
        status,
      }).select('id, run_id, contact, type, generated_message, status, created_at').single()
      if (error) throw error
      return data
    }))
    ok(res, { runId, results })
  } catch (error: any) {
    serverError(res, error.message || 'Failed to process outreach')
  }
}

export async function listOutreachLogs(req: AuthRequest, res: any): Promise<void> {
  try {
    const { data, error } = await supabase.from('automation_logs')
      .select('id, run_id, contact, type, generated_message, status, created_at')
      .eq('user_id', req.user?.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    ok(res, data)
  } catch (error: any) {
    serverError(res, error.message || 'Failed to load outreach logs')
  }
}
