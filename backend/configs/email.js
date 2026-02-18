const nodemailer = require('nodemailer')

// Try SMTP first using Mailtrap credentials
function getSmtpTransporter() {
  const host = process.env.MAILTRAP_HOST
  const port = process.env.MAILTRAP_PORT ? parseInt(process.env.MAILTRAP_PORT, 10) : undefined
  const user = process.env.MAILTRAP_USERNAME
  const pass = process.env.MAILTRAP_PASSWORD

  if (!host || !port || !user || !pass) return null

  const secure = port === 465
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

async function sendMailSMTP({ to, subject, html, text }) {
  const transporter = getSmtpTransporter()
  if (!transporter) throw new Error('SMTP credentials not set')

  const fromEmail = process.env.MAILTRAP_FROM_EMAIL || 'no-reply@wastevision.local'
  const fromName = process.env.MAILTRAP_FROM_NAME || 'WasteVision'

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  })
  return info
}


exports.sendVerificationEmail = async function ({ to, name, token }) {
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`

  const subject = 'Verify your email'
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to WasteVision, ${name}</h2>
      <p>Thanks for signing up. Please verify your email address by clicking the button below.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
      <p>If the button does not work, copy and paste this URL into your browser:</p>
      <p><code>${verifyUrl}</code></p>
    </div>
  `

  // SMTP-only
  return sendMailSMTP({ to, subject, html })
}