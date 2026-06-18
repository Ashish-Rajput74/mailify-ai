import cron from 'node-cron'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { connectDB } from '../lib/mongodb'
import { Job } from '../models/Job'
import { User } from '../models/User'
import { draftEmail } from '../lib/gemini'
import { sendEmail } from '../lib/mailer'
import { scheduleNextRecurrence } from '../lib/scheduler'

async function processDueJobs() {
  await connectDB()

  const dueJobs = await Job.find({
    status: 'pending',
    runAt: { $lte: new Date() },
  }).limit(20)

  if (dueJobs.length === 0) return
  console.log(`[worker] Processing ${dueJobs.length} due job(s)`)

  for (const job of dueJobs) {
    try {
      // 1. Get user's Gmail credentials
      const user = await User.findOne({ _id: job.userId })
      if (!user?.gmailEmail || !user?.gmailAppPassword) {
        await Job.findByIdAndUpdate(job._id, {
          status: 'failed',
          errorMessage: 'Gmail not connected for this user',
        })
        continue
      }

      // 2. Draft email with Gemini
      const draft = await draftEmail(job.emailIntent)

      // 3. Send via Gmail SMTP
      await sendEmail({
        gmailEmail: user.gmailEmail,
        gmailAppPassword: user.gmailAppPassword,
        draft: {
          to: draft.to.length > 0 ? draft.to : [user.gmailEmail], // fallback to self
          subject: draft.subject,
          body: draft.body,
        },
      })

      // 4. Mark sent
      await Job.findByIdAndUpdate(job._id, {
        status: 'sent',
        emailDraft: draft,
        sentAt: new Date(),
      })

      console.log(`[worker] ✅ Job ${job._id} sent`)

      // 5. If recurring, queue next occurrence
      if (job.recurrence) {
        await scheduleNextRecurrence(job)
        console.log(`[worker] ⏰ Next recurrence scheduled for job ${job._id}`)
      }
    } catch (err: any) {
      await Job.findByIdAndUpdate(job._id, {
        status: 'failed',
        errorMessage: err.message,
      })
      console.error(`[worker] ❌ Job ${job._id} failed:`, err.message)
    }
  }
}

// Run every minute
cron.schedule('* * * * *', processDueJobs)
console.log('[worker] Mailify cron worker started — checking every minute')
processDueJobs() // run immediately on start too
