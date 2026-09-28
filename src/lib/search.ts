import type { Restaurant, Lang } from '../data/types'
import { categoryMap, cuisineMap, neighborhoodMap } from '../data/categories'

export interface SearchResult {
  restaurant: Restaurant
  matchType: 'name' | 'category' | 'cuisine' | 'neighborhood' | 'menu'
  matchLabel?: string
}

function norm(s: string): string {
  return s.toLowerCase().trim()
}

export function searchRestaurants(restaurants: Restaurant[], query: string, lang: Lang): SearchResult[] {
  const q = norm(query)
  if (!q) return []
  const results: SearchResult[] = []

  for (const r of restaurants) {
    if (norm(r.name).includes(q)) {
      results.push({ restaurant: r, matchType: 'name' })
      continue
    }
    const catLabel = categoryMap[r.category]?.label[lang]
    if (catLabel && norm(catLabel).includes(q)) {
      results.push({ restaurant: r, matchType: 'category', matchLabel: catLabel })
      continue
    }
    const cuisineHit = r.cuisine.find((c) => norm(cuisineMap[c]?.label[lang] ?? '').includes(q))
    if (cuisineHit) {
      results.push({ restaurant: r, matchType: 'cuisine', matchLabel: cuisineMap[cuisineHit].label[lang] })
      continue
    }
    const hood = neighborhoodMap[r.neighborhood]?.label[lang]
    if (hood && norm(hood).includes(q)) {
      results.push({ restaurant: r, matchType: 'neighborhood', matchLabel: hood })
      continue
    }
    if (norm(r.address[lang]).includes(q)) {
      results.push({ restaurant: r, matchType: 'neighborhood', matchLabel: r.address[lang] })
      continue
    }
    const menuItem = r.menu.flatMap((c) => c.items).find((item) => norm(item.name[lang]).includes(q))
    if (menuItem) {
      results.push({ restaurant: r, matchType: 'menu', matchLabel: menuItem.name[lang] })
      continue
    }
  }

  return results
}
