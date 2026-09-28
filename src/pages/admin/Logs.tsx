import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import type { ActivityAction, LogCategory } from '../../data/types'
import { useAuth } from '../../hooks/useAuth'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { useManagedRestaurants, useUsers } from '../../hooks/useAdmin'
import { useSeo } from '../../hooks/useSeo'
import { ACTION_CATEGORY, ACTION_LABELS } from '../../services/activityLogService'
import ActivityFeed, { CATEGORY_FILTERS, CategoryChips } from '../../components/admin/ActivityFeed'
import { Card, PageHeader } from '../../components/admin/AdminUI'
import { Select, TextInput } from '../../components/ui/Inputs'

function dayStart(value: string): Date | undefined {
  return value ? new Date(`${value}T00:00:00`) : undefined
}
function dayEnd(value: string): Date | undefined {
  return value ? new Date(`${value}T23:59:59.999`) : undefined
}

export default function Logs() {
  useSeo('აქტივობები | მართვის პანელი')
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const { restaurants } = useManagedRestaurants()
  const { users } = useUsers()

  const [category, setCategory] = useState<LogCategory | 'all'>('all')
  const [action, setAction] = useState<ActivityAction | ''>('')
  const [restaurantId, setRestaurantId] = useState(params.get('restaurant') ?? '')
  const actorUid = params.get('actor') ?? ''
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [text, setText] = useState('')

  // Managers may only query their own restaurants' logs (enforced by rules), so a restaurant is required.
  const effectiveRestaurant = isAdmin ? restaurantId : restaurantId || restaurants[0]?.id || ''
  const filters = useMemo(
    () => ({
      category: category === 'all' ? undefined : category,
      action: action || undefined,
      restaurantId: effectiveRestaurant || undefined,
      actorUid: isAdmin ? actorUid || undefined : undefined,
      since: dayStart(from),
      until: dayEnd(to),
    }),
    [category, action, effectiveRestaurant, actorUid, from, to, isAdmin]
  )
  const feed = useActivityLogs(filters, { pageSize: 25, enabled: isAdmin || !!effectiveRestaurant })

  const shown = text.trim()
    ? feed.logs.filter((l) => `${l.description} ${l.targetName ?? ''} ${l.actorName} ${l.actorEmail}`.toLowerCase().includes(text.trim().toLowerCase()))
    : feed.logs

  const actionOptions = (Object.keys(ACTION_LABELS) as ActivityAction[])
    .filter((a) => category === 'all' || ACTION_CATEGORY[a] === category)
    .map((a) => ({ value: a, label: ACTION_LABELS[a] }))
  const actor = users.find((u) => u.uid === actorUid)

  return (
    <div>
      <PageHeader title={isAdmin ? 'აქტივობების ჟურნალი' : 'აქტივობა'} description={isAdmin ? 'ყველა ადმინისტრაციული მოქმედება, უახლესი პირველი.' : 'შენი რესტორნის ცვლილებების ისტორია.'} />

      <Card className="p-4 md:p-5 mb-4 flex flex-col gap-4">
        <CategoryChips
          value={category}
          onChange={(c) => {
            setCategory(c)
            setAction('')
          }}
          options={isAdmin ? CATEGORY_FILTERS : CATEGORY_FILTERS.filter((c) => ['all', 'restaurants', 'menus', 'managers'].includes(c.value))}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TextInput label="თარიღიდან" type="date" value={from} onValueChange={setFrom} />
          <TextInput label="თარიღამდე" type="date" value={to} onValueChange={setTo} />
          <Select label="მოქმედება" value={action} onValueChange={(v) => setAction(v as ActivityAction | '')} options={[{ value: '', label: 'ყველა მოქმედება' }, ...actionOptions]} />
          <Select
            label="რესტორანი"
            value={effectiveRestaurant}
            onValueChange={setRestaurantId}
            options={[...(isAdmin ? [{ value: '', label: 'ყველა რესტორანი' }] : []), ...restaurants.map((r) => ({ value: r.id, label: r.nameI18n.ka || r.name }))]}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ძებნა აღწერაში, სამიზნეში ან შემსრულებელში"
              className="w-full h-11 rounded-xl border border-border bg-white pl-10 pr-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-green/25 focus:border-green"
            />
          </div>
          {isAdmin && (
            <Select
              wrapperClassName="sm:w-64"
              value={actorUid}
              onValueChange={(v) => {
                const next = new URLSearchParams(params)
                if (v) next.set('actor', v)
                else next.delete('actor')
                setParams(next, { replace: true })
              }}
              options={[{ value: '', label: 'ყველა შემსრულებელი' }, ...users.map((u) => ({ value: u.uid, label: u.name || u.email }))]}
            />
          )}
        </div>
        {actor && (
          <div className="flex items-center gap-2 text-[13px] text-ink-soft">
            ნაჩვენებია <b className="text-ink">{actor.name || actor.email}</b>-ის აქტივობა
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('actor')
                setParams(next, { replace: true })
              }}
              className="w-7 h-7 rounded-full hover:bg-cream-2 flex items-center justify-center"
              aria-label="ფილტრის მოხსნა"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <ActivityFeed logs={shown} loading={feed.loading} loadingMore={feed.loadingMore} hasMore={feed.hasMore} onLoadMore={feed.loadMore} error={feed.error} detailed />
      </Card>
    </div>
  )
}
