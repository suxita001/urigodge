import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, type Timestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../lib/firebase'
import type { UserProfile, UserRole } from '../data/types'

export const userRef = (uid: string) => doc(db, 'users', uid)

const ROLES: UserRole[] = ['user', 'restaurant_manager', 'admin', 'super_admin']

export function toProfile(uid: string, data: Record<string, unknown>): UserProfile {
  const role = ROLES.includes(data.role as UserRole) ? (data.role as UserRole) : 'user'
  return {
    uid,
    name: typeof data.name === 'string' ? data.name : '',
    email: typeof data.email === 'string' ? data.email : '',
    role,
    status: data.status === 'blocked' ? 'blocked' : 'active',
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    managedRestaurantIds: Array.isArray(data.managedRestaurantIds) ? (data.managedRestaurantIds as string[]) : [],
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() ?? null,
    lastActiveAt: (data.lastActiveAt as Timestamp | undefined)?.toDate?.() ?? null,
  }
}

// Role is 'user' for everyone except the verified super admin; firestore.rules rejects anything else.
export async function createUserProfile(uid: string, name: string, email: string, role: 'user' | 'super_admin' = 'user'): Promise<void> {
  await setDoc(userRef(uid), {
    uid,
    name,
    email,
    role,
    status: 'active',
    managedRestaurantIds: [],
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  })
}

// Creates the profile document for accounts that don't have one yet (email-link invitees, console-created users).
export async function ensureUserProfile(user: User, preferredName?: string, role: 'user' | 'super_admin' = 'user'): Promise<void> {
  const snap = await getDoc(userRef(user.uid))
  if (!snap.exists()) {
    const name = preferredName || user.displayName || user.email?.split('@')[0] || 'მომხმარებელი'
    await createUserProfile(user.uid, name.slice(0, 80), user.email ?? '', role)
  }
}

export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    userRef(uid),
    (snap) => onChange(snap.exists() ? toProfile(uid, snap.data()) : null),
    (error) => onError?.(error)
  )
}

export async function updateOwnProfile(uid: string, data: { name?: string; phone?: string }): Promise<void> {
  await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() })
}

export async function updateUserName(uid: string, name: string): Promise<void> {
  await updateOwnProfile(uid, { name })
}

export async function touchLastActive(uid: string): Promise<void> {
  await updateDoc(userRef(uid), { lastActiveAt: serverTimestamp() })
}

export async function markSelfSuperAdmin(uid: string): Promise<void> {
  await updateDoc(userRef(uid), { role: 'super_admin', status: 'active', managedRestaurantIds: [], updatedAt: serverTimestamp() })
}
