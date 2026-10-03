// Thin wrapper over the Gemini REST API (free tier). The key is read from the GEMINI_API_KEY
// environment variable set in Vercel — it must never be committed or sent to the browser.
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

// Tried in order; a model the key has no access to (404) or whose quota is used up (429) is skipped.
const MODELS = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'])]
let preferred = 0

export class GeminiError extends Error {
  code: 'not_configured' | 'rate_limited' | 'failed'
  constructor(code: GeminiError['code'], message?: string) {
    super(message ?? code)
    this.code = code
  }
}

export interface GeminiContent {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface GenerateOptions {
  system: string
  contents: GeminiContent[]
  /** Gemini response schema (OpenAPI subset); the reply is parsed as JSON of this shape. */
  schema: Record<string, unknown>
  temperature?: number
  maxOutputTokens?: number
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1))
    throw new Error('Model did not return JSON')
  }
}

export async function generateJson<T>(options: GenerateOptions): Promise<{ data: T; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new GeminiError('not_configured')

  let rateLimited = false
  let lastError = ''
  for (let attempt = 0; attempt < MODELS.length; attempt++) {
    const index = (preferred + attempt) % MODELS.length
    const model = MODELS[index]
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: options.contents,
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxOutputTokens ?? 1024,
          responseMimeType: 'application/json',
          responseSchema: options.schema,
        },
      }),
    })

    if (res.ok) {
      const payload = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] }
      const raw = (payload.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && p.text)
        .map((p) => p.text)
        .join('')
      if (!raw) {
        lastError = `${model}: empty response`
        continue
      }
      preferred = index
      return { data: parseJson(raw) as T, model }
    }

    const body = await res.text().catch(() => '')
    lastError = `${model}: ${res.status} ${body.slice(0, 300)}`
    if (res.status === 429) rateLimited = true
    // 400/404 = unknown or unsupported model, 429 = this model's quota, 5xx = overloaded → try the next one.
    if (res.status === 401 || res.status === 403) break
  }
  console.error('[gemini]', lastError)
  throw new GeminiError(rateLimited ? 'rate_limited' : 'failed', lastError)
}
