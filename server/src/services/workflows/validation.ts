import type {
  InvoiceReminderConfig,
  OutreachConfig,
  OutreachContact,
  RecurringInvoiceConfig,
  WorkflowConfig,
  WorkflowFrequency,
  WorkflowType,
} from './types'
import { isValidTimeZone, parseRunTime, timeZoneOrDefault } from './schedule'

export const WORKFLOW_TYPES: WorkflowType[] = ['outreach', 'invoice_reminder', 'recurring_invoice']
export const WORKFLOW_FREQUENCIES: WorkflowFrequency[] = ['daily', 'weekly', 'monthly']
export const MAX_OUTREACH_CONTACTS = 50
export const REMINDER_PLACEHOLDERS = ['{{client_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}']

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface WorkflowInput {
  name?: unknown
  type?: unknown
  timezone?: unknown
  frequency?: unknown
  runTime?: unknown
  config?: any
}

export interface ValidatedWorkflow {
  name: string
  type: WorkflowType
  timezone: string
  frequency: WorkflowFrequency
  runTime: string
  config: WorkflowConfig
}

export interface ValidationOutcome {
  ok: boolean
  errors: string[]
  value?: ValidatedWorkflow
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeContacts(input: unknown): OutreachContact[] {
  if (!Array.isArray(input)) return []
  return input
    .map((entry: any) => {
      const identifier = text(entry?.identifier)
      const type: OutreachContact['type'] = entry?.type === 'phone' ? 'phone' : 'email'
      const name = text(entry?.name)
      return { identifier, type, ...(name ? { name } : {}) }
    })
    .filter((contact) => contact.identifier.length > 0)
}

function validateOutreach(raw: any, errors: string[]): OutreachConfig {
  const contacts = normalizeContacts(raw?.contacts)
  if (contacts.length === 0) errors.push('Add at least one outreach contact')
  if (contacts.length > MAX_OUTREACH_CONTACTS) errors.push(`A workflow can include up to ${MAX_OUTREACH_CONTACTS} contacts`)
  for (const contact of contacts) {
    if (contact.type === 'email' && !EMAIL_PATTERN.test(contact.identifier)) {
      errors.push(`"${contact.identifier}" is not a valid email address`)
    }
    if (contact.type === 'phone' && contact.identifier.replace(/\D/g, '').length < 7) {
      errors.push(`"${contact.identifier}" is not a valid phone number`)
    }
  }
  const systemPrompt = text(raw?.systemPrompt)
  if (!systemPrompt) errors.push('System instructions for the AI message writer are required')
  const subject = text(raw?.subject) || 'A quick note from your team'
  return { contacts, systemPrompt, subject }
}

function validateInvoiceReminder(raw: any, errors: string[]): InvoiceReminderConfig {
  const daysBeforeDue = Math.round(number(raw?.daysBeforeDue, 0))
  if (daysBeforeDue < 0 || daysBeforeDue > 90) errors.push('Reminder window must be between 0 and 90 days')
  const subject = text(raw?.subject)
  if (!subject) errors.push('Reminder subject is required')
  const message = text(raw?.message)
  if (!message) errors.push('Reminder message is required')
  const clientId = text(raw?.clientId)
  return {
    clientId: clientId || null,
    daysBeforeDue,
    subject,
    message,
  }
}

function validateRecurringInvoice(raw: any, errors: string[]): RecurringInvoiceConfig {
  const clientId = text(raw?.clientId)
  if (!clientId) errors.push('Choose the client that should be invoiced')
  const invoice = raw?.invoice || {}
  const description = text(invoice.description)
  if (!description) errors.push('Invoice line description is required')
  const quantity = number(invoice.quantity, 1)
  if (quantity <= 0 || quantity > 100000) errors.push('Quantity must be greater than 0')
  const unitPrice = number(invoice.unitPrice, 0)
  if (unitPrice <= 0) errors.push('Unit price must be greater than 0')
  const taxRate = number(invoice.taxRate, 0)
  if (taxRate < 0 || taxRate > 100) errors.push('Tax rate must be between 0 and 100')
  const dueInDays = Math.round(number(invoice.dueInDays, 30))
  if (dueInDays < 0 || dueInDays > 365) errors.push('Payment terms must be between 0 and 365 days')
  const numberPrefix = text(invoice.numberPrefix) || 'INV'
  return { clientId, invoice: { description, quantity, unitPrice, taxRate, dueInDays, numberPrefix } }
}

/**
 * Validate and normalise CMS input for a workflow definition.
 * Errors are user-facing sentences so the form can render them directly.
 */
export function validateWorkflowInput(input: WorkflowInput): ValidationOutcome {
  const errors: string[] = []
  const name = text(input.name)
  if (!name) errors.push('Give the workflow a name')
  if (name.length > 120) errors.push('Workflow name must be 120 characters or fewer')

  const type = WORKFLOW_TYPES.includes(input.type as WorkflowType) ? (input.type as WorkflowType) : null
  if (!type) errors.push('Choose a workflow template')

  if (typeof input.timezone === 'string' && input.timezone.trim() && !isValidTimeZone(input.timezone)) {
    errors.push('Timezone must be a valid IANA timezone such as Africa/Nairobi')
  }
  const timezone = timeZoneOrDefault(input.timezone)

  const frequency = WORKFLOW_FREQUENCIES.includes(input.frequency as WorkflowFrequency)
    ? (input.frequency as WorkflowFrequency)
    : null
  if (!frequency) errors.push('Choose how often the workflow should run')

  const runTime = text(input.runTime)
  if (!parseRunTime(runTime)) errors.push('Run time must be a 24-hour time such as 09:00')

  let config: WorkflowConfig = { contacts: [], systemPrompt: '', subject: '' }
  if (type === 'outreach') config = validateOutreach(input.config, errors)
  if (type === 'invoice_reminder') config = validateInvoiceReminder(input.config, errors)
  if (type === 'recurring_invoice') config = validateRecurringInvoice(input.config, errors)

  if (errors.length > 0 || !type || !frequency) return { ok: false, errors }
  return { ok: true, errors: [], value: { name, type, timezone, frequency, runTime, config } }
}
