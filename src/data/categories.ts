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
  { id: 'french', label: { ka: 'ფრანგული', en: 'French' } },
  { id: 'spanish', label: { ka: 'ესპანური', en: 'Spanish' } },
  { id: 'mediterranean', label: { ka: 'ხმელთაშუაზღვის', en: 'Mediterranean' } },
  { id: 'asian', label: { ka: 'აზიური', en: 'Asian' } },
  { id: 'japanese', label: { ka: 'იაპონური', en: 'Japanese' } },
  { id: 'chinese', label: { ka: 'ჩინური', en: 'Chinese' } },
  { id: 'korean', label: { ka: 'კორეული', en: 'Korean' } },
  { id: 'thai', label: { ka: 'ტაილანდური', en: 'Thai' } },
  { id: 'indian', label: { ka: 'ინდური', en: 'Indian' } },
  { id: 'turkish', label: { ka: 'თურქული', en: 'Turkish' } },
  { id: 'middle-eastern', label: { ka: 'ახლო აღმოსავლური', en: 'Middle Eastern' } },
  { id: 'mexican', label: { ka: 'მექსიკური', en: 'Mexican' } },
  { id: 'american', label: { ka: 'ამერიკული', en: 'American' } },
  { id: 'ukrainian', label: { ka: 'უკრაინული', en: 'Ukrainian' } },
  { id: 'international', label: { ka: 'საერთაშორისო', en: 'International' } },
  { id: 'fusion', label: { ka: 'ფიუჟენი', en: 'Fusion' } },
  { id: 'seafood', label: { ka: 'ზღვის პროდუქტები', en: 'Seafood' } },
  { id: 'steakhouse', label: { ka: 'სტეიკჰაუსი', en: 'Steakhouse' } },
  { id: 'bbq', label: { ka: 'გრილი და BBQ', en: 'Grill & BBQ' } },
  { id: 'street-food', label: { ka: 'ქუჩის საჭმელი', en: 'Street Food' } },
  { id: 'fast-food', label: { ka: 'სწრაფი კვება', en: 'Fast Food' } },
  { id: 'vegetarian', label: { ka: 'ვეგეტარიანული', en: 'Vegetarian' } },
  { id: 'vegan', label: { ka: 'ვეგანური', en: 'Vegan' } },
  { id: 'healthy', label: { ka: 'ჯანსაღი', en: 'Healthy' } },
  { id: 'bakery', label: { ka: 'საცხობი', en: 'Bakery' } },
  { id: 'desserts', label: { ka: 'ტკბილეული', en: 'Desserts' } },
  { id: 'breakfast', label: { ka: 'საუზმე და ბრანჩი', en: 'Breakfast & Brunch' } },
  { id: 'wine-bar', label: { ka: 'ღვინის ბარი', en: 'Wine Bar' } },
  { id: 'pub', label: { ka: 'ლუდის ბარი', en: 'Pub' } },
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
  { id: 'sololaki', label: { ka: 'სოლოლაკი', en: 'Sololaki' } },
  { id: 'mtatsminda', label: { ka: 'მთაწმინდა', en: 'Mtatsminda' } },
  { id: 'vera', label: { ka: 'ვერა', en: 'Vera' } },
  { id: 'vake', label: { ka: 'ვაკე', en: 'Vake' } },
  { id: 'saburtalo', label: { ka: 'საბურთალო', en: 'Saburtalo' } },
  { id: 'chugureti', label: { ka: 'ჩუღურეთი', en: 'Chugureti' } },
  { id: 'avlabari', label: { ka: 'ავლაბარი', en: 'Avlabari' } },
  { id: 'ortachala', label: { ka: 'ორთაჭალა', en: 'Ortachala' } },
  { id: 'isani', label: { ka: 'ისანი', en: 'Isani' } },
  { id: 'didube', label: { ka: 'დიდუბე', en: 'Didube' } },
  { id: 'dighomi', label: { ka: 'დიღომი', en: 'Dighomi' } },
  { id: 'gldani', label: { ka: 'გლდანი', en: 'Gldani' } },
]

export const neighborhoodMap: Record<NeighborhoodId, NeighborhoodDef> = neighborhoods.reduce(
  (acc, n) => ({ ...acc, [n.id]: n }),
  {} as Record<NeighborhoodId, NeighborhoodDef>
)
