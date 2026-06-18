import mongoose, { Schema, Document } from 'mongoose'

export interface EmailDraft {
  to: string[]
  subject: string
  body: string
}

export interface IJob extends Document {
  automationId: string
  userId: string
  runAt: Date
  recurrence?: string   // cron string if recurring
  emailDraft?: EmailDraft
  emailIntent: string
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  errorMessage?: string
}

const JobSchema = new Schema<IJob>({
  automationId: { type: String, required: true },
  userId: { type: String, required: true },
  runAt: { type: Date, required: true },
  recurrence: String,
  emailDraft: {
    to: [String],
    subject: String,
    body: String,
  },
  emailIntent: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt: Date,
  errorMessage: String,
})

// Index for fast due-job polling
JobSchema.index({ status: 1, runAt: 1 })

export const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema)
