import { useSyncExternalStore } from 'react'

// The home page tells the navbar what sits underneath it: `dark` artwork (the bar goes see-through
// with light text), `light` artwork (a frosted bar with normal text), or nothing (the usual bar).

export type HeroTone = 'dark' | 'light' | null

let active: HeroTone = null
const listeners = new Set<() => void>()

export function setHeroOverlay(value: HeroTone) {
  if (active === value) return
  active = value
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useHeroOverlay = () => useSyncExternalStore(subscribe, () => active)
