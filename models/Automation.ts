import mongoose, { Schema, Document } from 'mongoose'

export interface ParsedJob {
  type: 'immediate' | 'scheduled' | 'recurring'
  to: string[]
  scheduleTime?: string   // ISO string for one-time
  recurrence?: string     // cron expression e.g. "0 7 * * *"
  timezone?: string
  emailIntent: string     // what the AI should write about
}

export interface IAutomation extends Document {
  userId: string
  name: string
  description: string
  instructionRaw: string
  parsedJob: ParsedJob
  status: 'active' | 'paused'
  createdAt: Date
}

const AutomationSchema = new Schema<IAutomation>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  instructionRaw: { type: String, required: true },
  parsedJob: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['active', 'paused'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
})

export const Automation =
  mongoose.models.Automation || mongoose.model<IAutomation>('Automation', AutomationSchema)
