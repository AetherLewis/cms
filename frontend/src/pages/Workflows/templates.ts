import type { WorkflowFrequency, WorkflowStatus, WorkflowType } from '../../utils/api'

export const TEMPLATES: Record<
  WorkflowType,
  { label: string; tagline: string; description: string; needs: string }
> = {
  outreach: {
    label: 'Outreach',
    tagline: 'Personalised messages, on a schedule',
    description: 'AI writes and sends a personalised email or WhatsApp message to a contact list on a recurring schedule.',
    needs: 'AI generation plus email or WhatsApp delivery',
  },
  invoice_reminder: {
    label: 'Invoice reminders',
    tagline: 'Chase due and overdue invoices',
    description: 'Emails a reminder for every unpaid invoice that is due or about to be due. Each invoice is only reminded once per day.',
    needs: 'Email delivery',
  },
  recurring_invoice: {
    label: 'Recurring invoice',
    tagline: 'Create the same invoice each period',
    description: 'Creates a draft invoice for one client from an explicit line-item template, once per billing period.',
    needs: 'No provider configuration',
  },
}

export const FREQUENCY_LABELS: Record<WorkflowFrequency, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
}

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
]

export const DEFAULT_REMINDER_SUBJECT = 'Payment reminder: invoice {{invoice_number}}'
export const DEFAULT_REMINDER_MESSAGE =
  'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{amount}} was due on {{due_date}}.\n\nCould you let us know when payment will be made?\n\nThank you.'

export const DEFAULT_OUTREACH_PROMPT =
  'Act as a friendly account manager. Offer a short, specific follow-up about our services. Keep it under two paragraphs.'

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function parseContactsText(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [identifier, name] = line.split(/\s*[|\t]\s*/)
      const trimmed = (identifier || '').trim()
      return {
        identifier: trimmed,
        type: (trimmed.includes('@') ? 'email' : 'phone') as 'email' | 'phone',
        ...(name?.trim() ? { name: name.trim() } : {}),
      }
    })
}

export function formatSchedule(frequency: WorkflowFrequency, runTime: string, timezone: string): string {
  return `${FREQUENCY_LABELS[frequency] || frequency} at ${runTime} · ${timezone}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function workflowStatusTone(status: WorkflowStatus): string {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700'
  if (status === 'paused') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

export function runStatusTone(status: string): string {
  if (status === 'succeeded') return 'bg-emerald-50 text-emerald-700'
  if (status === 'partial') return 'bg-amber-50 text-amber-700'
  if (status === 'failed') return 'bg-red-50 text-red-700'
  if (status === 'running') return 'bg-indigo-50 text-indigo-700'
  return 'bg-slate-100 text-slate-600'
}

export function itemStatusTone(status: string): string {
  if (status === 'sent' || status === 'created') return 'bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'bg-red-50 text-red-700'
  return 'bg-slate-100 text-slate-600'
}

export function providerLabel(key: keyof { email: boolean; whatsapp: boolean; ai: boolean }): string {
  if (key === 'email') return 'Gmail sender'
  if (key === 'whatsapp') return 'WhatsApp sender'
  return 'AI generation (OmniRoute)'
}
