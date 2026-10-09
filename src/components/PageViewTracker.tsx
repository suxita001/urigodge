import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/** Reports each public page a visitor opens. Staff browsing their own site are not counted. */
export default function PageViewTracker() {
  const { pathname } = useLocation()
  const { loading, isStaff } = useAuth()
  const last = useRef('')

  useEffect(() => {
    if (loading || isStaff || last.current === pathname) return
    last.current = pathname
    // Loaded on demand so the counter never delays the first paint.
    import('../services/analyticsService').then((m) => m.trackPageView()).catch(() => {})
  }, [pathname, loading, isStaff])

  return null
}
