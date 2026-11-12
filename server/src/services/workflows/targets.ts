import type { InvoiceReminderConfig, WorkflowTarget } from './types'

export interface ReminderInvoice {
  id: string
  invoiceNumber: string
  total: number
  dueDate: string | null
  status: string
  clientName: string
  clientEmail: string | null
}

const DAY_MS = 86_400_000

export function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function formatDate(value: string | null): string {
  if (!value) return 'no due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

export function daysOverdue(dueDate: string | null, now: Date): number {
  if (!dueDate) return 0
  const due = new Date(dueDate).getTime()
  if (Number.isNaN(due)) return 0
  return Math.floor((now.getTime() - due) / DAY_MS)
}

/** Invoices that a reminder workflow should consider: unpaid and due inside the configured window. */
export function buildReminderTargets(
  config: InvoiceReminderConfig,
  invoices: ReminderInvoice[],
  now: Date,
): ReminderInvoice[] {
  const cutoff = now.getTime() + Math.max(0, config.daysBeforeDue) * DAY_MS
  return invoices
    .filter((invoice) => !['paid', 'cancelled', 'draft'].includes(invoice.status))
    .filter((invoice) => {
      if (!invoice.dueDate) return false
      const due = new Date(invoice.dueDate).getTime()
      if (Number.isNaN(due)) return false
      return due <= cutoff
    })
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
}

export function renderReminderMessage(template: string, invoice: ReminderInvoice, now: Date): string {
  const overdue = daysOverdue(invoice.dueDate, now)
  return template
    .replace(/{{client_name}}/g, invoice.clientName || 'there')
    .replace(/{{invoice_number}}/g, invoice.invoiceNumber)
    .replace(/{{amount}}/g, money(invoice.total))
    .replace(/{{due_date}}/g, formatDate(invoice.dueDate))
    .replace(/{{days_overdue}}/g, String(Math.max(0, overdue)))
}

export function reminderTarget(invoice: ReminderInvoice, dedupeKey: string, now: Date): WorkflowTarget {
  const overdue = invoice.dueDate ? daysOverdue(invoice.dueDate, now) : 0
  return {
    itemKey: `invoice:${invoice.id}`,
    label: `Reminder for ${invoice.invoiceNumber}`,
    detail: `${invoice.clientName} · ${money(invoice.total)} · due ${formatDate(invoice.dueDate)}${
      overdue > 0 ? ` (${overdue} day${overdue === 1 ? '' : 's'} overdue)` : ''
    }`,
    dedupeKey,
  }
}

export function recurringInvoiceTarget(
  input: { clientId: string; clientName: string; description: string; quantity: number; unitPrice: number; taxRate: number; numberPrefix: string },
  periodKey: string,
  dedupeKey: string,
): WorkflowTarget {
  const subtotal = input.quantity * input.unitPrice
  const total = subtotal + subtotal * (input.taxRate / 100)
  return {
    itemKey: `client:${input.clientId}`,
    label: `Invoice ${input.clientName} (${periodKey})`,
    detail: `${input.quantity} × ${input.description} at ${money(input.unitPrice)} · ${money(total)} total`,
    dedupeKey,
  }
}
