import type { SenderChannel, SenderProvider } from '../workflows/types'

export type { SenderChannel, SenderProvider }

export interface ProviderProfile {
  channel: SenderChannel
  label: string
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
}

export interface TokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: string | null
  scopes: string[]
}

export interface ProviderIdentity {
  account: string
  providerData: Record<string, unknown>
}

export const PROVIDERS: Record<SenderProvider, ProviderProfile> = {
  google: {
    channel: 'email',
    label: 'Gmail',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'openid', 'email'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  meta: {
    channel: 'whatsapp',
    label: 'WhatsApp',
    authorizationUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management', 'business_management'],
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
  },
}

export const SENDER_PROVIDERS: SenderProvider[] = ['google', 'meta']

export function isSenderProvider(value: unknown): value is SenderProvider {
  return value === 'google' || value === 'meta'
}

export function providerCredentials(provider: SenderProvider): { clientId: string; clientSecret: string } {
  const profile = PROVIDERS[provider]
  const clientId = (process.env[profile.clientIdEnv] || '').trim()
  const clientSecret = (process.env[profile.clientSecretEnv] || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error(`${profile.label} OAuth is not configured in deployment secrets (${profile.clientIdEnv}, ${profile.clientSecretEnv})`)
  }
  return { clientId, clientSecret }
}

export function isProviderConfigured(provider: SenderProvider): boolean {
  try {
    providerCredentials(provider)
    return true
  } catch {
    return false
  }
}

/** Public web origin used for the OAuth callback; the API is served through the same origin. */
export function publicBaseUrl(): string {
  const base = (process.env.OAUTH_REDIRECT_BASE || process.env.FRONTEND_URL || '').split(',')[0].trim()
  if (!base) throw new Error('FRONTEND_URL must be configured so provider authorization can return to the CMS')
  return base.replace(/\/$/, '')
}

export function callbackUrl(provider: SenderProvider): string {
  return `${publicBaseUrl()}/api/senders/oauth/${provider}/callback`
}

export function cmsUrl(path: string): string {
  return `${publicBaseUrl()}${path}`
}

export function buildAuthorizationUrl(provider: SenderProvider, state: string): string {
  const profile = PROVIDERS[provider]
  const { clientId } = providerCredentials(provider)
  const url = new URL(profile.authorizationUrl)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl(provider))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', profile.scopes.join(' '))
  url.searchParams.set('state', state)
  if (provider === 'google') {
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('include_granted_scopes', 'true')
  }
  return url.toString()
}

function parseScopes(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value.split(/[\s,]+/).filter(Boolean)
}

function expiresAtFrom(seconds: unknown): string | null {
  const ttl = Number(seconds)
  if (!Number.isFinite(ttl) || ttl <= 0) return null
  return new Date(Date.now() + ttl * 1000).toISOString()
}

async function readJson(response: Response): Promise<any> {
  const body = await response.text()
  try {
    return body ? JSON.parse(body) : {}
  } catch {
    return { raw: body }
  }
}

export async function exchangeAuthorizationCode(
  provider: SenderProvider,
  code: string,
): Promise<TokenSet> {
  const profile = PROVIDERS[provider]
  const { clientId, clientSecret } = providerCredentials(provider)
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl(provider),
    code,
    grant_type: 'authorization_code',
  })
  const response = await fetch(profile.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = await readJson(response)
  if (!response.ok || !payload.access_token) {
    const detail = payload?.error_description || payload?.error?.message || payload?.error || `HTTP ${response.status}`
    throw new Error(`${profile.label} authorization failed: ${detail}`)
  }

  let accessToken = String(payload.access_token)
  let expiresIn = payload.expires_in

  // Meta returns a short-lived token here; exchange it for the long-lived one.
  if (provider === 'meta') {
    const extended = await exchangeExistingToken('meta', accessToken)
    if (extended) {
      accessToken = extended.accessToken
      expiresIn = extended.expiresIn
    }
  }

  return {
    accessToken,
    refreshToken: payload.refresh_token ? String(payload.refresh_token) : null,
    expiresAt: expiresAtFrom(expiresIn),
    scopes: parseScopes(payload.scope),
  }
}

async function exchangeExistingToken(
  provider: SenderProvider,
  token: string,
): Promise<{ accessToken: string; expiresIn: number | null } | null> {
  const profile = PROVIDERS[provider]
  const { clientId, clientSecret } = providerCredentials(provider)
  const url = new URL(profile.tokenUrl)
  url.searchParams.set('grant_type', provider === 'meta' ? 'fb_exchange_token' : 'refresh_token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  if (provider === 'meta') url.searchParams.set('fb_exchange_token', token)
  else url.searchParams.set('refresh_token', token)

  const response = await fetch(url, { method: provider === 'meta' ? 'GET' : 'POST' })
  const payload = await readJson(response)
  if (!response.ok || !payload.access_token) return null
  return {
    accessToken: String(payload.access_token),
    expiresIn: Number.isFinite(Number(payload.expires_in)) ? Number(payload.expires_in) : null,
  }
}

/** Trade a stored refresh token (or long-lived Meta token) for a fresh access token. */
export async function refreshAccessToken(provider: SenderProvider, refreshToken: string): Promise<TokenSet | null> {
  const profile = PROVIDERS[provider]
  const refreshed = await exchangeExistingToken(provider, refreshToken)
  if (!refreshed) return null
  return {
    accessToken: refreshed.accessToken,
    refreshToken: provider === 'google' ? refreshToken : refreshed.accessToken,
    expiresAt: expiresAtFrom(refreshed.expiresIn),
    scopes: profile.scopes,
  }
}

export async function fetchProviderIdentity(provider: SenderProvider, accessToken: string): Promise<ProviderIdentity> {
  if (provider === 'google') {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const payload = await readJson(response)
    if (!response.ok || !payload.email) throw new Error('Google did not return the connected account email')
    return { account: String(payload.email), providerData: { email: String(payload.email) } }
  }

  const graph = 'https://graph.facebook.com/v21.0'
  const businesses = await readJson(await fetch(`${graph}/me/businesses?fields=id,name&access_token=${encodeURIComponent(accessToken)}`))
  const businessId = businesses?.data?.[0]?.id
  if (!businessId) throw new Error('The connected Meta account does not manage a business with WhatsApp access')

  const accounts = await readJson(await fetch(`${graph}/${businessId}/owned_whatsapp_business_accounts?access_token=${encodeURIComponent(accessToken)}`))
  const wabaId = accounts?.data?.[0]?.id
  if (!wabaId) throw new Error('No WhatsApp Business Account was found on the connected Meta business')

  const numbers = await readJson(await fetch(`${graph}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name&access_token=${encodeURIComponent(accessToken)}`))
  const phone = numbers?.data?.[0]
  if (!phone?.id || !phone?.display_phone_number) {
    throw new Error('No WhatsApp phone number was found on the connected business account')
  }

  return {
    account: String(phone.display_phone_number),
    providerData: {
      businessId,
      wabaId,
      phoneNumberId: String(phone.id),
      verifiedName: phone.verified_name ? String(phone.verified_name) : null,
    },
  }
}

/** Best-effort revocation at the provider when a sender is disconnected. */
export async function revokeProviderToken(provider: SenderProvider, token: string | null): Promise<void> {
  if (!token) return
  try {
    if (provider === 'google') {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }),
      })
      return
    }
    await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`, { method: 'DELETE' })
  } catch {
    // Revocation is best effort: local disconnect still removes the stored credentials.
  }
}
