import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Store, UserCog, ShieldCheck, History, Pencil, UtensilsCrossed, GitBranch, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAdminStats, useManagedRestaurants } from '../../hooks/useAdmin'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { useSeo } from '../../hooks/useSeo'
import { RECENT_WINDOW_MS } from '../../services/adminService'
import { menuStats } from '../../services/menuService'
import type { LogCategory, Restaurant } from '../../data/types'
import ActivityFeed, { CategoryChips } from '../../components/admin/ActivityFeed'
import { Card, EmptyState, PageHeader, StatCard, StatusBadge } from '../../components/admin/AdminUI'
import { Select } from '../../components/ui/Inputs'

function useRecentSince() {
  const [since] = useState(() => new Date(Date.now() - RECENT_WINDOW_MS))
  return since
}

export default function Overview() {
  const { isAdmin } = useAuth()
  useSeo('მართვის პანელი | urigod.ge')
  return isAdmin ? <AdminOverview /> : <ManagerOverview />
}

function AdminOverview() {
  const { profile } = useAuth()
  const stats = useAdminStats()
  const since = useRecentSince()
  const [category, setCategory] = useState<LogCategory | 'all'>('all')
  const feed = useActivityLogs({ since, category: category === 'all' ? undefined : category }, { pageSize: 15 })

  return (
    <div>
      <PageHeader
        title={`გამარჯობა, ${profile?.name.split(' ')[0] ?? ''} 👋`}
        description="urigod.ge-ის მიმოხილვა და ბოლო აქტივობები."
        actions={
          <Link to="/admin/restaurants/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-green text-cream font-bold text-[14px] hover:bg-green-dark shadow-card">
            <Plus size={16} /> რესტორნის დამატება
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <StatCard index={0} icon={Users} label="მომხმარებლები" value={stats?.users ?? null} tone="ink" />
        <StatCard index={1} icon={Store} label="რესტორნები" value={stats?.restaurants ?? null} />
        <StatCard index={2} icon={UserCog} label="მენეჯერები" value={stats?.managers ?? null} tone="terracotta" />
        <StatCard index={3} icon={ShieldCheck} label="ადმინები" value={stats?.admins ?? null} tone="ink" />
        <StatCard index={4} icon={History} label="აქტივობები (72 სთ)" value={stats?.recentActivities ?? null} />
      </div>

      <Card className="mt-6 md:mt-8 overflow-hidden">
        <div className="px-4 md:px-5 pt-5 pb-3 flex flex-col gap-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold text-ink">ბოლო 3 დღის აქტივობები</h2>
            <Link to="/admin/logs" className="text-[13px] font-bold text-green inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              ყველა <ArrowRight size={14} />
            </Link>
          </div>
          <CategoryChips value={category} onChange={setCategory} />
        </div>
        <ActivityFeed {...feed} onLoadMore={feed.loadMore} />
      </Card>
    </div>
  )
}

function ManagedRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const stats = menuStats(restaurant.menu)
  const base = `/admin/restaurants/${restaurant.id}`
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 md:h-52 bg-cream-2">
        {restaurant.coverImage && <img src={restaurant.coverImage} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 flex items-end gap-3">
          {restaurant.logo && <img src={restaurant.logo} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white shrink-0" />}
          <div className="min-w-0">
            <h2 className="text-[22px] md:text-[26px] font-extrabold text-snow tracking-tight truncate">{restaurant.nameI18n.ka || restaurant.name}</h2>
            <StatusBadge tone={restaurant.status === 'published' ? 'green' : 'neutral'}>{restaurant.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}</StatusBadge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: 'მენიუს კატეგორიები', value: stats.categories },
          { label: 'მენიუს პროდუქტები', value: stats.items },
          { label: 'ფილიალები', value: restaurant.branches.length },
        ].map((s) => (
          <div key={s.label} className="px-3 md:px-5 py-4">
            <p className="text-[22px] md:text-[26px] font-extrabold text-ink leading-none">{s.value}</p>
            <p className="mt-1.5 text-[12px] md:text-[13px] font-semibold text-ink-faint">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Link to={`${base}?tab=info`} className="h-11 rounded-full bg-green text-cream font-bold text-[14px] hover:bg-green-dark flex items-center justify-center gap-2">
          <Pencil size={15} /> რესტორნის რედაქტირება
        </Link>
        <Link to={`${base}?tab=menu`} className="h-11 rounded-full border border-border bg-white text-ink font-bold text-[14px] hover:bg-cream-2 flex items-center justify-center gap-2">
          <UtensilsCrossed size={15} /> მენიუს მართვა
        </Link>
        <Link to={`${base}?tab=branches`} className="h-11 rounded-full border border-border bg-white text-ink font-bold text-[14px] hover:bg-cream-2 flex items-center justify-center gap-2">
          <GitBranch size={15} /> ფილიალები
        </Link>
      </div>
    </Card>
  )
}

function ManagerOverview() {
  const { restaurants, loading } = useManagedRestaurants()
  const since = useRecentSince()
  const [selected, setSelected] = useState<string | null>(null)
  const restaurantId = selected ?? restaurants[0]?.id
  const feed = useActivityLogs({ since, restaurantId }, { pageSize: 15, enabled: !!restaurantId })

  return (
    <div>
      <PageHeader title="ჩემი რესტორანი" description="მართე შენი რესტორნის ინფორმაცია, მენიუ და ფილიალები." />
      {loading ? (
        <Card className="h-80 animate-pulse" />
      ) : restaurants.length === 0 ? (
        <Card>
          <EmptyState icon={Store} title="რესტორანი ჯერ არ არის მინიჭებული" text="დაუკავშირდი urigod.ge-ის ადმინისტრაციას, რომ მოგანიჭონ რესტორანი." />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {restaurants.map((r) => (
            <ManagedRestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}

      {restaurants.length > 0 && (
        <Card className="mt-6 md:mt-8 overflow-hidden">
          <div className="px-4 md:px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <h2 className="text-[17px] font-extrabold text-ink">ბოლო 3 დღის აქტივობები</h2>
            {restaurants.length > 1 && (
              <Select wrapperClassName="w-full sm:w-64" value={restaurantId ?? ''} onValueChange={setSelected} options={restaurants.map((r) => ({ value: r.id, label: r.nameI18n.ka || r.name }))} />
            )}
          </div>
          <ActivityFeed {...feed} onLoadMore={feed.loadMore} />
        </Card>
      )}
    </div>
  )
}
