import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch, type Timestamp } from 'firebase/firestore'
import { sendSignInLinkToEmail, type User } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import type { Invitation, InvitationRole } from '../data/types'
import { userRef } from './userService'
import { logActivity } from './activityLogService'

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
const invitationRef = (email: string) => doc(db, 'invitations', normalizeEmail(email))

function toInvitation(data: Record<string, unknown>): Invitation {
  return {
    email: String(data.email ?? ''),
    role: data.role as InvitationRole,
    name: typeof data.name === 'string' ? data.name : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    restaurantIds: Array.isArray(data.restaurantIds) ? (data.restaurantIds as string[]) : [],
    status: data.status === 'accepted' ? 'accepted' : 'pending',
    invitedByUid: String(data.invitedByUid ?? ''),
    invitedByName: String(data.invitedByName ?? ''),
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() ?? null,
  }
}

export async function createInvitation(input: {
  email: string
  role: InvitationRole
  restaurantIds?: string[]
  name?: string
  phone?: string
  invitedByName: string
}): Promise<void> {
  const email = normalizeEmail(input.email)
  await setDoc(invitationRef(email), {
    email,
    role: input.role,
    restaurantIds: input.restaurantIds ?? [],
    name: input.name || undefined,
    phone: input.phone || undefined,
    status: 'pending',
    invitedByUid: auth.currentUser?.uid ?? '',
    invitedByName: input.invitedByName,
    createdAt: serverTimestamp(),
  })
}

export async function deleteInvitation(email: string): Promise<void> {
  await deleteDoc(invitationRef(email))
}

export function subscribeInvitations(onChange: (list: Invitation[]) => void, onError?: (e: Error) => void): () => void {
  return onSnapshot(
    collection(db, 'invitations'),
    (snap) => onChange(snap.docs.map((d) => toInvitation(d.data()))),
    (e) => onError?.(e)
  )
}

/**
 * Sends a passwordless sign-in link (Firebase "Email link" provider). Clicking it proves the invitee
 * owns the address (email becomes verified), which firestore.rules requires before a role is claimed.
 * Returns false when the provider isn't enabled; the invitee can still register + verify their email.
 */
export async function sendInvitationEmail(email: string): Promise<boolean> {
  const address = normalizeEmail(email)
  try {
    await sendSignInLinkToEmail(auth, address, {
      url: `${window.location.origin}/invite?email=${encodeURIComponent(address)}`,
      handleCodeInApp: true,
    })
    return true
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[urigod] invitation email not sent', error)
    return false
  }
}

export async function getOwnInvitation(email: string): Promise<Invitation | null> {
  const snap = await getDoc(invitationRef(email))
  return snap.exists() ? toInvitation(snap.data()) : null
}

/**
 * Applies a pending invitation for the signed-in user's own verified email.
 * The batch is validated by firestore.rules: the new role/restaurants must equal the invitation's.
 */
export async function claimPendingInvitation(user: User): Promise<Invitation | null> {
  if (!user.email || !user.emailVerified) return null
  const invitation = await getOwnInvitation(user.email)
  if (!invitation || invitation.status !== 'pending') return null

  const batch = writeBatch(db)
  batch.update(userRef(user.uid), {
    role: invitation.role,
    managedRestaurantIds: invitation.restaurantIds,
    updatedAt: serverTimestamp(),
  })
  batch.update(invitationRef(user.email), { status: 'accepted', acceptedUid: user.uid, acceptedAt: serverTimestamp() })
  await batch.commit()

  await logActivity({
    action: 'INVITATION_ACCEPTED',
    targetType: 'user',
    targetId: user.uid,
    targetName: user.email,
    description: `${user.email} შეუერთდა როგორც ${invitation.role === 'admin' ? 'ადმინი' : 'რესტორნის მენეჯერი'}`,
  })
  return invitation
}
