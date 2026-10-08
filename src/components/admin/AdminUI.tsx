import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Crown } from 'lucide-react'
import type { UserRole } from '../../data/types'
import { ROLE_LABELS } from '../../services/adminService'

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[14.5px] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-border shadow-card ${className}`}>{children}</div>
}

export function StatCard({ icon: Icon, label, value, tone = 'green', index = 0 }: { icon: LucideIcon; label: string; value: number | string | null; tone?: 'green' | 'terracotta' | 'ink'; index?: number }) {
  const tones = {
    green: 'bg-green-light text-green',
    terracotta: 'bg-terracotta-light text-terracotta',
    ink: 'bg-cream-2 text-ink',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.05 }}>
      <Card className="p-4 md:p-5 h-full">
        <div className="flex items-center justify-between gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
            <Icon size={19} />
          </span>
        </div>
        <p className="mt-4 text-[26px] md:text-[30px] font-extrabold text-ink tracking-tight leading-none">
          {value ?? <span className="inline-block w-12 h-7 rounded-lg bg-cream-2 animate-pulse align-middle" />}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-ink-faint">{label}</p>
      </Card>
    </motion.div>
  )
}

const roleStyles: Record<UserRole, string> = {
  user: 'bg-cream-2 text-ink-soft',
  restaurant_manager: 'bg-terracotta-light text-terracotta',
  admin: 'bg-green-light text-green',
  super_admin: 'bg-ink text-cream',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap ${roleStyles[role]}`}>
      {role === 'super_admin' && <Crown size={12} />}
      {ROLE_LABELS[role]}
    </span>
  )
}

export function StatusBadge({ tone, children }: { tone: 'green' | 'terracotta' | 'neutral' | 'amber'; children: ReactNode }) {
  const tones = {
    green: 'bg-green-light text-green',
    terracotta: 'bg-terracotta-light text-terracotta',
    neutral: 'bg-cream-2 text-ink-soft',
    amber: 'bg-amber-bg text-amber-fg',
  }
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <span className="w-14 h-14 rounded-2xl bg-cream-2 text-ink-faint flex items-center justify-center mb-4">
        <Icon size={24} />
      </span>
      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      {text && <p className="mt-1.5 text-[14px] text-ink-soft max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-cream-2 shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 w-1/3 rounded-full bg-cream-2" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-cream-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function timeAgo(date: Date | null): string {
  if (!date) return 'ახლახან'
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (s < 45) return 'ახლახან'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} წუთის წინ`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} საათის წინ`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} დღის წინ`
  return date.toLocaleDateString('en-GB')
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
