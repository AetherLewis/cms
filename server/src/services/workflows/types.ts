export type WorkflowType = 'outreach' | 'invoice_reminder' | 'recurring_invoice'
export type SenderChannel = 'email' | 'whatsapp'
export type SenderProvider = 'google' | 'meta'
export type SenderStatus = 'connected' | 'expired' | 'revoked'

/** Sender profiles assigned per channel, e.g. one Gmail sender and one WhatsApp sender. */
export interface SenderAssignments {
  email?: string
  whatsapp?: string
}

export interface SenderRow {
  id: string
  user_id: string
  name: string
  channel: SenderChannel
  provider: SenderProvider
  account: string
  status: SenderStatus
  scopes: string[]
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  provider_data: Record<string, unknown>
  last_connected_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

/** Sender shape returned to the CMS — never includes token material. */
export interface SenderSummary {
  id: string
  name: string
  channel: SenderChannel
  provider: 'gmail' | 'whatsapp'
  account: string
  status: 'connected' | 'expired' | 'disconnected'
  scopes: string[]
  last_connected_at: string | null
  last_error: string | null
  created_at: string
}
export type WorkflowStatus = 'draft' | 'active' | 'paused'
export type WorkflowFrequency = 'daily' | 'weekly' | 'monthly'
export type RunTrigger = 'manual' | 'schedule'
export type RunStatus = 'running' | 'succeeded' | 'partial' | 'failed' | 'empty'
export type RunItemStatus = 'sent' | 'created' | 'failed' | 'skipped'

export interface OutreachContact {
  identifier: string
  type: 'email' | 'phone'
  name?: string
}

export interface OutreachConfig {
  contacts: OutreachContact[]
  systemPrompt: string
  subject: string
  senderIds?: SenderAssignments
}

export interface InvoiceReminderConfig {
  clientId: string | null
  daysBeforeDue: number
  subject: string
  message: string
  senderIds?: SenderAssignments
}

export interface RecurringInvoiceConfig {
  clientId: string
  invoice: {
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    dueInDays: number
    numberPrefix: string
  }
}

export type WorkflowConfig = OutreachConfig | InvoiceReminderConfig | RecurringInvoiceConfig

export interface WorkflowRow {
  id: string
  user_id: string
  name: string
  type: WorkflowType
  status: WorkflowStatus
  timezone: string
  frequency: WorkflowFrequency
  run_time: string
  config: any
  next_run_at: string | null
  last_run_at: string | null
  last_run_status: string | null
  last_run_id: string | null
  created_at: string
  updated_at: string
}

/** Planned unit of work for a run; also what the CMS previews before activation. */
export interface WorkflowTarget {
  itemKey: string
  label: string
  detail: string
  dedupeKey?: string | null
}

export interface RunItem extends WorkflowTarget {
  status: RunItemStatus
}

export interface OutreachTarget extends WorkflowTarget {
  contact: OutreachContact
}

export interface ProviderReadiness {
  email: boolean
  whatsapp: boolean
  ai: boolean
}
