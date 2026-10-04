import type { LocalizedText, Restaurant } from './types'
import { dishList, matchDishIds } from '../../shared/taxonomy'

export interface DishDef {
  id: string
  label: LocalizedText
  keywords: string[]
}

// The list itself lives in shared/taxonomy.ts so the server (sitemap, landing pages) uses the same one.
export const dishes: DishDef[] = dishList

export const dishMap: Record<string, DishDef> = Object.fromEntries(dishes.map((d) => [d.id, d]))

const cache = new WeakMap<Restaurant, Set<string>>()

export function restaurantDishIds(r: Restaurant): Set<string> {
  let found = cache.get(r)
  if (!found) {
    found = matchDishIds(r.menu)
    cache.set(r, found)
  }
  return found
}

/** Dishes that at least one of the given restaurants serves, in menu order (food first, drinks last). */
export function availableDishes(restaurants: Restaurant[]): { dish: DishDef; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of restaurants) for (const id of restaurantDishIds(r)) counts.set(id, (counts.get(id) ?? 0) + 1)
  return dishes.filter((d) => counts.has(d.id)).map((dish) => ({ dish, count: counts.get(dish.id)! }))
}
