import type { MenuItem, MenuOptionGroup, MenuOptionKind } from '../data/types'

// A dish can carry option groups of three kinds:
//   variant — sizes/versions, each with its OWN full price (S 8 ₾, M 10 ₾, L 12 ₾); pick exactly one
//   choice  — pick one of several (Cola / Fanta); the option's price is a surcharge, 0 = included
//   addon   — pick any number (extra cheese, toppings); the option's price is added on top

export const OPTION_KINDS: MenuOptionKind[] = ['variant', 'choice', 'addon']

export const formatPrice = (price: number) => (Number.isInteger(price) ? String(price) : price.toFixed(2))

export const optionGroups = (item: MenuItem): MenuOptionGroup[] => (item.options ?? []).filter((g) => g.options.length > 0)

/** The group whose options replace the dish price (there is at most one). */
export const variantGroup = (item: MenuItem): MenuOptionGroup | undefined => optionGroups(item).find((g) => g.kind === 'variant')

/** Cheapest way to order the dish: the smallest variant, or the plain price when it has no variants. */
export function basePrice(item: MenuItem): number {
  const variants = variantGroup(item)
  return variants ? Math.min(...variants.options.map((o) => o.price)) : item.price
}

/** True when the price shown on the card is only a starting point. */
export function priceVaries(item: MenuItem): boolean {
  const variants = variantGroup(item)
  if (variants && new Set(variants.options.map((o) => o.price)).size > 1) return true
  return optionGroups(item).some((g) => g.kind !== 'variant' && g.options.some((o) => o.price > 0))
}

/** groupId → chosen option ids. */
export type Selection = Record<string, string[]>

/** What a guest gets if they touch nothing: the cheapest variant and the first of every single-choice group. */
export function defaultSelection(item: MenuItem): Selection {
  const selection: Selection = {}
  for (const group of optionGroups(item)) {
    if (group.kind === 'variant') selection[group.id] = [[...group.options].sort((a, b) => a.price - b.price)[0].id]
    else if (group.kind === 'choice') selection[group.id] = [group.options[0].id]
    else selection[group.id] = []
  }
  return selection
}

export function toggleOption(selection: Selection, group: MenuOptionGroup, optionId: string): Selection {
  if (group.kind !== 'addon') return { ...selection, [group.id]: [optionId] }
  const current = selection[group.id] ?? []
  return { ...selection, [group.id]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] }
}

export function totalPrice(item: MenuItem, selection: Selection): number {
  let total = variantGroup(item) ? 0 : item.price
  for (const group of optionGroups(item)) {
    for (const option of group.options) {
      if (selection[group.id]?.includes(option.id)) total += option.price
    }
  }
  return Math.round(total * 100) / 100
}
