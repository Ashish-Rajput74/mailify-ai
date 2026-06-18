import nodemailer from 'nodemailer'
import { EmailDraft } from '@/models/Job'

interface SendOptions {
  gmailEmail: string
  gmailAppPassword: string
  draft: EmailDraft
}

export async function sendEmail({ gmailEmail, gmailAppPassword, draft }: SendOptions) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailAppPassword, // 16-char app password
    },
  })

  await transporter.sendMail({
    from: `"Mailify" <${gmailEmail}>`,
    to: draft.to.join(', '),
    subject: draft.subject,
    html: draft.body.replace(/\n/g, '<br/>'),
  })
}
