import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * Token encryption for connected sender profiles.
 * The key lives in deployment secrets only (SENDER_TOKEN_ENCRYPTION_KEY) —
 * token material is never exposed to the CMS, logs or API responses.
 */
function encryptionKey(): Buffer {
  const secret = process.env.SENDER_TOKEN_ENCRYPTION_KEY
  if (!secret || secret.trim().length < 16) {
    throw new Error('SENDER_TOKEN_ENCRYPTION_KEY is not configured, so sender credentials cannot be stored')
  }
  return createHash('sha256').update(secret.trim()).digest()
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':')
}

export function decryptToken(payload: string | null | undefined): string | null {
  if (!payload) return null
  const [version, iv, tag, data] = payload.split(':')
  if (version !== 'v1' || !iv || !tag || !data) return null
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
