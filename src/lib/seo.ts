import type { Lang, OpeningHours, Restaurant } from '../data/types'
import { variantGroup } from './menuOptions'
import { cuisineMap } from '../data/categories'
import { SITE_NAME, SITE_URL, absoluteUrl, menuPath, restaurantPath } from './site'
import { priceSymbol } from './format'

type JsonLd = Record<string, unknown>

const DAY_NAMES: Record<keyof OpeningHours, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const SCHEMA_TYPE: Partial<Record<Restaurant['category'], string>> = {
  cafe: 'CafeOrCoffeeShop',
  coffee: 'CafeOrCoffeeShop',
  bar: 'BarOrPub',
  dessert: 'Bakery',
  burger: 'FastFoodRestaurant',
}

/** Name for <title>: the interface language first, the other spelling in brackets ("სახლი №11 (Sakhli No. 11)"). */
export function seoName(r: Restaurant, lang: Lang): string {
  const primary = r.nameI18n[lang] || r.name
  const other = r.nameI18n[lang === 'ka' ? 'en' : 'ka']
  return other && other !== primary ? `${primary} (${other})` : primary
}

export function websiteJsonLd(): JsonLd[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ['ka', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/restaurants?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
  ]
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: SITE_NAME, path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function restaurantListJsonLd(restaurants: Restaurant[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: restaurants.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: absoluteUrl(restaurantPath(r.slug)) })),
  }
}

export function restaurantJsonLd(r: Restaurant, lang: Lang): JsonLd {
  const sameAs = [r.website, r.socialLinks?.instagram, r.socialLinks?.facebook].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[r.category] ?? 'Restaurant',
    '@id': absoluteUrl(restaurantPath(r.slug)),
    name: r.nameI18n[lang] || r.name,
    alternateName: r.nameI18n.ka && r.nameI18n.en && r.nameI18n.ka !== r.nameI18n.en ? [r.nameI18n.ka, r.nameI18n.en] : undefined,
    description: r.description[lang] || r.description.ka,
    url: absoluteUrl(restaurantPath(r.slug)),
    image: r.images.length ? r.images.slice(0, 6) : r.coverImage ? [r.coverImage] : undefined,
    telephone: r.phone || undefined,
    priceRange: priceSymbol(r.priceLevel),
    servesCuisine: r.cuisine.map((c) => cuisineMap[c]?.label.en).filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      streetAddress: r.address[lang] || r.address.ka,
      addressLocality: lang === 'ka' ? 'თბილისი' : 'Tbilisi',
      addressCountry: 'GE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: r.coordinates.lat, longitude: r.coordinates.lng },
    openingHoursSpecification: (Object.keys(DAY_NAMES) as (keyof OpeningHours)[])
      .filter((day) => !r.openingHours[day].closed)
      .map((day) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[day], opens: r.openingHours[day].open, closes: r.openingHours[day].close })),
    hasMenu: r.menu.length ? absoluteUrl(menuPath(r.slug)) : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }
}

export function menuJsonLd(r: Restaurant, lang: Lang): JsonLd {
  const text = (t: { ka: string; en: string }) => t[lang] || t.ka || t.en
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${r.name} — ${lang === 'ka' ? 'მენიუ' : 'Menu'}`,
    url: absoluteUrl(menuPath(r.slug)),
    inLanguage: lang,
    hasMenuSection: r.menu.map((section) => ({
      '@type': 'MenuSection',
      name: text(section.name),
      hasMenuItem: section.items.map((item) => ({
        '@type': 'MenuItem',
        name: text(item.name),
        description: text(item.description) || undefined,
        image: item.image || undefined,
        offers: variantGroup(item)
          ? variantGroup(item)!.options.map((o) => ({ '@type': 'Offer', name: text(o.name), price: o.price.toFixed(2), priceCurrency: 'GEL' }))
          : { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'GEL' },
      })),
    })),
  }
}
