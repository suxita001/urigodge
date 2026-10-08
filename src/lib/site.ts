export const SITE_URL = 'https://www.urigod.ge'
export const SITE_NAME = 'urigod.ge'
export const CONTACT_EMAIL = 'info@urigod.ge'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export const restaurantPath = (slug: string) => `/restaurants/${slug}`
export const menuPath = (slug: string) => `/restaurants/${slug}/menu`
export const absoluteUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

/** "Featured places" on the home page is two rows of three. */
export const MAX_FEATURED = 6
