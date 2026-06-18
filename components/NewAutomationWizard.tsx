'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles, Check, Clock, Repeat, Zap } from 'lucide-react'

type Step = 1 | 2 | 3

interface ParsedJob {
  type: 'immediate' | 'scheduled' | 'recurring'
  to: string[]
  scheduleTime?: string
  recurrence?: string
  timezone?: string
  emailIntent: string
}

export function NewAutomationWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instruction, setInstruction] = useState('')
  const [parsed, setParsed] = useState<ParsedJob | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleParseInstruction() {
    setParsing(true)
    setParseError('')
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, timezone: tz }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed(data.parsed)
      setStep(3)
    } catch (e: any) {
      setParseError(e.message)
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, instructionRaw: instruction, parsedJob: parsed }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/dashboard')
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exampleInstructions = [
    'Send a good morning email to me daily at 7:00 AM with a motivational thought of the day',
    'Send an email to john@example.com right now saying the project is ready for review',
    'Send a weekly summary email to team@company.com every Monday at 9 AM',
  ]

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
              ${step > s ? 'bg-accent text-white' : step === s ? 'bg-accent text-white' : 'bg-border text-muted'}`}>
              {step > s ? <Check size={13} /> : s}
            </div>
            {s < 3 && <div className={`h-px w-8 transition-all ${step > s ? 'bg-accent' : 'bg-border'}`} />}
          </div>
        ))}
        <span className="ml-2 text-xs text-muted">
          {step === 1 ? 'Name it' : step === 2 ? 'Instruct AI' : 'Confirm'}
        </span>
      </div>

      {/* Step 1 — Name + Description */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-0.5">Name your automation</h2>
            <p className="text-muted text-sm">Give it a name you'll recognise later.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Name *</label>
            <input className="input" placeholder="e.g. Daily Morning Motivation" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Description (optional)</label>
            <input className="input" placeholder="Brief note for yourself — not used by AI" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <button className="btn-primary flex items-center gap-2 ml-auto" disabled={!name} onClick={() => setStep(2)}>
            Next <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Step 2 — AI Instruction */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-0.5">What should the AI do?</h2>
            <p className="text-muted text-sm">Describe the email in plain English — who to send to, what to say, and when.</p>
          </div>

          <textarea
            className="input min-h-32 resize-none"
            placeholder="e.g. Send me a good morning email every day at 7 AM with a thought of the day…"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
          />

          {/* Examples */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Try an example:</p>
            {exampleInstructions.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInstruction(ex)}
                className="w-full text-left text-xs text-muted bg-paper border border-border rounded-lg px-3 py-2 hover:border-accent hover:text-accent transition"
              >
                {ex}
              </button>
            ))}
          </div>

          {parseError && <p className="text-danger text-sm">{parseError}</p>}

          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={() => setStep(1)}>
              <ArrowLeft size={15} /> Back
            </button>
            <button className="btn-primary flex items-center gap-2 ml-auto" disabled={!instruction || parsing} onClick={handleParseInstruction}>
              {parsing ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Parsing…</>
              ) : (
                <><Sparkles size={14} /> Parse with AI</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm parsed job */}
      {step === 3 && parsed && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-0.5">Confirm automation</h2>
            <p className="text-muted text-sm">Here's what the AI understood. Looks right?</p>
          </div>

          <div className="card space-y-3">
            {/* Type badge */}
            <div className="flex items-center gap-2">
              {parsed.type === 'immediate' && <><Zap size={15} className="text-accent" /><span className="text-sm font-medium">Send immediately</span></>}
              {parsed.type === 'scheduled' && <><Clock size={15} className="text-amber-500" /><span className="text-sm font-medium">Scheduled once</span></>}
              {parsed.type === 'recurring' && <><Repeat size={15} className="text-success" /><span className="text-sm font-medium">Recurring</span></>}
            </div>

            {parsed.to.length > 0 && (
              <div>
                <p className="text-xs text-muted mb-0.5">Recipients</p>
                <p className="text-sm font-mono">{parsed.to.join(', ')}</p>
              </div>
            )}

            {parsed.scheduleTime && (
              <div>
                <p className="text-xs text-muted mb-0.5">Scheduled for</p>
                <p className="text-sm">{new Date(parsed.scheduleTime).toLocaleString()}</p>
              </div>
            )}

            {parsed.recurrence && (
              <div>
                <p className="text-xs text-muted mb-0.5">Recurrence (cron)</p>
                <p className="text-sm font-mono">{parsed.recurrence}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted mb-0.5">Email intent</p>
              <p className="text-sm">{parsed.emailIntent}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={() => setStep(2)}>
              <ArrowLeft size={15} /> Edit
            </button>
            <button className="btn-primary flex items-center gap-2 ml-auto" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : <><Check size={14} /> Activate</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
