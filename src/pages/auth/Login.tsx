import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import FormAlert from '../../components/auth/FormAlert'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSeo } from '../../hooks/useSeo'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { getSafeRedirect } from '../../utils/redirect'
import { validateEmail, validatePassword } from '../../utils/validation'

export default function Login() {
  const { t, lang } = useLanguage()
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = getSafeRedirect(params.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  useSeo(`${t('nav_login')} | urigod.ge`)

  const emailError = submitted ? validateEmail(email) : undefined
  const passwordError = submitted ? validatePassword(password, false) : undefined

  if (currentUser && status === 'idle') return <Navigate to={redirect} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (validateEmail(email) || validatePassword(password, false)) return
    setStatus('loading')
    try {
      await login(email, password)
      setStatus('success')
      setTimeout(() => navigate(redirect, { replace: true }), 700)
    } catch (err) {
      setError(getFirebaseErrorMessage(err, lang))
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'
  const registerLink = redirect !== '/' ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'

  return (
    <AuthLayout
      title={t('auth_login_title')}
      subtitle={t('auth_login_subtitle')}
      footer={
        <>
          {t('auth_no_account')}{' '}
          <Link to={registerLink} className="font-bold text-green hover:underline">
            {t('nav_register')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert type="error" message={error} />
        <FormAlert type="success" message={status === 'success' ? t('auth_login_success') : null} />

        <FormField
          label={t('auth_email')}
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t('auth_email_placeholder')}
          value={email}
          onValueChange={setEmail}
          error={emailError && t(emailError)}
          disabled={busy}
        />
        <FormField
          label={t('auth_password')}
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onValueChange={setPassword}
          error={passwordError && t(passwordError)}
          disabled={busy}
          labelAside={
            <Link to="/forgot-password" className="text-[13px] font-semibold text-green hover:underline">
              {t('auth_forgot_link')}
            </Link>
          }
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' && <Spinner size={17} />}
          {t('auth_login_btn')}
        </button>
      </form>
    </AuthLayout>
  )
}
