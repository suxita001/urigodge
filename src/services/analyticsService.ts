import { collection, doc, documentId, getDocs, increment, orderBy, query, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Home-grown visit counter: one Firestore document per day (analytics/2026-10-09) holding two
// numbers. The security rules only let a visitor add exactly one to them, and only admins can read.

export interface DayStats {
  /** YYYY-MM-DD, Tbilisi time. */
  day: string
  /** Pages opened. */
  views: number
  /** Different browsers that came that day. */
  visitors: number
}

const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000
const VISITOR_KEY = 'urigod-visit-day'

export const dayKey = (date = new Date()) => new Date(date.getTime() + TBILISI_OFFSET_MS).toISOString().slice(0, 10)

const isBot = () => navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent)
const isLocal = () => /^(localhost|127\.|\[::1\])/.test(window.location.hostname) || window.location.hostname.endsWith('.local')

/** Counts one page view; the first view of the day from this browser also counts a visitor. Never throws. */
export async function trackPageView(): Promise<void> {
  if (isLocal() || isBot()) return
  const day = dayKey()
  let newVisitor = false
  try {
    newVisitor = localStorage.getItem(VISITOR_KEY) !== day
  } catch {
    /* private mode: every view would look like a new visitor, so count none */
  }
  try {
    await setDoc(doc(db, 'analytics', day), { day, views: increment(1), ...(newVisitor ? { visitors: increment(1) } : {}) }, { merge: true })
    if (newVisitor) localStorage.setItem(VISITOR_KEY, day)
  } catch {
    /* offline or blocked — statistics must never get in a visitor's way */
  }
}

/** The last `days` days, oldest first, with zeros for days nobody came. Admins only. */
export async function fetchDailyStats(days: number): Promise<DayStats[]> {
  const today = new Date()
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(today.getTime() - (days - 1 - i) * 86_400_000)))
  const snap = await getDocs(query(collection(db, 'analytics'), where(documentId(), '>=', keys[0]), orderBy(documentId())))
  const found = new Map(snap.docs.map((d) => [d.id, d.data() as Partial<DayStats>]))
  return keys.map((day) => ({ day, views: Number(found.get(day)?.views) || 0, visitors: Number(found.get(day)?.visitors) || 0 }))
}
