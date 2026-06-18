import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import { Automation } from '@/models/Automation'
import { User } from '@/models/User'
import { createJobsForAutomation } from '@/lib/scheduler'

// GET — list all automations for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  const automations = await Automation.find({ userId: user._id }).sort({ createdAt: -1 })
  return NextResponse.json({ automations })
}

// POST — create a new automation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.user.email })

  if (!user?.gmailAppPassword) {
    return NextResponse.json({ error: 'Connect your Gmail first' }, { status: 400 })
  }

  const { name, description, instructionRaw, parsedJob } = await req.json()
  if (!name || !instructionRaw || !parsedJob)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const automation = await Automation.create({
    userId: user._id.toString(),
    name,
    description,
    instructionRaw,
    parsedJob,
    status: 'active',
  })

  // Schedule the job(s) in MongoDB
  await createJobsForAutomation(automation._id.toString(), user._id.toString(), parsedJob)

  return NextResponse.json({ automation }, { status: 201 })
}
