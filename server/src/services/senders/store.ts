import { supabase } from '../../config/supabase'
import { decryptSecret, encryptSecret, refreshGoogleToken } from '../senderOAuth'
import { fetchProviderIdentity, revokeProviderToken, type ProviderIdentity, type TokenSet } from './providers'
import { requiredChannels } from '../workflows/readiness'
import type { SenderAssignments, SenderChannel, SenderProvider, SenderRow, SenderSummary } from '../workflows/types'

type Profile = any
function fromProfile(row: Profile): SenderRow {
  return {
    id: row.id, user_id: row.user_id, name: row.name,
    channel: row.provider === 'gmail' ? 'email' : 'whatsapp',
    provider: row.provider === 'gmail' ? 'google' : 'meta', account: row.provider_account_id,
    status: row.status === 'disconnected' ? 'revoked' : row.status, scopes: [],
    access_token: row.encrypted_access_token, refresh_token: row.encrypted_refresh_token,
    token_expires_at: row.token_expires_at,
    provider_data: { wabaId: row.waba_id, phoneNumberId: row.phone_number_id },
    last_connected_at: row.last_connected_at, last_error: null, created_at: row.created_at, updated_at: row.updated_at,
  } as SenderRow
}
export function toSummary(row: SenderRow): SenderSummary {
  return { id: row.id, name: row.name, channel: row.channel, provider: row.provider === 'google' ? 'gmail' : 'whatsapp', account: row.account,
    status: row.status === 'revoked' ? 'disconnected' : row.status, scopes: [], last_connected_at: row.last_connected_at, last_error: row.last_error, created_at: row.created_at }
}
export async function listSenders(userId: string): Promise<SenderRow[]> {
  const { data, error } = await supabase.from('sender_profiles').select('*').eq('user_id', userId).order('created_at')
  if (error) throw error
  return (data || []).map(fromProfile)
}
export async function findSender(userId: string, id: string): Promise<SenderRow | null> {
  const { data, error } = await supabase.from('sender_profiles').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? fromProfile(data) : null
}
export async function createOAuthState(input: { userId: string; provider: SenderProvider; channel: SenderChannel; senderId?: string | null }): Promise<string> {
  const { createOAuthState } = await import('../senderOAuth')
  return createOAuthState({ user_id: input.userId, provider: input.provider === 'google' ? 'gmail' : 'whatsapp', ...(input.senderId ? { sender_profile_id: input.senderId } : {}) })
}
export async function consumeOAuthState(state: string, provider: SenderProvider) {
  const { verifyOAuthState } = await import('../senderOAuth')
  const value = verifyOAuthState(state, provider === 'google' ? 'gmail' : 'whatsapp')
  return value ? { user_id: value.user_id, provider, channel: provider === 'google' ? 'email' as const : 'whatsapp' as const, sender_id: value.sender_profile_id || null } : null
}
export async function saveConnectedSender(input: { userId: string; provider: SenderProvider; channel: SenderChannel; tokens: TokenSet; identity?: ProviderIdentity; senderId?: string | null }): Promise<SenderRow> {
  const provider = input.provider === 'google' ? 'gmail' : 'whatsapp'
  const identity = input.identity || await fetchProviderIdentity(input.provider, input.tokens.accessToken)
  let existing: any = null
  if (input.senderId) {
    const { data } = await supabase.from('sender_profiles').select('*').eq('id', input.senderId).eq('user_id', input.userId).maybeSingle()
    existing = data
  }
  const payload = {
    user_id: input.userId, name: existing?.name || (provider === 'gmail' ? identity.account : `WhatsApp ${identity.account}`), provider,
    provider_account_id: identity.account, waba_id: (identity.providerData.wabaId as string) || null,
    phone_number_id: (identity.providerData.phoneNumberId as string) || null, status: 'connected',
    encrypted_access_token: encryptSecret(input.tokens.accessToken),
    encrypted_refresh_token: input.tokens.refreshToken ? encryptSecret(input.tokens.refreshToken) : existing?.encrypted_refresh_token || null,
    token_expires_at: input.tokens.expiresAt, last_connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
  const query = existing ? supabase.from('sender_profiles').update(payload).eq('id', existing.id) : supabase.from('sender_profiles').upsert(payload, { onConflict: 'user_id,provider,provider_account_id' })
  const { data, error } = await query.select().single()
  if (error) throw error
  return fromProfile(data)
}
export async function renameSender(userId: string, id: string, name: string): Promise<SenderRow | null> {
  const { data, error } = await supabase.from('sender_profiles').update({ name, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select().maybeSingle()
  if (error) throw error
  return data ? fromProfile(data) : null
}
export async function disconnectSender(userId: string, id: string): Promise<SenderRow | null> {
  const { data: profile, error: readError } = await supabase.from('sender_profiles').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (readError) throw readError
  if (!profile) return null
  const row = fromProfile(profile)
  try { await revokeProviderToken(row.provider, profile.encrypted_refresh_token ? decryptSecret(profile.encrypted_refresh_token) : decryptSecret(profile.encrypted_access_token)) } catch { /* local disconnect still clears credentials */ }
  const { data, error } = await supabase.from('sender_profiles').update({ status: 'disconnected', encrypted_access_token: null, encrypted_refresh_token: null, token_expires_at: null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return fromProfile(data)
}
async function markExpired(row: SenderRow): Promise<void> {
  await supabase.from('sender_profiles').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', row.id)
}
export async function accessTokenForSender(row: SenderRow): Promise<string> {
  if (row.status !== 'connected') throw new Error(`The sender "${row.name}" is ${row.status}. Reconnect it before sending`)
  if (!row.access_token) throw new Error(`The sender "${row.name}" has no stored authorization. Reconnect it`)
  const expired = row.token_expires_at && new Date(row.token_expires_at).getTime() <= Date.now() + 60_000
  if (!expired) return decryptSecret(row.access_token)
  if (row.provider !== 'google' || !row.refresh_token) { await markExpired(row); throw new Error(`The sender "${row.name}" authorization expired. Reconnect it`) }
  try {
    const refreshed = await refreshGoogleToken(row.refresh_token)
    const { error } = await supabase.from('sender_profiles').update({ encrypted_access_token: encryptSecret(refreshed.accessToken), token_expires_at: refreshed.expiresAt, updated_at: new Date().toISOString() }).eq('id', row.id)
    if (error) throw error
    return refreshed.accessToken
  } catch {
    await markExpired(row)
    throw new Error(`The sender "${row.name}" authorization could not be refreshed. Reconnect it`)
  }
}
export function phoneNumberIdFor(row: SenderRow): string | null { const value = row.provider_data?.phoneNumberId; return typeof value === 'string' ? value : null }
export interface ResolvedSenders { assignments: Partial<Record<SenderChannel, SenderRow>>; issues: Partial<Record<SenderChannel, string>> }
export function assignedSenderIds(config: any): SenderAssignments {
  const raw = config?.senderIds || {}
  return { ...(typeof raw.email === 'string' && raw.email.trim() ? { email: raw.email.trim() } : {}), ...(typeof raw.whatsapp === 'string' && raw.whatsapp.trim() ? { whatsapp: raw.whatsapp.trim() } : {}) }
}
export function assignmentsFrom(channels: SenderChannel[], config: any, rows: SenderRow[]): ResolvedSenders {
  const ids = assignedSenderIds(config), assignments: ResolvedSenders['assignments'] = {}, issues: ResolvedSenders['issues'] = {}
  for (const channel of channels) {
    const label = channel === 'email' ? 'Gmail' : 'WhatsApp', row = rows.find((item) => item.id === ids[channel])
    if (!ids[channel]) issues[channel] = `Choose a connected ${label} sender for this workflow`
    else if (!row || row.channel !== channel) issues[channel] = `The selected ${label} sender is not available. Choose another connected sender`
    else if (row.status !== 'connected') issues[channel] = `The ${label} sender "${row.name}" is ${row.status}. Reconnect it before running`
    else assignments[channel] = row
  }
  return { assignments, issues }
}
export async function resolveSenderAssignments(userId: string, type: string, config: any): Promise<ResolvedSenders> {
  const channels = requiredChannels(type, config)
  return channels.length ? assignmentsFrom(channels, config, await listSenders(userId)) : { assignments: {}, issues: {} }
}
export async function connectedChannels(userId: string): Promise<Partial<Record<SenderChannel, boolean>>> {
  const rows = await listSenders(userId)
  return { email: rows.some((row) => row.channel === 'email' && row.status === 'connected'), whatsapp: rows.some((row) => row.channel === 'whatsapp' && row.status === 'connected') }
}
export function senderProblems(type: string, config: any, rows: SenderRow[]): string[] { return Object.values(assignmentsFrom(requiredChannels(type, config), config, rows).issues).filter((v): v is string => Boolean(v)) }
