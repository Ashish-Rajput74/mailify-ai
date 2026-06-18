'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Zap, Clock, Repeat, Pause, Play, Trash2,
  CheckCircle, XCircle, Loader2, Mail
} from 'lucide-react'

interface Job {
  _id: string
  runAt: string
  status: 'pending' | 'sent' | 'failed'
  sentAt?: string
  emailDraft?: { to: string[]; subject: string; body: string }
  errorMessage?: string
  recurrence?: string
}

interface Automation {
  _id: string
  name: string
  description: string
  instructionRaw: string
  parsedJob: { type: string; to: string[]; recurrence?: string; scheduleTime?: string; emailIntent: string }
  status: 'active' | 'paused'
  createdAt: string
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  immediate: { icon: Zap, label: 'Immediate', color: 'text-accent bg-accent-light' },
  scheduled: { icon: Clock, label: 'Scheduled', color: 'text-amber-600 bg-amber-50' },
  recurring: { icon: Repeat, label: 'Recurring', color: 'text-success bg-green-50' },
}

export default function AutomationDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [automation, setAutomation] = useState<Automation | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/automations/${id}`)
        .then(r => r.json())
        .then(d => {
          setAutomation(d.automation)
          setJobs(d.jobs || [])
        })
        .finally(() => setLoading(false))
    }
  }, [status, id])

  async function togglePause() {
    if (!automation) return
    setToggling(true)
    const newStatus = automation.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    setAutomation(data.automation)
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this automation? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-muted" />
    </div>
  )

  if (!automation) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-muted text-sm">Automation not found.</p>
    </div>
  )

  const cfg = typeConfig[automation.parsedJob.type] || typeConfig.immediate
  const Icon = cfg.icon
  const sentJobs = jobs.filter(j => j.status === 'sent')
  const pendingJobs = jobs.filter(j => j.status === 'pending')
  const failedJobs = jobs.filter(j => j.status === 'failed')

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted hover:text-ink transition">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <span className="font-medium text-sm truncate max-w-[200px]">{automation.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              disabled={toggling}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              {toggling ? <Loader2 size={13} className="animate-spin" /> :
                automation.status === 'active'
                  ? <><Pause size={13} /> Pause</>
                  : <><Play size={13} /> Resume</>
              }
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-danger text-danger hover:bg-red-50 transition font-medium"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Delete</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Overview card */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                  <Icon size={11} />{cfg.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                  ${automation.status === 'active' ? 'border-success text-success bg-green-50' : 'border-border text-muted bg-paper'}`}>
                  {automation.status === 'active' ? 'Active' : 'Paused'}
                </span>
              </div>
              <h1 className="font-semibold">{automation.name}</h1>
              {automation.description && <p className="text-muted text-sm mt-0.5">{automation.description}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-semibold text-success">{sentJobs.length}</p>
              <p className="text-xs text-muted">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-accent">{pendingJobs.length}</p>
              <p className="text-xs text-muted">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-danger">{failedJobs.length}</p>
              <p className="text-xs text-muted">Failed</p>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <div className="card">
          <p className="text-xs font-medium text-muted mb-2">AI Instruction</p>
          <p className="text-sm">{automation.instructionRaw}</p>
          {automation.parsedJob.to.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted mb-1">Recipients</p>
              <p className="text-sm font-mono">{automation.parsedJob.to.join(', ')}</p>
            </div>
          )}
          {automation.parsedJob.recurrence && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted mb-1">Schedule (cron)</p>
              <p className="text-sm font-mono">{automation.parsedJob.recurrence}</p>
            </div>
          )}
        </div>

        {/* Job history */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Email history</h2>
          {jobs.length === 0 ? (
            <div className="card text-center py-10">
              <Mail size={22} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No emails sent yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job._id} className="card">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                  >
                    <div className="flex items-center gap-2.5">
                      {job.status === 'sent' && <CheckCircle size={15} className="text-success flex-shrink-0" />}
                      {job.status === 'pending' && <Clock size={15} className="text-accent flex-shrink-0" />}
                      {job.status === 'failed' && <XCircle size={15} className="text-danger flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">
                          {job.emailDraft?.subject || 'Pending draft'}
                        </p>
                        <p className="text-xs text-muted">
                          {job.status === 'sent' && job.sentAt
                            ? `Sent ${new Date(job.sentAt).toLocaleString()}`
                            : job.status === 'pending'
                            ? `Scheduled for ${new Date(job.runAt).toLocaleString()}`
                            : `Failed — ${job.errorMessage}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted">{expandedJob === job._id ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded email preview */}
                  {expandedJob === job._id && job.emailDraft && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs text-muted mb-0.5">To</p>
                        <p className="text-xs font-mono">{job.emailDraft.to.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Subject</p>
                        <p className="text-sm font-medium">{job.emailDraft.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Body</p>
                        <p className="text-xs text-ink whitespace-pre-wrap bg-paper rounded-lg p-3 border border-border">
                          {job.emailDraft.body}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
