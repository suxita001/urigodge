import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import * as authService from '../services/authService'
import { ensureUserProfile, markSelfSuperAdmin, subscribeToUserProfile, touchLastActive } from '../services/userService'
import { claimPendingInvitation } from '../services/invitationService'
import type { UserProfile } from '../data/types'
import { isAdmin, isRestaurantManager, isStaff, isSuperAdmin, SUPER_ADMIN_EMAIL } from '../utils/roles'
import { useToast } from '../hooks/useToast'

export interface AuthContextValue {
  currentUser: User | null
  profile: UserProfile | null
  /** True until Firebase has restored (or ruled out) a persisted session. */
  loading: boolean
  profileLoading: boolean
  emailVerified: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isRestaurantManager: boolean
  isStaff: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateName: (name: string, phone?: string) => Promise<void>
  /** Re-reads the Auth user (e.g. after the email was verified) and re-applies roles/invitations. */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACTIVITY_TOUCH_MS = 30 * 60 * 1000
const NEW_ACCOUNT_GRACE_MS = 15 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Bumped when the same User object changes (reload after email verification).
  const [userVersion, setUserVersion] = useState(0)
  // Tagged with the uid it belongs to, so a stale or not-yet-loaded profile is never shown for the current user.
  const [profileState, setProfileState] = useState<{ uid: string; profile: UserProfile | null } | null>(null)
  const done = useRef(new Set<string>())

  useEffect(
    () =>
      authService.subscribeToAuth((user) => {
        setCurrentUser(user)
        setLoading(false)
      }),
    []
  )

  const uid = currentUser?.uid
  useEffect(() => {
    if (!uid) return
    return subscribeToUserProfile(
      uid,
      (profile) => setProfileState({ uid, profile }),
      () => setProfileState({ uid, profile: null })
    )
  }, [uid])

  const profile = uid && profileState?.uid === uid ? profileState.profile : null
  const profileLoading = !!uid && profileState?.uid !== uid
  const emailVerified = !!currentUser?.emailVerified

  // Post-login housekeeping. Every write here is validated by firestore.rules, so these are
  // conveniences that apply rights the rules already grant — never a source of authority.
  useEffect(() => {
    if (!currentUser || profileLoading) return
    const once = (key: string, fn: () => Promise<unknown>) => {
      const k = `${currentUser.uid}:${key}:${userVersion}`
      if (done.current.has(k)) return
      done.current.add(k)
      fn().catch((e) => {
        if (import.meta.env.DEV) console.warn(`[urigod] ${key} failed`, e)
      })
    }

    if (!profile) {
      const age = Date.now() - new Date(currentUser.metadata.creationTime ?? 0).getTime()
      if (age > NEW_ACCOUNT_GRACE_MS) once('ensure-profile', () => ensureUserProfile(currentUser, undefined, authService.profileRoleFor(currentUser)))
      return
    }

    if (profile.status === 'blocked') {
      once('blocked', async () => {
        await authService.logout()
        toast.error('შენი ანგარიში დაბლოკილია. დაუკავშირდი ადმინისტრაციას.')
      })
      return
    }

    const isSuperEmail = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL
    if (isSuperEmail && emailVerified && profile.role !== 'super_admin') {
      once('super-admin', () => markSelfSuperAdmin(currentUser.uid))
    }

    if (emailVerified && (profile.role === 'user' || profile.role === 'restaurant_manager')) {
      once('claim-invitation', async () => {
        const inv = await claimPendingInvitation(currentUser)
        if (inv) toast.success(inv.role === 'admin' ? 'მოწვევა მიღებულია — ახლა ადმინი ხარ.' : 'მოწვევა მიღებულია — ახლა რესტორნის მენეჯერი ხარ.')
      })
    }

    if (!profile.lastActiveAt || Date.now() - profile.lastActiveAt.getTime() > ACTIVITY_TOUCH_MS) {
      once('touch', () => touchLastActive(currentUser.uid))
    }
  }, [currentUser, profile, profileLoading, emailVerified, userVersion, toast])

  const login = useCallback(async (email: string, password: string) => {
    await authService.loginWithEmail(email, password)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authService.registerWithEmail(name, email, password)
  }, [])

  const logout = useCallback(() => authService.logout(), [])

  const resetPassword = useCallback((email: string) => authService.resetPassword(email), [])

  const updateName = useCallback(
    async (name: string, phone?: string) => {
      if (!currentUser) throw new Error('Not signed in')
      await authService.changeDisplayName(currentUser, name, phone)
    },
    [currentUser]
  )

  const refreshUser = useCallback(async () => {
    const user = await authService.refreshCurrentUser()
    setCurrentUser(user)
    setUserVersion((v) => v + 1)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      profile,
      loading,
      profileLoading,
      emailVerified,
      isAdmin: isAdmin(profile),
      isSuperAdmin: isSuperAdmin(profile),
      isRestaurantManager: isRestaurantManager(profile),
      isStaff: isStaff(profile),
      login,
      register,
      logout,
      resetPassword,
      updateName,
      refreshUser,
    }),
    // userVersion: the User object is mutated in place by reload(), so force consumers to re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, profile, loading, profileLoading, emailVerified, userVersion, login, register, logout, resetPassword, updateName, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
