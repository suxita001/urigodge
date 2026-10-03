import type { Restaurant, Lang } from '../data/types'
import { categoryMap, cuisineMap, neighborhoodMap } from '../data/categories'

export interface SearchResult {
  restaurant: Restaurant
  matchType: 'name' | 'category' | 'cuisine' | 'neighborhood' | 'menu'
  matchLabel?: string
}

function norm(s: string | undefined): string {
  return (s ?? '').toLowerCase().trim()
}

const both = (t: { ka: string; en: string } | undefined) => `${norm(t?.ka)} ${norm(t?.en)}`

// Matches in either language, so "khinkali" and "ხინკალი" find the same places whatever the UI language is.
export function searchRestaurants(restaurants: Restaurant[], query: string, lang: Lang): SearchResult[] {
  const q = norm(query)
  if (!q) return []
  const results: SearchResult[] = []

  for (const r of restaurants) {
    if (`${norm(r.name)} ${both(r.nameI18n)}`.includes(q)) {
      results.push({ restaurant: r, matchType: 'name' })
      continue
    }
    const category = categoryMap[r.category]
    if (category && both(category.label).includes(q)) {
      results.push({ restaurant: r, matchType: 'category', matchLabel: category.label[lang] })
      continue
    }
    const cuisineHit = r.cuisine.find((c) => both(cuisineMap[c]?.label).includes(q))
    if (cuisineHit) {
      results.push({ restaurant: r, matchType: 'cuisine', matchLabel: cuisineMap[cuisineHit].label[lang] })
      continue
    }
    const hood = neighborhoodMap[r.neighborhood]
    if (hood && both(hood.label).includes(q)) {
      results.push({ restaurant: r, matchType: 'neighborhood', matchLabel: hood.label[lang] })
      continue
    }
    if (both(r.address).includes(q)) {
      results.push({ restaurant: r, matchType: 'neighborhood', matchLabel: r.address[lang] || r.address.ka })
      continue
    }
    const menuItem = r.menu.flatMap((c) => c.items).find((item) => both(item.name).includes(q))
    if (menuItem) {
      results.push({ restaurant: r, matchType: 'menu', matchLabel: menuItem.name[lang] || menuItem.name.ka })
      continue
    }
  }

  return results
}
