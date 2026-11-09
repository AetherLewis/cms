import nodemailer from 'nodemailer'

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
