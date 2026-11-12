import { randomBytes } from 'node:crypto'
import { supabase } from '../../config/supabase'
import { decryptToken, encryptToken } from './crypto'
import {
  PROVIDERS,
  fetchProviderIdentity,
  refreshAccessToken,
  revokeProviderToken,
  type ProviderIdentity,
  type TokenSet,
} from './providers'
import { requiredChannels } from '../workflows/readiness'
import type {
  SenderAssignments,
  SenderChannel,
  SenderProvider,
  SenderRow,
  SenderSummary,
} from '../workflows/types'

const STATE_TTL_MS = 10 * 60 * 1000
const REFRESH_WINDOW_MS = 60 * 1000

export function toSummary(row: SenderRow): SenderSummary {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    provider: row.provider,
    account: row.account,
    status: row.status,
    scopes: row.scopes || [],
    last_connected_at: row.last_connected_at,
    last_error: row.last_error,
    created_at: row.created_at,
  }
}

export async function listSenders(userId: string): Promise<SenderRow[]> {
  const { data, error } = await supabase
    .from('senders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as SenderRow[]
}

export async function findSender(userId: string, id: string): Promise<SenderRow | null> {
  const { data, error } = await supabase.from('senders').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data as SenderRow) || null
}

export async function createOAuthState(input: {
  userId: string
  provider: SenderProvider
  channel: SenderChannel
  senderId?: string | null
}): Promise<string> {
  const state = randomBytes(24).toString('base64url')
  const { error } = await supabase.from('oauth_states').insert({
    state,
    user_id: input.userId,
    provider: input.provider,
    channel: input.channel,
    sender_id: input.senderId || null,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  })
  if (error) throw error
  return state
}

/** Validate and consume a callback state; returns null for unknown, expired or mismatched states. */
export async function consumeOAuthState(state: string, provider: SenderProvider) {
  if (!state) return null
  const { data, error } = await supabase.from('oauth_states').select('*').eq('state', state).maybeSingle()
  if (error || !data) return null
  await supabase.from('oauth_states').delete().eq('state', state)
  if (data.provider !== provider) return null
  if (new Date(data.expires_at).getTime() < Date.now()) return null
  return data as { user_id: string; provider: SenderProvider; channel: SenderChannel; sender_id: string | null }
}

/** Persist the result of a completed authorization redirect (insert or reconnect). */
export async function saveConnectedSender(input: {
  userId: string
  provider: SenderProvider
  channel: SenderChannel
  tokens: TokenSet
  identity?: ProviderIdentity
  senderId?: string | null
}): Promise<SenderRow> {
  const { userId, provider, channel, tokens } = input
  const identity = input.identity || (await fetchProviderIdentity(provider, tokens.accessToken))
  const providerData = identity.providerData
  const now = new Date().toISOString()

  let existing: SenderRow | null = null
  if (input.senderId) {
    existing = await findSender(userId, input.senderId)
    if (existing && (existing.provider !== provider || existing.channel !== channel)) existing = null
  }
  if (!existing) {
    const { data } = await supabase
      .from('senders')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('account', identity.account)
      .maybeSingle()
    existing = (data as SenderRow) || null
  }

  const payload = {
    user_id: userId,
    name: existing?.name || (provider === 'google' ? identity.account : `WhatsApp ${identity.account}`),
    channel,
    provider,
    account: identity.account,
    status: 'connected',
    scopes: tokens.scopes.length > 0 ? tokens.scopes : PROVIDERS[provider].scopes,
    access_token: encryptToken(tokens.accessToken),
    refresh_token: tokens.refreshToken ? encryptToken(tokens.refreshToken) : existing?.refresh_token || null,
    token_expires_at: tokens.expiresAt,
    provider_data: providerData,
    last_connected_at: now,
    last_error: null,
    updated_at: now,
  }

  const query = existing
    ? supabase.from('senders').update(payload).eq('id', existing.id)
    : supabase.from('senders').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as SenderRow
}

export async function renameSender(userId: string, id: string, name: string): Promise<SenderRow | null> {
  const { data, error } = await supabase
    .from('senders')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle()
  if (error) throw error
  return (data as SenderRow) || null
}

/** Disconnect: revoke at the provider when possible, then drop the stored credentials. */
export async function disconnectSender(userId: string, id: string): Promise<SenderRow | null> {
  const row = await findSender(userId, id)
  if (!row) return null
  const token = decryptToken(row.refresh_token) || decryptToken(row.access_token)
  await revokeProviderToken(row.provider, token)
  const { data, error } = await supabase
    .from('senders')
    .update({
      status: 'revoked',
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      last_error: 'Disconnected from the CMS',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data as SenderRow
}

async function markExpired(row: SenderRow, message: string): Promise<void> {
  await supabase
    .from('senders')
    .update({ status: 'expired', last_error: message, updated_at: new Date().toISOString() })
    .eq('id', row.id)
}

/** A usable access token for a connected sender, refreshed when it is about to expire. */
export async function accessTokenForSender(row: SenderRow): Promise<string> {
  if (row.status !== 'connected') {
    throw new Error(`The ${PROVIDERS[row.provider].label} sender "${row.name}" is ${row.status}. Reconnect it to send again`)
  }

  const accessToken = decryptToken(row.access_token)
  if (!accessToken) throw new Error(`The ${PROVIDERS[row.provider].label} sender "${row.name}" has no stored authorization. Reconnect it`)

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : null
  if (expiresAt === null || expiresAt - Date.now() > REFRESH_WINDOW_MS) return accessToken

  const refreshToken = decryptToken(row.refresh_token)
  if (!refreshToken) {
    const message = `The ${PROVIDERS[row.provider].label} sender "${row.name}" authorization expired. Reconnect it to send again`
    await markExpired(row, message)
    throw new Error(message)
  }

  const refreshed = await refreshAccessToken(row.provider, refreshToken)
  if (!refreshed) {
    const message = `The ${PROVIDERS[row.provider].label} sender "${row.name}" authorization could not be refreshed. Reconnect it to send again`
    await markExpired(row, message)
    throw new Error(message)
  }

  await supabase
    .from('senders')
    .update({
      access_token: encryptToken(refreshed.accessToken),
      refresh_token: refreshed.refreshToken ? encryptToken(refreshed.refreshToken) : row.refresh_token,
      token_expires_at: refreshed.expiresAt,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
  return refreshed.accessToken
}

export function phoneNumberIdFor(row: SenderRow): string | null {
  const value = row.provider_data?.phoneNumberId
  return typeof value === 'string' && value ? value : null
}

export interface ResolvedSenders {
  assignments: Partial<Record<SenderChannel, SenderRow>>
  /** User-facing blocker per channel, e.g. "no sender selected" or "sender disconnected". */
  issues: Partial<Record<SenderChannel, string>>
}

export function assignedSenderIds(config: any): SenderAssignments {
  const raw = config?.senderIds
  if (!raw || typeof raw !== 'object') return {}
  const ids: SenderAssignments = {}
  if (typeof raw.email === 'string' && raw.email.trim()) ids.email = raw.email.trim()
  if (typeof raw.whatsapp === 'string' && raw.whatsapp.trim()) ids.whatsapp = raw.whatsapp.trim()
  return ids
}

/** Match a workflow's sender assignments against loaded sender rows (ownership enforced by the query). */
export function assignmentsFrom(
  channels: SenderChannel[],
  config: any,
  rows: SenderRow[],
): ResolvedSenders {
  const ids = assignedSenderIds(config)
  const assignments: ResolvedSenders['assignments'] = {}
  const issues: ResolvedSenders['issues'] = {}

  for (const channel of channels) {
    const label = channel === 'email' ? 'Gmail' : 'WhatsApp'
    const senderId = ids[channel]
    if (!senderId) {
      issues[channel] = `Choose a connected ${label} sender for this workflow`
      continue
    }
    const row = rows.find((candidate) => candidate.id === senderId)
    if (!row || row.channel !== channel) {
      issues[channel] = `The selected ${label} sender is not available. Choose another connected sender`
      continue
    }
    if (row.status !== 'connected') {
      issues[channel] = `The ${label} sender "${row.name}" is ${row.status}. Reconnect it before running`
      continue
    }
    assignments[channel] = row
  }
  return { assignments, issues }
}

/**
 * Resolve the senders assigned to a workflow for its owner.
 * Records a blocker per channel instead of throwing so previews can explain what is missing.
 */
export async function resolveSenderAssignments(
  userId: string,
  type: string,
  config: any,
): Promise<ResolvedSenders> {
  const channels = requiredChannels(type, config)
  if (channels.length === 0) return { assignments: {}, issues: {} }
  return assignmentsFrom(channels, config, await listSenders(userId))
}

export async function connectedChannels(userId: string): Promise<Partial<Record<SenderChannel, boolean>>> {
  const rows = await listSenders(userId)
  return {
    email: rows.some((row) => row.channel === 'email' && row.status === 'connected'),
    whatsapp: rows.some((row) => row.channel === 'whatsapp' && row.status === 'connected'),
  }
}

/** User-facing blockers for a workflow definition given already-loaded sender rows. */
export function senderProblems(type: string, config: any, rows: SenderRow[]): string[] {
  const { issues } = assignmentsFrom(requiredChannels(type, config), config, rows)
  return Object.values(issues).filter((issue): issue is string => Boolean(issue))
}
