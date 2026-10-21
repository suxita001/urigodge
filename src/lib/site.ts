export const SITE_URL = 'https://www.urigod.ge'
export const SITE_NAME = 'urigod.ge'
export const CONTACT_EMAIL = 'info@urigod.ge'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export const restaurantPath = (slug: string) => `/restaurants/${slug}`
export const menuPath = (slug: string) => `/restaurants/${slug}/menu`
export const absoluteUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

/** "Featured places" on the home page is two rows of three. */
export const MAX_FEATURED = 6

/**
 * Table booking is built but switched off for now: with this false nobody — guests, managers or
 * admins — sees any booking button, page, tab or menu item. Flip to true to bring it all back.
 */
export const BOOKING_ENABLED = false
