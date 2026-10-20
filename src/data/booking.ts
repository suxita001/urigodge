import type { LocalizedText } from './types'

// ---------------------------------------------------------------- floor plans

export type FloorItemType = 'table' | 'toilet' | 'entrance' | 'stage' | 'bar' | 'kitchen' | 'stairs' | 'window' | 'wall' | 'plant'

/** One thing on a floor plan. Coordinates and sizes are in plan units (the floor is `width` × `height`). */
export interface FloorItem {
  id: string
  type: FloorItemType
  x: number
  y: number
  w: number
  h: number
  /** Tables only. */
  shape?: 'round' | 'rect'
  seats?: number
  /** What guests see, e.g. "T4" or "ტერასა". */
  label?: string
}

export interface Floor {
  id: string
  name: LocalizedText
  order: number
  width: number
  height: number
  items: FloorItem[]
}

// ---------------------------------------------------------------- settings on the restaurant document

/** Switched on by an admin — managers cannot change these. */
export interface BookingAccess {
  /** Guests can reserve at this restaurant. */
  enabled: boolean
  /** Guests pick a table on the floor plan; without it they fill in a short form. */
  floorPlan: boolean
}

/** Chosen by the restaurant's manager. */
export interface BookingPrefs {
  /** Confirm automatically instead of waiting for the manager. */
  autoConfirm: boolean
  /** How long a table is held for one reservation. */
  durationMinutes: number
  /** Distance between the times guests can choose. */
  slotMinutes: number
  maxParty: number
  /** How many days ahead guests can book. */
  daysAhead: number
}

export const DEFAULT_BOOKING_ACCESS: BookingAccess = { enabled: false, floorPlan: false }
export const DEFAULT_BOOKING_PREFS: BookingPrefs = { autoConfirm: false, durationMinutes: 120, slotMinutes: 30, maxParty: 12, daysAhead: 14 }

// ---------------------------------------------------------------- reservations

export type ReservationStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'

export interface Reservation {
  id: string
  restaurantId: string
  restaurantName: string
  mode: 'table' | 'form'
  floorId?: string
  floorName?: string
  tableId?: string
  tableLabel?: string
  /** YYYY-MM-DD in Tbilisi time. */
  date: string
  /** HH:MM */
  start: string
  end: string
  partySize: number
  name: string
  phone: string
  note: string
  status: ReservationStatus
  managerNote?: string
  createdBy: string
  createdAt: Date | null
  updatedAt: Date | null
}

export const ITEM_LABELS: Record<FloorItemType, LocalizedText> = {
  table: { ka: 'მაგიდა', en: 'Table' },
  toilet: { ka: 'ტუალეტი', en: 'Toilet' },
  entrance: { ka: 'შესასვლელი', en: 'Entrance' },
  stage: { ka: 'სცენა', en: 'Stage' },
  bar: { ka: 'ბარი', en: 'Bar' },
  kitchen: { ka: 'სამზარეულო', en: 'Kitchen' },
  stairs: { ka: 'კიბე', en: 'Stairs' },
  window: { ka: 'ფანჯარა', en: 'Window' },
  wall: { ka: 'კედელი', en: 'Wall' },
  plant: { ka: 'მცენარე', en: 'Plant' },
}
