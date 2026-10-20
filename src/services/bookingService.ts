import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch, type Timestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { OpeningHours, Restaurant } from '../data/types'
import { DEFAULT_BOOKING_PREFS, type BookingPrefs, type Floor, type FloorItem, type Reservation, type ReservationStatus } from '../data/booking'

// Reservations live in their own collection (readable only by the guest who made them, the
// restaurant's managers and admins). Which tables are taken is public, but carries no personal
// data: every reserved table × time slot gets a "lock" document whose ID is unique, so the database
// itself refuses a second booking of the same table at the same time.

const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000
export const tbilisiToday = (d = new Date()) => new Date(d.getTime() + TBILISI_OFFSET_MS).toISOString().slice(0, 10)
const tbilisiMinutesNow = () => { const d = new Date(Date.now() + TBILISI_OFFSET_MS); return d.getUTCHours() * 60 + d.getUTCMinutes() }

export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0) }
export const fromMin = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
export const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const DAY_KEYS: (keyof OpeningHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const weekdayOf = (date: string) => DAY_KEYS[new Date(`${date}T12:00:00Z`).getUTCDay()]

export const prefsOf = (r: Pick<Restaurant, 'bookingPrefs'>): BookingPrefs => ({ ...DEFAULT_BOOKING_PREFS, ...(r.bookingPrefs ?? {}) })

/**
 * Start times a guest can pick on `date`: from opening time until the table would have to be given
 * back after closing, every `slotMinutes`. Today only offers times at least 30 minutes away.
 */
export function startTimes(hours: OpeningHours, date: string, prefs: BookingPrefs): string[] {
  const day = hours[weekdayOf(date)]
  if (!day || day.closed) return []
  const open = toMin(day.open)
  let close = toMin(day.close)
  if (close <= open) close = 24 * 60 // open past midnight: bookings stay on the same calendar day
  const last = Math.min(close, 24 * 60) - Math.min(prefs.durationMinutes, 90)
  const earliest = date === tbilisiToday() ? tbilisiMinutesNow() + 30 : 0
  const out: string[] = []
  for (let m = Math.ceil(open / prefs.slotMinutes) * prefs.slotMinutes; m <= last; m += prefs.slotMinutes) if (m >= earliest) out.push(fromMin(m))
  return out
}

/** The lock slots a booking occupies: start, start + slot, … until the end (exclusive). */
export function slotsOf(start: string, prefs: BookingPrefs): string[] {
  const s = toMin(start), e = Math.min(24 * 60, s + prefs.durationMinutes), out: string[] = []
  for (let m = s; m < e; m += prefs.slotMinutes) out.push(fromMin(m).replace(':', ''))
  return out
}
export const endOf = (start: string, prefs: BookingPrefs) => fromMin(Math.min(24 * 60 - 1, toMin(start) + prefs.durationMinutes))
const lockId = (date: string, tableId: string, slot: string) => `${date}_${tableId}_${slot}`

// ---------------------------------------------------------------- floors

const floorsCol = (rid: string) => collection(db, 'restaurants', rid, 'floors')

export function subscribeFloors(rid: string, onChange: (floors: Floor[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    floorsCol(rid),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Floor, 'id'>) })).sort((a, b) => a.order - b.order)),
    (e) => (onError ? onError(e) : onChange([]))
  )
}

export async function saveFloors(rid: string, floors: Floor[], removedIds: string[]) {
  const batch = writeBatch(db)
  floors.forEach((f, i) => {
    const { id, ...data } = f
    batch.set(doc(floorsCol(rid), id), { ...data, order: i, items: data.items.map(cleanItem) })
  })
  removedIds.forEach((id) => batch.delete(doc(floorsCol(rid), id)))
  await batch.commit()
}
function cleanItem(it: FloorItem): FloorItem {
  const out: FloorItem = { id: it.id, type: it.type, x: Math.round(it.x), y: Math.round(it.y), w: Math.round(it.w), h: Math.round(it.h) }
  if (it.type === 'table') { out.shape = it.shape ?? 'round'; out.seats = Math.max(1, Math.min(20, Math.round(it.seats ?? 4))) }
  if (it.label?.trim()) out.label = it.label.trim().slice(0, 24)
  return out
}

// ---------------------------------------------------------------- availability

export function subscribeTakenTables(rid: string, date: string, onChange: (taken: Map<string, Set<string>>) => void) {
  return onSnapshot(
    query(collection(db, 'restaurants', rid, 'locks'), where('date', '==', date)),
    (snap) => {
      const taken = new Map<string, Set<string>>()
      snap.docs.forEach((d) => { const { tableId, slot } = d.data() as { tableId: string; slot: string }; if (!taken.has(tableId)) taken.set(tableId, new Set()); taken.get(tableId)!.add(slot) })
      onChange(taken)
    },
    () => onChange(new Map())
  )
}
export const tableFree = (taken: Map<string, Set<string>>, tableId: string, slots: string[]) => !slots.some((s) => taken.get(tableId)?.has(s))

// ---------------------------------------------------------------- reservations

const resCol = collection(db, 'reservations')
const toDate = (v: unknown) => (v as Timestamp | undefined)?.toDate?.() ?? null
const fromDoc = (id: string, d: Record<string, unknown>): Reservation => ({ ...(d as unknown as Reservation), id, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) })

export interface NewReservation {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'nameI18n' | 'bookingPrefs'>
  date: string
  start: string
  partySize: number
  name: string
  phone: string
  note: string
  table?: { floorId: string; floorName: string; tableId: string; tableLabel: string }
}

/** Creates the reservation and, for a chosen table, its time-slot locks — all or nothing. */
export async function createReservation(input: NewReservation): Promise<Reservation> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  const prefs = prefsOf(input.restaurant)
  const ref = doc(resCol)
  const status: ReservationStatus = prefs.autoConfirm ? 'confirmed' : 'pending'
  const data = {
    restaurantId: input.restaurant.id,
    restaurantName: input.restaurant.nameI18n.ka || input.restaurant.name,
    mode: input.table ? 'table' : 'form',
    ...(input.table ?? {}),
    date: input.date,
    start: input.start,
    end: endOf(input.start, prefs),
    partySize: input.partySize,
    name: input.name.trim().slice(0, 80),
    phone: input.phone.trim().slice(0, 30),
    note: input.note.trim().slice(0, 300),
    status,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const batch = writeBatch(db)
  batch.set(ref, data)
  if (input.table) {
    for (const slot of slotsOf(input.start, prefs)) {
      batch.set(doc(db, 'restaurants', input.restaurant.id, 'locks', lockId(input.date, input.table.tableId, slot)), {
        reservationId: ref.id, tableId: input.table.tableId, floorId: input.table.floorId, date: input.date, slot,
      })
    }
  }
  await batch.commit()
  return fromDoc(ref.id, { ...data, createdAt: null, updatedAt: null })
}

/** Changes a reservation's status; declining or cancelling frees the table again. */
export async function setReservationStatus(r: Reservation, status: ReservationStatus, prefsForSlots: BookingPrefs, managerNote?: string) {
  const batch = writeBatch(db)
  batch.update(doc(resCol, r.id), { status, updatedAt: serverTimestamp(), ...(managerNote !== undefined ? { managerNote: managerNote.slice(0, 300) } : {}) })
  if ((status === 'declined' || status === 'cancelled') && r.mode === 'table' && r.tableId) {
    // the slots are re-derived from the stored start/end, so a later change of duration cannot orphan locks
    const s = toMin(r.start), e = toMin(r.end) + 1
    for (let m = s; m < e && m < 24 * 60; m += prefsForSlots.slotMinutes) batch.delete(doc(db, 'restaurants', r.restaurantId, 'locks', lockId(r.date, r.tableId, fromMin(m).replace(':', ''))))
  }
  await batch.commit()
}

export function subscribeMyReservations(uid: string, onChange: (list: Reservation[]) => void) {
  return onSnapshot(query(resCol, where('createdBy', '==', uid)), (s) => onChange(sortRes(s.docs.map((d) => fromDoc(d.id, d.data())))), () => onChange([]))
}
export function subscribeRestaurantReservations(rid: string, onChange: (list: Reservation[]) => void) {
  return onSnapshot(query(resCol, where('restaurantId', '==', rid)), (s) => onChange(sortRes(s.docs.map((d) => fromDoc(d.id, d.data())))), () => onChange([]))
}
/** Admins: everything from `fromDate` on. */
export function subscribeAllReservations(fromDate: string, onChange: (list: Reservation[]) => void) {
  return onSnapshot(query(resCol, where('date', '>=', fromDate), orderBy('date')), (s) => onChange(sortRes(s.docs.map((d) => fromDoc(d.id, d.data())))), () => onChange([]))
}
const sortRes = (l: Reservation[]) => l.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
