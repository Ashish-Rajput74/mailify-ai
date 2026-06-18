import { connectDB } from '@/lib/mongodb'
import { Job } from '@/models/Job'
import { ParsedJob } from '@/models/Automation'
import { addDays } from 'date-fns'

// Convert a cron string + timezone to the next run Date (simple approach)
function nextRunFromCron(cronExpr: string): Date {
  // For simplicity we compute next occurrence manually for common patterns
  // In production, use the 'cron-parser' package
  const now = new Date()
  const parts = cronExpr.split(' ')
  const minute = parseInt(parts[0])
  const hour = parseInt(parts[1])

  const next = new Date()
  next.setSeconds(0)
  next.setMilliseconds(0)
  next.setMinutes(minute)
  next.setHours(hour)

  // If that time has already passed today, push to tomorrow
  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}

export async function createJobsForAutomation(
  automationId: string,
  userId: string,
  parsedJob: ParsedJob
) {
  await connectDB()

  if (parsedJob.type === 'immediate') {
    await Job.create({
      automationId,
      userId,
      runAt: new Date(),
      emailIntent: parsedJob.emailIntent,
      status: 'pending',
    })
  } else if (parsedJob.type === 'scheduled' && parsedJob.scheduleTime) {
    await Job.create({
      automationId,
      userId,
      runAt: new Date(parsedJob.scheduleTime),
      emailIntent: parsedJob.emailIntent,
      status: 'pending',
    })
  } else if (parsedJob.type === 'recurring' && parsedJob.recurrence) {
    // Create first occurrence now
    const firstRun = nextRunFromCron(parsedJob.recurrence)
    await Job.create({
      automationId,
      userId,
      runAt: firstRun,
      recurrence: parsedJob.recurrence,
      emailIntent: parsedJob.emailIntent,
      status: 'pending',
    })
  }
}

export async function scheduleNextRecurrence(job: InstanceType<typeof Job>) {
  if (!job.recurrence) return
  const nextRun = nextRunFromCron(job.recurrence)
  await Job.create({
    automationId: job.automationId,
    userId: job.userId,
    runAt: nextRun,
    recurrence: job.recurrence,
    emailIntent: job.emailIntent,
    status: 'pending',
  })
}
