import type { MenuCategoryData, PriceLevel } from '../data/types'

/**
 * Offline estimate of the ₾ / ₾₾ / ₾₾₾ level from menu prices. Used when the AI endpoint
 * is unreachable (local dev, quota exhausted) so a level is always available.
 */
export function estimatePriceLevel(menu: MenuCategoryData[]): PriceLevel | null {
  // Per-piece and small-ticket items (khinkali, espresso, bread) would drag the level down.
  const prices = menu
    .flatMap((c) => c.items)
    .map((i) => i.price)
    .filter((p) => p >= 5)
    .sort((a, b) => a - b)
  if (prices.length === 0) return null
  // The upper quartile is close to what a main dish (or a signature drink) costs; drinks and sides sit below it.
  const typical = prices[Math.floor(prices.length * 0.75)]
  if (typical < 16) return 1
  if (typical < 30) return 2
  return 3
}
