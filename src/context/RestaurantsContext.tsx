import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { subscribePublishedRestaurants } from '../services/restaurantService'
import type { Restaurant } from '../data/types'

export interface RestaurantsContextValue {
  restaurants: Restaurant[]
  loading: boolean
  getBySlug: (slug: string) => Restaurant | undefined
}

export const RestaurantsContext = createContext<RestaurantsContextValue | undefined>(undefined)

const FIRST_SNAPSHOT_TIMEOUT_MS = 8000
const EMPTY: Restaurant[] = []

// The list from the previous visit is shown straight away while Firestore (a large script plus a
// network round trip) catches up; the live data replaces it as soon as it arrives.
const CACHE_KEY = 'urigod-restaurants-v1'
const CACHE_MAX_CHARS = 1_500_000

function readCache(): Restaurant[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const list = JSON.parse(raw) as Restaurant[]
    return Array.isArray(list) && list.length ? list.map((r) => ({ ...r, updatedAt: r.updatedAt ? new Date(r.updatedAt) : null })) : null
  } catch {
    return null
  }
}

function writeCache(list: Restaurant[]) {
  try {
    const raw = JSON.stringify(list)
    if (list.length && raw.length <= CACHE_MAX_CHARS) localStorage.setItem(CACHE_KEY, raw)
    else localStorage.removeItem(CACHE_KEY)
  } catch {
    /* storage full or unavailable — the site simply loads without the head start */
  }
}

type FirestoreState = { status: 'waiting' } | { status: 'ok'; list: Restaurant[] } | { status: 'failed' }

// Live subscription: edits made in the dashboard show up on the public site without a reload.
// Only real, published restaurants are ever shown. If Firestore is slow or unreachable the copy
// from the last visit stays on screen; a late first snapshot still replaces it when it arrives.
export function RestaurantsProvider({ children }: { children: ReactNode }) {
  const [firestore, setFirestore] = useState<FirestoreState>({ status: 'waiting' })
  const [cached] = useState(readCache)

  useEffect(() => {
    const timer = setTimeout(() => setFirestore((s) => (s.status === 'waiting' ? { status: 'failed' } : s)), FIRST_SNAPSHOT_TIMEOUT_MS)
    const unsubscribe = subscribePublishedRestaurants(
      (list) => {
        setFirestore({ status: 'ok', list })
        writeCache(list)
      },
      (error) => {
        if (import.meta.env.DEV) console.warn('[urigod] restaurants subscription failed:', error)
        setFirestore({ status: 'failed' })
      }
    )
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  const restaurants = firestore.status === 'ok' ? firestore.list : (cached ?? EMPTY)
  const loading = firestore.status === 'waiting' && !cached

  const bySlug = useMemo(() => new Map(restaurants.map((r) => [r.slug, r])), [restaurants])
  const getBySlug = useCallback((slug: string) => bySlug.get(slug), [bySlug])

  const value = useMemo(() => ({ restaurants, loading, getBySlug }), [restaurants, loading, getBySlug])

  return <RestaurantsContext.Provider value={value}>{children}</RestaurantsContext.Provider>
}
