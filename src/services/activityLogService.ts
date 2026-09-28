import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  Timestamp,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { ActivityAction, ActivityLog, LogCategory } from '../data/types'

const logsCol = collection(db, 'activityLogs')

export const ACTION_CATEGORY: Record<ActivityAction, LogCategory> = {
  USER_REGISTERED: 'users',
  USER_ROLE_CHANGED: 'users',
  USER_UPDATED: 'users',
  USER_BLOCKED: 'users',
  USER_UNBLOCKED: 'users',
  RESTAURANT_CREATED: 'restaurants',
  RESTAURANT_UPDATED: 'restaurants',
  RESTAURANT_DELETED: 'restaurants',
  BRANCH_CREATED: 'restaurants',
  BRANCH_UPDATED: 'restaurants',
  BRANCH_DELETED: 'restaurants',
  MENU_CREATED: 'menus',
  MENU_UPDATED: 'menus',
  MENU_ITEM_ADDED: 'menus',
  MENU_ITEM_UPDATED: 'menus',
  MENU_ITEM_DELETED: 'menus',
  MANAGER_ASSIGNED: 'managers',
  MANAGER_REMOVED: 'managers',
  MANAGER_INVITED: 'managers',
  ADMIN_CREATED: 'admins',
  ADMIN_REMOVED: 'admins',
  ADMIN_INVITED: 'admins',
  INVITATION_ACCEPTED: 'users',
  SETTINGS_UPDATED: 'admins',
  LOGIN: 'auth',
  LOGOUT: 'auth',
}

export const ACTION_LABELS: Record<ActivityAction, string> = {
  USER_REGISTERED: 'ახალი მომხმარებელი',
  USER_ROLE_CHANGED: 'როლი შეიცვალა',
  USER_UPDATED: 'მომხმარებელი განახლდა',
  USER_BLOCKED: 'მომხმარებელი დაიბლოკა',
  USER_UNBLOCKED: 'მომხმარებელი განიბლოკა',
  RESTAURANT_CREATED: 'რესტორანი დაემატა',
  RESTAURANT_UPDATED: 'რესტორანი განახლდა',
  RESTAURANT_DELETED: 'რესტორანი წაიშალა',
  BRANCH_CREATED: 'ფილიალი დაემატა',
  BRANCH_UPDATED: 'ფილიალი განახლდა',
  BRANCH_DELETED: 'ფილიალი წაიშალა',
  MENU_CREATED: 'მენიუ შეიქმნა',
  MENU_UPDATED: 'მენიუ განახლდა',
  MENU_ITEM_ADDED: 'კერძი დაემატა',
  MENU_ITEM_UPDATED: 'კერძი განახლდა',
  MENU_ITEM_DELETED: 'კერძი წაიშალა',
  MANAGER_ASSIGNED: 'მენეჯერი დაინიშნა',
  MANAGER_REMOVED: 'მენეჯერი მოიხსნა',
  MANAGER_INVITED: 'მენეჯერი მოწვეულია',
  ADMIN_CREATED: 'ადმინი დაინიშნა',
  ADMIN_REMOVED: 'ადმინი მოიხსნა',
  ADMIN_INVITED: 'ადმინი მოწვეულია',
  INVITATION_ACCEPTED: 'მოწვევა მიღებულია',
  SETTINGS_UPDATED: 'პარამეტრები შეიცვალა',
  LOGIN: 'შესვლა',
  LOGOUT: 'გასვლა',
}

export interface LogInput {
  action: ActivityAction
  targetType: ActivityLog['targetType']
  targetId: string
  targetName?: string
  restaurantId?: string
  description: string
}

// Logging is best-effort: a failed log write must never fail the action it describes.
// Actor identity is enforced by firestore.rules (actorUid/actorEmail must match the caller).
export async function logActivity(input: LogInput, actorName?: string): Promise<void> {
  const user = auth.currentUser
  if (!user) return
  try {
    await addDoc(logsCol, {
      actorUid: user.uid,
      actorName: actorName || user.displayName || user.email?.split('@')[0] || '',
      actorEmail: user.email ?? '',
      action: input.action,
      category: ACTION_CATEGORY[input.action],
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      restaurantId: input.restaurantId,
      description: input.description.slice(0, 500),
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[urigod] activity log failed', input.action, error)
  }
}

function toLog(d: QueryDocumentSnapshot): ActivityLog {
  const data = d.data()
  return {
    id: d.id,
    actorUid: data.actorUid ?? '',
    actorName: data.actorName ?? '',
    actorEmail: data.actorEmail ?? '',
    action: data.action,
    category: data.category ?? ACTION_CATEGORY[data.action as ActivityAction] ?? 'users',
    targetType: data.targetType,
    targetId: data.targetId ?? '',
    targetName: data.targetName,
    restaurantId: data.restaurantId,
    description: data.description ?? '',
    timestamp: (data.timestamp as Timestamp | null)?.toDate?.() ?? null,
  }
}

export interface LogQuery {
  since?: Date
  until?: Date
  category?: LogCategory
  action?: ActivityAction
  actorUid?: string
  /** Required for restaurant managers — rules only let them read their own restaurant's logs. */
  restaurantId?: string
}

export interface LogPage {
  logs: ActivityLog[]
  cursor: QueryDocumentSnapshot | null
}

// One equality filter is applied server-side (each has a composite index with timestamp, see
// firestore.indexes.json); any remaining filters are applied to the fetched page.
export async function fetchLogs(filters: LogQuery, pageSize = 20, cursor?: QueryDocumentSnapshot | null): Promise<LogPage> {
  const constraints: QueryConstraint[] = []
  const serverKey = (['restaurantId', 'actorUid', 'action', 'category'] as const).find((k) => filters[k])
  if (serverKey) constraints.push(where(serverKey, '==', filters[serverKey]))
  if (filters.since) constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.since)))
  if (filters.until) constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.until)))
  constraints.push(orderBy('timestamp', 'desc'))
  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(pageSize))

  const snap = await getDocs(query(logsCol, ...constraints))
  const logs = snap.docs.map(toLog).filter(
    (l) =>
      (!filters.category || l.category === filters.category) &&
      (!filters.action || l.action === filters.action) &&
      (!filters.actorUid || l.actorUid === filters.actorUid) &&
      (!filters.restaurantId || l.restaurantId === filters.restaurantId)
  )
  return { logs, cursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null }
}
