import type { CategoryId, CuisineId, Lang, MenuCategoryData, PriceLevel } from '../data/types'
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
