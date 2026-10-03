import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, absoluteUrl } from '../lib/site'

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

const JSON_LD_ID = 'seo-jsonld'

export interface SeoOptions {
  /** Canonical path, e.g. `/restaurants/stamba`. Defaults to the current pathname. */
  path?: string
  image?: string
  jsonLd?: object | object[]
  noindex?: boolean
}

const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/profile', '/login', '/register', '/forgot-password', '/invite']

/** Keeps <title>, description, canonical, Open Graph / Twitter tags and JSON-LD in sync with the current page. */
export function useSeo(title: string, description?: string, options: SeoOptions = {}) {
  const { path, image, noindex } = options
  const jsonLd = options.jsonLd ? JSON.stringify(options.jsonLd) : ''

  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const pathname = path ?? window.location.pathname
    const url = absoluteUrl(pathname)
    const isPrivate = noindex ?? PRIVATE_PREFIXES.some((p) => pathname.startsWith(p))

    setCanonical(url)
    setMeta('robots', isPrivate ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setMeta('og:title', title, 'property')
    setMeta('og:url', url, 'property')
    setMeta('og:image', image || DEFAULT_OG_IMAGE, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:image', image || DEFAULT_OG_IMAGE)
    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, 'property')
      setMeta('twitter:description', description)
    }

    // The server may have already injected structured data for this URL; the client copy replaces it.
    document.querySelectorAll(`script[type="application/ld+json"]`).forEach((el) => el.remove())
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = JSON_LD_ID
      script.textContent = jsonLd
      document.head.appendChild(script)
    }

    return () => {
      document.title = prevTitle
      document.getElementById(JSON_LD_ID)?.remove()
    }
  }, [title, description, path, image, noindex, jsonLd])
}
