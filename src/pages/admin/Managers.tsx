import { useState } from 'react'
import { Check, Plus, Settings2, UserCog, UserMinus } from 'lucide-react'
import type { Restaurant, UserProfile } from '../../data/types'
import { useInvitations, useManagedRestaurants, useUsers } from '../../hooks/useAdmin'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { removeManager, setManagerRestaurants } from '../../services/managerService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, EmptyState, PageHeader, SkeletonRows, StatusBadge, timeAgo } from '../../components/admin/AdminUI'
import AssignManagerModal from '../../components/admin/AssignManagerModal'
import InvitationList from '../../components/admin/InvitationList'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Managers() {
  useSeo('რესტორნის მენეჯერები | მართვის პანელი')
  const toast = useToast()
  const { users, loading } = useUsers()
  const { invitations } = useInvitations()
  const { restaurants } = useManagedRestaurants()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<UserProfile | null>(null)
  const [removing, setRemoving] = useState<UserProfile | null>(null)

  const managers = users.filter((u) => u.role === 'restaurant_manager')
  const pending = invitations.filter((i) => i.status === 'pending' && i.role === 'restaurant_manager')
  const nameOf = (id: string) => restaurants.find((r) => r.id === id)?.nameI18n.ka || id

  return (
    <div>
      <PageHeader
        title="რესტორნის მენეჯერები"
        description="მენეჯერი ხედავს და არედაქტირებს მხოლოდ მისთვის მინიჭებულ რესტორნებს."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>
            მენეჯერის დამატება
          </Button>
        }
      />
      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={4} />
        ) : managers.length === 0 && pending.length === 0 ? (
          <EmptyState icon={UserCog} title="მენეჯერები ჯერ არ არის" text="დაამატე მენეჯერი ელფოსტით — პაროლის მითითება არ არის საჭირო." />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {managers.map((m) => (
                <li key={m.uid} className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 md:px-5 py-3.5">
                  <Avatar name={m.name || m.email} size={40} />
                  <div className="min-w-0 flex-1 basis-[60%]">
                    <p className="font-bold text-[14.5px] text-ink truncate">
                      {m.name} {m.status === 'blocked' && <StatusBadge tone="terracotta">დაბლოკილი</StatusBadge>}
                    </p>
                    <p className="text-[12.5px] text-ink-faint truncate">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ''} · აქტ. {m.lastActiveAt ? timeAgo(m.lastActiveAt) : '—'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.managedRestaurantIds.map((id) => (
                        <StatusBadge key={id} tone="green">
                          {nameOf(id)}
                        </StatusBadge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="sm" icon={<Settings2 size={15} />} onClick={() => setEditing(m)}>
                      რესტორნები
                    </Button>
                    <button
                      type="button"
                      onClick={() => setRemoving(m)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta"
                      aria-label="მენეჯერის მოხსნა"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <InvitationList invitations={pending} describe={(i) => i.restaurantIds.map(nameOf).join(', ')} />
          </>
        )}
      </Card>

      <AssignManagerModal open={adding} onClose={() => setAdding(false)} restaurants={restaurants} />
      <AssignmentModal manager={editing} restaurants={restaurants} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="მენეჯერის მოხსნა"
        message={
          <>
            <b className="text-ink">{removing?.email}</b> დაკარგავს წვდომას ყველა მინიჭებულ რესტორანზე და გახდება ჩვეულებრივი მომხმარებელი.
          </>
        }
        confirmText={removing?.email}
        confirmLabel="მოხსნა"
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeManager(removing)
            toast.success('მენეჯერი მოიხსნა.')
          } catch (e) {
            toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
            throw e
          }
        }}
      />
    </div>
  )
}

function AssignmentModal({ manager, restaurants, onClose }: { manager: UserProfile | null; restaurants: Restaurant[]; onClose: () => void }) {
  return (
    <Modal open={!!manager} onClose={onClose} title="მინიჭებული რესტორნები" description={manager?.email} size="sm">
      {manager && <AssignmentBody key={manager.uid} manager={manager} restaurants={restaurants} onClose={onClose} />}
    </Modal>
  )
}

function AssignmentBody({ manager, restaurants, onClose }: { manager: UserProfile; restaurants: Restaurant[]; onClose: () => void }) {
  const toast = useToast()
  const [ids, setIds] = useState(manager.managedRestaurantIds)
  const [saving, setSaving] = useState(false)
  return (
    <div>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-white divide-y divide-border">
        {restaurants.map((r) => {
          const on = ids.includes(r.id)
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setIds((cur) => (on ? cur.filter((x) => x !== r.id) : [...cur, r.id]))}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-cream-2"
            >
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-green border-green text-cream' : 'border-border'}`}>
                {on && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="text-[14px] font-semibold text-ink truncate">{r.nameI18n.ka || r.name}</span>
            </button>
          )
        })}
      </div>
      {ids.length === 0 && <p className="mt-2 text-[12.5px] text-terracotta font-medium">ყველა რესტორნის მოხსნისას მენეჯერი ჩვეულებრივ მომხმარებლად გადაიქცევა.</p>}
      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          გაუქმება
        </Button>
        <Button
          loading={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await setManagerRestaurants(manager, ids)
              toast.success('მინიჭებები განახლდა.')
              onClose()
            } catch (e) {
              toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
            } finally {
              setSaving(false)
            }
          }}
        >
          შენახვა
        </Button>
      </div>
    </div>
  )
}
