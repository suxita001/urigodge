import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users as UsersIcon, Eye, KeyRound, Ban, History, ShieldCheck, Lock, CircleCheck } from 'lucide-react'
import type { Restaurant, UserProfile, UserRole } from '../../data/types'
import { useAuth } from '../../hooks/useAuth'
import { useManagedRestaurants, useUsers } from '../../hooks/useAdmin'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { changeUserRole, setUserBlocked, updateUserByAdmin, ROLE_LABELS } from '../../services/adminService'
import { assignableRoles, canEditUser, isProtectedAccount } from '../../utils/roles'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, EmptyState, PageHeader, RoleBadge, SkeletonRows, StatusBadge, formatDateTime, timeAgo } from '../../components/admin/AdminUI'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Select, TextInput } from '../../components/ui/Inputs'

export default function Users() {
  useSeo('მომხმარებლები | მართვის პანელი')
  const toast = useToast()
  const { profile: actor } = useAuth()
  const { users, loading } = useUsers()
  const { restaurants } = useManagedRestaurants()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [viewing, setViewing] = useState<UserProfile | null>(null)
  const [roleFor, setRoleFor] = useState<UserProfile | null>(null)
  const [blocking, setBlocking] = useState<UserProfile | null>(null)

  const visible = users.filter((u) => (role === 'all' || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))

  async function toggleBlock(u: UserProfile) {
    const block = u.status !== 'blocked'
    try {
      await setUserBlocked(u, block)
      toast.success(block ? 'მომხმარებელი დაიბლოკა.' : 'მომხმარებელი განიბლოკა.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
      throw e
    }
  }

  return (
    <div>
      <PageHeader title="მომხმარებლები" description={loading ? 'იტვირთება...' : `სულ ${users.length} რეგისტრირებული მომხმარებელი`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ძებნა სახელით ან ელფოსტით"
            className="w-full h-11 rounded-xl border border-border bg-white pl-10 pr-3.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-green/25 focus:border-green"
          />
        </div>
        <Select
          wrapperClassName="sm:w-56"
          value={role}
          onValueChange={(v) => setRole(v as UserRole | 'all')}
          options={[{ value: 'all', label: 'ყველა როლი' }, ...(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))]}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={7} />
        ) : visible.length === 0 ? (
          <EmptyState icon={UsersIcon} title="მომხმარებელი ვერ მოიძებნა" />
        ) : (
          <>
            <div className="hidden xl:block overflow-x-auto"><table className="w-full text-left">
              <thead>
                <tr className="text-[12px] font-bold uppercase tracking-wide text-ink-faint border-b border-border">
                  <th className="px-5 py-3">მომხმარებელი</th>
                  <th className="px-3 py-3">როლი</th>
                  <th className="px-3 py-3">რეგისტრაცია</th>
                  <th className="px-3 py-3">ბოლო აქტივობა</th>
                  <th className="px-3 py-3">სტატუსი</th>
                  <th className="px-5 py-3 text-right">მოქმედებები</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((u) => (
                  <tr key={u.uid} className="hover:bg-cream/60">
                    <td className="px-5 py-3">
                      <UserCell u={u} />
                    </td>
                    <td className="px-3 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-3 text-[13px] text-ink-soft whitespace-nowrap">{formatDateTime(u.createdAt).slice(0, 10)}</td>
                    <td className="px-3 py-3 text-[13px] text-ink-soft whitespace-nowrap">{u.lastActiveAt ? timeAgo(u.lastActiveAt) : '—'}</td>
                    <td className="px-3 py-3">
                      <UserStatus u={u} />
                    </td>
                    <td className="px-5 py-3">
                      <UserActions u={u} actor={actor} onView={() => setViewing(u)} onRole={() => setRoleFor(u)} onBlock={() => setBlocking(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <ul className="xl:hidden divide-y divide-border">
              {visible.map((u) => (
                <li key={u.uid} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <UserCell u={u} />
                    <UserStatus u={u} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-faint">
                    <RoleBadge role={u.role} />
                    <span>რეგ. {formatDateTime(u.createdAt).slice(0, 10)}</span>
                    <span>აქტ. {u.lastActiveAt ? timeAgo(u.lastActiveAt) : '—'}</span>
                  </div>
                  <div className="mt-3">
                    <UserActions u={u} actor={actor} onView={() => setViewing(u)} onRole={() => setRoleFor(u)} onBlock={() => setBlocking(u)} mobile />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ProfileModal user={viewing} actor={actor} restaurants={restaurants} onClose={() => setViewing(null)} />
      <RoleModal user={roleFor} actor={actor} restaurants={restaurants} onClose={() => setRoleFor(null)} />
      <ConfirmDialog
        open={!!blocking}
        onClose={() => setBlocking(null)}
        title={blocking?.status === 'blocked' ? 'მომხმარებლის განბლოკვა' : 'მომხმარებლის დაბლოკვა'}
        danger={blocking?.status !== 'blocked'}
        message={
          blocking?.status === 'blocked' ? (
            <>
              <b className="text-ink">{blocking?.email}</b> კვლავ შეძლებს სისტემაში შესვლას.
            </>
          ) : (
            <>
              <b className="text-ink">{blocking?.email}</b> ავტომატურად გავა სისტემიდან და ვეღარ შეძლებს ფავორიტების, პროფილის ან (თუ მენეჯერია) რესტორნის მართვას.
            </>
          )
        }
        confirmText={blocking?.status === 'blocked' ? undefined : blocking?.email}
        confirmLabel={blocking?.status === 'blocked' ? 'განბლოკვა' : 'დაბლოკვა'}
        onConfirm={() => (blocking ? toggleBlock(blocking) : undefined)}
      />
    </div>
  )
}

function UserCell({ u }: { u: UserProfile }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={u.name || u.email} size={38} />
      <div className="min-w-0">
        <p className="font-bold text-[14.5px] text-ink truncate max-w-[240px] flex items-center gap-1.5">
          {u.name || '—'}
          {isProtectedAccount(u) && <Lock size={12} className="text-ink-faint shrink-0" />}
        </p>
        <p className="text-[12.5px] text-ink-faint truncate max-w-[240px]">{u.email}</p>
      </div>
    </div>
  )
}

function UserStatus({ u }: { u: UserProfile }) {
  return u.status === 'blocked' ? <StatusBadge tone="terracotta">დაბლოკილი</StatusBadge> : <StatusBadge tone="green">აქტიური</StatusBadge>
}

function UserActions({ u, actor, onView, onRole, onBlock, mobile }: { u: UserProfile; actor: UserProfile | null; onView: () => void; onRole: () => void; onBlock: () => void; mobile?: boolean }) {
  const editable = !!actor && canEditUser(actor, u) && u.uid !== actor.uid
  const lockedTitle = isProtectedAccount(u) ? 'დაცული ანგარიში' : 'ამ მომხმარებლის მართვის უფლება არ გაქვს'
  const cls = mobile
    ? 'h-10 rounded-xl border border-border bg-white text-[12.5px] font-semibold text-ink-soft flex items-center justify-center gap-1.5 hover:bg-cream-2 disabled:opacity-40'
    : 'w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 hover:text-ink transition-colors disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className={mobile ? 'grid grid-cols-4 gap-2' : 'flex items-center justify-end gap-0.5'}>
      <button type="button" className={cls} onClick={onView} title="პროფილის ნახვა" aria-label="პროფილის ნახვა">
        <Eye size={16} />
        {mobile && 'პროფილი'}
      </button>
      <button type="button" className={cls} onClick={onRole} disabled={!editable} title={editable ? 'როლის შეცვლა' : lockedTitle} aria-label="როლის შეცვლა">
        <KeyRound size={16} />
        {mobile && 'როლი'}
      </button>
      <button type="button" className={cls} onClick={onBlock} disabled={!editable} title={editable ? (u.status === 'blocked' ? 'განბლოკვა' : 'დაბლოკვა') : lockedTitle} aria-label="დაბლოკვა">
        {u.status === 'blocked' ? <CircleCheck size={16} /> : <Ban size={16} />}
        {mobile && (u.status === 'blocked' ? 'განბლოკვა' : 'ბლოკი')}
      </button>
      <Link to={`/admin/logs?actor=${u.uid}`} className={cls} title="აქტივობის ნახვა" aria-label="აქტივობის ნახვა">
        <History size={16} />
        {mobile && 'აქტივობა'}
      </Link>
    </div>
  )
}

function ProfileModal({ user, actor, restaurants, onClose }: { user: UserProfile | null; actor: UserProfile | null; restaurants: Restaurant[]; onClose: () => void }) {
  return (
    <Modal open={!!user} onClose={onClose} title="მომხმარებლის პროფილი" size="sm">
      {user && <ProfileBody key={user.uid} user={user} actor={actor} restaurants={restaurants} onClose={onClose} />}
    </Modal>
  )
}

function ProfileBody({ user, actor, restaurants, onClose }: { user: UserProfile; actor: UserProfile | null; restaurants: Restaurant[]; onClose: () => void }) {
  const toast = useToast()
  const editable = !!actor && canEditUser(actor, user) && actor.uid !== user.uid
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [saving, setSaving] = useState(false)
  const managed = restaurants.filter((r) => user.managedRestaurantIds.includes(r.id))

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateUserByAdmin(user, { name: name.trim(), phone: phone.trim() })
      toast.success('პროფილი განახლდა.')
      onClose()
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={user.name || user.email} size={56} />
        <div className="min-w-0">
          <p className="font-extrabold text-[17px] text-ink truncate">{user.name}</p>
          <p className="text-[13px] text-ink-faint truncate">{user.email}</p>
          <div className="mt-1.5 flex gap-1.5">
            <RoleBadge role={user.role} />
            <UserStatus u={user} />
          </div>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-xl bg-white border border-border p-3">
          <dt className="text-ink-faint font-semibold">რეგისტრაცია</dt>
          <dd className="mt-0.5 font-bold text-ink">{formatDateTime(user.createdAt)}</dd>
        </div>
        <div className="rounded-xl bg-white border border-border p-3">
          <dt className="text-ink-faint font-semibold">ბოლო აქტივობა</dt>
          <dd className="mt-0.5 font-bold text-ink">{formatDateTime(user.lastActiveAt)}</dd>
        </div>
      </dl>
      {user.role === 'restaurant_manager' && (
        <div className="mt-3 rounded-xl bg-white border border-border p-3 text-[13px]">
          <p className="text-ink-faint font-semibold">მართავს</p>
          <p className="mt-0.5 font-bold text-ink">{managed.map((r) => r.nameI18n.ka || r.name).join(', ') || '—'}</p>
        </div>
      )}
      <div className="mt-5 flex flex-col gap-4">
        <TextInput label="სახელი" value={name} onValueChange={setName} disabled={!editable} />
        <TextInput label="ტელეფონი" type="tel" value={phone} onValueChange={setPhone} disabled={!editable} />
        <p className="text-[12px] text-ink-faint">პაროლები ინახება მხოლოდ Firebase Authentication-ში და არასდროს ჩანს პანელში.</p>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          დახურვა
        </Button>
        {editable && (
          <Button onClick={save} loading={saving} disabled={!name.trim()}>
            შენახვა
          </Button>
        )}
      </div>
    </div>
  )
}

function RoleModal({ user, actor, restaurants, onClose }: { user: UserProfile | null; actor: UserProfile | null; restaurants: Restaurant[]; onClose: () => void }) {
  return (
    <Modal open={!!user} onClose={onClose} title="როლის შეცვლა" description={user?.email} size="sm">
      {user && <RoleBody key={user.uid} user={user} actor={actor} restaurants={restaurants} onClose={onClose} />}
    </Modal>
  )
}

function RoleBody({ user, actor, restaurants, onClose }: { user: UserProfile; actor: UserProfile | null; restaurants: Restaurant[]; onClose: () => void }) {
  const toast = useToast()
  const roles = assignableRoles(actor)
  const [role, setRole] = useState<UserRole>(roles.includes(user.role) ? user.role : 'user')
  const [ids, setIds] = useState<string[]>(user.managedRestaurantIds)
  const [saving, setSaving] = useState(false)
  const needsRestaurant = role === 'restaurant_manager' && ids.length === 0

  async function save() {
    setSaving(true)
    try {
      await changeUserRole(user, role, ids)
      toast.success(role === 'admin' ? 'ადმინი დაინიშნა.' : 'როლი შეიცვალა.')
      onClose()
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {roles.map((r) => (
          <label key={r} className={`flex items-center gap-3 px-4 h-12 rounded-xl border cursor-pointer transition-colors ${role === r ? 'border-green bg-green-light/60' : 'border-border bg-white hover:bg-cream-2'}`}>
            <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="accent-green w-4 h-4" />
            <span className="font-semibold text-[14px] text-ink">{ROLE_LABELS[r]}</span>
            {r === 'admin' && <ShieldCheck size={15} className="text-green ml-auto" />}
          </label>
        ))}
      </div>
      {role === 'restaurant_manager' && (
        <Select
          label="რესტორანი"
          value={ids[0] ?? ''}
          onValueChange={(v) => setIds(v ? [v] : [])}
          options={[{ value: '', label: 'აირჩიე რესტორანი' }, ...restaurants.map((r) => ({ value: r.id, label: r.nameI18n.ka || r.name }))]}
          hint={ids.length > 1 ? `ამჟამად მართავს ${ids.length} რესტორანს — დეტალური მართვა „მენეჯერების“ გვერდზეა.` : undefined}
        />
      )}
      {actor?.role !== 'super_admin' && <p className="text-[12.5px] text-ink-faint">ადმინის დანიშვნა მხოლოდ Super Admin-ს შეუძლია.</p>}
      <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          გაუქმება
        </Button>
        <Button onClick={save} loading={saving} disabled={role === user.role && JSON.stringify(ids) === JSON.stringify(user.managedRestaurantIds) || needsRestaurant}>
          შენახვა
        </Button>
      </div>
    </div>
  )
}
