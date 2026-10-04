import type { CategoryId, CuisineId, NeighborhoodId, LocalizedText } from './types'
import { areaList, cuisineList } from '../../shared/taxonomy'

export interface CategoryDef {
  id: CategoryId
  label: LocalizedText
  icon: string
}

export const categories: CategoryDef[] = [
  { id: 'restaurant', label: { ka: 'რესტორანი', en: 'Restaurant' }, icon: 'UtensilsCrossed' },
  { id: 'cafe', label: { ka: 'კაფე', en: 'Cafe' }, icon: 'Coffee' },
  { id: 'bar', label: { ka: 'ბარი', en: 'Bar' }, icon: 'Martini' },
  { id: 'burger', label: { ka: 'ბურგერი', en: 'Burger' }, icon: 'Beef' },
  { id: 'pizza', label: { ka: 'პიცა', en: 'Pizza' }, icon: 'Pizza' },
  { id: 'georgian', label: { ka: 'ქართული', en: 'Georgian' }, icon: 'Wheat' },
  { id: 'asian', label: { ka: 'აზიური', en: 'Asian' }, icon: 'Soup' },
  { id: 'dessert', label: { ka: 'დესერტი', en: 'Dessert' }, icon: 'CakeSlice' },
  { id: 'coffee', label: { ka: 'ყავა', en: 'Coffee' }, icon: 'Coffee' },
]

export const categoryMap: Record<CategoryId, CategoryDef> = categories.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, CategoryDef>
)

export interface CuisineDef {
  id: CuisineId
  label: LocalizedText
  adjective?: boolean
}

// Defined in shared/taxonomy.ts (also used by the server); the ids there match CuisineId / NeighborhoodId.
export const cuisines = cuisineList as CuisineDef[]

export const cuisineMap: Record<CuisineId, CuisineDef> = cuisines.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CuisineId, CuisineDef>
)

export interface NeighborhoodDef {
  id: NeighborhoodId
  label: LocalizedText
  /** Locative form for headings ("ვაკეში", "in Vake"). */
  in: LocalizedText
}

export const neighborhoods = areaList as NeighborhoodDef[]

export const neighborhoodMap: Record<NeighborhoodId, NeighborhoodDef> = neighborhoods.reduce(
  (acc, n) => ({ ...acc, [n.id]: n }),
  {} as Record<NeighborhoodId, NeighborhoodDef>
)
