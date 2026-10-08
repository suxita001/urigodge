import { requireStaff } from './_lib/auth.js'
import { GeminiError, generateJson } from './_lib/gemini.js'
import { parseBody, rateLimited, type ApiRequest, type ApiResponse } from './_lib/http.js'

// Reads one photo (or PDF page set) of a printed menu and returns it as structured, bilingual data.
// The dashboard sends files one at a time and merges the results, which keeps each request small.

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_BASE64_CHARS = 4_100_000 // ≈ 3 MB of file; Vercel rejects request bodies above 4.5 MB

const SYSTEM = `You convert a photo or PDF of a restaurant menu from Georgia into structured data.

Rules:
- Return EVERY dish and drink that is readable. Never invent items, descriptions or prices.
- Keep the menu's own sections as categories, in the order they appear. If the menu has no sections, use a single category named "მენიუ" / "Menu".
- Every name is given in Georgian (name_ka) and English (name_en). If the menu is printed in only one language, translate into the other. Use the usual English spellings of Georgian dishes (Khinkali, Khachapuri, Mtsvadi) and write foreign brand or dish names in Georgian letters the way a Georgian menu would.
- description_ka / description_en: only when the menu itself prints a description or ingredients for that item — translate it into the missing language. Otherwise both must be empty strings.
- price: the number printed for the item, in Georgian lari, without the currency sign. If no price is readable use 0.
- options: only when the menu prints them for that item; otherwise an empty array. Each group has a kind:
  - "variant": the item is sold in several sizes or versions, each with its own price (0.33 l / 0.5 l, small / large, single / double). List every size with its full price, name the group "ზომა" / "Size" (or what the menu calls it), and set the item's price to the cheapest one. Never output separate items per size.
  - "choice": the guest picks exactly one of several (a combo's drink: Cola / Fanta / Sprite; a sauce). Option price is the surcharge printed for it, or 0 when it is included.
  - "addon": optional extras that cost more (toppings, extra cheese, extra shot). Option price is the amount added.
  Extras printed once for a whole section (for example "ტოპინგები +1 ₾" under ice creams) belong to every item of that section.
- Ignore everything that is not an item: logos, addresses, phone numbers, slogans, service-charge notes, page numbers.
- If the file is not a menu, return an empty "categories" array.`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    categories: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name_ka: { type: 'STRING' },
          name_en: { type: 'STRING' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name_ka: { type: 'STRING' },
                name_en: { type: 'STRING' },
                description_ka: { type: 'STRING' },
                description_en: { type: 'STRING' },
                price: { type: 'NUMBER' },
                options: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      kind: { type: 'STRING', enum: ['variant', 'choice', 'addon'] },
                      name_ka: { type: 'STRING' },
                      name_en: { type: 'STRING' },
                      options: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: { name_ka: { type: 'STRING' }, name_en: { type: 'STRING' }, price: { type: 'NUMBER' } },
                          required: ['name_ka', 'name_en', 'price'],
                        },
                      },
                    },
                    required: ['kind', 'name_ka', 'name_en', 'options'],
                  },
                },
              },
              required: ['name_ka', 'name_en', 'description_ka', 'description_en', 'price', 'options'],
            },
          },
        },
        required: ['name_ka', 'name_en', 'items'],
      },
    },
  },
  required: ['categories'],
}

interface RawItem {
  name_ka?: string
  name_en?: string
  description_ka?: string
  description_en?: string
  price?: number
  options?: { kind?: string; name_ka?: string; name_en?: string; options?: { name_ka?: string; name_en?: string; price?: number }[] }[]
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const money = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v) * 100) / 100 : 0)

const DEFAULT_GROUP_NAME = { variant: { ka: 'ზომა', en: 'Size' }, choice: { ka: 'არჩევანი', en: 'Choice' }, addon: { ka: 'დამატება', en: 'Extras' } }

function cleanOptions(raw: RawItem['options']) {
  let hasVariants = false
  return (Array.isArray(raw) ? raw : [])
    .map((g) => {
      const kind = g.kind === 'variant' || g.kind === 'choice' ? g.kind : ('addon' as const)
      const options = (Array.isArray(g.options) ? g.options : [])
        .map((o) => ({ name: { ka: clean(o.name_ka, 80) || clean(o.name_en, 80), en: clean(o.name_en, 80) || clean(o.name_ka, 80) }, price: money(o.price) }))
        .filter((o) => o.name.ka && (kind !== 'variant' || o.price > 0))
      return { kind, name: { ka: clean(g.name_ka, 60) || DEFAULT_GROUP_NAME[kind].ka, en: clean(g.name_en, 60) || DEFAULT_GROUP_NAME[kind].en }, options }
    })
    .filter((g) => {
      // A dish has one set of sizes at most, and a single "size" is just the price.
      if (g.kind === 'variant' && (hasVariants || g.options.length < 2)) return false
      if (g.kind === 'variant') hasVariants = true
      return g.options.length > 0
    })
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).json({ error: 'method_not_allowed' })
    return
  }

  let staff
  try {
    staff = await requireStaff(req)
  } catch (e) {
    console.error('[menu-import] auth', e)
    res.status(503).json({ error: 'failed' })
    return
  }
  if (!staff) {
    res.status(403).json({ error: 'forbidden' })
    return
  }
  if (rateLimited(`menu:${staff.uid}`, 20)) {
    res.status(429).json({ error: 'rate_limited' })
    return
  }

  const body = parseBody(req)
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : ''
  const data = typeof body.data === 'string' ? body.data : ''
  if (!ALLOWED_TYPES.includes(mimeType) || !data || data.length > MAX_BASE64_CHARS) {
    res.status(400).json({ error: 'bad_request' })
    return
  }

  try {
    const { data: result, model } = await generateJson<{ categories?: { name_ka?: string; name_en?: string; items?: RawItem[] }[] }>({
      system: SYSTEM,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data } }, { text: 'Extract this menu.' }] }],
      schema: SCHEMA,
      temperature: 0,
      maxOutputTokens: 32000,
    })
    const categories = (Array.isArray(result.categories) ? result.categories : [])
      .map((c) => ({
        name: { ka: clean(c.name_ka, 80) || clean(c.name_en, 80), en: clean(c.name_en, 80) || clean(c.name_ka, 80) },
        items: (Array.isArray(c.items) ? c.items : [])
          .map((i) => {
            const options = cleanOptions(i.options)
            const variants = options.find((g) => g.kind === 'variant')
            return {
              name: { ka: clean(i.name_ka, 120) || clean(i.name_en, 120), en: clean(i.name_en, 120) || clean(i.name_ka, 120) },
              description: { ka: clean(i.description_ka, 400), en: clean(i.description_en, 400) },
              price: variants ? Math.min(...variants.options.map((o) => o.price)) : money(i.price),
              ...(options.length ? { options } : {}),
            }
          })
          .filter((i) => i.name.ka || i.name.en),
      }))
      .filter((c) => c.items.length > 0)
    res.setHeader('Cache-Control', 'no-store').setHeader('X-AI-Model', model).status(200).json({ categories })
  } catch (e) {
    if (e instanceof GeminiError) {
      res.status(e.code === 'rate_limited' ? 429 : 503).json({ error: e.code })
      return
    }
    console.error('[menu-import]', e)
    res.status(500).json({ error: 'failed' })
  }
}
