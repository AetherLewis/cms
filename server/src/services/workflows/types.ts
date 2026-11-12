export type WorkflowType = 'outreach' | 'invoice_reminder' | 'recurring_invoice'
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
}

export interface InvoiceReminderConfig {
  clientId: string | null
  daysBeforeDue: number
  subject: string
  message: string
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
