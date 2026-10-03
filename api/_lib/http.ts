// Minimal shapes of the Node request/response objects Vercel hands to a function,
// so the API code needs no extra type packages.
export interface ApiRequest {
  method?: string
  body?: unknown
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
}

export interface ApiResponse {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): ApiResponse
  json(body: unknown): void
  send(body: string): void
}

export const SITE_URL = 'https://www.urigod.ge'

const header = (req: ApiRequest, name: string): string => {
  const value = req.headers[name]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export const clientIp = (req: ApiRequest) => header(req, 'x-forwarded-for').split(',')[0].trim() || 'unknown'
export const requestHost = (req: ApiRequest) => header(req, 'x-forwarded-host') || header(req, 'host')

// Best-effort limiter: counters live in this function instance's memory, so they reset on a cold
// start and are not shared between instances. Enough to stop a single client from burning the quota.
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimited(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.resetAt < now) {
    if (hits.size > 5000) hits.clear()
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > limit
}

export function parseBody(req: ApiRequest): Record<string, unknown> {
  const body = req.body
  if (body && typeof body === 'object') return body as Record<string, unknown>
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    } catch {
      /* not JSON */
    }
  }
  return {}
}
