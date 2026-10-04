// Shared between the React app (src/) and the Vercel functions (api/).
// Keep this file free of imports so both build setups can load it as-is.

export interface Localized {
  ka: string
  en: string
}

// ---------------------------------------------------------------- cuisines

export interface CuisineInfo {
  id: string
  label: Localized
  /** The label is an adjective ("Italian"), so headings read "Italian cuisine". */
  adjective?: boolean
}

export const cuisineList: CuisineInfo[] = [
  { id: 'georgian', label: { ka: 'ქართული', en: 'Georgian' }, adjective: true },
  { id: 'european', label: { ka: 'ევროპული', en: 'European' }, adjective: true },
  { id: 'italian', label: { ka: 'იტალიური', en: 'Italian' }, adjective: true },
  { id: 'french', label: { ka: 'ფრანგული', en: 'French' }, adjective: true },
  { id: 'spanish', label: { ka: 'ესპანური', en: 'Spanish' }, adjective: true },
  { id: 'mediterranean', label: { ka: 'ხმელთაშუაზღვის', en: 'Mediterranean' }, adjective: true },
  { id: 'asian', label: { ka: 'აზიური', en: 'Asian' }, adjective: true },
  { id: 'japanese', label: { ka: 'იაპონური', en: 'Japanese' }, adjective: true },
  { id: 'chinese', label: { ka: 'ჩინური', en: 'Chinese' }, adjective: true },
  { id: 'korean', label: { ka: 'კორეული', en: 'Korean' }, adjective: true },
  { id: 'thai', label: { ka: 'ტაილანდური', en: 'Thai' }, adjective: true },
  { id: 'indian', label: { ka: 'ინდური', en: 'Indian' }, adjective: true },
  { id: 'turkish', label: { ka: 'თურქული', en: 'Turkish' }, adjective: true },
  { id: 'middle-eastern', label: { ka: 'ახლო აღმოსავლური', en: 'Middle Eastern' }, adjective: true },
  { id: 'mexican', label: { ka: 'მექსიკური', en: 'Mexican' }, adjective: true },
  { id: 'american', label: { ka: 'ამერიკული', en: 'American' }, adjective: true },
  { id: 'ukrainian', label: { ka: 'უკრაინული', en: 'Ukrainian' }, adjective: true },
  { id: 'international', label: { ka: 'საერთაშორისო', en: 'International' }, adjective: true },
  { id: 'fusion', label: { ka: 'ფიუჟენი', en: 'Fusion' } },
  { id: 'seafood', label: { ka: 'ზღვის პროდუქტები', en: 'Seafood' } },
  { id: 'steakhouse', label: { ka: 'სტეიკჰაუსი', en: 'Steakhouse' } },
  { id: 'bbq', label: { ka: 'გრილი და BBQ', en: 'Grill & BBQ' } },
  { id: 'street-food', label: { ka: 'ქუჩის საჭმელი', en: 'Street Food' } },
  { id: 'fast-food', label: { ka: 'სწრაფი კვება', en: 'Fast Food' } },
  { id: 'vegetarian', label: { ka: 'ვეგეტარიანული', en: 'Vegetarian' }, adjective: true },
  { id: 'vegan', label: { ka: 'ვეგანური', en: 'Vegan' }, adjective: true },
  { id: 'healthy', label: { ka: 'ჯანსაღი', en: 'Healthy' }, adjective: true },
  { id: 'bakery', label: { ka: 'საცხობი', en: 'Bakery' } },
  { id: 'desserts', label: { ka: 'ტკბილეული', en: 'Desserts' } },
  { id: 'breakfast', label: { ka: 'საუზმე და ბრანჩი', en: 'Breakfast & Brunch' } },
  { id: 'wine-bar', label: { ka: 'ღვინის ბარი', en: 'Wine Bar' } },
  { id: 'pub', label: { ka: 'ლუდის ბარი', en: 'Pub' } },
]

// ---------------------------------------------------------------- areas

export interface AreaInfo {
  id: string
  label: Localized
  /** Locative form used in headings: "ვაკეში", "საბურთალოზე", "in Vake". */
  in: Localized
}

export const areaList: AreaInfo[] = [
  { id: 'old-tbilisi', label: { ka: 'ძველი თბილისი', en: 'Old Tbilisi' }, in: { ka: 'ძველ თბილისში', en: 'in Old Tbilisi' } },
  { id: 'sololaki', label: { ka: 'სოლოლაკი', en: 'Sololaki' }, in: { ka: 'სოლოლაკში', en: 'in Sololaki' } },
  { id: 'mtatsminda', label: { ka: 'მთაწმინდა', en: 'Mtatsminda' }, in: { ka: 'მთაწმინდაზე', en: 'in Mtatsminda' } },
  { id: 'vera', label: { ka: 'ვერა', en: 'Vera' }, in: { ka: 'ვერაზე', en: 'in Vera' } },
  { id: 'vake', label: { ka: 'ვაკე', en: 'Vake' }, in: { ka: 'ვაკეში', en: 'in Vake' } },
  { id: 'saburtalo', label: { ka: 'საბურთალო', en: 'Saburtalo' }, in: { ka: 'საბურთალოზე', en: 'in Saburtalo' } },
  { id: 'chugureti', label: { ka: 'ჩუღურეთი', en: 'Chugureti' }, in: { ka: 'ჩუღურეთში', en: 'in Chugureti' } },
  { id: 'avlabari', label: { ka: 'ავლაბარი', en: 'Avlabari' }, in: { ka: 'ავლაბარში', en: 'in Avlabari' } },
  { id: 'ortachala', label: { ka: 'ორთაჭალა', en: 'Ortachala' }, in: { ka: 'ორთაჭალაში', en: 'in Ortachala' } },
  { id: 'isani', label: { ka: 'ისანი', en: 'Isani' }, in: { ka: 'ისანში', en: 'in Isani' } },
  { id: 'didube', label: { ka: 'დიდუბე', en: 'Didube' }, in: { ka: 'დიდუბეში', en: 'in Didube' } },
  { id: 'dighomi', label: { ka: 'დიღომი', en: 'Dighomi' }, in: { ka: 'დიღომში', en: 'in Dighomi' } },
  { id: 'gldani', label: { ka: 'გლდანი', en: 'Gldani' }, in: { ka: 'გლდანში', en: 'in Gldani' } },
]

const CITY_IN: Localized = { ka: 'თბილისში', en: 'in Tbilisi' }

// ---------------------------------------------------------------- dishes

export interface DishInfo {
  id: string
  label: Localized
  /** Lowercase fragments looked up in menu item and menu category names (Georgian and English). */
  keywords: string[]
}

// A venue "has" a dish when one of its menu items (or the category the item sits in) matches a
// keyword. Nothing is stored per venue, so menus edited in the dashboard are picked up automatically.
export const dishList: DishInfo[] = [
  { id: 'khinkali', label: { ka: 'ხინკალი', en: 'Khinkali' }, keywords: ['ხინკალ', 'ხინკლ', 'khinkali'] },
  { id: 'khachapuri', label: { ka: 'ხაჭაპური', en: 'Khachapuri' }, keywords: ['ხაჭაპურ', 'khachapuri', 'აჭარული', 'აჩმა', 'achma'] },
  { id: 'mtsvadi', label: { ka: 'მწვადი', en: 'Mtsvadi (BBQ skewers)' }, keywords: ['მწვად', 'mtsvadi', 'shashlik', 'skewer'] },
  { id: 'kebab', label: { ka: 'ქაბაბი', en: 'Kebab' }, keywords: ['ქაბაბ', 'kebab'] },
  { id: 'lobio', label: { ka: 'ლობიო', en: 'Lobio' }, keywords: ['ლობიო', 'lobio'] },
  { id: 'lobiani', label: { ka: 'ლობიანი', en: 'Lobiani' }, keywords: ['ლობიან', 'lobiani'] },
  { id: 'pkhali', label: { ka: 'ფხალი', en: 'Pkhali' }, keywords: ['ფხალ', 'pkhali'] },
  { id: 'badrijani', label: { ka: 'ბადრიჯანი ნიგვზით', en: 'Eggplant with walnuts' }, keywords: ['ბადრიჯ', 'eggplant', 'badrijani'] },
  { id: 'kharcho', label: { ka: 'ხარჩო', en: 'Kharcho' }, keywords: ['ხარჩო', 'kharcho'] },
  { id: 'chakapuli', label: { ka: 'ჩაქაფული', en: 'Chakapuli' }, keywords: ['ჩაქაფულ', 'chakapuli'] },
  { id: 'shkmeruli', label: { ka: 'შქმერული', en: 'Shkmeruli' }, keywords: ['შქმერულ', 'shkmeruli'] },
  { id: 'ojakhuri', label: { ka: 'ოჯახური', en: 'Ojakhuri' }, keywords: ['ოჯახურ', 'ojakhuri'] },
  { id: 'satsivi', label: { ka: 'საცივი', en: 'Satsivi' }, keywords: ['საცივ', 'satsivi'] },
  { id: 'elarji', label: { ka: 'ელარჯი / ღომი', en: 'Elarji / Ghomi' }, keywords: ['ელარჯ', 'ღომი', 'elarji', 'ghomi'] },
  { id: 'kubdari', label: { ka: 'კუბდარი', en: 'Kubdari' }, keywords: ['კუბდარ', 'kubdari'] },
  { id: 'fish', label: { ka: 'თევზი', en: 'Fish' }, keywords: ['თევზ', 'კალმახ', 'ორაგულ', 'სიბას', 'დორადო', 'fish', 'trout', 'salmon', 'sea bass', 'dorado'] },
  { id: 'seafood', label: { ka: 'ზღვის პროდუქტები', en: 'Seafood' }, keywords: ['ზღვის პროდუქტ', 'კრევეტ', 'მიდი', 'კალმარ', 'რვაფეხ', 'seafood', 'shrimp', 'prawn', 'mussel', 'calamari', 'octopus'] },
  { id: 'pizza', label: { ka: 'პიცა', en: 'Pizza' }, keywords: ['პიცა', 'pizza'] },
  { id: 'pasta', label: { ka: 'პასტა', en: 'Pasta' }, keywords: ['პასტა', 'სპაგეტ', 'ტალიატელ', 'კარბონარა', 'პენე', 'ფეტუჩინ', 'ლაზანია', 'რავიოლ', 'pasta', 'spaghetti', 'tagliatelle', 'carbonara', 'penne', 'fettuccine', 'lasagna', 'ravioli'] },
  { id: 'risotto', label: { ka: 'რიზოტო', en: 'Risotto' }, keywords: ['რიზოტო', 'risotto'] },
  { id: 'burger', label: { ka: 'ბურგერი', en: 'Burger' }, keywords: ['ბურგერ', 'burger'] },
  { id: 'steak', label: { ka: 'სტეიკი', en: 'Steak' }, keywords: ['სტეიკ', 'რიბაი', 'steak', 'ribeye', 'tenderloin'] },
  { id: 'ribs', label: { ka: 'ნეკნები', en: 'Ribs' }, keywords: ['ნეკნ', 'ribs'] },
  { id: 'wings', label: { ka: 'ქათმის ფრთები', en: 'Chicken wings' }, keywords: ['ფრთებ', 'ფრთა', 'wings'] },
  { id: 'fries', label: { ka: 'კარტოფილი ფრი', en: 'French fries' }, keywords: ['კარტოფილი ფრი', 'ფრი კარტოფილ', 'fries'] },
  { id: 'hotdog', label: { ka: 'ჰოთ-დოგი', en: 'Hot dog' }, keywords: ['ჰოთ-დოგ', 'ჰოთდოგ', 'hot dog', 'hotdog'] },
  { id: 'sandwich', label: { ka: 'სენდვიჩი', en: 'Sandwich' }, keywords: ['სენდვიჩ', 'ტოსტ', 'პანინ', 'sandwich', 'toast', 'panini'] },
  { id: 'shawarma', label: { ka: 'შაურმა', en: 'Shawarma' }, keywords: ['შაურმა', 'shawarma', 'doner', 'დონერ'] },
  { id: 'falafel', label: { ka: 'ფალაფელი და ჰუმუსი', en: 'Falafel & hummus' }, keywords: ['ფალაფელ', 'ჰუმუს', 'falafel', 'hummus'] },
  { id: 'tacos', label: { ka: 'ტაკო და ბურიტო', en: 'Tacos & burritos' }, keywords: ['ტაკო', 'ბურიტო', 'კესადილ', 'ნაჩოს', 'taco', 'burrito', 'quesadilla', 'nachos'] },
  { id: 'sushi', label: { ka: 'სუში', en: 'Sushi' }, keywords: ['სუში', 'როლი', 'როლებ', 'ნიგირ', 'საშიმ', 'sushi', 'roll', 'nigiri', 'sashimi', 'maki'] },
  { id: 'ramen', label: { ka: 'რამენი', en: 'Ramen' }, keywords: ['რამენ', 'ramen'] },
  { id: 'noodles', label: { ka: 'ნუდლსი და ვოკი', en: 'Noodles & wok' }, keywords: ['ნუდლ', 'ვოკ', 'უდონ', 'ფად ტაი', 'ლაფშა', 'noodle', 'wok', 'udon', 'pad thai'] },
  { id: 'dumplings', label: { ka: 'დიმსამი და გიოზა', en: 'Dumplings' }, keywords: ['დიმსამ', 'გიოზა', 'პელმენ', 'dim sum', 'gyoza', 'dumpling'] },
  { id: 'curry', label: { ka: 'კარი', en: 'Curry' }, keywords: ['კარი ', 'კარი,', 'ქარი', 'მასალა', 'curry', 'masala'] },
  { id: 'salad', label: { ka: 'სალათი', en: 'Salad' }, keywords: ['სალათ', 'salad'] },
  { id: 'soup', label: { ka: 'სუპი', en: 'Soup' }, keywords: ['სუპ', 'წვნიან', 'soup'] },
  { id: 'breakfast', label: { ka: 'საუზმე', en: 'Breakfast' }, keywords: ['საუზმე', 'ომლეტ', 'შაქშუკა', 'ბენედიქტ', 'ერბოკვერცხ', 'breakfast', 'omelette', 'omelet', 'shakshuka', 'benedict', 'brunch'] },
  { id: 'pancakes', label: { ka: 'ბლინები და ვაფლი', en: 'Pancakes & waffles' }, keywords: ['ბლინ', 'პანქეიქ', 'ვაფლ', 'pancake', 'waffle', 'crepe'] },
  { id: 'croissant', label: { ka: 'კრუასანი', en: 'Croissant' }, keywords: ['კრუასან', 'croissant'] },
  { id: 'cake', label: { ka: 'ნამცხვარი', en: 'Cake' }, keywords: ['ნამცხვ', 'ტორტ', 'ჩიზქეიქ', 'ტირამისუ', 'ნაპოლეონ', 'მედოკ', 'ბრაუნ', 'cake', 'cheesecake', 'tiramisu', 'napoleon', 'brownie'] },
  { id: 'icecream', label: { ka: 'ნაყინი', en: 'Ice cream' }, keywords: ['ნაყინ', 'ჯელატო', 'ice cream', 'gelato'] },
  { id: 'coffee', label: { ka: 'ყავა', en: 'Coffee' }, keywords: ['ყავა', 'ესპრესო', 'კაპუჩინო', 'ლატე', 'ამერიკანო', 'ფლეთ უაით', 'coffee', 'espresso', 'cappuccino', 'latte', 'americano', 'flat white'] },
  { id: 'tea', label: { ka: 'ჩაი', en: 'Tea' }, keywords: ['ჩაი', 'tea'] },
  { id: 'lemonade', label: { ka: 'ლიმონათი', en: 'Lemonade' }, keywords: ['ლიმონათ', 'lemonade'] },
  { id: 'juice', label: { ka: 'წვენი და სმუზი', en: 'Juice & smoothie' }, keywords: ['წვენ', 'სმუზ', 'ფრეშ', 'juice', 'smoothie'] },
  { id: 'wine', label: { ka: 'ღვინო', en: 'Wine' }, keywords: ['ღვინ', 'საფერავ', 'რქაწითელ', 'ქინძმარაულ', 'წინანდალ', 'მუკუზან', 'ქისი', 'wine', 'saperavi', 'rkatsiteli', 'kindzmarauli', 'tsinandali', 'mukuzani'] },
  { id: 'beer', label: { ka: 'ლუდი', en: 'Beer' }, keywords: ['ლუდ', 'beer', 'lager', 'ipa'] },
  { id: 'cocktail', label: { ka: 'კოქტეილი', en: 'Cocktails' }, keywords: ['კოქტეილ', 'მოხიტო', 'შპრიც', 'ნეგრონ', 'cocktail', 'mojito', 'spritz', 'negroni'] },
  { id: 'chacha', label: { ka: 'ჭაჭა', en: 'Chacha' }, keywords: ['ჭაჭა', 'chacha'] },
]

/** The minimum a menu needs for dish matching — satisfied by both the app's and the API's menu types. */
export interface MenuLike {
  name: Localized
  items: { name: Localized; price: number }[]
}

const isLatin = (s: string) => /^[\x20-\x7e]+$/.test(s)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Latin keywords must match whole words (so "tea" does not hit "steak"); Georgian ones are stems.
const matchers: { id: string; test: (text: string) => boolean }[] = dishList.map((d) => {
  const latin = d.keywords.filter(isLatin)
  const georgian = d.keywords.filter((k) => !isLatin(k))
  const re = latin.length ? new RegExp(`\\b(?:${latin.map(escapeRe).join('|')})(?:e?s)?\\b`, 'i') : null
  return { id: d.id, test: (text) => georgian.some((k) => text.includes(k)) || (!!re && re.test(text)) }
})
const matcherById = new Map(matchers.map((m) => [m.id, m]))

const itemText = (item: { name: Localized }, category: { name: Localized }) =>
  `${item.name.ka} ${item.name.en} ${category.name.ka} ${category.name.en} `.toLowerCase()

export function matchDishIds(menu: MenuLike[]): Set<string> {
  const found = new Set<string>()
  for (const category of menu) {
    for (const item of category.items) {
      const text = itemText(item, category)
      for (const m of matchers) if (!found.has(m.id) && m.test(text)) found.add(m.id)
    }
  }
  return found
}

/** Menu items of one venue that count as the given dish (used to show prices on landing pages). */
export function dishItems<T extends MenuLike>(menu: T[], dishId: string): T['items'][number][] {
  const m = matcherById.get(dishId)
  if (!m) return []
  return menu.flatMap((category) => category.items.filter((item) => m.test(itemText(item, category))))
}

// ---------------------------------------------------------------- landing pages

export type LandingKind = 'dish' | 'cuisine' | 'area'

export interface LandingCopy {
  heading: string
  title: string
  description: string
}

const cuisineById = new Map(cuisineList.map((c) => [c.id, c]))
const areaById = new Map(areaList.map((a) => [a.id, a]))
const dishById = new Map(dishList.map((d) => [d.id, d]))

export const getCuisine = (id: string) => cuisineById.get(id)
export const getArea = (id: string) => areaById.get(id)
export const getDish = (id: string) => dishById.get(id)

export function landingPath(kind: LandingKind, id: string, areaId?: string): string {
  if (kind === 'area') return `/areas/${id}`
  return `/${kind === 'dish' ? 'dishes' : 'cuisines'}/${id}${areaId ? `/${areaId}` : ''}`
}

/** Heading, <title> and meta description of a landing page; null when the ids are unknown. */
export function landingCopy(kind: LandingKind, id: string, areaId: string | undefined, lang: 'ka' | 'en', count: number): LandingCopy | null {
  const area = areaId ? areaById.get(areaId) : undefined
  if (areaId && !area) return null
  const where = (area?.in ?? CITY_IN)[lang]
  const ka = lang === 'ka'

  if (kind === 'area') {
    const a = areaById.get(id)
    if (!a) return null
    const heading = ka ? `რესტორნები და კაფეები ${a.in.ka}` : `Restaurants and cafés ${a.in.en}`
    return {
      heading,
      title: ka ? `${heading} — მენიუები და ფასები | urigod.ge` : `${heading} — menus and prices | urigod.ge`,
      description: ka
        ? `${count} ადგილი ${a.in.ka}: რესტორნები, კაფეები და ბარები მენიუებით, ფასებით, მისამართებითა და სამუშაო საათებით.`
        : `${count} places ${a.in.en}: restaurants, cafés and bars with menus, prices, addresses and opening hours.`,
    }
  }

  if (kind === 'dish') {
    const d = dishById.get(id)
    if (!d) return null
    const heading = `${d.label[lang]} ${where}`
    return {
      heading,
      title: ka ? `${heading} — ადგილები, ფასები და მენიუები | urigod.ge` : `${heading} — places, prices and menus | urigod.ge`,
      description: ka
        ? `${d.label.ka} ${where}: ${count} ადგილი ფასებით, მენიუებით, მისამართებითა და სამუშაო საათებით.`
        : `${d.label.en} ${where}: ${count} places with prices, menus, addresses and opening hours.`,
    }
  }

  const c = cuisineById.get(id)
  if (!c) return null
  const name = c.adjective ? (ka ? `${c.label.ka} სამზარეულო` : `${c.label.en} cuisine`) : c.label[lang]
  const heading = `${name} ${where}`
  return {
    heading,
    title: ka ? `${heading} — რესტორნები, მენიუები და ფასები | urigod.ge` : `${heading} — restaurants, menus and prices | urigod.ge`,
    description: ka
      ? `${name} ${where}: ${count} ადგილი მენიუებით, ფასებით, მისამართებითა და სამუშაო საათებით.`
      : `${name} ${where}: ${count} places with menus, prices, addresses and opening hours.`,
  }
}

/** The fields landing pages filter on — satisfied by both the app's and the API's restaurant types. */
export interface VenueLike {
  cuisine: string[]
  neighborhood: string
  menu: MenuLike[]
}

export function matchesLanding(venue: VenueLike, kind: LandingKind, id: string, areaId?: string, dishIds?: Set<string>): boolean {
  if (kind === 'area') return venue.neighborhood === id
  if (areaId && venue.neighborhood !== areaId) return false
  if (kind === 'cuisine') return venue.cuisine.includes(id)
  return (dishIds ?? matchDishIds(venue.menu)).has(id)
}

/** City-wide pages need one venue; neighbourhood combinations need two, so near-empty pages are not created. */
export const MIN_RESULTS = { city: 1, area: 2 }

export interface LandingEntry {
  kind: LandingKind
  id: string
  areaId?: string
  count: number
}

/** Every landing page that currently has enough venues behind it (for the sitemap and cross-links). */
export function listLandings(venues: VenueLike[]): LandingEntry[] {
  const withDishes = venues.map((v) => ({ v, dishes: matchDishIds(v.menu) }))
  const out: LandingEntry[] = []
  const count = (kind: LandingKind, id: string, areaId?: string) => withDishes.filter(({ v, dishes }) => matchesLanding(v, kind, id, areaId, dishes)).length
  for (const a of areaList) {
    const n = count('area', a.id)
    if (n >= MIN_RESULTS.city) out.push({ kind: 'area', id: a.id, count: n })
  }
  for (const [kind, list] of [
    ['dish', dishList],
    ['cuisine', cuisineList],
  ] as const) {
    for (const entry of list) {
      const n = count(kind, entry.id)
      if (n < MIN_RESULTS.city) continue
      out.push({ kind, id: entry.id, count: n })
      for (const a of areaList) {
        const m = count(kind, entry.id, a.id)
        if (m >= MIN_RESULTS.area) out.push({ kind, id: entry.id, areaId: a.id, count: m })
      }
    }
  }
  return out
}
