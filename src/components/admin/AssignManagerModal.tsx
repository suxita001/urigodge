import { useState } from 'react'
import { Mail, Check } from 'lucide-react'
import type { Restaurant } from '../../data/types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput } from '../ui/Inputs'
import { assignManager } from '../../services/managerService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { validateEmail } from '../../utils/validation'

interface Props {
  open: boolean
  onClose: () => void
  restaurants: Restaurant[]
  initialRestaurantIds?: string[]
}

export default function AssignManagerModal({ open, onClose, restaurants, initialRestaurantIds = [] }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="მენეჯერის დამატება" description="პაროლი არ არის საჭირო — მენეჯერი საკუთარი ელფოსტით შევა.">
      {open && <AssignForm onClose={onClose} restaurants={restaurants} initialRestaurantIds={initialRestaurantIds} />}
    </Modal>
  )
}

function AssignForm({ onClose, restaurants, initialRestaurantIds }: Omit<Props, 'open'> & { initialRestaurantIds: string[] }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [ids, setIds] = useState<string[]>(initialRestaurantIds)
  const [filter, setFilter] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const emailError = submitted && validateEmail(email) ? 'შეიყვანე სწორი ელფოსტა.' : undefined
  const idsError = submitted && ids.length === 0 ? 'აირჩიე მინიმუმ ერთი რესტორანი.' : undefined
  const visible = restaurants.filter((r) => `${r.nameI18n.ka} ${r.nameI18n.en}`.toLowerCase().includes(filter.toLowerCase()))

  async function submit() {
    setSubmitted(true)
    if (validateEmail(email) || ids.length === 0) return
    setSaving(true)
    try {
      const names = restaurants.filter((r) => ids.includes(r.id)).map((r) => r.nameI18n.ka || r.name).join(', ')
      const result = await assignManager({ email, name: name.trim(), phone: phone.trim(), restaurantIds: ids, restaurantNames: names, actorName: profile?.name ?? '' })
      if (result === 'is-admin') {
        toast.error('ეს ანგარიში ადმინია — მენეჯერად დანიშვნა შეუძლებელია.')
        return
      }
      toast.success(
        result === 'assigned'
          ? 'მენეჯერი წარმატებით დაემატა.'
          : result === 'invited'
            ? 'მოწვევა გაიგზავნა ელფოსტაზე.'
            : 'მოწვევა შეიქმნა. ელფოსტა ვერ გაიგზავნა — მენეჯერმა დარეგისტრირდეს ამ ელფოსტით.'
      )
      onClose()
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex flex-col gap-4"
    >
      <TextInput label="ელფოსტა" type="email" inputMode="email" placeholder="manager@example.com" value={email} onValueChange={setEmail} error={emailError} autoFocus />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="სახელი" value={name} onValueChange={setName} placeholder="არასავალდებულო" />
        <TextInput label="ტელეფონი" type="tel" value={phone} onValueChange={setPhone} placeholder="არასავალდებულო" />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-ink">რესტორანი</p>
        {restaurants.length > 6 && <TextInput placeholder="ძებნა..." value={filter} onValueChange={setFilter} wrapperClassName="mb-2" />}
        <div className={`max-h-56 overflow-y-auto rounded-xl border bg-white divide-y divide-border ${idsError ? 'border-terracotta' : 'border-border'}`}>
          {visible.map((r) => {
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
        {idsError && <p className="mt-1.5 text-[12.5px] font-medium text-terracotta">{idsError}</p>}
      </div>
      <p className="flex gap-2 text-[12.5px] text-ink-faint leading-relaxed bg-cream-2/60 rounded-xl px-3.5 py-3">
        <Mail size={15} className="shrink-0 mt-0.5" />
        თუ ამ ელფოსტით ანგარიში უკვე არსებობს, როლი მაშინვე მიენიჭება. თუ არა — შეიქმნება მოწვევა და გაიგზავნება შესვლის ბმული; როლი გააქტიურდება, როცა მენეჯერი ელფოსტას დაადასტურებს.
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          გაუქმება
        </Button>
        <Button type="submit" loading={saving}>
          მენეჯერის დამატება
        </Button>
      </div>
    </form>
  )
}
