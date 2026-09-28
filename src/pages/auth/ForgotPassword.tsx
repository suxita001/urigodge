import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, MailCheck, ArrowLeft } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import FormAlert from '../../components/auth/FormAlert'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSeo } from '../../hooks/useSeo'
import { getFirebaseErrorCode, getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { validateEmail } from '../../utils/validation'

export default function ForgotPassword() {
  const { t, lang } = useLanguage()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useSeo(`${t('auth_forgot_title')} | urigod.ge`)

  const emailError = submitted ? validateEmail(email) : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (validateEmail(email)) return
    setLoading(true)
    try {
      await resetPassword(email)
      setSentTo(email.trim())
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      if (getFirebaseErrorCode(err) === 'auth/user-not-found') setSentTo(email.trim())
      else setError(getFirebaseErrorMessage(err, lang))
    } finally {
      setLoading(false)
    }
  }

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-green hover:underline">
      <ArrowLeft size={15} />
      {t('auth_back_to_login')}
    </Link>
  )

  return (
    <AuthLayout title={t('auth_forgot_title')} subtitle={t('auth_forgot_subtitle')} footer={backLink}>
      <AnimatePresence mode="wait" initial={false}>
        {sentTo ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="text-center py-2"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-light text-green flex items-center justify-center mx-auto mb-4">
              <MailCheck size={26} />
            </div>
            <h2 className="text-[18px] font-bold text-ink">{t('auth_reset_sent_title')}</h2>
            <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">{t('auth_reset_sent', { email: sentTo })}</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" exit={{ opacity: 0 }}>
            <FormAlert type="error" message={error} />
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
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Spinner size={17} />}
              {t('auth_send_reset_btn')}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
