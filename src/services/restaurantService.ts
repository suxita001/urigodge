import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { logActivity, type LogInput } from './activityLogService'
import type {
  CuisineId,
  DayHours,
  LocalizedText,
  OpeningHours,
  Restaurant,
  RestaurantDoc,
} from '../data/types'

const COLLECTION = 'restaurants'
const restaurantsCol = collection(db, COLLECTION)
const restaurantRef = (id: string) => doc(db, COLLECTION, id)

export const DAYS: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const closedDay: DayHours = { open: '00:00', close: '00:00', closed: true }

export function normalizeHours(hours: Partial<OpeningHours> | undefined): OpeningHours {
  const result = {} as OpeningHours
  DAYS.forEach((day) => {
    result[day] = hours?.[day] ?? closedDay
  })
  return result
}

export function fromRestaurantDoc(id: string, data: Partial<RestaurantDoc>): Restaurant {
  const rawName = data.name as LocalizedText | string | undefined
  const nameI18n = typeof rawName === 'string' ? { ka: rawName, en: rawName } : { ka: rawName?.ka ?? '', en: rawName?.en ?? '' }
  const description = data.description ?? { ka: '', en: '' }
  const images = data.images ?? []
  const cuisine = data.cuisine
  return {
    id,
    slug: data.slug || id,
    name: nameI18n.en || nameI18n.ka || id,
    nameI18n,
    description,
    shortDescription: data.shortDescription?.ka || data.shortDescription?.en ? data.shortDescription : description,
    category: data.category ?? 'restaurant',
    cuisine: (Array.isArray(cuisine) ? cuisine : cuisine ? [cuisine] : []) as CuisineId[],
    priceLevel: data.priceLevel ?? 2,
    images,
    coverImage: data.coverImage || images[0] || '',
    logo: data.logo || undefined,
    address: data.address ?? { ka: '', en: '' },
    neighborhood: data.neighborhood ?? 'old-tbilisi',
    phone: data.phone ?? '',
    website: data.website || undefined,
    socialLinks: data.socialLinks,
    coordinates: data.coordinates ?? { lat: 41.6938, lng: 44.8015 },
    openingHours: normalizeHours(data.openingHours),
    branches: data.branches ?? [],
    menu: data.menu ?? [],
    features: data.features ?? [],
    qrEnabled: !!data.qrEnabled,
    popularity: data.popularity ?? 0,
    status: data.status === 'draft' ? 'draft' : 'published',
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate?.() ?? null,
  }
}

export type RestaurantInput = Omit<RestaurantDoc, 'createdAt' | 'updatedAt'>

export function toRestaurantDoc(r: Restaurant): RestaurantInput {
  return {
    name: r.nameI18n,
    slug: r.slug,
    description: r.description,
    shortDescription: r.shortDescription,
    category: r.category,
    cuisine: r.cuisine,
    priceLevel: r.priceLevel,
    images: r.images,
    coverImage: r.coverImage,
    logo: r.logo,
    address: r.address,
    neighborhood: r.neighborhood,
    phone: r.phone,
    website: r.website,
    socialLinks: r.socialLinks,
    coordinates: r.coordinates,
    openingHours: r.openingHours,
    branches: r.branches,
    menu: r.menu,
    features: r.features,
    qrEnabled: r.qrEnabled,
    popularity: r.popularity,
    status: r.status,
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// ---- Reads ----

type Unsubscribe = () => void

/** Public site: live list of published restaurants (rules only allow list queries filtered this way). */
export function subscribePublishedRestaurants(onChange: (list: Restaurant[]) => void, onError: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(restaurantsCol, where('status', '==', 'published')),
    (snap) => onChange(snap.docs.map((d) => fromRestaurantDoc(d.id, d.data() as Partial<RestaurantDoc>))),
    onError
  )
}

/** Admin: every restaurant including drafts. */
export function subscribeAllRestaurants(onChange: (list: Restaurant[]) => void, onError: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    restaurantsCol,
    (snap) => onChange(snap.docs.map((d) => fromRestaurantDoc(d.id, d.data() as Partial<RestaurantDoc>))),
    onError
  )
}

export function subscribeRestaurant(id: string, onChange: (r: Restaurant | null) => void, onError: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    restaurantRef(id),
    (snap) => onChange(snap.exists() ? fromRestaurantDoc(snap.id, snap.data() as Partial<RestaurantDoc>) : null),
    onError
  )
}

// ---- Writes (authorization enforced by firestore.rules) ----

export async function restaurantExists(id: string): Promise<boolean> {
  return (await getDoc(restaurantRef(id))).exists()
}

export async function createRestaurant(data: RestaurantInput): Promise<string> {
  const id = data.slug
  await setDoc(restaurantRef(id), {
    ...data,
    createdBy: auth.currentUser?.uid ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const name = data.name.ka || data.name.en
  await logActivity({ action: 'RESTAURANT_CREATED', targetType: 'restaurant', targetId: id, targetName: name, restaurantId: id, description: `დაემატა რესტორანი „${name}“` })
  if (data.menu.length) {
    await logActivity({ action: 'MENU_CREATED', targetType: 'menu', targetId: id, targetName: name, restaurantId: id, description: `„${name}“-ს მენიუ შეიქმნა (${data.menu.length} კატეგორია)` })
  }
  return id
}

export type RestaurantPatch = Partial<Omit<RestaurantDoc, 'createdAt' | 'updatedAt' | 'slug'>>

/** Updates a restaurant and records one or more activity-log entries describing the change. */
export async function updateRestaurant(
  restaurant: Pick<Restaurant, 'id' | 'name'>,
  patch: RestaurantPatch,
  logs: Omit<LogInput, 'restaurantId' | 'targetId' | 'targetName' | 'targetType'>[] = [
    { action: 'RESTAURANT_UPDATED', description: `„${restaurant.name}“ განახლდა` },
  ]
): Promise<void> {
  await updateDoc(restaurantRef(restaurant.id), { ...patch, updatedAt: serverTimestamp() })
  await Promise.all(
    logs.map((l) =>
      logActivity({
        ...l,
        targetType: l.action.startsWith('MENU') ? 'menu' : l.action.startsWith('BRANCH') ? 'branch' : 'restaurant',
        targetId: restaurant.id,
        targetName: restaurant.name,
        restaurantId: restaurant.id,
      })
    )
  )
}

export async function deleteRestaurant(restaurant: Pick<Restaurant, 'id' | 'name'>): Promise<void> {
  await deleteDoc(restaurantRef(restaurant.id))
  await logActivity({
    action: 'RESTAURANT_DELETED',
    targetType: 'restaurant',
    targetId: restaurant.id,
    targetName: restaurant.name,
    restaurantId: restaurant.id,
    description: `წაიშალა რესტორანი „${restaurant.name}“`,
  })
}
