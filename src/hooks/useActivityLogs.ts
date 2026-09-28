import { useCallback, useEffect, useRef, useState } from 'react'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import type { ActivityLog } from '../data/types'
import { fetchLogs, type LogQuery } from '../services/activityLogService'

/** Paginated activity log ("load more"). Pass `enabled: false` until the query is valid for the viewer's role. */
export function useActivityLogs(filters: LogQuery, { pageSize = 20, enabled = true } = {}) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const cursor = useRef<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const key = JSON.stringify(filters)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchLogs(JSON.parse(key, (k, v) => (k === 'since' || k === 'until') && v ? new Date(v) : v) as LogQuery, pageSize)
      .then((page) => {
        if (cancelled) return
        cursor.current = page.cursor
        setLogs(page.logs)
        setHasMore(!!page.cursor)
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [key, pageSize, enabled, reloadToken])

  const loadMore = useCallback(async () => {
    if (!cursor.current) return
    setLoadingMore(true)
    try {
      const page = await fetchLogs(filters, pageSize, cursor.current)
      cursor.current = page.cursor
      setLogs((prev) => [...prev, ...page.logs])
      setHasMore(!!page.cursor)
    } catch (e) {
      setError(e)
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pageSize])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  return { logs, loading: enabled ? loading : false, loadingMore, hasMore, error, loadMore, reload }
}
