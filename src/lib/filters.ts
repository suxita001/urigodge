import type { CategoryId, CuisineId, NeighborhoodId, PriceLevel, Restaurant, Lang } from '../data/types'
import { isOpenNow } from '../data/helpers'

export type SortOption = 'recommended' | 'popular' | 'nearby' | 'az'

export interface FilterState {
  category: CategoryId | null
  cuisine: CuisineId | null
  neighborhood: NeighborhoodId | null
  price: PriceLevel | null
  openNow: boolean
  hasMenu: boolean
  hasQr: boolean
}

export const defaultFilters: FilterState = {
  category: null,
  cuisine: null,
  neighborhood: null,
  price: null,
  openNow: false,
  hasMenu: false,
  hasQr: false,
}

export function countActiveFilters(f: FilterState): number {
  let n = 0
  if (f.category) n++
  if (f.cuisine) n++
  if (f.neighborhood) n++
  if (f.price) n++
  if (f.openNow) n++
  if (f.hasMenu) n++
  if (f.hasQr) n++
  return n
}

export function applyFilters(restaurants: Restaurant[], filters: FilterState): Restaurant[] {
  return restaurants.filter((r) => {
    if (filters.category && r.category !== filters.category) return false
    if (filters.cuisine && !r.cuisine.includes(filters.cuisine)) return false
    if (filters.neighborhood && r.neighborhood !== filters.neighborhood) return false
    if (filters.price && r.priceLevel !== filters.price) return false
    if (filters.openNow && !isOpenNow(r.openingHours)) return false
    if (filters.hasMenu && r.menu.length === 0) return false
    if (filters.hasQr && !r.qrEnabled) return false
    return true
  })
}

export function sortRestaurants(restaurants: Restaurant[], sort: SortOption, lang: Lang): Restaurant[] {
  const arr = [...restaurants]
  switch (sort) {
    case 'popular':
      return arr.sort((a, b) => b.popularity - a.popularity)
    case 'az':
      return arr.sort((a, b) => a.name.localeCompare(b.name, lang === 'ka' ? 'ka' : 'en'))
    case 'nearby':
      // No real geolocation in MVP — approximate by distance from Freedom Square (city center)
      return arr.sort((a, b) => distFromCenter(a) - distFromCenter(b))
    case 'recommended':
    default:
      return arr.sort((a, b) => b.popularity - a.popularity)
  }
}

const CENTER = { lat: 41.6934, lng: 44.8015 }
function distFromCenter(r: Restaurant): number {
  const dLat = r.coordinates.lat - CENTER.lat
  const dLng = r.coordinates.lng - CENTER.lng
  return Math.sqrt(dLat * dLat + dLng * dLng)
}
