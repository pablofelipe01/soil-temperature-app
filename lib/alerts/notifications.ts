import { env } from '@/config/env'
import type { ThresholdBreach } from './thresholds'

interface AlertEmailInput {
  locationName: string
  recipients: string[]
  breaches: ThresholdBreach[]
  startDate: string
  endDate: string
}

export interface AlertEmailResult {
  sent: boolean
  reason?: string
}

function buildSubject(locationName: string, breaches: ThresholdBreach[]): string {
  const critical = breaches.some((b) => b.type === 'temperature' || b.type === 'moisture')
  return critical
    ? `[Alerta suelo] Umbrales fuera de rango en ${locationName}`
    : `[Aviso suelo] Cambios detectados en ${locationName}`
}

function buildHtml(input: AlertEmailInput): string {
  const items = input.breaches
    .slice(0, 10)
    .map((b) => `<li><strong>${b.date}</strong>: ${b.message}</li>`)
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Alerta de umbrales - ${input.locationName}</h2>
      <p style="margin-top: 0;">Se detectaron valores fuera de rango en el período ${input.startDate} a ${input.endDate}.</p>
      <ul>${items}</ul>
      <p style="font-size: 12px; color: #6b7280;">Mensaje automático generado por Soil Temperature App.</p>
    </div>
  `
}

async function sendWithResend(input: AlertEmailInput): Promise<AlertEmailResult> {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) {
    return { sent: false, reason: 'RESEND_API_KEY o ALERT_FROM_EMAIL no configurado' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ALERT_FROM_EMAIL,
      to: input.recipients,
      subject: buildSubject(input.locationName, input.breaches),
      html: buildHtml(input),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: `Resend error: ${body}` }
  }

  return { sent: true }
}

async function sendWithSendGrid(input: AlertEmailInput): Promise<AlertEmailResult> {
  if (!env.SENDGRID_API_KEY || !env.ALERT_FROM_EMAIL) {
    return { sent: false, reason: 'SENDGRID_API_KEY o ALERT_FROM_EMAIL no configurado' }
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: input.recipients.map((email) => ({ email })) }],
      from: { email: env.ALERT_FROM_EMAIL },
      subject: buildSubject(input.locationName, input.breaches),
      content: [{ type: 'text/html', value: buildHtml(input) }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: `SendGrid error: ${body}` }
  }

  return { sent: true }
}

export async function sendThresholdAlertEmail(input: AlertEmailInput): Promise<AlertEmailResult> {
  if (input.recipients.length === 0) {
    return { sent: false, reason: 'No hay destinatarios configurados' }
  }

  const provider = env.ALERT_EMAIL_PROVIDER || (env.RESEND_API_KEY ? 'resend' : env.SENDGRID_API_KEY ? 'sendgrid' : undefined)
  if (!provider) {
    return { sent: false, reason: 'No hay proveedor de correo configurado' }
  }

  if (provider === 'resend') {
    return sendWithResend(input)
  }

  return sendWithSendGrid(input)
}
