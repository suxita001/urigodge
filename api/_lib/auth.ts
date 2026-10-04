import type { ApiRequest } from './http.js'

// Public web config of the Firebase project (the same values ship in the site's JavaScript).
const FIREBASE_WEB_API_KEY = 'AIzaSyCFWrceDRcQVQU8YiNZCDVSJzQcc67mbB4'
const PROJECT_ID = 'urigodge-90c46'
const SUPER_ADMIN_EMAIL = 'nikasuxita96@gmail.com'
const STAFF_ROLES = ['admin', 'super_admin', 'restaurant_manager']

export interface StaffUser {
  uid: string
  email: string
  role: string
}

/**
 * Resolves the signed-in dashboard user from the `Authorization: Bearer <Firebase ID token>` header.
 * Returns null for anonymous callers, ordinary users and blocked accounts.
 *
 * The token is checked by Firebase itself (accounts:lookup rejects forged or expired tokens), and the
 * role is read from the caller's own Firestore profile using that same token, so the security rules apply.
 */
export async function requireStaff(req: ApiRequest): Promise<StaffUser | null> {
  const header = req.headers.authorization
  const token = (Array.isArray(header) ? header[0] : header)?.replace(/^Bearer\s+/i, '')
  if (!token) return null

  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  })
  if (!lookup.ok) return null
  const account = ((await lookup.json()) as { users?: { localId: string; email?: string; emailVerified?: boolean; disabled?: boolean }[] }).users?.[0]
  if (!account || account.disabled) return null
  const email = (account.email ?? '').toLowerCase()

  if (email === SUPER_ADMIN_EMAIL && account.emailVerified) return { uid: account.localId, email, role: 'super_admin' }

  const profile = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${account.localId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!profile.ok) return null
  const fields = ((await profile.json()) as { fields?: Record<string, { stringValue?: string }> }).fields ?? {}
  const role = fields.role?.stringValue ?? 'user'
  if (!STAFF_ROLES.includes(role) || fields.status?.stringValue === 'blocked') return null
  return { uid: account.localId, email, role }
}
