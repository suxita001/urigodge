import { listRestaurants } from './_lib/firestore.js'
import { SITE_URL, type ApiRequest, type ApiResponse } from './_lib/http.js'
import { landingPath, listLandings } from '../shared/taxonomy.js'

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/restaurants', priority: '0.9', changefreq: 'daily' },
  { path: '/map', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.4', changefreq: 'monthly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
]

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Served at /sitemap.xml (see vercel.json). Always reflects what is currently published.
export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const urls = STATIC_PAGES.map((p) => `  <url><loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`)
  try {
    const restaurants = await listRestaurants()
    for (const l of listLandings(restaurants)) {
      urls.push(`  <url><loc>${SITE_URL}${landingPath(l.kind, l.id, l.areaId)}</loc><changefreq>weekly</changefreq><priority>${l.areaId ? '0.5' : '0.6'}</priority></url>`)
    }
    for (const r of restaurants) {
      const lastmod = r.updatedAt ? `<lastmod>${r.updatedAt.slice(0, 10)}</lastmod>` : ''
      const slug = escapeXml(encodeURIComponent(r.slug))
      urls.push(`  <url><loc>${SITE_URL}/restaurants/${slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`)
      if (r.menu.some((c) => c.items.length)) {
        urls.push(`  <url><loc>${SITE_URL}/restaurants/${slug}/menu</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`)
      }
    }
  } catch (e) {
    // The static pages alone still make a valid sitemap.
    console.error('[sitemap]', e)
  }
  res
    .setHeader('Content-Type', 'application/xml; charset=utf-8')
    .setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    .status(200)
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
}
