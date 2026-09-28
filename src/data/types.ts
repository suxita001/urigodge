export type Lang = 'ka' | 'en'

export type LocalizedText = {
  ka: string
  en: string
}

export type CategoryId =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'burger'
  | 'pizza'
  | 'georgian'
  | 'asian'
  | 'dessert'
  | 'coffee'

export type CuisineId =
  | 'georgian'
  | 'european'
  | 'italian'
  | 'asian'
  | 'international'
  | 'mediterranean'
  | 'american'

export type NeighborhoodId =
  | 'old-tbilisi'
  | 'vera'
  | 'vake'
  | 'saburtalo'
  | 'chugureti'
  | 'mtatsminda'

export type PriceLevel = 1 | 2 | 3

export interface Coordinates {
  lat: number
  lng: number
}

export interface DayHours {
  open: string
  close: string
  closed?: boolean
}

export type OpeningHours = {
  mon: DayHours
  tue: DayHours
  wed: DayHours
  thu: DayHours
  fri: DayHours
  sat: DayHours
  sun: DayHours
}

export interface Branch {
  id: string
  name: LocalizedText
  address: LocalizedText
  phone: string
  coordinates: Coordinates
  openingHours: OpeningHours
  isMain?: boolean
}

export interface MenuItem {
  id: string
  name: LocalizedText
  description: LocalizedText
  price: number
  image?: string
  /** Missing means available. */
  available?: boolean
}

export interface MenuCategoryData {
  id: string
  name: LocalizedText
  items: MenuItem[]
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
}

export type RestaurantStatus = 'published' | 'draft'

export interface Restaurant {
  id: string
  slug: string
  /** Display name (English, falling back to Georgian). Use `nameI18n` when editing. */
  name: string
  nameI18n: LocalizedText
  description: LocalizedText
  shortDescription: LocalizedText
  category: CategoryId
  cuisine: CuisineId[]
  priceLevel: PriceLevel
  images: string[]
  coverImage: string
  address: LocalizedText
  neighborhood: NeighborhoodId
  phone: string
  website?: string
  socialLinks?: SocialLinks
  coordinates: Coordinates
  openingHours: OpeningHours
  branches: Branch[]
  menu: MenuCategoryData[]
  features: string[]
  qrEnabled: boolean
  popularity: number
  logo?: string
  status: RestaurantStatus
  updatedAt?: Date | null
}

export type UserRole = 'user' | 'restaurant_manager' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'blocked'

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  phone?: string
  managedRestaurantIds: string[]
  createdAt: Date | null
  lastActiveAt: Date | null
}

export type InvitationRole = 'admin' | 'restaurant_manager'

export interface Invitation {
  email: string
  role: InvitationRole
  name?: string
  phone?: string
  restaurantIds: string[]
  status: 'pending' | 'accepted'
  invitedByUid: string
  invitedByName: string
  createdAt: Date | null
}

export type LogCategory = 'users' | 'restaurants' | 'menus' | 'managers' | 'admins' | 'auth'

export type ActivityAction =
  | 'USER_REGISTERED'
  | 'USER_ROLE_CHANGED'
  | 'USER_UPDATED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'RESTAURANT_CREATED'
  | 'RESTAURANT_UPDATED'
  | 'RESTAURANT_DELETED'
  | 'MENU_CREATED'
  | 'MENU_UPDATED'
  | 'MENU_ITEM_ADDED'
  | 'MENU_ITEM_UPDATED'
  | 'MENU_ITEM_DELETED'
  | 'BRANCH_CREATED'
  | 'BRANCH_UPDATED'
  | 'BRANCH_DELETED'
  | 'MANAGER_ASSIGNED'
  | 'MANAGER_REMOVED'
  | 'MANAGER_INVITED'
  | 'ADMIN_CREATED'
  | 'ADMIN_REMOVED'
  | 'ADMIN_INVITED'
  | 'INVITATION_ACCEPTED'
  | 'SETTINGS_UPDATED'
  | 'LOGIN'
  | 'LOGOUT'

export interface ActivityLog {
  id: string
  actorUid: string
  actorName: string
  actorEmail: string
  action: ActivityAction
  category: LogCategory
  targetType: 'user' | 'restaurant' | 'menu' | 'branch' | 'invitation' | 'settings' | 'auth'
  targetId: string
  targetName?: string
  restaurantId?: string
  description: string
  timestamp: Date | null
}

export interface SiteSettings {
  demoFallback: boolean
}

export interface Favorite {
  restaurantId: string
  createdAt: Date | null
}

export type ImageKind = 'cover' | 'gallery' | 'menu' | 'logo'

// Shape of a document in the Firestore `restaurants` collection. The document ID should equal `slug`.
// Timestamps are typed loosely because they are FieldValue on write and Timestamp on read.
export interface RestaurantDoc {
  name: LocalizedText
  slug: string
  description: LocalizedText
  shortDescription?: LocalizedText
  category: CategoryId
  cuisine: CuisineId | CuisineId[]
  priceLevel: PriceLevel
  images: string[]
  coverImage?: string
  logo?: string
  address: LocalizedText
  neighborhood: NeighborhoodId
  phone: string
  website?: string
  socialLinks?: SocialLinks
  coordinates: Coordinates
  openingHours: Partial<OpeningHours>
  branches: Branch[]
  menu: MenuCategoryData[]
  features: string[]
  qrEnabled: boolean
  popularity?: number
  status?: RestaurantStatus
  createdAt?: unknown
  updatedAt?: unknown
}
