import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createUserProfile, ensureUserProfile, updateOwnProfile } from './userService'
import { logActivity } from './activityLogService'
import { SUPER_ADMIN_EMAIL } from '../utils/roles'

// Each provider (email/password, email link, later Google) signs in, then calls ensureUserProfile so
// every account gets a users/{uid} document regardless of how it was created.

const PROFILE_WRITE_WAIT_MS = 5000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function profileRoleFor(user: User): 'user' | 'super_admin' {
  return user.emailVerified && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user'
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await updateProfile(user, { displayName: name })
  // Verification proves email ownership; it's required before invitations or super admin rights apply.
  sendEmailVerification(user, { url: `${window.location.origin}/profile` }).catch(() => {})
  // Firestore queues the write locally and syncs it later, so a slow network shouldn't block sign-up.
  // If it never lands, ensureUserProfile() on the next login recreates it.
  await Promise.race([
    createUserProfile(user.uid, name, user.email ?? email.trim())
      .then(() => logActivity({ action: 'USER_REGISTERED', targetType: 'user', targetId: user.uid, targetName: name, description: `${name} დარეგისტრირდა` }, name))
      .catch(() => {}),
    wait(PROFILE_WRITE_WAIT_MS),
  ])
  return user
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password)
  ensureUserProfile(user, undefined, profileRoleFor(user))
    .then(() => logActivity({ action: 'LOGIN', targetType: 'auth', targetId: user.uid, description: `${user.displayName || user.email} შევიდა სისტემაში` }))
    .catch(() => {})
  return user
}

export function isEmailSignInLink(href: string): boolean {
  return isSignInWithEmailLink(auth, href)
}

export async function loginWithEmailLink(email: string, href: string): Promise<User> {
  const { user } = await signInWithEmailLink(auth, email.trim(), href)
  return user
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/profile` })
}

/** Reloads the user and forces a fresh ID token so a just-verified email reaches Security Rules. */
export async function refreshCurrentUser(): Promise<User | null> {
  const user = auth.currentUser
  if (!user) return null
  await user.reload()
  await user.getIdToken(true)
  return auth.currentUser
}

export async function setPassword(password: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Not signed in')
  await updatePassword(auth.currentUser, password)
}

export async function resetPassword(email: string): Promise<void> {
  auth.languageCode = 'ka'
  await sendPasswordResetEmail(auth, email.trim())
}

export async function logout(): Promise<void> {
  const user = auth.currentUser
  if (user) {
    await Promise.race([
      logActivity({ action: 'LOGOUT', targetType: 'auth', targetId: user.uid, description: `${user.displayName || user.email} გავიდა სისტემიდან` }),
      wait(1500),
    ])
  }
  await signOut(auth)
}

export async function changeDisplayName(user: User, name: string, phone?: string): Promise<void> {
  await Promise.all([updateProfile(user, { displayName: name }), updateOwnProfile(user.uid, phone === undefined ? { name } : { name, phone })])
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
