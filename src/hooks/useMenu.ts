import { useCallback, useState } from 'react'
import type { MenuCategoryData, Restaurant } from '../data/types'
import { menuStats, saveMenu } from '../services/menuService'

/**
 * Local, editable copy of a restaurant's menu. Changes stay local until `save()`, which writes the
 * whole menu in one update (so ordering is atomic) and logs a precise description of the diff.
 */
export function useMenu(restaurant: Restaurant | null) {
  const [draft, setDraft] = useState<{ restaurantId: string; menu: MenuCategoryData[] } | null>(null)
  const [saving, setSaving] = useState(false)

  const ownDraft = draft && restaurant && draft.restaurantId === restaurant.id ? draft : null
  const menu = ownDraft ? ownDraft.menu : (restaurant?.menu ?? [])
  const dirty = !!ownDraft && JSON.stringify(ownDraft.menu) !== JSON.stringify(restaurant?.menu)

  const setMenu = useCallback(
    (next: MenuCategoryData[]) => {
      if (restaurant) setDraft({ restaurantId: restaurant.id, menu: next })
    },
    [restaurant]
  )

  const save = useCallback(async () => {
    if (!restaurant || !dirty) return
    setSaving(true)
    try {
      await saveMenu(restaurant, menu)
      setDraft(null)
    } finally {
      setSaving(false)
    }
  }, [restaurant, dirty, menu])

  const discard = useCallback(() => setDraft(null), [])

  return { menu, setMenu, dirty, saving, save, discard, stats: menuStats(menu) }
}
