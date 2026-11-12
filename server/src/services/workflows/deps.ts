import OpenAI from 'openai'
import { supabase } from '../../config/supabase'
import { sendEmailWithSender, sendWhatsAppWithSender, type DispatchCredentials } from '../dispatch'
import {
  accessTokenForSender,
  phoneNumberIdFor,
  resolveSenderAssignments,
} from '../senders/store'
import type { CreateInvoiceInput, WorkflowDeps } from './executors'
import type { OutreachContact, SenderChannel, SenderRow } from './types'

/** Resolved sending identity plus the blocker for any channel that has no usable sender. */
export interface SenderContext {
  credentials: Partial<Record<SenderChannel, DispatchCredentials>>
  issues: Partial<Record<SenderChannel, string>>
}

export const NO_SENDERS: SenderContext = { credentials: {}, issues: {} }

async function resolveCredentials(channel: SenderChannel, sender: SenderRow): Promise<DispatchCredentials> {
  const accessToken = await accessTokenForSender(sender)
  return {
    channel,
    account: sender.account,
    accessToken,
    phoneNumberId: phoneNumberIdFor(sender),
  }
}

/**
 * Resolve the workflow's assigned senders for its owner, refreshing OAuth tokens
 * server-side before the run. Never returns token material to the caller.
 */
export async function loadWorkflowSenders(
  userId: string,
  type: string,
  config: any,
): Promise<SenderContext> {
  const resolved = await resolveSenderAssignments(userId, type, config)
  const credentials: SenderContext['credentials'] = {}
  const issues: SenderContext['issues'] = { ...resolved.issues }

  for (const [channel, sender] of Object.entries(resolved.assignments)) {
    if (!sender) continue
    try {
      credentials[channel as SenderChannel] = await resolveCredentials(channel as SenderChannel, sender)
    } catch (error) {
      issues[channel as SenderChannel] = error instanceof Error ? error.message : 'The selected sender is unavailable'
    }
  }

  return { credentials, issues }
}

function createAiClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.OMNIROUTE_API_URL || 'http://localhost:20128/v1',
    apiKey: process.env.OMNIROUTE_API_KEY || 'sk-no-key-required',
  })
}

async function nextInvoiceNumber(userId: string, prefix: string): Promise<string> {
  const now = new Date()
  const period = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return `${prefix}-${period}-${String((count || 0) + 1).padStart(3, '0')}`
}

/**
 * Production wiring: delivery uses the workflow's connected sender profiles;
 * AI writing is the only provider still supplied by deployment secrets.
 */
export function buildWorkflowDeps(userId: string, senders: SenderContext = NO_SENDERS): WorkflowDeps {
  const ai = createAiClient()
  return {
    delivery: senders.issues,
    async generateOutreachMessage({ systemPrompt, contact }: { systemPrompt: string; contact: OutreachContact }) {
      const response = await ai.chat.completions.create({
        model: process.env.OMNIROUTE_MODEL || 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write the outreach message for: ${contact.identifier}. Name: ${contact.name || 'Unknown'}` },
        ],
      })
      const message = response.choices[0]?.message?.content?.trim()
      if (!message) throw new Error('The AI provider returned an empty message')
      return message
    },
    async sendEmail(to, subject, body) {
      const credentials = senders.credentials.email
      if (!credentials) throw new Error(senders.issues.email || 'No Gmail sender is connected for this workflow')
      await sendEmailWithSender(credentials, to, subject, body)
    },
    async sendWhatsApp(to, body) {
      const credentials = senders.credentials.whatsapp
      if (!credentials) throw new Error(senders.issues.whatsapp || 'No WhatsApp sender is connected for this workflow')
      await sendWhatsAppWithSender(credentials, to, body)
    },
    async createInvoice(input: CreateInvoiceInput) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', input.clientId)
        .eq('user_id', userId)
        .single()
      if (clientError || !client) throw new Error('The configured client no longer belongs to this account')

      const invoiceNumber = await nextInvoiceNumber(userId, input.numberPrefix)
      const now = new Date()
      const subtotal = input.quantity * input.unitPrice
      const taxAmount = subtotal * (input.taxRate / 100)
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          user_id: userId,
          client_id: input.clientId,
          invoice_number: invoiceNumber,
          status: 'draft',
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          total: subtotal + taxAmount,
          issued_date: now.toISOString(),
          due_date: new Date(now.getTime() + input.dueInDays * 86_400_000).toISOString(),
          updated_at: now.toISOString(),
        })
        .select('id, invoice_number')
        .single()
      if (error || !invoice) throw error || new Error('Invoice could not be created')

      const { error: itemError } = await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        description: input.description,
        quantity: input.quantity,
        unit_price: input.unitPrice,
        total: subtotal,
      })
      if (itemError) throw itemError

      return { invoiceId: invoice.id, invoiceNumber: invoice.invoice_number }
    },
  }
}
