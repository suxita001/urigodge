import { useState } from 'react'
import { EyeOff, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { setMaintenance, useSiteStatus } from '../../services/siteStatusService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, StatusBadge } from './AdminUI'
import { TextArea } from '../ui/Inputs'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

/** Settings card: hide the whole public site from visitors for a while, and bring it back. */
export default function MaintenanceCard() {
  const { isSuperAdmin } = useAuth()
  const toast = useToast()
  const status = useSiteStatus()
  const [message, setMessage] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const text = message ?? status.message

  async function apply(enabled: boolean) {
    setSaving(true)
    try {
      await setMaintenance(enabled, text)
      setMessage(null)
      toast.success(enabled ? 'საიტი დაიმალა — სტუმრები ახლა „დროებით მიუწვდომელია“ გვერდს ხედავენ.' : 'საიტი ისევ ყველასთვის ღიაა.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
      throw e
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5 md:p-6 lg:col-span-2">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.maintenance ? 'bg-terracotta-light text-terracotta' : 'bg-green-light text-green'}`}>
          {status.maintenance ? <EyeOff size={19} /> : <Globe size={19} />}
        </span>
        <h2 className="text-[16px] font-extrabold text-ink flex-1">საიტის დროებით დამალვა</h2>
        {status.maintenance ? <StatusBadge tone="amber">დამალულია</StatusBadge> : <StatusBadge tone="green">ყველასთვის ღიაა</StatusBadge>}
      </div>
      <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-3xl">
        ჩართვისას სტუმრები ნახავენ მხოლოდ გვერდს „საიტი დროებით მიუწვდომელია“, ხოლო ბაზა რესტორნების მონაცემებს აღარავის მისცემს. ადმინები და მენეჯერები შესულ მდგომარეობაში
        საიტს და პანელს ჩვეულებრივ ხედავენ. არაფერი იშლება — გამორთვისთანავე ყველაფერი ისევ გამოჩნდება.
      </p>
      <div className="mt-5 max-w-2xl">
        <TextArea
          label="შეტყობინება სტუმრებისთვის (არ არის სავალდებულო)"
          rows={2}
          placeholder="მაგ. ვაუმჯობესებთ საიტს — მალე დავბრუნდებით."
          value={text}
          onValueChange={setMessage}
          disabled={!isSuperAdmin || saving}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status.maintenance ? (
          <Button onClick={() => apply(false).catch(() => {})} loading={saving} disabled={!isSuperAdmin} icon={<Globe size={16} />}>
            საიტის გახსნა
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setConfirm(true)} disabled={!isSuperAdmin || saving} icon={<EyeOff size={16} />}>
            საიტის დამალვა
          </Button>
        )}
        {status.maintenance && message !== null && message !== status.message && (
          <Button variant="secondary" onClick={() => apply(true).catch(() => {})} loading={saving} disabled={!isSuperAdmin}>
            შეტყობინების შენახვა
          </Button>
        )}
        {!isSuperAdmin && <p className="text-[12.5px] text-ink-faint">ამის შეცვლა მხოლოდ Super Admin-ს შეუძლია.</p>}
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="დავმალო საიტი?"
        message="სტუმრები ვეღარ დაინახავენ რესტორნებს, მენიუებს და რუკას, სანამ ისევ არ გახსნი. შენ და სხვა ადმინები შესულ მდგომარეობაში ყველაფერს ჩვეულებრივ ნახავთ."
        confirmLabel="დამალვა"
        onConfirm={() => apply(true)}
      />
    </Card>
  )
}
