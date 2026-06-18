'use client'
import { useState } from 'react'
import { CheckCircle, Mail, ExternalLink, Eye, EyeOff } from 'lucide-react'

interface Props {
  connected: boolean
  onConnected: () => void
}

export function GmailConnectButton({ connected, onConnected }: Props) {
  const [open, setOpen] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gmail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailEmail, appPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOpen(false)
      onConnected()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-success text-sm font-medium">
        <CheckCircle size={16} />
        Gmail connected
      </div>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-2">
        <Mail size={15} />
        Connect Gmail
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-xl">
            <h2 className="font-semibold mb-1">Connect your Gmail</h2>
            <p className="text-muted text-sm mb-5">
              We use an App Password — your main password is never used.{' '}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                className="text-accent underline inline-flex items-center gap-1"
              >
                Get one here <ExternalLink size={11} />
              </a>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Gmail address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@gmail.com"
                  value={gmailEmail}
                  onChange={e => setGmailEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">App Password (16 characters)</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={appPassword}
                    onChange={e => setAppPassword(e.target.value)}
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-muted"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button className="btn-primary flex-1" onClick={handleConnect} disabled={loading}>
                  {loading ? 'Verifying…' : 'Connect'}
                </button>
                <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
