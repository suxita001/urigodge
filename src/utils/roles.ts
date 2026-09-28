import type { UserProfile, UserRole } from '../data/types'

// Mirrors SUPER_ADMIN_EMAIL in firestore.rules / storage.rules, which is where it is actually enforced.
export const SUPER_ADMIN_EMAIL = 'nikasuxita96@gmail.com'

type MaybeProfile = UserProfile | null | undefined

// These checks only shape the UI. Real authorization is enforced by firestore.rules / storage.rules.
export function hasRole(profile: MaybeProfile, role: UserRole): boolean {
  return profile?.role === role && profile.status !== 'blocked'
}

export function isSuperAdmin(profile: MaybeProfile): boolean {
  return hasRole(profile, 'super_admin')
}

export function isAdmin(profile: MaybeProfile): boolean {
  return hasRole(profile, 'admin') || isSuperAdmin(profile)
}

export function isRestaurantManager(profile: MaybeProfile): boolean {
  return hasRole(profile, 'restaurant_manager')
}

/** Kept for the naming used elsewhere in the app. */
export const isRestaurantOwner = isRestaurantManager

export function isUser(profile: MaybeProfile): boolean {
  return hasRole(profile, 'user')
}

export function isStaff(profile: MaybeProfile): boolean {
  return isAdmin(profile) || isRestaurantManager(profile)
}

export function canManageRestaurant(profile: MaybeProfile, restaurantId: string): boolean {
  if (isAdmin(profile)) return true
  return isRestaurantManager(profile) && !!profile?.managedRestaurantIds.includes(restaurantId)
}

export function isProtectedAccount(target: Pick<UserProfile, 'role' | 'email'>): boolean {
  return target.role === 'super_admin' || target.email.toLowerCase() === SUPER_ADMIN_EMAIL
}

/** Roles the actor may assign to someone else (mirrors firestore.rules). */
export function assignableRoles(actor: MaybeProfile): UserRole[] {
  if (isSuperAdmin(actor)) return ['user', 'restaurant_manager', 'admin']
  if (isAdmin(actor)) return ['user', 'restaurant_manager']
  return []
}

export function canEditUser(actor: MaybeProfile, target: UserProfile): boolean {
  if (!isAdmin(actor) || isProtectedAccount(target)) return false
  if (target.role === 'admin') return isSuperAdmin(actor)
  return true
}
