import type { LocalizedText, Restaurant } from './types'

export interface DishDef {
  id: string
  label: LocalizedText
  /** Lowercase fragments looked up in menu item and menu category names (Georgian and English). */
  keywords: string[]
}

// A restaurant "has" a dish when one of its menu items (or the category the item sits in) matches a
// keyword. Nothing is stored per restaurant, so menus edited in the dashboard are picked up automatically.
export const dishes: DishDef[] = [
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

export const dishMap: Record<string, DishDef> = Object.fromEntries(dishes.map((d) => [d.id, d]))

const isLatin = (s: string) => /^[\x20-\x7e]+$/.test(s)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Latin keywords must match whole words (so "tea" does not hit "steak"); Georgian ones are stems.
const matchers: { id: string; test: (text: string) => boolean }[] = dishes.map((d) => {
  const latin = d.keywords.filter(isLatin)
  const georgian = d.keywords.filter((k) => !isLatin(k))
  const re = latin.length ? new RegExp(`\\b(?:${latin.map(escapeRe).join('|')})(?:e?s)?\\b`, 'i') : null
  return { id: d.id, test: (text) => georgian.some((k) => text.includes(k)) || (!!re && re.test(text)) }
})

const cache = new WeakMap<Restaurant, Set<string>>()

export function restaurantDishIds(r: Restaurant): Set<string> {
  const hit = cache.get(r)
  if (hit) return hit
  const found = new Set<string>()
  for (const category of r.menu) {
    const categoryText = `${category.name.ka} ${category.name.en} `.toLowerCase()
    for (const item of category.items) {
      const text = `${item.name.ka} ${item.name.en} ${categoryText}`.toLowerCase()
      for (const m of matchers) if (!found.has(m.id) && m.test(text)) found.add(m.id)
    }
  }
  cache.set(r, found)
  return found
}

/** Dishes that at least one of the given restaurants serves, in menu order (food first, drinks last). */
export function availableDishes(restaurants: Restaurant[]): { dish: DishDef; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of restaurants) for (const id of restaurantDishIds(r)) counts.set(id, (counts.get(id) ?? 0) + 1)
  return dishes
    .filter((d) => counts.has(d.id))
    .map((dish) => ({ dish, count: counts.get(dish.id)! }))
}
