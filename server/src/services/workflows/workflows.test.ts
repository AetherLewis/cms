import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeNextRunAt, dateKeyInZone, parseRunTime, periodKeyInZone } from './schedule'
import { validateWorkflowInput } from './validation'
import { getProviderReadiness, missingProviders } from './readiness'
import { buildReminderTargets, renderReminderMessage, type ReminderInvoice } from './targets'
import {
  runOutreachItems,
  runReminderItems,
  runRecurringInvoiceItem,
  type ItemContext,
  type WorkflowDeps,
} from './executors'
import { summariseTotals } from './runner'
import type { OutreachConfig, OutreachTarget, RunItem } from './types'

const SEND_ENV = {
  OMNIROUTE_API_URL: 'http://ai.internal/v1',
  OMNIROUTE_API_KEY: 'ai-secret',
  SMTP_HOST: 'smtp.internal',
  SMTP_USER: 'billing@example.com',
  SMTP_PASS: 'smtp-secret',
  WHATSAPP_API_URL: 'https://graph.example.com/messages',
  WHATSAPP_ACCESS_TOKEN: 'wa-secret',
}

function withEnv(overrides: Record<string, string | undefined>, run: () => Promise<void> | void) {
  const original: Record<string, string | undefined> = {}
  for (const key of Object.keys(overrides)) {
    original[key] = process.env[key]
    if (overrides[key] === undefined) delete process.env[key]
    else process.env[key] = overrides[key]
  }
  const restore = () => {
    for (const key of Object.keys(overrides)) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  }
  try {
    return Promise.resolve(run()).finally(restore)
  } catch (error) {
    restore()
    throw error
  }
}

function context(alreadyClaimed = new Set<string>()) {
  const recorded: RunItem[] = []
  const ctx: ItemContext = {
    claim: async (item) => {
      if (!item.dedupeKey) return true
      if (alreadyClaimed.has(item.dedupeKey)) return false
      alreadyClaimed.add(item.dedupeKey)
      return true
    },
    record: async (item) => {
      recorded.push(item)
    },
  }
  return { ctx, recorded }
}

function outreachTarget(identifier: string, type: 'email' | 'phone'): OutreachTarget {
  return {
    itemKey: `contact:${type}:${identifier}`,
    label: identifier,
    detail: 'outreach',
    dedupeKey: null,
    contact: { identifier, type },
  }
}

const outreachConfig: OutreachConfig = { contacts: [], systemPrompt: 'Be brief.', subject: 'Hello' }

test('schedule: daily run time is computed in the workflow timezone', () => {
  const next = computeNextRunAt('daily', '09:00', 'Africa/Nairobi', new Date('2026-01-01T05:00:00Z'))
  assert.equal(next?.toISOString(), '2026-01-01T06:00:00.000Z')
  const afterToday = computeNextRunAt('daily', '09:00', 'Africa/Nairobi', new Date('2026-01-01T07:00:00Z'))
  assert.equal(afterToday?.toISOString(), '2026-01-02T06:00:00.000Z')
})

test('schedule: weekly and monthly frequencies advance by one period', () => {
  const weekly = computeNextRunAt('weekly', '08:30', 'UTC', new Date('2026-03-04T09:00:00Z'))
  assert.equal(weekly?.toISOString(), '2026-03-11T08:30:00.000Z')
  const monthly = computeNextRunAt('monthly', '08:30', 'UTC', new Date('2026-01-31T09:00:00Z'))
  assert.equal(monthly?.toISOString(), '2026-02-28T08:30:00.000Z')
})

test('schedule: invalid run times and idempotency keys', () => {
  assert.equal(parseRunTime('24:00'), null)
  assert.equal(parseRunTime('9:05')?.minute, 5)
  assert.equal(computeNextRunAt('daily', 'not-a-time', 'UTC', new Date()), null)
  assert.equal(dateKeyInZone(new Date('2026-01-01T22:00:00Z'), 'Africa/Nairobi'), '2026-01-02')
  assert.equal(periodKeyInZone(new Date('2026-01-01T22:00:00Z'), 'Africa/Nairobi'), '2026-01')
})

test('validation: outreach requires contacts, valid identifiers, and instructions', () => {
  const invalid = validateWorkflowInput({
    name: '',
    type: 'outreach',
    timezone: 'Not/AZone',
    frequency: 'daily',
    runTime: '9am',
    config: { contacts: [{ identifier: 'not-an-email', type: 'email' }], systemPrompt: '' },
  })
  assert.equal(invalid.ok, false)
  assert.ok(invalid.errors.some((message) => message.includes('name')))
  assert.ok(invalid.errors.some((message) => message.includes('Timezone')))
  assert.ok(invalid.errors.some((message) => message.includes('Run time')))
  assert.ok(invalid.errors.some((message) => message.includes('valid email')))
  assert.ok(invalid.errors.some((message) => message.includes('System instructions')))

  const valid = validateWorkflowInput({
    name: 'Q3 outreach',
    type: 'outreach',
    timezone: 'Africa/Nairobi',
    frequency: 'weekly',
    runTime: '09:00',
    config: { contacts: [{ identifier: 'alex@example.com', type: 'email', name: 'Alex' }], systemPrompt: 'Be brief.' },
  })
  assert.equal(valid.ok, true)
  assert.equal(valid.value?.timezone, 'Africa/Nairobi')
  assert.equal((valid.value?.config as OutreachConfig).subject.length > 0, true)
})

test('validation: billing templates require the client and invoice source', () => {
  const reminder = validateWorkflowInput({
    name: 'Overdue chase',
    type: 'invoice_reminder',
    timezone: 'UTC',
    frequency: 'daily',
    runTime: '09:00',
    config: { daysBeforeDue: 400, subject: '', message: '' },
  })
  assert.equal(reminder.ok, false)
  assert.ok(reminder.errors.some((message) => message.includes('window')))
  assert.ok(reminder.errors.some((message) => message.includes('subject')))
  assert.ok(reminder.errors.some((message) => message.includes('message')))

  const recurring = validateWorkflowInput({
    name: 'Retainer',
    type: 'recurring_invoice',
    timezone: 'UTC',
    frequency: 'monthly',
    runTime: '09:00',
    config: { clientId: '', invoice: { description: '', quantity: 0, unitPrice: 0, taxRate: 120, dueInDays: 500 } },
  })
  assert.equal(recurring.ok, false)
  assert.ok(recurring.errors.some((message) => message.includes('client')))
  assert.ok(recurring.errors.some((message) => message.includes('description')))
  assert.ok(recurring.errors.some((message) => message.includes('Unit price')))
  assert.ok(recurring.errors.some((message) => message.includes('Tax rate')))
  assert.ok(recurring.errors.some((message) => message.includes('Payment terms')))
})

test('readiness: reports missing providers per template without exposing values', async () => {
  await withEnv(
    { SMTP_HOST: undefined, SMTP_USER: undefined, SMTP_PASS: undefined, WHATSAPP_API_URL: undefined, WHATSAPP_ACCESS_TOKEN: undefined, OMNIROUTE_API_URL: 'sk-no-key-required' },
    () => {
      const readiness = getProviderReadiness()
      assert.deepEqual(readiness, { email: false, whatsapp: false, ai: false })
      assert.deepEqual(missingProviders('invoice_reminder', {}, readiness), ['email'])
      assert.deepEqual(
        missingProviders('outreach', { contacts: [{ type: 'email' }, { type: 'phone' }] }, readiness),
        ['ai', 'email', 'whatsapp'],
      )
      assert.deepEqual(missingProviders('recurring_invoice', {}, readiness), [])
    },
  )

  await withEnv(SEND_ENV, () => {
    assert.deepEqual(getProviderReadiness(), { email: true, whatsapp: true, ai: true })
  })
})

test('reminder targets: unpaid invoices inside the window, message placeholders resolved', () => {
  const now = new Date('2026-04-10T12:00:00Z')
  const invoices: ReminderInvoice[] = [
    { id: '1', invoiceNumber: 'INV-1', total: 100, dueDate: '2026-04-01T00:00:00Z', status: 'overdue', clientName: 'Acme', clientEmail: 'ap@acme.test' },
    { id: '2', invoiceNumber: 'INV-2', total: 50, dueDate: '2026-06-01T00:00:00Z', status: 'sent', clientName: 'Later Co', clientEmail: 'ap@later.test' },
    { id: '3', invoiceNumber: 'INV-3', total: 70, dueDate: '2026-04-01T00:00:00Z', status: 'paid', clientName: 'Paid Co', clientEmail: 'ap@paid.test' },
    { id: '4', invoiceNumber: 'INV-4', total: 20, dueDate: '2026-04-08T00:00:00Z', status: 'draft', clientName: 'Draft Co', clientEmail: 'ap@draft.test' },
  ]
  const due = buildReminderTargets(
    { clientId: null, daysBeforeDue: 7, subject: 'Payment reminder: {{invoice_number}}', message: 'Hi {{client_name}}, {{invoice_number}} for {{amount}} was due {{due_date}}.' },
    invoices,
    now,
  )
  assert.deepEqual(due.map((invoice) => invoice.id), ['1'])
  const rendered = renderReminderMessage('Hi {{client_name}}, {{invoice_number}} for {{amount}} is {{days_overdue}} days late.', due[0], now)
  assert.equal(rendered, 'Hi Acme, INV-1 for $100.00 is 9 days late.')
})

test('executors: outreach records failures when providers are missing and partial successes otherwise', async () => {
  await withEnv({ SMTP_HOST: undefined, SMTP_USER: undefined, SMTP_PASS: undefined, OMNIROUTE_API_URL: SEND_ENV.OMNIROUTE_API_URL, OMNIROUTE_API_KEY: SEND_ENV.OMNIROUTE_API_KEY }, async () => {
    const { ctx } = context()
    const deps: WorkflowDeps = {
      generateOutreachMessage: async () => 'hello',
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => ({ invoiceId: 'x', invoiceNumber: 'INV-X' }),
    }
    const items = await runOutreachItems([outreachTarget('a@example.com', 'email')], outreachConfig, deps, ctx)
    assert.equal(items[0].status, 'failed')
    assert.match(String(items[0].detail), /not configured in deployment secrets/)
  })

  await withEnv(SEND_ENV, async () => {
    const { ctx } = context()
    const deps: WorkflowDeps = {
      generateOutreachMessage: async ({ contact }) => {
        if (contact.identifier === 'broken@example.com') throw new Error('AI quota exhausted')
        return 'hello'
      },
      sendEmail: async (to) => {
        if (to === 'bounce@example.com') throw new Error('Mailbox unavailable')
      },
      sendWhatsApp: async () => undefined,
      createInvoice: async () => ({ invoiceId: 'x', invoiceNumber: 'INV-X' }),
    }
    const items = await runOutreachItems(
      [outreachTarget('ok@example.com', 'email'), outreachTarget('broken@example.com', 'email'), outreachTarget('bounce@example.com', 'email'), outreachTarget('+15550100', 'phone')],
      outreachConfig,
      deps,
      ctx,
    )
    assert.deepEqual(items.map((item) => item.status), ['sent', 'failed', 'failed', 'sent'])
    assert.equal(items[1].detail, 'AI quota exhausted')
    assert.equal(items[2].detail, 'Mailbox unavailable')
    assert.equal(summariseTotals({ total: 4, succeeded: 2, failed: 2, skipped: 0 }), 'partial')
  })
})

test('executors: provider concurrency stays bounded', async () => {
  await withEnv(SEND_ENV, async () => {
    const { ctx } = context()
    let inFlight = 0
    let peak = 0
    const deps: WorkflowDeps = {
      generateOutreachMessage: async () => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 15))
        inFlight -= 1
        return 'hello'
      },
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => ({ invoiceId: 'x', invoiceNumber: 'INV-X' }),
    }
    const targets = Array.from({ length: 8 }, (_, index) => outreachTarget(`person${index}@example.com`, 'email'))
    const items = await runOutreachItems(targets, outreachConfig, deps, ctx)
    assert.equal(items.every((item) => item.status === 'sent'), true)
    assert.ok(peak <= 3, `expected at most 3 concurrent provider calls, saw ${peak}`)
  })
})

test('executors: reminders skip clients without email and dedupe repeats', async () => {
  await withEnv(SEND_ENV, async () => {
    const claimed = new Set<string>()
    const { ctx, recorded } = context(claimed)
    const deps: WorkflowDeps = {
      generateOutreachMessage: async () => 'hello',
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => ({ invoiceId: 'x', invoiceNumber: 'INV-X' }),
    }
    const now = new Date('2026-04-10T12:00:00Z')
    const invoices: ReminderInvoice[] = [
      { id: '1', invoiceNumber: 'INV-1', total: 100, dueDate: '2026-04-01T00:00:00Z', status: 'overdue', clientName: 'Acme', clientEmail: 'ap@acme.test' },
      { id: '2', invoiceNumber: 'INV-2', total: 30, dueDate: '2026-04-02T00:00:00Z', status: 'overdue', clientName: 'No Mail', clientEmail: null },
    ]
    const config = { clientId: null, daysBeforeDue: 7, subject: 'Reminder', message: 'Hi {{client_name}}' }
    const first = await runReminderItems(invoices, config, deps, ctx, now, (invoice) => `reminder:${invoice.id}:2026-04-10`)
    assert.deepEqual(first.map((item) => item.status).sort(), ['sent', 'skipped'])
    assert.equal(recorded.length, 2)

    const second = await runReminderItems(invoices, config, deps, ctx, now, (invoice) => `reminder:${invoice.id}:2026-04-10`)
    assert.equal(second.find((item) => item.label.includes('INV-1'))?.status, 'skipped')
    assert.equal(summariseTotals({ total: 2, succeeded: 0, failed: 0, skipped: 2 }), 'empty')
  })
})

test('executors: recurring invoice creation reports created or failed per item', async () => {
  const config = {
    clientId: 'client-1',
    invoice: { description: 'Retainer', quantity: 1, unitPrice: 500, taxRate: 10, dueInDays: 14, numberPrefix: 'INV' },
  }
  const target = { itemKey: 'client:client-1', label: 'Invoice Acme', detail: '1 × Retainer', dedupeKey: 'invoice-create:client-1:2026-04' }

  const success = context()
  const created = await runRecurringInvoiceItem(
    target,
    config,
    {
      generateOutreachMessage: async () => '',
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => ({ invoiceId: 'inv-1', invoiceNumber: 'INV-202604-001' }),
    },
    success.ctx,
  )
  assert.equal(created.status, 'created')
  assert.match(String(created.detail), /INV-202604-001/)

  const failure = context()
  const failed = await runRecurringInvoiceItem(
    target,
    config,
    {
      generateOutreachMessage: async () => '',
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => {
        throw new Error('Client was removed')
      },
    },
    failure.ctx,
  )
  assert.equal(failed.status, 'failed')
  assert.equal(failed.detail, 'Client was removed')

  const duplicate = context(new Set([String(target.dedupeKey)]))
  const skipped = await runRecurringInvoiceItem(
    target,
    config,
    {
      generateOutreachMessage: async () => '',
      sendEmail: async () => undefined,
      sendWhatsApp: async () => undefined,
      createInvoice: async () => {
        throw new Error('must not be called')
      },
    },
    duplicate.ctx,
  )
  assert.equal(skipped.status, 'skipped')
})
