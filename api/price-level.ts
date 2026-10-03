import { GeminiError, generateJson } from './_lib/gemini.js'
import { clientIp, parseBody, rateLimited, type ApiRequest, type ApiResponse } from './_lib/http.js'

const SYSTEM = `You classify how expensive a venue in Tbilisi, Georgia is, from its menu. Prices are in Georgian lari (₾, GEL).

Return one level:
1 = budget (₾): a typical main dish costs under ~15 ₾; canteens, bakeries, khinkali houses, fast food, most coffee bars.
2 = mid-range (₾₾): typical mains ~15–30 ₾; most casual restaurants, pizzerias, bistros, cocktail bars.
3 = premium (₾₾₾): typical mains above ~30 ₾; fine dining, steakhouses, sushi and seafood restaurants, upscale wine bars.

Judge by what a normal guest would order as a meal here. Ignore per-piece items (a single khinkali), bread, sauces and extras. For coffee shops, bakeries and dessert places compare against similar venues: a 9 ₾ cappuccino is mid-range, a 15 ₾ one is premium. For bars judge by drink prices (cocktail under 15 ₾ = 1, 15–25 ₾ = 2, above 25 ₾ = 3).`

const SCHEMA = {
  type: 'OBJECT',
  properties: { level: { type: 'INTEGER' }, reason: { type: 'STRING' } },
  required: ['level', 'reason'],
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).json({ error: 'method_not_allowed' })
    return
  }
  if (rateLimited(`price:${clientIp(req)}`, 20)) {
    res.status(429).json({ error: 'rate_limited' })
    return
  }

  const body = parseBody(req)
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
  const items = (Array.isArray(body.items) ? body.items : [])
    .filter((i): i is { name?: unknown; category?: unknown; price: number } => !!i && typeof i === 'object' && Number((i as { price?: unknown }).price) > 0)
    .slice(0, 150)
    .map((i) => `${str(i.category, 40)} / ${str(i.name, 60)}: ${Number(i.price)} ₾`)
  if (items.length === 0) {
    res.status(400).json({ error: 'bad_request' })
    return
  }

  try {
    const cuisine = Array.isArray(body.cuisine) ? body.cuisine.filter((c) => typeof c === 'string').join(', ') : ''
    const { data, model } = await generateJson<{ level?: number; reason?: string }>({
      system: SYSTEM,
      contents: [{ role: 'user', parts: [{ text: `Venue: ${str(body.name, 80)}\nType: ${str(body.category, 30)}\nCuisine: ${cuisine.slice(0, 120)}\nMenu:\n${items.join('\n')}` }] }],
      schema: SCHEMA,
      temperature: 0,
      maxOutputTokens: 200,
    })
    const level = Math.round(Number(data.level))
    if (level !== 1 && level !== 2 && level !== 3) throw new Error('level out of range')
    res.setHeader('Cache-Control', 'no-store').setHeader('X-AI-Model', model).status(200).json({ level, reason: String(data.reason ?? '') })
  } catch (e) {
    if (e instanceof GeminiError) {
      res.status(e.code === 'rate_limited' ? 429 : 503).json({ error: e.code })
      return
    }
    console.error('[price-level]', e)
    res.status(500).json({ error: 'failed' })
  }
}
