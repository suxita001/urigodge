import { serverTimestamp, updateDoc } from 'firebase/firestore'
import type { UserProfile } from '../data/types'
import { userRef } from './userService'
import { logActivity } from './activityLogService'
import { findUserByEmail } from './adminService'
import { createInvitation, normalizeEmail, sendInvitationEmail } from './invitationService'

export type AssignManagerResult = 'assigned' | 'invited' | 'invited-no-email' | 'is-admin'

/**
 * Admin only (enforced by rules). An existing account becomes a manager of the given restaurants
 * (merged with any it already manages); an unknown email gets a pending invitation instead.
 */
export async function assignManager(input: {
  email: string
  name?: string
  phone?: string
  restaurantIds: string[]
  restaurantNames: string
  actorName: string
}): Promise<AssignManagerResult> {
  const email = normalizeEmail(input.email)
  const existing = await findUserByEmail(email)

  if (existing) {
    if (existing.role === 'admin' || existing.role === 'super_admin') return 'is-admin'
    const ids = Array.from(new Set([...(existing.role === 'restaurant_manager' ? existing.managedRestaurantIds : []), ...input.restaurantIds]))
    await updateDoc(userRef(existing.uid), {
      role: 'restaurant_manager',
      managedRestaurantIds: ids,
      ...(input.phone ? { phone: input.phone } : {}),
      updatedAt: serverTimestamp(),
    })
    await Promise.all(
      input.restaurantIds.map((rid) =>
        logActivity({
          action: 'MANAGER_ASSIGNED',
          targetType: 'user',
          targetId: existing.uid,
          targetName: existing.name || existing.email,
          restaurantId: rid,
          description: `${existing.name || existing.email} დაინიშნა მენეჯერად: ${input.restaurantNames}`,
        })
      )
    )
    return 'assigned'
  }

  await createInvitation({
    email,
    role: 'restaurant_manager',
    restaurantIds: input.restaurantIds,
    name: input.name,
    phone: input.phone,
    invitedByName: input.actorName,
  })
  await logActivity({
    action: 'MANAGER_INVITED',
    targetType: 'invitation',
    targetId: email,
    targetName: input.name || email,
    restaurantId: input.restaurantIds[0],
    description: `${input.name || email} მოწვეულია მენეჯერად: ${input.restaurantNames}`,
  })
  return (await sendInvitationEmail(email)) ? 'invited' : 'invited-no-email'
}

export async function setManagerRestaurants(manager: UserProfile, restaurantIds: string[]): Promise<void> {
  const removed = manager.managedRestaurantIds.filter((id) => !restaurantIds.includes(id))
  const added = restaurantIds.filter((id) => !manager.managedRestaurantIds.includes(id))
  await updateDoc(userRef(manager.uid), {
    role: restaurantIds.length ? 'restaurant_manager' : 'user',
    managedRestaurantIds: restaurantIds,
    updatedAt: serverTimestamp(),
  })
  const who = manager.name || manager.email
  await Promise.all([
    ...added.map((rid) =>
      logActivity({ action: 'MANAGER_ASSIGNED', targetType: 'user', targetId: manager.uid, targetName: who, restaurantId: rid, description: `${who} დაინიშნა მენეჯერად (${rid})` })
    ),
    ...removed.map((rid) =>
      logActivity({ action: 'MANAGER_REMOVED', targetType: 'user', targetId: manager.uid, targetName: who, restaurantId: rid, description: `${who} მოიხსნა მენეჯერობიდან (${rid})` })
    ),
  ])
}

export function removeManager(manager: UserProfile): Promise<void> {
  return setManagerRestaurants(manager, [])
}
