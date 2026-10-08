import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { UserProfile, UserRole } from '../data/types'
import { toProfile, userRef } from './userService'
import { logActivity } from './activityLogService'
import { createInvitation, normalizeEmail, sendInvitationEmail } from './invitationService'
import { SUPER_ADMIN_EMAIL } from '../utils/roles'

const usersCol = collection(db, 'users')

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'მომხმარებელი',
  restaurant_manager: 'რესტორნის მენეჯერი',
  admin: 'ადმინი',
  super_admin: 'Super Admin',
}

export function subscribeUsers(onChange: (users: UserProfile[]) => void, onError?: (e: Error) => void): () => void {
  return onSnapshot(
    usersCol,
    (snap) => {
      const list = snap.docs.map((d) => toProfile(d.id, d.data()))
      list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      onChange(list)
    },
    (e) => onError?.(e)
  )
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const snap = await getDocs(query(usersCol, where('email', '==', normalizeEmail(email)), limit(1)))
  if (!snap.empty) return toProfile(snap.docs[0].id, snap.docs[0].data())
  // Emails are stored as Firebase Auth returns them; fall back to an exact-case match.
  const exact = await getDocs(query(usersCol, where('email', '==', email.trim()), limit(1)))
  return exact.empty ? null : toProfile(exact.docs[0].id, exact.docs[0].data())
}

export async function changeUserRole(target: UserProfile, role: UserRole, managedRestaurantIds?: string[]): Promise<void> {
  const ids = role === 'restaurant_manager' ? (managedRestaurantIds ?? target.managedRestaurantIds) : []
  await updateDoc(userRef(target.uid), { role, managedRestaurantIds: ids, updatedAt: serverTimestamp() })

  const action =
    role === 'admin' ? 'ADMIN_CREATED' : target.role === 'admin' ? 'ADMIN_REMOVED' : 'USER_ROLE_CHANGED'
  await logActivity({
    action,
    targetType: 'user',
    targetId: target.uid,
    targetName: target.name || target.email,
    description: `${target.name || target.email}: ${ROLE_LABELS[target.role]} → ${ROLE_LABELS[role]}`,
  })
}

export async function setUserBlocked(target: UserProfile, blocked: boolean): Promise<void> {
  await updateDoc(userRef(target.uid), { status: blocked ? 'blocked' : 'active', updatedAt: serverTimestamp() })
  await logActivity({
    action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
    targetType: 'user',
    targetId: target.uid,
    targetName: target.name || target.email,
    description: `${target.name || target.email} ${blocked ? 'დაიბლოკა' : 'განიბლოკა'}`,
  })
}

export async function updateUserByAdmin(target: UserProfile, data: { name: string; phone?: string }): Promise<void> {
  await updateDoc(userRef(target.uid), { name: data.name, phone: data.phone ?? '', updatedAt: serverTimestamp() })
  await logActivity({
    action: 'USER_UPDATED',
    targetType: 'user',
    targetId: target.uid,
    targetName: data.name,
    description: `${target.email}-ის პროფილი განახლდა`,
  })
}

export type AddAdminResult = 'promoted' | 'invited' | 'invited-no-email' | 'already-admin'

/** Super admin only (enforced by rules). Existing accounts are promoted; unknown emails get a pending invitation. */
export async function addAdminByEmail(email: string, actorName: string): Promise<AddAdminResult> {
  const address = normalizeEmail(email)
  if (address === SUPER_ADMIN_EMAIL) return 'already-admin'
  const existing = await findUserByEmail(address)
  if (existing) {
    if (existing.role === 'admin' || existing.role === 'super_admin') return 'already-admin'
    await changeUserRole(existing, 'admin')
    return 'promoted'
  }
  await createInvitation({ email: address, role: 'admin', invitedByName: actorName })
  await logActivity({
    action: 'ADMIN_INVITED',
    targetType: 'invitation',
    targetId: address,
    targetName: address,
    description: `${address} მოწვეულია ადმინად`,
  })
  return (await sendInvitationEmail(address)) ? 'invited' : 'invited-no-email'
}

export interface AdminStats {
  users: number
  restaurants: number
  managers: number
  admins: number
  recentActivities: number
}

export const RECENT_WINDOW_MS = 72 * 60 * 60 * 1000

export async function fetchAdminStats(): Promise<AdminStats> {
  const since = Timestamp.fromDate(new Date(Date.now() - RECENT_WINDOW_MS))
  const [users, restaurants, managers, admins, supers, recent] = await Promise.all([
    getCountFromServer(usersCol),
    getCountFromServer(collection(db, 'restaurants')),
    getCountFromServer(query(usersCol, where('role', '==', 'restaurant_manager'))),
    getCountFromServer(query(usersCol, where('role', '==', 'admin'))),
    getCountFromServer(query(usersCol, where('role', '==', 'super_admin'))),
    getCountFromServer(query(collection(db, 'activityLogs'), where('timestamp', '>=', since))),
  ])
  return {
    users: users.data().count,
    restaurants: restaurants.data().count,
    managers: managers.data().count,
    admins: admins.data().count + supers.data().count,
    recentActivities: recent.data().count,
  }
}
