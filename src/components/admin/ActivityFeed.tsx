import { History, Store, Users, UtensilsCrossed, UserCog, ShieldCheck, LogIn, type LucideIcon } from 'lucide-react'
import type { ActivityLog, LogCategory } from '../../data/types'
import { ACTION_LABELS } from '../../services/activityLogService'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { EmptyState, SkeletonRows, formatDateTime, timeAgo } from './AdminUI'

export const CATEGORY_FILTERS: { value: LogCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'ყველა' },
  { value: 'users', label: 'მომხმარებლები' },
  { value: 'restaurants', label: 'რესტორნები' },
  { value: 'menus', label: 'მენიუები' },
  { value: 'managers', label: 'მენეჯერები' },
  { value: 'admins', label: 'ადმინები' },
  { value: 'auth', label: 'შესვლები' },
]

const categoryIcon: Record<LogCategory, LucideIcon> = {
  users: Users,
  restaurants: Store,
  menus: UtensilsCrossed,
  managers: UserCog,
  admins: ShieldCheck,
  auth: LogIn,
}

const categoryTone: Record<LogCategory, string> = {
  users: 'bg-cream-2 text-ink-soft',
  restaurants: 'bg-green-light text-green',
  menus: 'bg-terracotta-light text-terracotta',
  managers: 'bg-amber-bg text-amber-fg',
  admins: 'bg-ink text-cream',
  auth: 'bg-cream-2 text-ink-faint',
}

export function CategoryChips({ value, onChange, options = CATEGORY_FILTERS }: { value: LogCategory | 'all'; onChange: (v: LogCategory | 'all') => void; options?: typeof CATEGORY_FILTERS }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
      {options.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          className={`h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors ${
            value === f.value ? 'bg-ink text-cream border-ink' : 'bg-white text-ink-soft border-border hover:bg-cream-2'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

interface ActivityFeedProps {
  logs: ActivityLog[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  error?: unknown
  detailed?: boolean
}

export default function ActivityFeed({ logs, loading, loadingMore, hasMore, onLoadMore, error, detailed }: ActivityFeedProps) {
  if (loading) return <SkeletonRows rows={5} />
  if (error && logs.length === 0) {
    return <EmptyState icon={History} title="აქტივობების ჩატვირთვა ვერ მოხერხდა" text="შეამოწმე კავშირი ან სცადე თავიდან." />
  }
  if (logs.length === 0) return <EmptyState icon={History} title="აქტივობები არ მოიძებნა" text="ამ პერიოდში ჩანაწერები არ არის." />

  return (
    <div>
      <ul className="divide-y divide-border">
        {logs.map((log) => {
          const Icon = categoryIcon[log.category] ?? History
          return (
            <li key={log.id} className="flex gap-3.5 px-4 md:px-5 py-3.5">
              <div className="relative shrink-0">
                <Avatar name={log.actorName || log.actorEmail || '?'} size={38} />
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center ${categoryTone[log.category]}`}>
                  <Icon size={11} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-ink leading-snug">
                  <span className="font-bold">{log.actorName || log.actorEmail}</span>{' '}
                  <span className="text-ink-soft">— {log.description}</span>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-faint">
                  <span className="font-semibold text-ink-soft">{ACTION_LABELS[log.action] ?? log.action}</span>
                  {log.targetName && <span>· {log.targetName}</span>}
                  <span title={formatDateTime(log.timestamp)}>· {detailed ? formatDateTime(log.timestamp) : timeAgo(log.timestamp)}</span>
                  {detailed && log.actorEmail && <span className="hidden sm:inline">· {log.actorEmail}</span>}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {hasMore && onLoadMore && (
        <div className="p-4 border-t border-border flex justify-center">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={onLoadMore}>
            მეტის ჩატვირთვა
          </Button>
        </div>
      )}
    </div>
  )
}
