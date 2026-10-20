import { useSyncExternalStore } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { logActivity } from './activityLogService'

/**
 * Maintenance mode lives in settings/site. While it is on, visitors see a "temporarily unavailable"
 * page and the database itself refuses to hand out restaurants (see firestore.rules); staff who are
 * signed in keep using the site and the dashboard as usual.
 */
export interface SiteStatus {
  maintenance: boolean
  message: string
  /** False until the first answer from the database (the cached value is used meanwhile). */
  known: boolean
}

const ref = doc(db, 'settings', 'site')
const CACHE_KEY = 'urigod-site-status'

function readCache(): SiteStatus {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Partial<SiteStatus> | null
    if (c) return { maintenance: !!c.maintenance, message: c.message ?? '', known: false }
  } catch {
    /* no cache */
  }
  return { maintenance: false, message: '', known: false }
}

let status: SiteStatus = readCache()
const listeners = new Set<() => void>()
let started = false

function start() {
  if (started) return
  started = true
  onSnapshot(
    ref,
    (snap) => {
      const d = snap.data() ?? {}
      status = { maintenance: d.maintenance === true, message: typeof d.maintenanceMessage === 'string' ? d.maintenanceMessage : '', known: true }
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(status))
      } catch {
        /* storage unavailable */
      }
      listeners.forEach((fn) => fn())
    },
    () => {
      status = { ...status, known: true }
      listeners.forEach((fn) => fn())
    }
  )
}

const subscribe = (fn: () => void) => {
  start()
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useSiteStatus = () => useSyncExternalStore(subscribe, () => status)

/** Super admin only (enforced by the security rules). */
export async function setMaintenance(enabled: boolean, message: string): Promise<void> {
  await setDoc(ref, { maintenance: enabled, maintenanceMessage: message.trim(), updatedAt: serverTimestamp() }, { merge: true })
  await logActivity({
    action: 'SETTINGS_UPDATED',
    targetType: 'settings',
    targetId: 'site',
    description: enabled ? 'საიტი დაიმალა სტუმრებისთვის (მოვლის რეჟიმი ჩაირთო)' : 'საიტი ისევ ღიაა სტუმრებისთვის (მოვლის რეჟიმი გამოირთო)',
  })
}
