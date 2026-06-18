import { GoogleGenerativeAI } from '@google/generative-ai'
import { ParsedJob } from '@/models/Automation'
import { EmailDraft } from '@/models/Job'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// ── Parse a natural language instruction into a structured job ──────────────
export async function parseInstruction(
  instruction: string,
  timezone: string = 'Asia/Kolkata'
): Promise<ParsedJob> {
  const now = new Date().toISOString()

  const prompt = `
You are an email automation parser. Given a natural language instruction, return ONLY a valid JSON object (no markdown, no backticks).

Current time (UTC): ${now}
User timezone: ${timezone}

Instruction: "${instruction}"

Return this exact shape:
{
  "type": "immediate" | "scheduled" | "recurring",
  "to": ["email1@example.com"],
  "scheduleTime": "ISO string — only for type=scheduled",
  "recurrence": "cron expression — only for type=recurring (e.g. '0 7 * * *' for daily 7AM)",
  "timezone": "${timezone}",
  "emailIntent": "plain English description of what the email should say"
}

Rules:
- "immediate" = send right now
- "scheduled" = send once at a specific time
- "recurring" = send on a schedule repeatedly
- For "daily at 7AM" use cron "0 7 * * *"
- For "every Monday" use cron "0 9 * * 1"
- emailIntent must describe the email content fully so AI can draft it later
- If no email address is mentioned, set to: []
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as ParsedJob
}

// ── Draft an actual email from an intent ────────────────────────────────────
export async function draftEmail(intent: string): Promise<EmailDraft & { to: string[] }> {
  const prompt = `
You are an email writing assistant. Write a professional, warm email based on this intent:

"${intent}"

Return ONLY valid JSON (no markdown, no backticks):
{
  "to": [],
  "subject": "email subject here",
  "body": "full email body here (plain text, use \\n for new lines)"
}

If recipient email addresses are mentioned in the intent, include them in "to". Otherwise leave "to" as [].
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
