import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Coordinates } from '../data/types'

export interface UserLocation extends Coordinates {
  /** Radius of uncertainty reported by the device, in metres. */
  accuracy: number
}

export type LocateFailure = 'denied' | 'failed' | 'unsupported'

interface LocationContextValue {
  location: UserLocation | null
  locating: boolean
  /**
   * Asks the browser for the visitor's position (prompting for permission the first time) and keeps
   * it updated afterwards. Resolves with the position or the reason it could not be obtained.
   */
  locate: () => Promise<UserLocation | LocateFailure>
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

const STORAGE_KEY = 'urigod-location'

function remembered(): UserLocation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserLocation) : null
  } catch {
    return null
  }
}

// The position never leaves the browser: it is only used to draw the dot on the map and to sort by distance.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(remembered)
  const [locating, setLocating] = useState(false)
  const watchId = useRef<number | null>(null)
  const pending = useRef<Promise<UserLocation | LocateFailure> | null>(null)
  const latest = useRef(location)
  latest.current = location

  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    },
    []
  )

  const locate = useCallback((): Promise<UserLocation | LocateFailure> => {
    if (watchId.current !== null && latest.current) return Promise.resolve(latest.current)
    if (pending.current) return pending.current
    if (!('geolocation' in navigator)) return Promise.resolve('unsupported')

    setLocating(true)
    pending.current = new Promise((resolve) => {
      let first = true
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
          setLocation(here)
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(here))
          } catch {
            /* private mode */
          }
          if (first) {
            first = false
            setLocating(false)
            pending.current = null
            resolve(here)
          }
        },
        (err) => {
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
          if (first) {
            first = false
            setLocating(false)
            pending.current = null
            resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'failed')
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      )
    })
    return pending.current
  }, [])

  const value = useMemo(() => ({ location, locating, locate }), [location, locating, locate])
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useUserLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useUserLocation must be used within LocationProvider')
  return ctx
}
