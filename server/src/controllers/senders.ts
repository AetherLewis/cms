import { AuthRequest } from '../middleware/auth'
import { badRequest, notFound, ok, serverError } from '../utils/response'
import {
  consumeOAuthState,
  createOAuthState,
  disconnectSender,
  findSender,
  listSenders,
  renameSender,
  saveConnectedSender,
  toSummary,
} from '../services/senders/store'
import {
  PROVIDERS,
  SENDER_PROVIDERS,
  buildAuthorizationUrl,
  cmsUrl,
  exchangeAuthorizationCode,
  isProviderConfigured,
  isSenderProvider,
  providerCredentials,
  type SenderProvider,
} from '../services/senders/providers'
import type { SenderChannel } from '../services/workflows/types'

const CHANNELS: SenderChannel[] = ['email', 'whatsapp']

function paramId(req: AuthRequest): string {
  return String((req.params as Record<string, unknown>).id || '')
}

function providerForChannel(channel: SenderChannel): SenderProvider | null {
  const match = SENDER_PROVIDERS.find((provider) => PROVIDERS[provider].channel === channel)
  return match || null
}

/** Providers and whether their OAuth client credentials are present in deployment secrets. */
export async function listSendersHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const rows = await listSenders(userId)
    ok(res, {
      senders: rows.map(toSummary),
      providers: SENDER_PROVIDERS.map((provider) => ({
        provider,
        channel: PROVIDERS[provider].channel,
        label: PROVIDERS[provider].label,
        configured: isProviderConfigured(provider),
      })),
    })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Start (or restart) a provider authorization. Returns the provider consent URL;
 * token material never touches the browser.
 */
export async function startAuthorization(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }

    const channel = req.body?.channel as SenderChannel
    if (!CHANNELS.includes(channel)) { badRequest(res, 'Choose the sender channel to connect'); return }
    const provider = providerForChannel(channel)
    if (!provider) { badRequest(res, 'That sender channel is not supported'); return }

    try {
      providerCredentials(provider)
    } catch (error: any) {
      badRequest(res, error.message)
      return
    }

    let senderId: string | null = null
    if (req.body?.senderId) {
      const existing = await findSender(userId, String(req.body.senderId))
      if (!existing) { notFound(res, 'Sender not found'); return }
      if (existing.channel !== channel || existing.provider !== provider) {
        badRequest(res, 'That sender cannot be reconnected for this channel'); return
      }
      senderId = existing.id
    }

    const state = await createOAuthState({ userId, provider, channel, senderId })
    ok(res, { authorizationUrl: buildAuthorizationUrl(provider, state), provider })
  } catch (e: any) {
    serverError(res, e.message)
  }
}

/**
 * Provider callback: validates the CSRF state, stores the encrypted credentials
 * and returns the browser to the Sender Profiles page.
 */
export async function oauthCallback(req: AuthRequest, res: any): Promise<void> {
  const provider = String((req.params as Record<string, unknown>).provider || '')
  if (!isSenderProvider(provider)) {
    res.redirect(cmsUrl('/senders?error=Unknown%20provider'))
    return
  }

  try {
    const error = typeof req.query.error === 'string' ? req.query.error : ''
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const pending = await consumeOAuthState(state, provider)
    if (!pending) {
      res.redirect(cmsUrl('/senders?error=This%20authorization%20link%20is%20no%20longer%20valid.%20Start%20again.'))
      return
    }
    if (error) {
      res.redirect(cmsUrl(`/senders?error=${encodeURIComponent(`Provider authorization was cancelled (${error})`)}`))
      return
    }

    const code = typeof req.query.code === 'string' ? req.query.code : ''
    if (!code) {
      res.redirect(cmsUrl('/senders?error=The%20provider%20did%20not%20return%20an%20authorization%20code'))
      return
    }

    const tokens = await exchangeAuthorizationCode(provider, code)
    const sender = await saveConnectedSender({
      userId: pending.user_id,
      provider,
      channel: pending.channel,
      tokens,
      senderId: pending.sender_id,
    })
    res.redirect(cmsUrl(`/senders?connected=${encodeURIComponent(sender.name)}`))
  } catch (e: any) {
    const message = e instanceof Error ? e.message : 'The sender could not be connected'
    res.redirect(cmsUrl(`/senders?error=${encodeURIComponent(message)}`))
  }
}

export async function renameSenderHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) { badRequest(res, 'Give the sender a name'); return }
    if (name.length > 80) { badRequest(res, 'Sender name must be 80 characters or fewer'); return }

    const row = await renameSender(userId, paramId(req), name)
    if (!row) { notFound(res, 'Sender not found'); return }
    ok(res, toSummary(row))
  } catch (e: any) {
    serverError(res, e.message)
  }
}

export async function disconnectSenderHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const row = await disconnectSender(userId, paramId(req))
    if (!row) { notFound(res, 'Sender not found'); return }
    ok(res, toSummary(row))
  } catch (e: any) {
    serverError(res, e.message)
  }
}
