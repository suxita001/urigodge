import type { CategoryId, CuisineId, NeighborhoodId, LocalizedText } from './types'

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
}

export const cuisines: CuisineDef[] = [
  { id: 'georgian', label: { ka: 'ქართული', en: 'Georgian' } },
  { id: 'european', label: { ka: 'ევროპული', en: 'European' } },
  { id: 'italian', label: { ka: 'იტალიური', en: 'Italian' } },
  { id: 'asian', label: { ka: 'აზიური', en: 'Asian' } },
  { id: 'international', label: { ka: 'საერთაშორისო', en: 'International' } },
  { id: 'mediterranean', label: { ka: 'ხმელთაშუაზღვის', en: 'Mediterranean' } },
  { id: 'american', label: { ka: 'ამერიკული', en: 'American' } },
]

export const cuisineMap: Record<CuisineId, CuisineDef> = cuisines.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CuisineId, CuisineDef>
)

export interface NeighborhoodDef {
  id: NeighborhoodId
  label: LocalizedText
}

export const neighborhoods: NeighborhoodDef[] = [
  { id: 'old-tbilisi', label: { ka: 'ძველი თბილისი', en: 'Old Tbilisi' } },
  { id: 'vera', label: { ka: 'ვერა', en: 'Vera' } },
  { id: 'vake', label: { ka: 'ვაკე', en: 'Vake' } },
  { id: 'saburtalo', label: { ka: 'საბურთალო', en: 'Saburtalo' } },
  { id: 'chugureti', label: { ka: 'ჩუღურეთი', en: 'Chugureti' } },
  { id: 'mtatsminda', label: { ka: 'მთაწმინდა', en: 'Mtatsminda' } },
]

export const neighborhoodMap: Record<NeighborhoodId, NeighborhoodDef> = neighborhoods.reduce(
  (acc, n) => ({ ...acc, [n.id]: n }),
  {} as Record<NeighborhoodId, NeighborhoodDef>
)
