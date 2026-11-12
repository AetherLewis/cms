import type { ProviderReadiness } from './types'

export type { ProviderReadiness }

const PLACEHOLDER_PATTERN = /^(your-|changeme|placeholder|sk-no-key-required)/i

function present(value: string | undefined): boolean {
  return Boolean(value && value.trim() && !PLACEHOLDER_PATTERN.test(value.trim()))
}

/** Provider configuration is read from deployment secrets only — never from CMS input. */
export function getProviderReadiness(env: NodeJS.ProcessEnv = process.env): ProviderReadiness {
  const email = present(env.SMTP_HOST) && present(env.SMTP_USER) && present(env.SMTP_PASS)
  const whatsapp = present(env.WHATSAPP_API_URL) && present(env.WHATSAPP_ACCESS_TOKEN)
  const ai = present(env.OMNIROUTE_API_URL)
  return { email, whatsapp, ai }
}

export function describeProvider(key: keyof ProviderReadiness): string {
  if (key === 'email') return 'Email delivery (SMTP_HOST, SMTP_USER, SMTP_PASS)'
  if (key === 'whatsapp') return 'WhatsApp delivery (WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN)'
  return 'AI message generation (OMNIROUTE_API_URL, OMNIROUTE_API_KEY)'
}

/** Providers a workflow needs before it can be activated or executed. */
export function requiredProviders(type: string, config: any, readiness: ProviderReadiness): Array<keyof ProviderReadiness> {
  if (type === 'invoice_reminder') return ['email']
  if (type === 'outreach') {
    const contacts: Array<{ type?: string }> = Array.isArray(config?.contacts) ? config.contacts : []
    const required: Array<keyof ProviderReadiness> = ['ai']
    if (contacts.some((contact) => contact?.type !== 'phone')) required.push('email')
    if (contacts.some((contact) => contact?.type === 'phone')) required.push('whatsapp')
    return required
  }
  return []
}

export function missingProviders(type: string, config: any, readiness = getProviderReadiness()): Array<keyof ProviderReadiness> {
  return requiredProviders(type, config, readiness).filter((key) => !readiness[key])
}

export function missingProviderLabels(type: string, config: any, readiness = getProviderReadiness()): string[] {
  return missingProviders(type, config, readiness).map(describeProvider)
}
