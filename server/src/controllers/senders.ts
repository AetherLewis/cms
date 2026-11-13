import { AuthRequest } from '../middleware/auth'
import { badRequest, notFound, ok, serverError } from '../utils/response'
import { disconnectSender, findSender, listSenders, renameSender, saveConnectedSender, toSummary } from '../services/senders/store'
import { createOAuthState, exchangeGoogleCode, exchangeWhatsAppCode, getGoogleAuthUrl, getWhatsAppAuthUrl, verifyOAuthState, type OAuthProvider } from '../services/senderOAuth'

const validProvider = (value: unknown): value is OAuthProvider => value === 'gmail' || value === 'whatsapp'
const validCallbackProvider = (value: unknown): value is OAuthProvider | 'google' => validProvider(value) || value === 'google'
const normalizeProvider = (value: OAuthProvider | 'google'): OAuthProvider => value === 'google' ? 'gmail' : value
const callbackUrl = (res: any, query: string) => res.redirect(`${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/senders?${query}`)
function id(req: AuthRequest): string { return String((req.params as any).id || '') }

export async function listSendersHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const rows = await listSenders(userId)
    ok(res, { senders: rows.map(toSummary), providers: [
      { provider: 'gmail', channel: 'email', label: 'Gmail', configured: Boolean(process.env.GOOGLE_CLIENT_ID) },
      { provider: 'whatsapp', channel: 'whatsapp', label: 'WhatsApp', configured: Boolean(process.env.META_APP_ID) },
    ] })
  } catch (e: any) { serverError(res, e.message) }
}

export async function initOAuth(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id, provider = (req.params as any).provider as OAuthProvider
    if (!userId) { badRequest(res, 'User ID missing'); return }
    if (!validProvider(provider)) { badRequest(res, 'Choose gmail or whatsapp'); return }
    const senderId = typeof req.body?.sender_profile_id === 'string' ? req.body.sender_profile_id : undefined
    if (senderId) {
      const existing = await findSender(userId, senderId)
      if (!existing || (provider === 'gmail') !== (existing.provider === 'google')) { notFound(res, 'Sender profile not found'); return }
    }
    const state = createOAuthState({ user_id: userId, provider, ...(senderId ? { sender_profile_id: senderId } : {}) })
    ok(res, { authorizationUrl: provider === 'gmail' ? getGoogleAuthUrl(state) : getWhatsAppAuthUrl(state), provider })
  } catch (e: any) { serverError(res, e.message) }
}

// Compatibility endpoint for the existing CMS page.
export async function startAuthorization(req: AuthRequest, res: any): Promise<void> {
  const channel = req.body?.channel
  const provider = channel === 'email' ? 'gmail' : channel === 'whatsapp' ? 'whatsapp' : null
  if (!provider) { badRequest(res, 'Choose the sender channel to connect'); return }
  req.params.provider = provider
  req.body.sender_profile_id = req.body.senderId
  return initOAuth(req, res)
}

export async function oauthCallback(req: AuthRequest, res: any): Promise<void> {
  const routeProvider = (req.params as any).provider
  const provider = validCallbackProvider(routeProvider) ? normalizeProvider(routeProvider) : routeProvider
  if (!validCallbackProvider(routeProvider)) { callbackUrl(res, 'error=Unknown%20provider'); return }
  try {
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const pending = verifyOAuthState(state, provider)
    if (!pending) { callbackUrl(res, 'error=Authorization%20state%20is%20invalid%20or%20expired'); return }
    if (req.query.error) { callbackUrl(res, `error=${encodeURIComponent(String(req.query.error))}`); return }
    const code = typeof req.query.code === 'string' ? req.query.code : ''
    if (!code) { callbackUrl(res, 'error=Authorization%20code%20missing'); return }
    const result = provider === 'gmail' ? await exchangeGoogleCode(code) : await exchangeWhatsAppCode(code)
    const saved = await saveConnectedSender({
      userId: pending.user_id, provider: provider === 'gmail' ? 'google' : 'meta', channel: provider === 'gmail' ? 'email' : 'whatsapp',
      tokens: { accessToken: result.accessToken, refreshToken: result.refreshToken, expiresAt: result.expiresAt, scopes: [] },
      identity: { account: result.account, providerData: { wabaId: result.wabaId, phoneNumberId: result.phoneNumberId } },
      senderId: pending.sender_profile_id,
    })
    callbackUrl(res, 'connected=1')
  } catch (e: any) { callbackUrl(res, `error=${encodeURIComponent(e?.message || 'Authorization failed')}`) }
}

export async function renameSenderHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id, name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!userId) { badRequest(res, 'User ID missing'); return }
    if (!name || name.length > 80) { badRequest(res, 'Name must be between 1 and 80 characters'); return }
    const row = await renameSender(userId, id(req), name)
    if (!row) { notFound(res, 'Sender profile not found'); return }
    ok(res, toSummary(row))
  } catch (e: any) { serverError(res, e.message) }
}
export async function disconnectSenderHandler(req: AuthRequest, res: any): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { badRequest(res, 'User ID missing'); return }
    const row = await disconnectSender(userId, id(req))
    if (!row) { notFound(res, 'Sender profile not found'); return }
    ok(res, toSummary(row))
  } catch (e: any) { serverError(res, e.message) }
}
