import type { Coordinates, Lang } from '../data/types'

/** Great-circle distance in metres. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(meters: number, lang: Lang): string {
  const m = lang === 'ka' ? 'მ' : 'm'
  const km = lang === 'ka' ? 'კმ' : 'km'
  if (meters < 950) return `${Math.max(50, Math.round(meters / 50) * 50)} ${m}`
  return `${meters < 9500 ? (meters / 1000).toFixed(1) : Math.round(meters / 1000)} ${km}`
}
