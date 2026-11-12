import nodemailer from 'nodemailer'
import type { SenderChannel } from './workflows/types'

/** Resolved OAuth credentials for one connected sender profile. */
export interface DispatchCredentials {
  channel: SenderChannel
  account: string
  accessToken: string
  /** WhatsApp Cloud API phone number ID (the sending number). */
  phoneNumberId?: string | null
}

export async function sendEmail(recipient: string, subject: string, body: string): Promise<void> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured to send email')

  const port = Number(process.env.SMTP_PORT || 587)
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: user,
    to: recipient,
    subject,
    text: body,
  })
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const apiUrl = process.env.WHATSAPP_API_URL
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  if (!apiUrl || !accessToken) throw new Error('WHATSAPP_API_URL and WHATSAPP_ACCESS_TOKEN must be configured to send WhatsApp messages')

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone.replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body: message },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`WhatsApp delivery failed (${response.status})${detail ? `: ${detail}` : ''}`)
  }
}

function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

/**
 * Send mail through the Gmail API using the connected sender's OAuth access token.
 * No SMTP password or token material ever reaches the CMS.
 */
export async function sendEmailWithSender(
  credentials: DispatchCredentials,
  recipient: string,
  subject: string,
  body: string,
): Promise<void> {
  const message = [
    `From: ${credentials.account}`,
    `To: ${recipient}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n')

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: Buffer.from(message, 'utf8').toString('base64url') }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gmail delivery failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }
}

/** Send a WhatsApp Cloud API message with the connected sender's OAuth access token. */
export async function sendWhatsAppWithSender(
  credentials: DispatchCredentials,
  phone: string,
  message: string,
): Promise<void> {
  if (!credentials.phoneNumberId) {
    throw new Error(`The WhatsApp sender "${credentials.account}" has no phone number ID. Reconnect it`)
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${credentials.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone.replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body: message },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`WhatsApp delivery failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }
}
