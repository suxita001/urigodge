import { useSyncExternalStore } from 'react'

// The home page tells the navbar when a full-screen photo sits underneath it, so the bar can go
// see-through with light text instead of drawing a cream strip across the picture.

let active = false
const listeners = new Set<() => void>()

export function setHeroOverlay(value: boolean) {
  if (active === value) return
  active = value
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useHeroOverlay = () => useSyncExternalStore(subscribe, () => active)
