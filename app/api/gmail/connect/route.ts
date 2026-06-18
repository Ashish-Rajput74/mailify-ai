import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { gmailEmail, appPassword } = await req.json()
  if (!gmailEmail || !appPassword)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify credentials actually work before saving
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailEmail, pass: appPassword },
    })
    await transporter.verify()
  } catch {
    return NextResponse.json({ error: 'Invalid Gmail credentials. Check your app password.' }, { status: 400 })
  }

  await connectDB()
  await User.findOneAndUpdate(
    { email: session.user.email },
    { gmailEmail, gmailAppPassword: appPassword }
  )

  return NextResponse.json({ success: true })
}
