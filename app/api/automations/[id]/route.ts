import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import { Automation } from '@/models/Automation'
import { Job } from '@/models/Job'
import { User } from '@/models/User'

// GET — single automation + its jobs
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  const automation = await Automation.findOne({ _id: params.id, userId: user._id.toString() })
  if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const jobs = await Job.find({ automationId: params.id }).sort({ runAt: -1 }).limit(20)

  return NextResponse.json({ automation, jobs })
}

// PATCH — toggle pause/active
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  const { status } = await req.json()

  const automation = await Automation.findOneAndUpdate(
    { _id: params.id, userId: user._id.toString() },
    { status },
    { new: true }
  )
  if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ automation })
}

// DELETE — remove automation + all its pending jobs
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.user.email })

  await Automation.findOneAndDelete({ _id: params.id, userId: user._id.toString() })
  await Job.deleteMany({ automationId: params.id, status: 'pending' })

  return NextResponse.json({ success: true })
}
