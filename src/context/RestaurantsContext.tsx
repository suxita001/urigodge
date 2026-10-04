import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadDemoRestaurants, subscribePublishedRestaurants } from '../services/restaurantService'
import { subscribeSettings, DEFAULT_SETTINGS } from '../services/adminService'
import type { Restaurant, SiteSettings } from '../data/types'

export type RestaurantSource = 'firestore' | 'demo'

export interface RestaurantsContextValue {
  restaurants: Restaurant[]
  loading: boolean
  source: RestaurantSource | null
  getBySlug: (slug: string) => Restaurant | undefined
}

export const RestaurantsContext = createContext<RestaurantsContextValue | undefined>(undefined)

const FIRST_SNAPSHOT_TIMEOUT_MS = 5000
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
// While Firestore has no published restaurants (or is unreachable) the bundled demo data is shown,
// unless the super admin turned that off in Settings.
export function RestaurantsProvider({ children }: { children: ReactNode }) {
  const [firestore, setFirestore] = useState<FirestoreState>({ status: 'waiting' })
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [demo, setDemo] = useState<Restaurant[] | null>(null)
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

  useEffect(() => {
    const timer = setTimeout(() => setSettings((s) => s ?? DEFAULT_SETTINGS), FIRST_SNAPSHOT_TIMEOUT_MS)
    const unsubscribe = subscribeSettings(setSettings)
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  const firestoreEmpty = firestore.status === 'failed' || (firestore.status === 'ok' && firestore.list.length === 0)
  const wantDemo = firestoreEmpty && (firestore.status === 'failed' || settings?.demoFallback !== false)
  const decided = firestore.status === 'failed' || (firestore.status === 'ok' && (firestore.list.length > 0 || settings !== null))

  useEffect(() => {
    if (wantDemo && !demo) loadDemoRestaurants().then(setDemo)
  }, [wantDemo, demo])

  let restaurants = EMPTY
  let source: RestaurantSource | null = null
  let loading = true
  if (firestore.status === 'waiting' && cached) {
    restaurants = cached
    source = 'firestore'
    loading = false
  } else if (decided) {
    if (wantDemo) {
      restaurants = demo ?? EMPTY
      source = 'demo'
      loading = !demo
    } else {
      restaurants = firestore.status === 'ok' ? firestore.list : EMPTY
      source = 'firestore'
      loading = false
    }
  }

  const bySlug = useMemo(() => new Map(restaurants.map((r) => [r.slug, r])), [restaurants])
  const getBySlug = useCallback((slug: string) => bySlug.get(slug), [bySlug])

  const value = useMemo(() => ({ restaurants, loading, source, getBySlug }), [restaurants, loading, source, getBySlug])

  return <RestaurantsContext.Provider value={value}>{children}</RestaurantsContext.Provider>
}
