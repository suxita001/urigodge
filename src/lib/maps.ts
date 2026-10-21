import type { Coordinates } from '../data/types'

// Google Maps links for restaurants and branches. A saved place link (the "Share" link from Google
// Maps) opens the real place card — name, photos, reviews, hours. Without one we fall back to the
// stored coordinates.

const MAPS_HOSTS = /^(www\.)?(google\.[a-z.]+|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)$/i

/** True for links that Google Maps will open (full links and the short maps.app.goo.gl ones). */
export function isMapsUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    if (!MAPS_HOSTS.test(u.hostname)) return false
    return u.hostname.includes('maps') || u.pathname.startsWith('/maps') || u.hostname === 'goo.gl'
  } catch {
    return false
  }
}

/**
 * Reads the pin's coordinates out of a full Google Maps link, so pasting the link can also place
 * the pin. Short links (maps.app.goo.gl/…) carry no coordinates — for those this returns null.
 */
export function coordsFromMapsUrl(raw: string): Coordinates | null {
  const s = decodeURIComponent(raw)
  const pick = (lat: string, lng: string) => {
    const c = { lat: Number(lat), lng: Number(lng) }
    return Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 ? c : null
  }
  // the place's own position is in "!3d<lat>!4d<lng>" — prefer it over the map's centre ("@lat,lng")
  const place = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (place) return pick(place[1], place[2])
  const q = s.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
  if (q) return pick(q[1], q[2])
  const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return pick(at[1], at[2])
  return null
}

/** Opens the place on Google Maps: its own link if saved, otherwise a pin at the coordinates. */
export const placeLink = (mapsUrl: string | undefined, c: Coordinates) =>
  mapsUrl && isMapsUrl(mapsUrl) ? mapsUrl.trim() : `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`

/** Directions: the place link (its page has the route button and the right entrance) or a route to the coordinates. */
export const directionsLink = (mapsUrl: string | undefined, c: Coordinates) =>
  mapsUrl && isMapsUrl(mapsUrl) ? mapsUrl.trim() : `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
