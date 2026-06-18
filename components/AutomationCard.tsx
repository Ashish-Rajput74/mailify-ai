import Link from 'next/link'
import { Clock, Repeat, Zap, ChevronRight, Pause } from 'lucide-react'

interface Props {
  automation: {
    _id: string
    name: string
    description: string
    parsedJob: { type: string; to: string[]; recurrence?: string; scheduleTime?: string }
    status: string
    createdAt: string
  }
}

const typeConfig = {
  immediate: { icon: Zap, label: 'Immediate', color: 'text-accent bg-accent-light' },
  scheduled: { icon: Clock, label: 'Scheduled', color: 'text-amber-600 bg-amber-50' },
  recurring: { icon: Repeat, label: 'Recurring', color: 'text-success bg-green-50' },
}

export function AutomationCard({ automation }: Props) {
  const cfg = typeConfig[automation.parsedJob.type as keyof typeof typeConfig] || typeConfig.immediate
  const Icon = cfg.icon

  return (
    <Link href={`/dashboard/${automation._id}`}>
      <div className="card flex items-start justify-between gap-4 hover:shadow-sm hover:border-accent hover:border-opacity-40 transition-all group cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
              <Icon size={11} />
              {cfg.label}
            </span>
            {automation.status === 'paused' && (
              <span className="inline-flex items-center gap-1 text-xs text-muted bg-paper px-2 py-0.5 rounded-full border border-border">
                <Pause size={10} /> Paused
              </span>
            )}
          </div>
          <h3 className="font-medium text-sm truncate">{automation.name}</h3>
          {automation.description && (
            <p className="text-muted text-xs mt-0.5 truncate">{automation.description}</p>
          )}
          {automation.parsedJob.to.length > 0 && (
            <p className="text-xs text-muted mt-1 font-mono truncate">
              → {automation.parsedJob.to.join(', ')}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-muted mt-1 group-hover:text-accent transition flex-shrink-0" />
      </div>
    </Link>
  )
}
