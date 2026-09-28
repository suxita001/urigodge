import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, MailX } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import FormAlert from '../../components/auth/FormAlert'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useSeo } from '../../hooks/useSeo'
import { isEmailSignInLink, loginWithEmailLink, profileRoleFor, setPassword } from '../../services/authService'
import { getOwnInvitation } from '../../services/invitationService'
import { ensureUserProfile } from '../../services/userService'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { validateEmail, validatePassword } from '../../utils/validation'

export default function InviteComplete() {
  useSeo('მოწვევის მიღება | urigod.ge')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [validLink] = useState(() => isEmailSignInLink(window.location.href))
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [stage, setStage] = useState<'confirm' | 'password'>('confirm')
  const [password, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (validateEmail(email)) {
      setError('შეიყვანე სწორი ელფოსტა.')
      return
    }
    setBusy(true)
    try {
      const user = await loginWithEmailLink(email, window.location.href)
      const invitation = await getOwnInvitation(email).catch(() => null)
      await ensureUserProfile(user, invitation?.name, profileRoleFor(user))
      await refreshUser()
      setStage('password')
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'ka', 'ბმული არასწორია ან ვადაგასულია. სთხოვე ადმინს მოწვევის ხელახლა გაგზავნა.'))
    } finally {
      setBusy(false)
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (validatePassword(password)) {
      setError('პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს.')
      return
    }
    setBusy(true)
    try {
      await setPassword(password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!validLink) {
    return (
      <AuthLayout title="მოწვევის ბმული არასწორია" subtitle="ბმული ვადაგასულია ან უკვე გამოყენებულია.">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto mb-4">
            <MailX size={26} />
          </div>
          <p className="text-[14px] text-ink-soft">სთხოვე ადმინისტრატორს მოწვევის ხელახლა გაგზავნა, ან შედი ჩვეულებრივად, თუ ანგარიში უკვე გაქვს.</p>
          <Link to="/login" className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark">
            შესვლა
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (stage === 'password') {
    return (
      <AuthLayout title="კეთილი იყოს შენი მობრძანება!" subtitle="მოწვევა მიღებულია. დააყენე პაროლი, რომ შემდეგში მარტივად შეხვიდე.">
        <form onSubmit={savePassword} noValidate className="flex flex-col gap-4">
          <FormAlert type="error" message={error} />
          <FormField label="ახალი პაროლი" icon={Lock} type="password" autoComplete="new-password" value={password} onValueChange={setPw} hint="მინიმუმ 6 სიმბოლო" disabled={busy} />
          <button type="submit" disabled={busy} className="mt-2 h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark shadow-card disabled:opacity-80 flex items-center justify-center gap-2">
            {busy && <Spinner size={17} />}
            შენახვა და გაგრძელება
          </button>
          <button type="button" onClick={() => navigate('/admin', { replace: true })} className="text-[14px] font-semibold text-ink-soft hover:text-ink">
            გამოტოვება
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="მოწვევის მიღება" subtitle="დაადასტურე ელფოსტა, რომელზეც მოწვევა მიიღე.">
      <form onSubmit={signIn} noValidate className="flex flex-col gap-4">
        <FormAlert type="error" message={error} />
        <FormField label="ელფოსტა" icon={Mail} type="email" autoComplete="email" value={email} onValueChange={setEmail} disabled={busy} />
        <button type="submit" disabled={busy} className="mt-2 h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark shadow-card disabled:opacity-80 flex items-center justify-center gap-2">
          {busy && <Spinner size={17} />}
          შესვლა
        </button>
      </form>
    </AuthLayout>
  )
}
