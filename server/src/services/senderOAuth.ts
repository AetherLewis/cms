import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export type OAuthProvider = 'gmail' | 'whatsapp'
export interface OAuthState { user_id: string; provider: OAuthProvider; sender_profile_id?: string; expires_at: number }
export interface OAuthTokens { accessToken: string; refreshToken: string | null; expiresAt: string | null; account: string; wabaId?: string; phoneNumberId?: string }

function encryptionKey(): Buffer {
  const value = process.env.TOKEN_ENCRYPTION_KEY
  if (!value || value.trim().length < 32) throw new Error('TOKEN_ENCRYPTION_KEY must contain at least 32 characters')
  return createHash('sha256').update(value.trim()).digest()
}
function stateKey(): string {
  const value = process.env.TOKEN_ENCRYPTION_KEY
  if (!value) throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  return value
}
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`
}
export function decryptSecret(cipherText: string): string {
  const [version, iv, tag, ciphertext] = cipherText.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Encrypted token is malformed')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
}
export function createOAuthState(input: Omit<OAuthState, 'expires_at'>): string {
  const payload = Buffer.from(JSON.stringify({ ...input, expires_at: Date.now() + 10 * 60_000 })).toString('base64url')
  const signature = createHmac('sha256', stateKey()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}
export function verifyOAuthState(state: string, provider: OAuthProvider): OAuthState | null {
  try {
    const [payload, encodedSignature] = state.split('.')
    if (!payload || !encodedSignature) return null
    const actual = Buffer.from(encodedSignature, 'base64url')
    const expected = createHmac('sha256', stateKey()).update(payload).digest()
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OAuthState
    if (value.provider !== provider || !value.user_id || value.expires_at < Date.now()) return null
    return value
  } catch { return null }
}
function required(name: string): string { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is not configured`); return value }
function redirectUri(provider: OAuthProvider): string { return required(provider === 'gmail' ? 'GOOGLE_REDIRECT_URI' : 'META_REDIRECT_URI') }
function expiry(seconds: unknown): string | null { const n = Number(seconds); return Number.isFinite(n) && n > 0 ? new Date(Date.now() + n * 1000).toISOString() : null }
async function json(response: Response): Promise<any> { const text = await response.text(); let data: any; try { data = JSON.parse(text) } catch { data = {} }; if (!response.ok) throw new Error(data.error_description || data.error?.message || data.error || `OAuth provider returned ${response.status}`); return data }

export function getGoogleAuthUrl(state: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({ client_id: required('GOOGLE_CLIENT_ID'), redirect_uri: redirectUri('gmail'), response_type: 'code', scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email', access_type: 'offline', prompt: 'consent', state }).toString()
  return url.toString()
}
export function getWhatsAppAuthUrl(state: string): string {
  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth')
  url.search = new URLSearchParams({
    client_id: required('META_APP_ID'),
    redirect_uri: redirectUri('whatsapp'),
    config_id: required('META_EMBEDDED_CONFIG_ID'),
    response_type: 'code',
    override_default_response_type: 'true',
    scope: 'whatsapp_business_management,whatsapp_business_messaging',
    state,
  }).toString()
  return url.toString()
}
async function exchangeCode(provider: OAuthProvider, code: string): Promise<any> {
  const google = provider === 'gmail'
  const body = new URLSearchParams({ client_id: required(google ? 'GOOGLE_CLIENT_ID' : 'META_APP_ID'), client_secret: required(google ? 'GOOGLE_CLIENT_SECRET' : 'META_APP_SECRET'), redirect_uri: redirectUri(provider), code, grant_type: 'authorization_code' })
  const response = await fetch(google ? 'https://oauth2.googleapis.com/token' : 'https://graph.facebook.com/v21.0/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  return json(response)
}
export async function exchangeGoogleCode(code: string): Promise<OAuthTokens> {
  const token = await exchangeCode('gmail', code)
  const identity = await json(await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } }))
  if (!identity.email) throw new Error('Google did not return the connected Gmail address')
  return { accessToken: token.access_token, refreshToken: token.refresh_token || null, expiresAt: expiry(token.expires_in), account: identity.email }
}
export async function refreshGoogleToken(encryptedRefreshToken: string): Promise<{ accessToken: string; expiresAt: string | null }> {
  const refreshToken = decryptSecret(encryptedRefreshToken)
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: required('GOOGLE_CLIENT_ID'), client_secret: required('GOOGLE_CLIENT_SECRET'), refresh_token: refreshToken, grant_type: 'refresh_token' }) })
  const token = await json(response)
  return { accessToken: token.access_token, expiresAt: expiry(token.expires_in) }
}
export async function exchangeWhatsAppCode(code: string): Promise<OAuthTokens> {
  const token = await exchangeCode('whatsapp', code)
  const accessToken = String(token.access_token)
  const graph = 'https://graph.facebook.com/v21.0'
  const businesses = await json(await fetch(`${graph}/me/businesses?fields=id`, { headers: { Authorization: `Bearer ${accessToken}` } }))
  const businessId = businesses.data?.[0]?.id
  if (!businessId) throw new Error('No Meta business with WhatsApp access was found')
  const accounts = await json(await fetch(`${graph}/${businessId}/owned_whatsapp_business_accounts?fields=id`, { headers: { Authorization: `Bearer ${accessToken}` } }))
  const wabaId = accounts.data?.[0]?.id
  if (!wabaId) throw new Error('No WhatsApp Business Account was found')
  const numbers = await json(await fetch(`${graph}/${wabaId}/phone_numbers?fields=id,display_phone_number`, { headers: { Authorization: `Bearer ${accessToken}` } }))
  const phone = numbers.data?.[0]
  if (!phone?.id || !phone?.display_phone_number) throw new Error('No WhatsApp Business phone number was found')
  return { accessToken, refreshToken: null, expiresAt: expiry(token.expires_in), account: String(phone.display_phone_number), wabaId: String(wabaId), phoneNumberId: String(phone.id) }
}
