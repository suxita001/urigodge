import { useCallback, useEffect, useState } from 'react'
import type { Invitation, Restaurant, UserProfile } from '../data/types'
import { subscribeUsers, fetchAdminStats, type AdminStats } from '../services/adminService'
import { subscribeInvitations } from '../services/invitationService'
import { subscribeAllRestaurants, subscribeRestaurant } from '../services/restaurantService'
import { useAuth } from './useAuth'

type Loadable<T> = { data: T; loading: boolean; error: Error | null }

function useSubscription<T>(subscribe: ((set: (v: T) => void, err: (e: Error) => void) => () => void) | null, initial: T): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ data: initial, loading: !!subscribe, error: null })
  useEffect(() => {
    if (!subscribe) return
    return subscribe(
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [subscribe])
  return state
}

const NO_USERS: UserProfile[] = []
const NO_INVITATIONS: Invitation[] = []
const NO_RESTAURANTS: Restaurant[] = []

/** Admin only: every user profile, newest first (live). */
export function useUsers() {
  const { isAdmin } = useAuth()
  const subscribe = useCallback((set: (v: UserProfile[]) => void, err: (e: Error) => void) => subscribeUsers(set, err), [])
  const { data, loading, error } = useSubscription(isAdmin ? subscribe : null, NO_USERS)
  return { users: data, loading, error }
}

/** Admin only: pending/accepted role invitations (live). */
export function useInvitations() {
  const { isAdmin } = useAuth()
  const subscribe = useCallback((set: (v: Invitation[]) => void, err: (e: Error) => void) => subscribeInvitations(set, err), [])
  const { data, loading } = useSubscription(isAdmin ? subscribe : null, NO_INVITATIONS)
  return { invitations: data, loading }
}

export function useAdminStats(refreshKey = 0) {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    fetchAdminStats()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats({ users: 0, restaurants: 0, managers: 0, admins: 0, recentActivities: 0 }))
    return () => {
      cancelled = true
    }
  }, [isAdmin, refreshKey])
  return stats
}

/** Restaurants the current staff member can manage: all for admins, assigned ones for managers (live). */
export function useManagedRestaurants() {
  const { isAdmin, isRestaurantManager, profile } = useAuth()
  const idsKey = isRestaurantManager ? (profile?.managedRestaurantIds ?? []).join('|') : ''
  const [state, setState] = useState<{ key: string; list: Restaurant[]; loading: boolean }>({ key: '', list: NO_RESTAURANTS, loading: true })
  const key = isAdmin ? 'admin' : `mgr:${idsKey}`

  useEffect(() => {
    if (isAdmin) {
      return subscribeAllRestaurants(
        (list) => setState({ key: 'admin', list: [...list].sort((a, b) => a.name.localeCompare(b.name)), loading: false }),
        () => setState({ key: 'admin', list: NO_RESTAURANTS, loading: false })
      )
    }
    const ids = idsKey ? idsKey.split('|') : []
    const k = `mgr:${idsKey}`
    if (ids.length === 0) {
      setState({ key: k, list: NO_RESTAURANTS, loading: false })
      return
    }
    const found = new Map<string, Restaurant | null>()
    const emit = () => {
      if (found.size < ids.length) return
      setState({ key: k, list: ids.map((id) => found.get(id)).filter((r): r is Restaurant => !!r), loading: false })
    }
    const unsubs = ids.map((id) =>
      subscribeRestaurant(
        id,
        (r) => {
          found.set(id, r)
          emit()
        },
        () => {
          found.set(id, null)
          emit()
        }
      )
    )
    return () => unsubs.forEach((u) => u())
  }, [isAdmin, idsKey])

  return state.key === key ? { restaurants: state.list, loading: state.loading } : { restaurants: NO_RESTAURANTS, loading: true }
}

/** One restaurant for editing (live), including drafts the public context doesn't load. */
export function useManagedRestaurant(id: string | undefined) {
  const [state, setState] = useState<{ id?: string; restaurant: Restaurant | null; loading: boolean }>({ restaurant: null, loading: true })
  useEffect(() => {
    if (!id) return
    return subscribeRestaurant(
      id,
      (restaurant) => setState({ id, restaurant, loading: false }),
      () => setState({ id, restaurant: null, loading: false })
    )
  }, [id])
  return state.id === id ? state : { restaurant: null, loading: true }
}
