import { useState } from 'react'
import { Send, X } from 'lucide-react'
import type { Invitation } from '../../data/types'
import { deleteInvitation, sendInvitationEmail } from '../../services/invitationService'
import { useToast } from '../../hooks/useToast'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import Avatar from '../ui/Avatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import { StatusBadge, timeAgo } from './AdminUI'

export default function InvitationList({ invitations, describe, canManage = true }: { invitations: Invitation[]; describe?: (i: Invitation) => string; canManage?: boolean }) {
  const toast = useToast()
  const [cancelling, setCancelling] = useState<Invitation | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  if (invitations.length === 0) return null

  async function resend(i: Invitation) {
    setSending(i.email)
    const ok = await sendInvitationEmail(i.email)
    setSending(null)
    if (ok) toast.success('მოწვევა ხელახლა გაიგზავნა.')
    else toast.error('ელფოსტა ვერ გაიგზავნა. შეამოწმე, რომ Firebase-ში ჩართულია „Email link“ შესვლა.')
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {invitations.map((i) => (
          <li key={i.email} className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 md:px-5 py-3.5 bg-[#fffaf0]">
            <Avatar name={i.name || i.email} size={38} className="!bg-[#e9d9b0] !text-[#7a5500]" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[14.5px] text-ink truncate">{i.name || i.email}</p>
              <p className="text-[12.5px] text-ink-faint truncate">
                {i.name ? `${i.email} · ` : ''}
                {describe?.(i)}
                {i.createdAt ? ` · მოწვეულია ${timeAgo(i.createdAt)}` : ''}
              </p>
            </div>
            <StatusBadge tone="amber">Pending invitation</StatusBadge>
            {canManage && (
              <div className="flex gap-1 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => resend(i)}
                  disabled={sending === i.email}
                  className="h-9 px-3 rounded-full text-[12.5px] font-semibold text-ink-soft hover:bg-cream-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} /> ხელახლა
                </button>
                <button
                  type="button"
                  onClick={() => setCancelling(i)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta"
                  aria-label="მოწვევის გაუქმება"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="მოწვევის გაუქმება"
        message={
          <>
            <b className="text-ink">{cancelling?.email}</b>-ის მოწვევა გაუქმდება და როლი აღარ მიენიჭება.
          </>
        }
        confirmLabel="გაუქმება"
        onConfirm={async () => {
          if (!cancelling) return
          try {
            await deleteInvitation(cancelling.email)
            toast.success('მოწვევა გაუქმდა.')
          } catch (e) {
            toast.error(getFirebaseErrorMessage(e))
            throw e
          }
        }}
      />
    </>
  )
}
