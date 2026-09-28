import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import FormAlert from '../../components/auth/FormAlert'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSeo } from '../../hooks/useSeo'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { getSafeRedirect } from '../../utils/redirect'
import { validateEmail, validateName, validatePassword, validatePasswordMatch } from '../../utils/validation'

export default function Register() {
  const { t, lang } = useLanguage()
  const { register, currentUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = getSafeRedirect(params.get('redirect'), '/profile')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  useSeo(`${t('nav_register')} | urigod.ge`)

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirm: validatePasswordMatch(password, confirm),
  }
  const shown = (key: keyof typeof errors) => (submitted && errors[key] ? t(errors[key]!) : undefined)

  if (currentUser && status === 'idle') return <Navigate to={redirect} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (Object.values(errors).some(Boolean)) return
    setStatus('loading')
    try {
      await register(name.trim(), email, password)
      setStatus('success')
      setTimeout(() => navigate(redirect, { replace: true }), 900)
    } catch (err) {
      setError(getFirebaseErrorMessage(err, lang))
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'
  const loginLink = params.get('redirect') ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'

  return (
    <AuthLayout
      title={t('auth_register_title')}
      subtitle={t('auth_register_subtitle')}
      footer={
        <>
          {t('auth_have_account')}{' '}
          <Link to={loginLink} className="font-bold text-green hover:underline">
            {t('nav_login')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert type="error" message={error} />
        <FormAlert type="success" message={status === 'success' ? t('auth_register_success') : null} />

        <FormField
          label={t('auth_name')}
          icon={User}
          autoComplete="name"
          placeholder={t('auth_name_placeholder')}
          maxLength={80}
          value={name}
          onValueChange={setName}
          error={shown('name')}
          disabled={busy}
        />
        <FormField
          label={t('auth_email')}
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t('auth_email_placeholder')}
          value={email}
          onValueChange={setEmail}
          error={shown('email')}
          disabled={busy}
        />
        <FormField
          label={t('auth_password')}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onValueChange={setPassword}
          error={shown('password')}
          hint={t('auth_password_hint')}
          disabled={busy}
        />
        <FormField
          label={t('auth_confirm_password')}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onValueChange={setConfirm}
          error={shown('confirm')}
          disabled={busy}
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' && <Spinner size={17} />}
          {t('auth_register_btn')}
        </button>
      </form>
    </AuthLayout>
  )
}
