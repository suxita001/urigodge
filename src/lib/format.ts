import type { Lang, PriceLevel, Restaurant } from '../data/types'

export function priceSymbol(level: PriceLevel): string {
  return '₾'.repeat(level)
}

const kaMonths = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']

// Built manually for Georgian because some browsers ship without ka locale data for Intl.
export function formatDate(date: Date, lang: 'ka' | 'en'): string {
  if (lang === 'ka') return `${date.getDate()} ${kaMonths[date.getMonth()]}, ${date.getFullYear()}`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function priceLabel(level: PriceLevel, lang: 'ka' | 'en'): string {
  const labels = {
    ka: { 1: 'ხელმისაწვდომი', 2: 'საშუალო', 3: 'პრემიუმ' },
    en: { 1: 'Budget', 2: 'Mid-range', 3: 'Premium' },
  }
  return labels[lang][level]
}

/** Venue name in the interface language, falling back to whichever name exists. */
export function venueName(r: Pick<Restaurant, 'name' | 'nameI18n'>, lang: Lang): string {
  return r.nameI18n?.[lang] || r.name
}
