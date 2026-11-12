import type {
  InvoiceReminderConfig,
  OutreachConfig,
  OutreachContact,
  OutreachTarget,
  RecurringInvoiceConfig,
  RunItem,
  WorkflowTarget,
} from './types'
import { aiProviderReady, describeProvider } from './readiness'
import { reminderTarget, renderReminderMessage, type ReminderInvoice } from './targets'

export const OUTREACH_CONCURRENCY = 3

export interface CreateInvoiceInput {
  clientId: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  dueInDays: number
  numberPrefix: string
}

export interface WorkflowDeps {
  generateOutreachMessage: (input: { systemPrompt: string; contact: OutreachContact }) => Promise<string>
  sendEmail: (to: string, subject: string, body: string) => Promise<void>
  sendWhatsApp: (to: string, body: string) => Promise<void>
  createInvoice: (input: CreateInvoiceInput) => Promise<{ invoiceId: string; invoiceNumber: string }>
  /** User-facing blocker per channel when no usable sender is connected (empty when ready). */
  delivery?: Partial<Record<'email' | 'whatsapp', string>>
}

export interface ItemContext {
  /** Persist the item and reserve its idempotency key. Returns false when the key was already used. */
  claim: (item: WorkflowTarget) => Promise<boolean>
  /** Persist the final outcome. `reserve: false` records without consuming the idempotency key. */
  record: (item: RunItem, options?: { reserve?: boolean }) => Promise<void>
}

/** Run `worker` over `items` with a bounded number of in-flight operations. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const size = Math.max(1, Math.min(limit, items.length || 1))
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        results[index] = await worker(items[index], index)
      }
    }),
  )
  return results
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function providerProblem(channel: 'email' | 'whatsapp', deps: WorkflowDeps, requiresAi = false): string | null {
  if (requiresAi && !aiProviderReady()) return `${describeProvider('ai')} is not configured in deployment secrets`
  return deps.delivery?.[channel] || null
}

export async function runOutreachItems(
  targets: OutreachTarget[],
  config: OutreachConfig,
  deps: WorkflowDeps,
  ctx: ItemContext,
): Promise<RunItem[]> {
  return mapWithConcurrency(targets, OUTREACH_CONCURRENCY, async (target) => {
    const contact = target.contact
    const problem = providerProblem(contact.type === 'email' ? 'email' : 'whatsapp', deps, true)
    if (problem) {
      const failed: RunItem = { ...target, status: 'failed', detail: problem }
      await ctx.record(failed, { reserve: false })
      return failed
    }

    if (!(await ctx.claim(target))) return { ...target, status: 'skipped' }

    let item: RunItem
    try {
      const message = await deps.generateOutreachMessage({ systemPrompt: config.systemPrompt, contact })
      if (contact.type === 'email') await deps.sendEmail(contact.identifier, config.subject, message)
      else await deps.sendWhatsApp(contact.identifier, message)
      item = { ...target, status: 'sent', detail: `Sent via ${contact.type === 'email' ? 'email' : 'WhatsApp'}` }
    } catch (error) {
      item = { ...target, status: 'failed', detail: errorMessage(error, 'Delivery failed') }
    }
    await ctx.record(item)
    return item
  })
}

export async function runReminderItems(
  invoices: ReminderInvoice[],
  config: InvoiceReminderConfig,
  deps: WorkflowDeps,
  ctx: ItemContext,
  now: Date,
  dedupeKeyFor: (invoice: ReminderInvoice) => string,
): Promise<RunItem[]> {
  const problem = providerProblem('email', deps)
  return mapWithConcurrency(invoices, OUTREACH_CONCURRENCY, async (invoice) => {
    const target = reminderTarget(invoice, dedupeKeyFor(invoice), now)
    if (!invoice.clientEmail) {
      const skipped: RunItem = { ...target, status: 'skipped', detail: 'Client has no email address' }
      await ctx.record(skipped, { reserve: false })
      return skipped
    }
    if (problem) {
      const failed: RunItem = { ...target, status: 'failed', detail: problem }
      await ctx.record(failed, { reserve: false })
      return failed
    }
    if (!(await ctx.claim(target))) return { ...target, status: 'skipped' }

    let item: RunItem
    try {
      const body = renderReminderMessage(config.message, invoice, now)
      await deps.sendEmail(invoice.clientEmail, config.subject, body)
      item = { ...target, status: 'sent', detail: `Reminder emailed to ${invoice.clientEmail}` }
    } catch (error) {
      item = { ...target, status: 'failed', detail: errorMessage(error, 'Reminder could not be sent') }
    }
    await ctx.record(item)
    return item
  })
}

export async function runRecurringInvoiceItem(
  target: WorkflowTarget,
  config: RecurringInvoiceConfig,
  deps: WorkflowDeps,
  ctx: ItemContext,
): Promise<RunItem> {
  if (!(await ctx.claim(target))) return { ...target, status: 'skipped' }
  let item: RunItem
  try {
    const invoice = await deps.createInvoice({ clientId: config.clientId, ...config.invoice })
    item = { ...target, status: 'created', detail: `Created invoice ${invoice.invoiceNumber}` }
  } catch (error) {
    item = { ...target, status: 'failed', detail: errorMessage(error, 'Invoice could not be created') }
  }
  await ctx.record(item)
  return item
}
