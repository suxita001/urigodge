import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, CalendarDays, Mail, User, LogOut, ArrowRight, ShieldCheck, MailWarning } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import FormField from '../components/auth/FormField'
import FormAlert from '../components/auth/FormAlert'
import RestaurantGrid from '../components/RestaurantGrid'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useRestaurants } from '../hooks/useRestaurants'
import { useLanguage } from '../i18n/LanguageContext'
import { useSeo } from '../hooks/useSeo'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import { validateName } from '../utils/validation'
import { formatDate } from '../lib/format'
import { useToast } from '../hooks/useToast'
import { resendVerificationEmail } from '../services/authService'
import type { Restaurant } from '../data/types'

// Verification proves email ownership; invitations and the super admin role only apply once verified.
function VerifyEmailBanner() {
  const { t, lang } = useLanguage()
  const { refreshUser } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState<'send' | 'refresh' | null>(null)
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-[#ecd9a8] bg-[#fffaf0] px-5 py-4">
      <MailWarning size={22} className="text-[#9a6b00] shrink-0" />
      <div className="flex-1">
        <p className="font-bold text-[14.5px] text-ink">{t('verify_email_title')}</p>
        <p className="text-[13px] text-ink-soft">{t('verify_email_text')}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={async () => {
            setBusy('send')
            try {
              await resendVerificationEmail()
              toast.success(t('verify_email_sent'))
            } catch (e) {
              toast.error(getFirebaseErrorMessage(e, lang))
            } finally {
              setBusy(null)
            }
          }}
          className="h-10 px-4 rounded-full border border-border bg-white text-[13px] font-bold text-ink hover:bg-cream-2 disabled:opacity-60"
        >
          {t('verify_email_resend')}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={async () => {
            setBusy('refresh')
            try {
              await refreshUser()
            } finally {
              setBusy(null)
            }
          }}
          className="h-10 px-4 rounded-full bg-green text-cream text-[13px] font-bold hover:bg-green-dark disabled:opacity-60 flex items-center gap-2"
        >
          {busy === 'refresh' && <Spinner size={14} />}
          {t('verify_email_refresh')}
        </button>
      </div>
    </div>
  )
}

function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-5 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-cream-2" />
      <div className="flex-1">
        <div className="h-6 w-48 rounded-full bg-cream-2" />
        <div className="mt-3 h-3.5 w-64 max-w-full rounded-full bg-cream-2" />
      </div>
    </div>
  )
}

export default function Profile() {
  const { t, lang } = useLanguage()
  const { currentUser, profile, profileLoading, updateName, logout } = useAuth()
  const { favorites, loading: favoritesLoading } = useFavorites()
  const { getBySlug, loading: restaurantsLoading } = useRestaurants()
  const location = useLocation()
  const navigate = useNavigate()

  const currentName = profile?.name || currentUser?.displayName || ''
  const [draftName, setDraftName] = useState<string | null>(null)
  const name = draftName ?? currentName
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useSeo(`${t('profile_title')} | urigod.ge`)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(timer)
  }, [saved])

  const favoriteRestaurants = useMemo(
    () =>
      [...favorites]
        .sort((a, b) => (b.createdAt?.getTime() ?? Infinity) - (a.createdAt?.getTime() ?? Infinity))
        .map((f) => getBySlug(f.restaurantId))
        .filter((r): r is Restaurant => !!r),
    [favorites, getBySlug]
  )

  const listLoading = favoritesLoading || restaurantsLoading

  // Scroll to #favorites / #settings once content has rendered (e.g. from the user menu).
  useEffect(() => {
    if (!location.hash || listLoading) return
    const el = document.getElementById(location.hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, listLoading])

  if (!currentUser) return null

  const createdAt =
    profile?.createdAt ?? (currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : null)
  const createdLabel = createdAt ? formatDate(createdAt, lang) : '—'

  const nameError = submitted ? validateName(name) : undefined
  const unchanged = name.trim() === currentName

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    setSaved(false)
    if (validateName(name) || unchanged) return
    setSaving(true)
    try {
      await updateName(name.trim())
      setDraftName(null)
      setSaved(true)
      setSubmitted(false)
    } catch (err) {
      setError(getFirebaseErrorMessage(err, lang))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    navigate('/', { replace: true })
    await logout()
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
      {!currentUser.emailVerified && <VerifyEmailBanner />}
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-card p-6 md:p-8"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-green-light blur-3xl opacity-70 pointer-events-none" />
        <div className="relative">
          {profileLoading ? (
            <ProfileHeaderSkeleton />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Avatar name={currentName || currentUser.email || '?'} size={80} className="ring-4 ring-green-light" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight break-words">{currentName}</h1>
                  {profile && profile.role !== 'user' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-light text-green text-[12px] font-bold">
                      <ShieldCheck size={13} />
                      {t(`role_${profile.role}`)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-ink-soft">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail size={15} className="text-green shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-green shrink-0" />
                    {t('profile_registered')}: {createdLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="self-start sm:self-center inline-flex items-center gap-2 px-5 h-11 rounded-full border border-border text-[14px] font-bold text-ink hover:bg-terracotta-light hover:text-terracotta hover:border-terracotta-light transition-colors"
              >
                <LogOut size={16} />
                {t('menu_logout')}
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* Favorites */}
      <section id="favorites" className="mt-12 scroll-mt-24">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-terracotta-light text-terracotta flex items-center justify-center">
              <Heart size={19} fill="currentColor" />
            </span>
            <h2 className="text-[22px] md:text-[26px] font-extrabold text-ink tracking-tight">
              {t('profile_favorites_title')}
              {!listLoading && favoriteRestaurants.length > 0 && (
                <span className="ml-2 text-ink-faint font-bold">{favoriteRestaurants.length}</span>
              )}
            </h2>
          </div>
        </div>

        {listLoading ? (
          <RestaurantGrid restaurants={[]} loading skeletonCount={3} />
        ) : favoriteRestaurants.length > 0 ? (
          <RestaurantGrid restaurants={favoriteRestaurants} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center py-14 px-6 rounded-3xl border border-dashed border-border bg-white/60"
          >
            <div className="w-14 h-14 rounded-2xl bg-cream-2 text-ink-faint flex items-center justify-center mb-4">
              <Heart size={24} />
            </div>
            <h3 className="text-[18px] font-bold text-ink">{t('profile_favorites_empty_title')}</h3>
            <p className="mt-1.5 text-[14.5px] text-ink-soft max-w-sm">{t('profile_favorites_empty_text')}</p>
            <Link
              to="/restaurants"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green text-cream font-bold text-[14.5px] hover:bg-green-dark transition-colors"
            >
              {t('profile_browse')}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </section>

      {/* Info / settings */}
      <section id="settings" className="mt-14 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-green-light text-green flex items-center justify-center">
            <User size={19} />
          </span>
          <h2 className="text-[22px] md:text-[26px] font-extrabold text-ink tracking-tight">{t('profile_info_title')}</h2>
        </div>

        <form
          onSubmit={handleSave}
          noValidate
          className="max-w-xl rounded-3xl border border-border bg-white shadow-card p-6 md:p-7 flex flex-col gap-4"
        >
          <FormAlert type="error" message={error} />
          <FormAlert type="success" message={saved ? t('profile_saved') : null} />
          <FormField
            label={t('auth_name')}
            icon={User}
            autoComplete="name"
            maxLength={80}
            value={name}
            onValueChange={(v) => {
              setDraftName(v)
              setSaved(false)
            }}
            error={nameError && t(nameError)}
            disabled={saving || profileLoading}
          />
          <FormField
            label={t('auth_email')}
            icon={Mail}
            type="email"
            value={currentUser.email ?? ''}
            onValueChange={() => {}}
            readOnly
            disabled
            hint={t('profile_email_readonly')}
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving || unchanged}
              className="inline-flex items-center justify-center gap-2 min-w-32 h-11 px-6 rounded-full bg-green text-cream font-bold text-[14.5px] hover:bg-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Spinner size={16} />}
              {t('profile_save')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
