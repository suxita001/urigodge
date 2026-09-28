import { useAuth } from './useAuth'

export function useUserRole() {
  const { profile, isAdmin, isSuperAdmin, isRestaurantManager, isStaff, profileLoading } = useAuth()
  return {
    role: profile?.role ?? null,
    managedRestaurantIds: profile?.managedRestaurantIds ?? [],
    isAdmin,
    isSuperAdmin,
    isRestaurantManager,
    isStaff,
    loading: profileLoading,
  }
}
