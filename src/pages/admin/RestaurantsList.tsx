import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, UtensilsCrossed, GitBranch, UserCog, Trash2, Plus, Search, Store, MapPin } from 'lucide-react'
import type { Restaurant } from '../../data/types'
import { useManagedRestaurants, useInvitations, useUsers } from '../../hooks/useAdmin'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { deleteRestaurant } from '../../services/restaurantService'
import { deleteImageByUrl } from '../../services/storageService'
import { categoryMap, cuisineMap, neighborhoodMap } from '../../data/categories'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, EmptyState, PageHeader, SkeletonRows, StatusBadge, formatDateTime } from '../../components/admin/AdminUI'
import AssignManagerModal from '../../components/admin/AssignManagerModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Select } from '../../components/ui/Inputs'

type StatusFilter = 'all' | 'published' | 'draft'

export default function RestaurantsList() {
  useSeo('რესტორნები | მართვის პანელი')
  const toast = useToast()
  const { restaurants, loading } = useManagedRestaurants()
  const { users } = useUsers()
  const { invitations } = useInvitations()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [assignFor, setAssignFor] = useState<Restaurant | null>(null)
  const [deleting, setDeleting] = useState<Restaurant | null>(null)

  const managersByRestaurant = useMemo(() => {
    const map = new Map<string, { label: string; pending: boolean }[]>()
    const add = (id: string, entry: { label: string; pending: boolean }) => map.set(id, [...(map.get(id) ?? []), entry])
    users.filter((u) => u.role === 'restaurant_manager').forEach((u) => u.managedRestaurantIds.forEach((id) => add(id, { label: u.name || u.email, pending: false })))
    invitations
      .filter((i) => i.status === 'pending' && i.role === 'restaurant_manager')
      .forEach((i) => i.restaurantIds.forEach((id) => add(id, { label: i.name || i.email, pending: true })))
    return map
  }, [users, invitations])

  const visible = restaurants.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    const hay = `${r.nameI18n.ka} ${r.nameI18n.en} ${r.slug} ${r.address.ka}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  async function handleDelete(r: Restaurant) {
    try {
      await deleteRestaurant(r)
      toast.success('რესტორანი წაიშალა.')
      const urls = [r.coverImage, r.logo, ...r.images, ...r.menu.flatMap((c) => c.items.map((i) => i.image))].filter((u): u is string => !!u)
      Promise.all(Array.from(new Set(urls)).map(deleteImageByUrl)).catch(() => {})
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
      throw e
    }
  }

  return (
    <div>
      <PageHeader
        title="რესტორნები"
        description={loading ? 'იტვირთება...' : `სულ ${restaurants.length} რესტორანი`}
        actions={
          <Link to="/admin/restaurants/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-green text-cream font-bold text-[14px] hover:bg-green-dark shadow-card">
            <Plus size={16} /> რესტორნის დამატება
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ძებნა სახელით, slug-ით ან მისამართით"
            className="w-full h-11 rounded-xl border border-border bg-white pl-10 pr-3.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-green/25 focus:border-green"
          />
        </div>
        <Select
          wrapperClassName="sm:w-52"
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: 'all', label: 'ყველა სტატუსი' },
            { value: 'published', label: 'გამოქვეყნებული' },
            { value: 'draft', label: 'დრაფტი' },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Store}
            title={restaurants.length ? 'ვერაფერი მოიძებნა' : 'რესტორნები ჯერ არ არის'}
            text={restaurants.length ? 'სცადე სხვა საძიებო სიტყვა.' : 'დაამატე პირველი რესტორანი ან გადადი პარამეტრებში დემო მონაცემების იმპორტისთვის.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[12px] font-bold uppercase tracking-wide text-ink-faint border-b border-border">
                    <th className="pl-5 pr-3 py-3">რესტორანი</th>
                    <th className="px-3 py-3">კატეგორია</th>
                    <th className="px-3 py-3">სტატუსი</th>
                    <th className="px-3 py-3">მენეჯერი</th>
                    <th className="px-3 py-3">განახლდა</th>
                    <th className="pl-3 pr-4 py-3 text-right">მოქმედებები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((r) => (
                    <tr key={r.id} className="hover:bg-cream/60">
                      <td className="pl-5 pr-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Thumb r={r} />
                          <div className="min-w-0">
                            <p className="font-bold text-[14.5px] text-ink truncate max-w-[200px]">{r.nameI18n.ka || r.name}</p>
                            <p className="text-[12px] text-ink-faint truncate max-w-[200px] flex items-center gap-1">
                              <MapPin size={11} className="shrink-0" />
                              {neighborhoodMap[r.neighborhood]?.label.ka} · /{r.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-ink-soft">
                        <p className="font-semibold text-ink">{categoryMap[r.category]?.label.ka}</p>
                        <p className="text-ink-faint truncate max-w-[120px]">{r.cuisine.map((c) => cuisineMap[c]?.label.ka).join(', ')}</p>
                      </td>
                      <td className="px-3 py-3">
                        <RestaurantStatus r={r} />
                      </td>
                      <td className="px-3 py-3 max-w-[170px]">
                        <Managers list={managersByRestaurant.get(r.id)} />
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-ink-faint whitespace-nowrap">{formatDateTime(r.updatedAt ?? null).slice(0, 10)}</td>
                      <td className="pl-3 pr-4 py-3">
                        <Actions r={r} onManager={() => setAssignFor(r)} onDelete={() => setDeleting(r)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <ul className="xl:hidden divide-y divide-border">
              {visible.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex gap-3">
                    <Thumb r={r} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[15.5px] text-ink leading-snug">{r.nameI18n.ka || r.name}</p>
                        <RestaurantStatus r={r} />
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-ink-faint">
                        {categoryMap[r.category]?.label.ka} · {r.cuisine.map((c) => cuisineMap[c]?.label.ka).join(', ')}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-faint">
                        <MapPin size={12} /> {neighborhoodMap[r.neighborhood]?.label.ka}
                      </p>
                      <div className="mt-1.5">
                        <Managers list={managersByRestaurant.get(r.id)} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Actions r={r} onManager={() => setAssignFor(r)} onDelete={() => setDeleting(r)} mobile />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <AssignManagerModal open={!!assignFor} onClose={() => setAssignFor(null)} restaurants={restaurants} initialRestaurantIds={assignFor ? [assignFor.id] : []} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="რესტორნის წაშლა"
        message={
          <>
            „ნამდვილად გსურთ რესტორნის წაშლა?“ <b className="text-ink">{deleting?.nameI18n.ka || deleting?.name}</b> სამუდამოდ წაიშლება მენიუსა და ფილიალებთან ერთად. ამ მოქმედების გაუქმება შეუძლებელია.
          </>
        }
        confirmText={deleting?.nameI18n.ka || deleting?.name}
        confirmLabel="სამუდამოდ წაშლა"
        onConfirm={() => (deleting ? handleDelete(deleting) : undefined)}
      />
    </div>
  )
}

function Thumb({ r, size = 'md' }: { r: Restaurant; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16 rounded-xl' : 'w-11 h-11 rounded-lg'
  return r.coverImage ? <img src={r.coverImage} alt="" loading="lazy" className={`${cls} object-cover shrink-0`} /> : <span className={`${cls} bg-cream-2 shrink-0`} />
}

function RestaurantStatus({ r }: { r: Restaurant }) {
  return <StatusBadge tone={r.status === 'published' ? 'green' : 'neutral'}>{r.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}</StatusBadge>
}

function Managers({ list }: { list?: { label: string; pending: boolean }[] }) {
  if (!list?.length) return <span className="text-[12.5px] text-ink-faint">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((m) => (
        <StatusBadge key={m.label} tone={m.pending ? 'amber' : 'neutral'}>
          {m.label}
          {m.pending && ' · მოწვეული'}
        </StatusBadge>
      ))}
    </div>
  )
}

function Actions({ r, onManager, onDelete, mobile }: { r: Restaurant; onManager: () => void; onDelete: () => void; mobile?: boolean }) {
  const base = `/admin/restaurants/${r.id}`
  const items = [
    { to: `/restaurants/${r.slug}`, icon: Eye, label: 'ნახვა', short: 'ნახვა', external: true },
    { to: `${base}?tab=info`, icon: Pencil, label: 'რედაქტირება', short: 'რედაქტ.' },
    { to: `${base}?tab=menu`, icon: UtensilsCrossed, label: 'მენიუს მართვა', short: 'მენიუ' },
    { to: `${base}?tab=branches`, icon: GitBranch, label: 'ფილიალები', short: 'ფილიალები' },
  ]
  const cls = mobile
    ? 'h-10 px-1 rounded-xl border border-border bg-white text-[12px] font-semibold text-ink-soft flex items-center justify-center gap-1.5 hover:bg-cream-2 whitespace-nowrap overflow-hidden'
    : 'w-8 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 hover:text-ink transition-colors'
  return (
    <div className={mobile ? 'grid grid-cols-3 gap-2' : 'flex items-center justify-end'}>
      {items.map((a) => (
        <Link key={a.label} to={a.to} target={a.external ? '_blank' : undefined} className={cls} title={a.label} aria-label={a.label}>
          <a.icon size={15} className="shrink-0" />
          {mobile && a.short}
        </Link>
      ))}
      <button type="button" onClick={onManager} className={cls} title="მენეჯერი" aria-label="მენეჯერი">
        <UserCog size={16} />
        {mobile && 'მენეჯერი'}
      </button>
      <button type="button" onClick={onDelete} className={`${cls} hover:!bg-terracotta-light hover:!text-terracotta`} title="წაშლა" aria-label="წაშლა">
        <Trash2 size={16} />
        {mobile && 'წაშლა'}
      </button>
    </div>
  )
}
