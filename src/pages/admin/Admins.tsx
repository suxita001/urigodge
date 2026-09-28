import { useState } from 'react'
import { Crown, Lock, Plus, ShieldCheck, ShieldOff } from 'lucide-react'
import type { UserProfile } from '../../data/types'
import { useAuth } from '../../hooks/useAuth'
import { useInvitations, useUsers } from '../../hooks/useAdmin'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { addAdminByEmail, changeUserRole } from '../../services/adminService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { validateEmail } from '../../utils/validation'
import { Card, EmptyState, PageHeader, RoleBadge, SkeletonRows, formatDateTime } from '../../components/admin/AdminUI'
import InvitationList from '../../components/admin/InvitationList'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { TextInput } from '../../components/ui/Inputs'

export default function Admins() {
  useSeo('ადმინები | მართვის პანელი')
  const toast = useToast()
  const { isSuperAdmin } = useAuth()
  const { users, loading } = useUsers()
  const { invitations } = useInvitations()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<UserProfile | null>(null)

  const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').sort((a, b) => Number(b.role === 'super_admin') - Number(a.role === 'super_admin'))
  const pending = invitations.filter((i) => i.status === 'pending' && i.role === 'admin')

  return (
    <div>
      <PageHeader
        title="ადმინები"
        description={isSuperAdmin ? 'ადმინების დანიშვნა და მოხსნა მხოლოდ Super Admin-ს შეუძლია.' : 'ადმინების სიის ნახვა. ცვლილებებს მხოლოდ Super Admin აკეთებს.'}
        actions={
          isSuperAdmin && (
            <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>
              ახალი ადმინის დამატება
            </Button>
          )
        }
      />
      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={3} />
        ) : admins.length === 0 && pending.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="ადმინები ვერ მოიძებნა" />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {admins.map((a) => (
                <li key={a.uid} className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                  <Avatar name={a.name || a.email} size={40} className={a.role === 'super_admin' ? '!bg-ink' : ''} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[14.5px] text-ink truncate flex items-center gap-1.5">
                      {a.name}
                      {a.role === 'super_admin' && <Crown size={14} className="text-[#c99a2e]" />}
                    </p>
                    <p className="text-[12.5px] text-ink-faint truncate">
                      {a.email} · დარეგ. {formatDateTime(a.createdAt).slice(0, 10)}
                    </p>
                  </div>
                  <RoleBadge role={a.role} />
                  {a.role === 'super_admin' ? (
                    <span className="w-9 h-9 flex items-center justify-center text-ink-faint" title="დაცული ანგარიში">
                      <Lock size={15} />
                    </span>
                  ) : (
                    isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setRemoving(a)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta"
                        title="ადმინის მოხსნა"
                        aria-label="ადმინის მოხსნა"
                      >
                        <ShieldOff size={16} />
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
            <InvitationList invitations={pending} describe={() => 'ადმინი'} canManage={isSuperAdmin} />
          </>
        )}
      </Card>

      <AddAdminModal open={adding} onClose={() => setAdding(false)} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="ადმინის მოხსნა"
        message={
          <>
            <b className="text-ink">{removing?.email}</b> დაკარგავს ადმინ პანელზე წვდომას და გახდება ჩვეულებრივი მომხმარებელი.
          </>
        }
        confirmText={removing?.email}
        confirmLabel="ადმინის მოხსნა"
        onConfirm={async () => {
          if (!removing) return
          try {
            await changeUserRole(removing, 'user')
            toast.success('ადმინი მოიხსნა.')
          } catch (e) {
            toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
            throw e
          }
        }}
      />
    </div>
  )
}

function AddAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="ახალი ადმინის დამატება" size="sm">
      {open && <AddAdminForm onClose={onClose} />}
    </Modal>
  )
}

function AddAdminForm({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const error = submitted && validateEmail(email) ? 'შეიყვანე სწორი ელფოსტა.' : undefined

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSubmitted(true)
        if (validateEmail(email)) return
        setSaving(true)
        try {
          const result = await addAdminByEmail(email, profile?.name ?? '')
          if (result === 'already-admin') toast.info('ეს ანგარიში უკვე ადმინია.')
          else if (result === 'promoted') toast.success('ადმინი წარმატებით დაინიშნა.')
          else if (result === 'invited') toast.success('მოწვევა გაიგზავნა ელფოსტაზე.')
          else toast.success('მოწვევა შეიქმნა. როცა ეს ადამიანი ამ ელფოსტით დარეგისტრირდება და მას დაადასტურებს, ადმინი გახდება.')
          onClose()
        } catch (err) {
          toast.error(getFirebaseErrorMessage(err, 'ka', SAVE_FAILED))
        } finally {
          setSaving(false)
        }
      }}
      className="flex flex-col gap-4"
    >
      <TextInput label="Email" type="email" inputMode="email" placeholder="example@gmail.com" value={email} onValueChange={setEmail} error={error} autoFocus />
      <p className="text-[12.5px] text-ink-faint leading-relaxed">
        თუ ანგარიში უკვე არსებობს, ადმინის როლი მაშინვე მიენიჭება. თუ არა — შეიქმნება „Pending invitation“ და როლი გააქტიურდება მხოლოდ მაშინ, როცა ადამიანი ამ ელფოსტით შევა და
        დაადასტურებს, რომ ელფოსტა მას ეკუთვნის.
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          გაუქმება
        </Button>
        <Button type="submit" loading={saving}>
          დამატება
        </Button>
      </div>
    </form>
  )
}
