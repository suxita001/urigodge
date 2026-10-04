import type { CategoryId, Coordinates, CuisineId, NeighborhoodId, PriceLevel, Restaurant, Lang } from '../data/types'
import { distanceMeters } from './geo'
import { isOpenNow } from '../data/helpers'
import { restaurantDishIds } from '../data/dishes'

export type SortOption = 'recommended' | 'popular' | 'nearby' | 'az'

export interface FilterState {
  category: CategoryId | null
  /** Any of the selected cuisines. */
  cuisines: CuisineId[]
  /** All of the selected dishes must be on the menu. */
  dishes: string[]
  neighborhood: NeighborhoodId | null
  price: PriceLevel | null
  openNow: boolean
  hasMenu: boolean
}

export const defaultFilters: FilterState = {
  category: null,
  cuisines: [],
  dishes: [],
  neighborhood: null,
  price: null,
  openNow: false,
  hasMenu: false,
}

export function countActiveFilters(f: FilterState): number {
  let n = f.cuisines.length + f.dishes.length
  if (f.category) n++
  if (f.neighborhood) n++
  if (f.price) n++
  if (f.openNow) n++
  if (f.hasMenu) n++
  return n
}

export function applyFilters(restaurants: Restaurant[], filters: FilterState): Restaurant[] {
  return restaurants.filter((r) => {
    if (filters.category && r.category !== filters.category) return false
    if (filters.cuisines.length && !filters.cuisines.some((c) => r.cuisine.includes(c))) return false
    if (filters.dishes.length) {
      const served = restaurantDishIds(r)
      if (!filters.dishes.every((d) => served.has(d))) return false
    }
    if (filters.neighborhood && r.neighborhood !== filters.neighborhood) return false
    if (filters.price && r.priceLevel !== filters.price) return false
    if (filters.openNow && !isOpenNow(r.openingHours)) return false
    if (filters.hasMenu && r.menu.length === 0) return false
    return true
  })
}

export function sortRestaurants(restaurants: Restaurant[], sort: SortOption, lang: Lang, origin?: Coordinates | null): Restaurant[] {
  const arr = [...restaurants]
  switch (sort) {
    case 'az':
      return arr.sort((a, b) => a.name.localeCompare(b.name, lang === 'ka' ? 'ka' : 'en'))
    case 'nearby':
      // From the visitor when we know where they are, otherwise from Freedom Square (city centre).
      return arr.sort((a, b) => nearestBranch(a, origin ?? CENTER) - nearestBranch(b, origin ?? CENTER))
    case 'popular':
    case 'recommended':
    default:
      return arr.sort((a, b) => b.popularity - a.popularity)
  }
}

const CENTER = { lat: 41.6934, lng: 44.8015 }

/** Distance in metres to the closest branch (or the main location when there are no branches). */
export function nearestBranch(r: Restaurant, origin: Coordinates): number {
  const points = r.branches.length ? r.branches.map((b) => b.coordinates) : [r.coordinates]
  return Math.min(...points.map((p) => distanceMeters(origin, p)))
}
