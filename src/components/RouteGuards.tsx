import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../i18n/LanguageContext'
import { loginPathFor } from '../utils/redirect'
import Spinner from './ui/Spinner'

function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-green">
      <Spinner size={30} />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!currentUser) return <Navigate to={loginPathFor(location.pathname + location.search)} replace />
  return <>{children}</>
}

export function NoAccess() {
  const { t } = useLanguage()
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto mb-4">
        <ShieldAlert size={26} />
      </div>
      <h1 className="text-[22px] font-extrabold text-ink">{t('admin_no_access_title')}</h1>
      <p className="mt-2 text-[14.5px] text-ink-soft">{t('admin_no_access_text')}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-6 py-3 rounded-full bg-green text-cream font-bold text-[14.5px] hover:bg-green-dark transition-colors"
      >
        {t('back_home')}
      </Link>
    </div>
  )
}

// UI gate only — Firestore/Storage rules are what actually protect admin data.
export function RequireRole({ allow, children }: { allow: 'staff' | 'admin'; children: ReactNode }) {
  const { profileLoading, isAdmin, isStaff } = useAuth()
  if (profileLoading) return <FullPageSpinner />
  const ok = allow === 'admin' ? isAdmin : isStaff
  return ok ? <>{children}</> : <NoAccess />
}
