// Read-only access to published restaurants through the Firestore REST API. No credentials:
// the same security rules that guard the public site apply (only `status == published` is readable).
const PROJECT_ID = 'urigodge-90c46'
const DOCUMENTS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

interface Localized {
  ka: string
  en: string
}

interface DayHours {
  open: string
  close: string
  closed?: boolean
}

export interface ApiMenuItem {
  name: Localized
  description: Localized
  price: number
  image?: string
  available?: boolean
}

export interface ApiRestaurant {
  slug: string
  name: Localized
  description: Localized
  shortDescription: Localized
  category: string
  cuisine: string[]
  priceLevel: number
  images: string[]
  coverImage: string
  address: Localized
  neighborhood: string
  phone: string
  website?: string
  socialLinks?: { instagram?: string; facebook?: string }
  coordinates: { lat: number; lng: number }
  openingHours: Record<string, DayHours | undefined>
  menu: { name: Localized; items: ApiMenuItem[] }[]
  popularity: number
  updatedAt?: string
}

type FsValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
  mapValue?: { fields?: Record<string, FsValue> }
  arrayValue?: { values?: FsValue[] }
}

function decode(value: FsValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return Number(value.integerValue)
  if (value.doubleValue !== undefined) return value.doubleValue
  if (value.booleanValue !== undefined) return value.booleanValue
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.mapValue) return decodeFields(value.mapValue.fields ?? {})
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode)
  return null
}

const decodeFields = (fields: Record<string, FsValue>): Record<string, unknown> => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]))

const text = (v: unknown): Localized => {
  if (typeof v === 'string') return { ka: v, en: v }
  const o = (v ?? {}) as Partial<Localized>
  return { ka: o.ka ?? '', en: o.en ?? '' }
}

function toRestaurant(id: string, raw: Record<string, unknown>, updateTime?: string): ApiRestaurant {
  const images = Array.isArray(raw.images) ? (raw.images as string[]) : []
  const cuisine = raw.cuisine
  const description = text(raw.description)
  const short = text(raw.shortDescription)
  const menu = Array.isArray(raw.menu) ? (raw.menu as { name?: unknown; items?: Record<string, unknown>[] }[]) : []
  return {
    slug: (raw.slug as string) || id,
    name: text(raw.name),
    description,
    shortDescription: short.ka || short.en ? short : description,
    category: (raw.category as string) ?? 'restaurant',
    cuisine: Array.isArray(cuisine) ? (cuisine as string[]) : cuisine ? [cuisine as string] : [],
    priceLevel: Number(raw.priceLevel) || 2,
    images,
    coverImage: (raw.coverImage as string) || images[0] || '',
    address: text(raw.address),
    neighborhood: (raw.neighborhood as string) ?? '',
    phone: (raw.phone as string) ?? '',
    website: (raw.website as string) || undefined,
    socialLinks: raw.socialLinks as ApiRestaurant['socialLinks'],
    coordinates: (raw.coordinates as ApiRestaurant['coordinates']) ?? { lat: 41.6938, lng: 44.8015 },
    openingHours: (raw.openingHours as ApiRestaurant['openingHours']) ?? {},
    menu: menu.map((c) => ({
      name: text(c.name),
      items: (c.items ?? []).map((i) => ({
        name: text(i.name),
        description: text(i.description),
        price: Number(i.price) || 0,
        image: (i.image as string) || undefined,
        available: i.available !== false,
      })),
    })),
    popularity: Number(raw.popularity) || 0,
    updatedAt: updateTime,
  }
}

const CACHE_MS = 5 * 60_000
let listCache: { at: number; data: ApiRestaurant[] } | null = null

export async function listRestaurants(): Promise<ApiRestaurant[]> {
  if (listCache && Date.now() - listCache.at < CACHE_MS) return listCache.data
  const res = await fetch(`${DOCUMENTS}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'restaurants' }],
        where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
      },
    }),
  })
  if (!res.ok) {
    if (listCache) return listCache.data
    throw new Error(`Firestore list failed: ${res.status}`)
  }
  const rows = (await res.json()) as { document?: { name: string; fields?: Record<string, FsValue>; updateTime?: string } }[]
  const data = rows
    .filter((row) => row.document)
    .map((row) => toRestaurant(row.document!.name.split('/').pop()!, decodeFields(row.document!.fields ?? {}), row.document!.updateTime))
  listCache = { at: Date.now(), data }
  return data
}

export async function getRestaurant(slug: string): Promise<ApiRestaurant | null> {
  const cached = listCache && Date.now() - listCache.at < CACHE_MS ? listCache.data.find((r) => r.slug === slug) : undefined
  if (cached) return cached
  const res = await fetch(`${DOCUMENTS}/restaurants/${encodeURIComponent(slug)}`)
  if (!res.ok) return null
  const doc = (await res.json()) as { fields?: Record<string, FsValue>; updateTime?: string }
  return toRestaurant(slug, decodeFields(doc.fields ?? {}), doc.updateTime)
}
