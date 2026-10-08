import type { CategoryId, CuisineId, Lang, MenuCategoryData, MenuOptionGroup, PriceLevel } from '../data/types'
import { estimatePriceLevel } from '../lib/price'

// The AI lives behind Vercel functions (/api/*) so the Gemini key never reaches the browser.

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  /** Slugs of restaurants the assistant recommends alongside its answer. */
  restaurants?: string[]
}

export type ChatErrorCode = 'not_configured' | 'rate_limited' | 'unavailable'

export class ChatError extends Error {
  code: ChatErrorCode
  constructor(code: ChatErrorCode) {
    super(code)
    this.code = code
  }
}

async function postJson<T>(url: string, body: unknown, timeoutMs: number): Promise<{ status: number; data: T | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
    const data = (await res.json().catch(() => null)) as T | null
    return { status: res.status, data }
  } finally {
    clearTimeout(timer)
  }
}

export async function sendChat(history: ChatMessage[], lang: Lang): Promise<ChatMessage> {
  let result: { status: number; data: { reply?: string; restaurants?: string[]; error?: string } | null }
  try {
    result = await postJson('/api/chat', { lang, messages: history.slice(-12).map((m) => ({ role: m.role, text: m.text })) }, 30000)
  } catch {
    throw new ChatError('unavailable')
  }
  const { status, data } = result
  if (status === 200 && data?.reply) return { role: 'assistant', text: data.reply, restaurants: data.restaurants ?? [] }
  if (status === 429) throw new ChatError('rate_limited')
  if (data?.error === 'not_configured') throw new ChatError('not_configured')
  throw new ChatError('unavailable')
}

export interface PriceLevelInput {
  name: string
  category: CategoryId
  cuisine: CuisineId | CuisineId[]
  menu: MenuCategoryData[]
}

/**
 * Asks the AI which ₾ level a menu belongs to. Never throws: if the endpoint is unreachable the
 * local price-based estimate is used, and if there are no prices at all `fallback` is returned.
 */
export async function aiPriceLevel(input: PriceLevelInput, fallback: PriceLevel): Promise<PriceLevel> {
  const items = input.menu
    .flatMap((c) => c.items.map((i) => ({ name: i.name.ka || i.name.en, category: c.name.ka || c.name.en, price: i.price })))
    .filter((i) => i.price > 0)
    .slice(0, 150)
  if (items.length === 0) return fallback
  try {
    const { status, data } = await postJson<{ level?: number }>(
      '/api/price-level',
      { name: input.name, category: input.category, cuisine: Array.isArray(input.cuisine) ? input.cuisine : [input.cuisine], items },
      12000
    )
    if (status === 200 && (data?.level === 1 || data?.level === 2 || data?.level === 3)) return data.level
  } catch {
    /* fall through to the local estimate */
  }
  return estimatePriceLevel(input.menu) ?? fallback
}

// ---------------------------------------------------------------- menu from a photo

export class MenuImportError extends Error {
  code: 'too_large' | 'forbidden' | 'rate_limited' | 'not_configured' | 'failed'
  constructor(code: MenuImportError['code']) {
    super(code)
    this.code = code
  }
}

// Vercel rejects request bodies above 4.5 MB and base64 adds a third, so files are kept under ~3 MB.
const MAX_UPLOAD_BYTES = 3_000_000

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** Photos straight from a phone are 5–12 MB; small menu print stays readable at 2000 px JPEG. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let side = 2000
  let quality = 0.85
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      bitmap.close()
      return blob
    }
    side = Math.round(side * 0.8)
    quality -= 0.07
  }
  bitmap.close()
  throw new MenuImportError('too_large')
}

/** Sends one photo or PDF of a printed menu to the AI and returns the categories it found. */
export async function importMenuFile(file: File): Promise<MenuCategoryData[]> {
  const { auth } = await import('../lib/firebase')
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new MenuImportError('forbidden')

  let blob: Blob = file
  if (file.type !== 'application/pdf') blob = await shrinkPhoto(file)
  if (blob.size > MAX_UPLOAD_BYTES) throw new MenuImportError('too_large')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 75_000)
  let res: Response
  try {
    res = await fetch('/api/menu-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mimeType: blob.type || 'image/jpeg', data: await toBase64(blob) }),
      signal: controller.signal,
    })
  } catch {
    throw new MenuImportError('failed')
  } finally {
    clearTimeout(timer)
  }
  const payload = (await res.json().catch(() => null)) as { categories?: { name: MenuCategoryData['name']; items: { name: MenuCategoryData['name']; description: MenuCategoryData['name']; price: number; options?: Omit<MenuOptionGroup, 'id'>[] }[] }[]; error?: string } | null
  if (res.status === 413) throw new MenuImportError('too_large')
  if (res.status === 403) throw new MenuImportError('forbidden')
  if (res.status === 429) throw new MenuImportError('rate_limited')
  if (!res.ok || !payload?.categories) throw new MenuImportError(payload?.error === 'not_configured' ? 'not_configured' : 'failed')

  const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return payload.categories.map((c) => ({
    id: id('cat'),
    name: c.name,
    items: c.items.map((i) => ({
      id: id('item'),
      name: i.name,
      description: i.description,
      price: i.price,
      available: true,
      ...(i.options?.length ? { options: i.options.map((g) => ({ ...g, id: id('grp'), options: g.options.map((o) => ({ ...o, id: id('opt') })) })) } : {}),
    })),
  }))
}

/**
 * Joins menus read from several pages (or an existing menu and an imported one): categories with the
 * same name are merged, and an item that is already there under the same name is not added twice.
 */
export function mergeImportedMenus(menus: MenuCategoryData[][]): MenuCategoryData[] {
  const key = (s: string) => s.trim().toLowerCase()
  const out: MenuCategoryData[] = []
  for (const category of menus.flat()) {
    const existing = out.find((c) => key(c.name.ka) === key(category.name.ka) || (!!c.name.en && key(c.name.en) === key(category.name.en)))
    if (!existing) {
      out.push({ ...category, items: [...category.items] })
      continue
    }
    for (const item of category.items) {
      if (!existing.items.some((i) => key(i.name.ka) === key(item.name.ka))) existing.items.push(item)
    }
  }
  return out
}
