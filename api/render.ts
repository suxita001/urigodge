import { getRestaurant, type ApiRestaurant } from './_lib/firestore.js'
import { SITE_URL, requestHost, type ApiRequest, type ApiResponse } from './_lib/http.js'

// Restaurant pages (/restaurants/:slug and /restaurants/:slug/menu) are routed here by vercel.json.
// The function returns the normal SPA shell with that restaurant's title, description, Open Graph
// tags and JSON-LD already in the HTML, so link previews (Messenger, Viber, Telegram…) and crawlers
// that do not run JavaScript see real data. The React app then boots exactly as on any other page.

const DAY_NAMES: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
const SCHEMA_TYPE: Record<string, string> = { cafe: 'CafeOrCoffeeShop', coffee: 'CafeOrCoffeeShop', bar: 'BarOrPub', dessert: 'Bakery', burger: 'FastFoodRestaurant' }

const TEMPLATE_TTL_MS = 5 * 60_000
let template: { at: number; html: string } | null = null

async function loadTemplate(host: string): Promise<string | null> {
  if (template && Date.now() - template.at < TEMPLATE_TTL_MS) return template.html
  try {
    const res = await fetch(`https://${host}/index.html`, { headers: { 'User-Agent': 'urigod-render' } })
    const html = res.ok ? await res.text() : ''
    if (html.includes('<div id="root">')) {
      template = { at: Date.now(), html }
      return html
    }
  } catch (e) {
    console.error('[render] template fetch failed', e)
  }
  return template?.html ?? null
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const oneLine = (s: string, max: number) => {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

function displayName(r: ApiRestaurant): string {
  // Georgian first (the site's main audience searches in Georgian), Latin spelling in brackets.
  const primary = r.name.ka || r.name.en || r.slug
  return r.name.en && r.name.en !== primary ? `${primary} (${r.name.en})` : primary
}

function restaurantJsonLd(r: ApiRestaurant, url: string) {
  const sameAs = [r.website, r.socialLinks?.instagram, r.socialLinks?.facebook].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[r.category] ?? 'Restaurant',
    '@id': url,
    name: r.name.ka || r.name.en,
    alternateName: r.name.en && r.name.en !== r.name.ka ? r.name.en : undefined,
    description: r.description.ka || r.description.en,
    url,
    image: r.images.length ? r.images.slice(0, 6) : r.coverImage ? [r.coverImage] : undefined,
    telephone: r.phone || undefined,
    priceRange: '₾'.repeat(r.priceLevel),
    servesCuisine: r.cuisine,
    address: { '@type': 'PostalAddress', streetAddress: r.address.ka || r.address.en, addressLocality: 'თბილისი', addressCountry: 'GE' },
    geo: { '@type': 'GeoCoordinates', latitude: r.coordinates.lat, longitude: r.coordinates.lng },
    openingHoursSpecification: Object.entries(DAY_NAMES)
      .filter(([day]) => r.openingHours[day] && !r.openingHours[day]!.closed)
      .map(([day, name]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: name, opens: r.openingHours[day]!.open, closes: r.openingHours[day]!.close })),
    hasMenu: r.menu.length ? `${url}/menu` : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }
}

function menuJsonLd(r: ApiRestaurant, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${r.name.ka || r.name.en} — მენიუ`,
    url,
    inLanguage: 'ka',
    hasMenuSection: r.menu.map((section) => ({
      '@type': 'MenuSection',
      name: section.name.ka || section.name.en,
      hasMenuItem: section.items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name.ka || item.name.en,
        description: item.description.ka || item.description.en || undefined,
        image: item.image,
        offers: { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'GEL' },
      })),
    })),
  }
}

function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'urigod.ge', url: SITE_URL }, ...items].map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  }
}

interface PageMeta {
  title: string
  description: string
  url: string
  image?: string
  jsonLd: object[]
  noindex?: boolean
}

function inject(html: string, meta: PageMeta): string {
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')
  const image = meta.image || `${SITE_URL}/og-image.png`
  const tags = [
    `<title>${escapeAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${escapeAttr(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="urigod.ge" />`,
    `<meta property="og:locale" content="ka_GE" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(meta.url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    // "<" is escaped so restaurant text can never close the script tag.
    ...meta.jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`),
  ]
  return stripped.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const param = (name: string) => {
    const value = req.query[name]
    return (Array.isArray(value) ? value[0] : value) ?? ''
  }
  const slug = param('slug')
  const isMenu = param('menu') === '1'
  const path = `/restaurants/${encodeURIComponent(slug)}${isMenu ? '/menu' : ''}`

  const html = await loadTemplate(requestHost(req) || 'www.urigod.ge')
  if (!html) {
    // Could not read the app shell: hand over to the static file, the app restores the route itself.
    res.setHeader('Cache-Control', 'no-store').setHeader('Location', `/index.html?route=${encodeURIComponent(path)}`).status(302).send('')
    return
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  try {
    const r = slug ? await getRestaurant(slug) : null
    if (!r) {
      // Unknown or unpublished: plain shell (the app redirects to the list), kept out of the index.
      res.setHeader('Cache-Control', 'public, s-maxage=60').status(404).send(html.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n  </head>'))
      return
    }
    const name = displayName(r)
    const pageUrl = `${SITE_URL}/restaurants/${encodeURIComponent(r.slug)}`
    const itemCount = r.menu.reduce((n, c) => n + c.items.length, 0)
    const crumbs = [
      { name: 'რესტორნები', url: `${SITE_URL}/restaurants` },
      { name: r.name.ka || r.name.en, url: pageUrl },
    ]
    const meta: PageMeta = isMenu
      ? {
          title: `${name} — მენიუ და ფასები | urigod.ge`,
          description: oneLine(`${r.name.ka || r.name.en} — სრული მენიუ ფასებით: ${itemCount} კერძი და სასმელი. ${r.address.ka}`, 200),
          url: `${pageUrl}/menu`,
          image: r.coverImage,
          jsonLd: [menuJsonLd(r, `${pageUrl}/menu`), breadcrumbJsonLd([...crumbs, { name: 'მენიუ', url: `${pageUrl}/menu` }])],
        }
      : {
          title: `${name} — მენიუ, ფასები, მისამართი და სამუშაო საათები | urigod.ge`,
          description: oneLine(`${r.shortDescription.ka || r.shortDescription.en} ${r.address.ka}`, 200),
          url: pageUrl,
          image: r.coverImage,
          jsonLd: [restaurantJsonLd(r, pageUrl), breadcrumbJsonLd(crumbs)],
        }
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400').status(200).send(inject(html, meta))
  } catch (e) {
    console.error('[render]', e)
    res.setHeader('Cache-Control', 'no-store').status(200).send(html)
  }
}
