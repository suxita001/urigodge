import type { ActivityAction, Branch, MenuCategoryData, MenuItem, Restaurant } from '../data/types'
import { updateRestaurant } from './restaurantService'
import { aiPriceLevel } from './aiService'

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function emptyItem(): MenuItem {
  return { id: newId('item'), name: { ka: '', en: '' }, description: { ka: '', en: '' }, price: 0, available: true }
}

export function emptyCategory(): MenuCategoryData {
  return { id: newId('cat'), name: { ka: '', en: '' }, items: [] }
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ---- Immutable menu operations ----

export const menuOps = {
  addCategory: (menu: MenuCategoryData[], category: MenuCategoryData) => [...menu, category],
  updateCategory: (menu: MenuCategoryData[], id: string, patch: Partial<MenuCategoryData>) =>
    menu.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  deleteCategory: (menu: MenuCategoryData[], id: string) => menu.filter((c) => c.id !== id),
  moveCategory: (menu: MenuCategoryData[], id: string, delta: number) => {
    const i = menu.findIndex((c) => c.id === id)
    return move(menu, i, i + delta)
  },
  upsertItem: (menu: MenuCategoryData[], categoryId: string, item: MenuItem) =>
    menu.map((c) => {
      if (c.id !== categoryId) return c
      const exists = c.items.some((i) => i.id === item.id)
      return { ...c, items: exists ? c.items.map((i) => (i.id === item.id ? item : i)) : [...c.items, item] }
    }),
  deleteItem: (menu: MenuCategoryData[], categoryId: string, itemId: string) =>
    menu.map((c) => (c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)),
  moveItem: (menu: MenuCategoryData[], categoryId: string, itemId: string, delta: number) =>
    menu.map((c) => {
      if (c.id !== categoryId) return c
      const i = c.items.findIndex((it) => it.id === itemId)
      return { ...c, items: move(c.items, i, i + delta) }
    }),
  reorderItems: (menu: MenuCategoryData[], categoryId: string, items: MenuItem[]) =>
    menu.map((c) => (c.id === categoryId ? { ...c, items } : c)),
}

export function menuStats(menu: MenuCategoryData[]) {
  return { categories: menu.length, items: menu.reduce((n, c) => n + c.items.length, 0) }
}

const itemName = (i: MenuItem) => i.name.ka || i.name.en || 'კერძი'

/** Turns a before/after menu into precise activity-log entries (e.g. price changes). */
export function describeMenuChanges(before: MenuCategoryData[], after: MenuCategoryData[]): { action: ActivityAction; description: string }[] {
  const logs: { action: ActivityAction; description: string }[] = []
  const beforeItems = new Map(before.flatMap((c) => c.items.map((i) => [i.id, i] as const)))
  const afterItems = new Map(after.flatMap((c) => c.items.map((i) => [i.id, i] as const)))

  for (const [id, item] of afterItems) {
    const prev = beforeItems.get(id)
    if (!prev) logs.push({ action: 'MENU_ITEM_ADDED', description: `დაემატა „${itemName(item)}“ — ${item.price.toFixed(2)} ₾` })
    else if (prev.price !== item.price)
      logs.push({ action: 'MENU_ITEM_UPDATED', description: `„${itemName(item)}“: ფასი ${prev.price.toFixed(2)} ₾ → ${item.price.toFixed(2)} ₾` })
    else if (JSON.stringify(prev) !== JSON.stringify(item))
      logs.push({ action: 'MENU_ITEM_UPDATED', description: `განახლდა „${itemName(item)}“` })
  }
  for (const [id, item] of beforeItems) {
    if (!afterItems.has(id)) logs.push({ action: 'MENU_ITEM_DELETED', description: `წაიშალა „${itemName(item)}“` })
  }

  const catNames = (m: MenuCategoryData[]) => m.map((c) => `${c.id}:${c.name.ka}:${c.name.en}`).join('|')
  if (catNames(before) !== catNames(after) || (logs.length === 0 && JSON.stringify(before) !== JSON.stringify(after))) {
    logs.push({ action: before.length === 0 ? 'MENU_CREATED' : 'MENU_UPDATED', description: `მენიუს სტრუქტურა განახლდა (${after.length} კატეგორია)` })
  }
  // Keep the log readable when a big edit is saved at once.
  if (logs.length > 8) {
    const counts = menuStats(after)
    return [{ action: 'MENU_UPDATED', description: `მენიუ განახლდა: ${logs.length} ცვლილება (${counts.categories} კატეგორია, ${counts.items} კერძი)` }]
  }
  return logs
}

export async function saveMenu(restaurant: Restaurant, menu: MenuCategoryData[]): Promise<void> {
  const logs = describeMenuChanges(restaurant.menu, menu)
  // Prices changed, so the ₾ level is re-derived by AI (falls back to a local estimate, never blocks the save).
  const hasPrices = menu.some((c) => c.items.some((i) => i.price > 0))
  const priceLevel = hasPrices
    ? await aiPriceLevel({ name: restaurant.nameI18n.ka || restaurant.name, category: restaurant.category, cuisine: restaurant.cuisine, menu }, restaurant.priceLevel)
    : restaurant.priceLevel
  await updateRestaurant(
    restaurant,
    priceLevel !== restaurant.priceLevel ? { menu, priceLevel } : { menu },
    logs.length ? logs : [{ action: 'MENU_UPDATED', description: 'მენიუ შენახულია' }]
  )
}

// ---- Branches ----

export function emptyBranch(restaurant: Restaurant): Branch {
  return {
    id: newId('branch'),
    name: { ka: '', en: '' },
    address: { ka: '', en: '' },
    phone: restaurant.phone,
    coordinates: { ...restaurant.coordinates },
    openingHours: { ...restaurant.openingHours },
    isMain: restaurant.branches.length === 0,
  }
}

export async function saveBranches(restaurant: Restaurant, branches: Branch[], log: { action: ActivityAction; description: string }): Promise<void> {
  await updateRestaurant(restaurant, { branches }, [log])
}
