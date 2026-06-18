import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { parseInstruction } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { instruction, timezone } = await req.json()
  if (!instruction) return NextResponse.json({ error: 'No instruction provided' }, { status: 400 })

  try {
    const parsed = await parseInstruction(instruction, timezone || 'Asia/Kolkata')
    return NextResponse.json({ parsed })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse instruction: ' + err.message }, { status: 500 })
  }
}
