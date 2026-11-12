import type { ProviderReadiness, SenderChannel, WorkflowConfig } from './types'

export type { ProviderReadiness }

const PLACEHOLDER_PATTERN = /^(your-|changeme|placeholder|sk-no-key-required)/i

function present(value: string | undefined): boolean {
  return Boolean(value && value.trim() && !PLACEHOLDER_PATTERN.test(value.trim()))
}

/** AI writing is the only provider still configured through deployment secrets. */
export function aiProviderReady(env: NodeJS.ProcessEnv = process.env): boolean {
  return present(env.OMNIROUTE_API_URL)
}

/** Delivery readiness comes from the user's connected sender profiles, not from environment variables. */
export function getProviderReadiness(
  connected: Partial<Record<SenderChannel, boolean>> = {},
  env: NodeJS.ProcessEnv = process.env,
): ProviderReadiness {
  return {
    email: Boolean(connected.email),
    whatsapp: Boolean(connected.whatsapp),
    ai: aiProviderReady(env),
  }
}

/** Sender channels a workflow definition needs before it can be activated or executed. */
export function requiredChannels(type: string, config: WorkflowConfig | any): SenderChannel[] {
  if (type === 'invoice_reminder') return ['email']
  if (type !== 'outreach') return []
  const contacts: Array<{ type?: string }> = Array.isArray(config?.contacts) ? config.contacts : []
  const channels: SenderChannel[] = []
  if (contacts.some((contact) => contact?.type !== 'phone')) channels.push('email')
  if (contacts.some((contact) => contact?.type === 'phone')) channels.push('whatsapp')
  return channels
}

export function requiredProviders(type: string, config: any): Array<keyof ProviderReadiness> {
  const providers: Array<keyof ProviderReadiness> = requiredChannels(type, config)
  if (type === 'outreach') providers.unshift('ai')
  return providers
}

export function describeProvider(key: keyof ProviderReadiness): string {
  if (key === 'ai') return 'AI message generation (OMNIROUTE_API_URL, OMNIROUTE_API_KEY)'
  return key === 'email' ? 'Gmail sending (connect a Gmail sender)' : 'WhatsApp sending (connect a WhatsApp sender)'
}

export function missingProviders(
  type: string,
  config: any,
  readiness: ProviderReadiness = getProviderReadiness(),
): Array<keyof ProviderReadiness> {
  return requiredProviders(type, config).filter((key) => !readiness[key])
}

export function missingProviderLabels(
  type: string,
  config: any,
  readiness: ProviderReadiness = getProviderReadiness(),
): string[] {
  return missingProviders(type, config, readiness).map(describeProvider)
}
