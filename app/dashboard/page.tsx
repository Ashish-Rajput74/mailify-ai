'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Zap, LogOut, Mail } from 'lucide-react'
import { GmailConnectButton } from '@/components/GmailConnectButton'
import { AutomationCard } from '@/components/AutomationCard'

export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const gmailConnected = !!(session?.user as any)?.gmailConnected

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/automations')
        .then(r => r.json())
        .then(d => setAutomations(d.automations || []))
        .finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'loading') return null

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Mailify.ai</span>
          </div>

          <div className="flex items-center gap-3">
            <GmailConnectButton connected={gmailConnected} onConnected={() => update()} />
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-muted hover:text-ink transition">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Gmail banner */}
        {!gmailConnected && (
          <div className="bg-accent-light border border-accent border-opacity-20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Mail size={18} className="text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-accent">Connect Gmail to get started</p>
              <p className="text-xs text-muted mt-0.5">You'll need to connect your Gmail account before creating automations.</p>
            </div>
          </div>
        )}

        {/* Top row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Automations</h1>
            <p className="text-muted text-sm">{automations.length} active</p>
          </div>
          {gmailConnected && (
            <Link href="/dashboard/new">
              <button className="btn-primary flex items-center gap-2">
                <Plus size={15} /> New automation
              </button>
            </Link>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-20 animate-pulse bg-border" />
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="card text-center py-14">
            <Zap size={28} className="text-muted mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">No automations yet</p>
            <p className="text-muted text-sm mb-4">Create your first to start sending emails on autopilot.</p>
            {gmailConnected && (
              <Link href="/dashboard/new">
                <button className="btn-primary">Create automation</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((a: any) => (
              <AutomationCard key={a._id} automation={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
