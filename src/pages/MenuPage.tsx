import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Search, X, UtensilsCrossed, MapPin, Phone, SearchX } from 'lucide-react'
import { useRestaurant } from '../hooks/useRestaurants'
import { useLanguage } from '../i18n/LanguageContext'
import { useSeo } from '../hooks/useSeo'
import { isOpenNow } from '../data/helpers'
import { categoryMap, neighborhoodMap } from '../data/categories'
import { breadcrumbJsonLd, menuJsonLd, seoName } from '../lib/seo'
import { menuPath, restaurantPath } from '../lib/site'
import { venueName } from '../lib/format'
import { sized, srcSet } from '../lib/image'
import type { MenuCategoryData, MenuItem } from '../data/types'

const formatPrice = (price: number) => (Number.isInteger(price) ? String(price) : price.toFixed(2))

function MenuSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 animate-pulse" aria-busy="true">
      <div className="h-4 w-40 rounded-full bg-cream-2" />
      <div className="mt-5 h-9 w-72 max-w-full rounded-full bg-cream-2" />
      <div className="mt-8 flex gap-2">
        {[90, 120, 80, 110].map((w) => (
          <div key={w} style={{ width: w }} className="h-10 rounded-full bg-cream-2" />
        ))}
      </div>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-cream-2" />
        ))}
      </div>
    </div>
  )
}

function ItemCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const { t, tx } = useLanguage()
  const unavailable = item.available === false
  const description = tx(item.description)
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`group w-full h-full text-left flex items-stretch gap-4 p-3.5 sm:p-4 rounded-2xl border border-border bg-white hover:border-green/50 hover:shadow-card transition-all ${
          unavailable ? 'opacity-60' : ''
        }`}
      >
        <span className="min-w-0 flex-1 flex flex-col">
          <span className="font-bold text-[15.5px] text-ink leading-snug">{tx(item.name)}</span>
          {description && <span className="mt-1 text-[13.5px] text-ink-soft leading-relaxed line-clamp-2">{description}</span>}
          <span className="mt-auto pt-2.5 flex items-center gap-2">
            <span className="font-extrabold text-[15.5px] text-green tabular-nums">{formatPrice(item.price)} ₾</span>
            {unavailable && <span className="px-2 py-0.5 rounded-full bg-cream-2 text-[11.5px] font-bold text-ink-faint">{t('menu_unavailable')}</span>}
          </span>
        </span>
        {item.image && (
          <img
            src={sized(item.image, 112, 112)}
            srcSet={srcSet(item.image, 112, 112)}
            alt={tx(item.name)}
            width={112}
            height={112}
            loading="lazy"
            decoding="async"
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 bg-cream-2 transition-transform duration-300 group-hover:scale-[1.03] ${unavailable ? 'grayscale' : ''}`}
          />
        )}
      </button>
    </li>
  )
}

function ItemSheet({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { t, tx } = useLanguage()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-ink/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={tx(item.name)}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={t('close_modal')} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-ink">
          <X size={18} />
        </button>
        {item.image && <img src={sized(item.image, 900, 675)} alt={tx(item.name)} className="w-full aspect-[4/3] object-cover bg-cream-2" />}
        <div className={`p-5 sm:p-6 overflow-y-auto ${item.image ? '' : 'pt-12'}`}>
          <h3 className="text-[20px] font-extrabold text-ink leading-snug">{tx(item.name)}</h3>
          {tx(item.description) && <p className="mt-2 text-[14.5px] text-ink-soft leading-relaxed">{tx(item.description)}</p>}
          <p className="mt-4 text-[22px] font-extrabold text-green tabular-nums">{formatPrice(item.price)} ₾</p>
          {item.available === false && <p className="mt-1 text-[13px] font-bold text-ink-faint">{t('menu_unavailable')}</p>}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, tx, lang } = useLanguage()
  const { restaurant, loading } = useRestaurant(slug)
  const name = restaurant ? venueName(restaurant, lang) : ''
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [openItem, setOpenItem] = useState<MenuItem | null>(null)
  const chipBar = useRef<HTMLDivElement>(null)
  const stickyBar = useRef<HTMLDivElement>(null)
  // While a chip-triggered smooth scroll is running the observer must not move the highlight around.
  const lockUntil = useRef(0)

  const sections: MenuCategoryData[] = useMemo(() => {
    const menu = restaurant?.menu ?? []
    const q = query.trim().toLowerCase()
    if (!q) return menu.filter((c) => c.items.length > 0)
    return menu
      .map((c) => ({ ...c, items: c.items.filter((i) => `${i.name.ka} ${i.name.en} ${i.description.ka} ${i.description.en}`.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0)
  }, [restaurant, query])

  const itemCount = restaurant?.menu.reduce((n, c) => n + c.items.length, 0) ?? 0

  useSeo(
    restaurant ? `${seoName(restaurant, lang)} — ${t('seo_menu_title')} | urigod.ge` : 'urigod.ge',
    restaurant ? t('seo_menu_description', { name, count: itemCount }) : undefined,
    restaurant
      ? {
          path: menuPath(restaurant.slug),
          image: restaurant.coverImage || undefined,
          jsonLd: [
            menuJsonLd(restaurant, lang),
            breadcrumbJsonLd([
              { name: t('nav_restaurants'), path: '/restaurants' },
              { name, path: restaurantPath(restaurant.slug) },
              { name: t('menu_title'), path: menuPath(restaurant.slug) },
            ]),
          ],
        }
      : {}
  )

  // Scroll-spy: the active category is the last section whose top has passed under the sticky bar.
  const sectionIds = sections.map((s) => s.id).join('|')
  useEffect(() => {
    if (!sectionIds) return
    const ids = sectionIds.split('|')
    const update = () => {
      if (Date.now() < lockUntil.current) return
      const line = (stickyBar.current?.getBoundingClientRect().bottom ?? 180) + 28
      let found = ids[0]
      for (const id of ids) {
        const el = document.getElementById(`menu-${id}`)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      // The last sections may be too short to ever reach the bar.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) found = ids[ids.length - 1]
      setActiveId(found)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sectionIds])

  const current = activeId && sections.some((s) => s.id === activeId) ? activeId : sections[0]?.id

  // Keep the active chip in view inside the horizontally scrolling bar.
  useEffect(() => {
    const chip = chipBar.current?.querySelector<HTMLElement>(`[data-chip="${current}"]`)
    const bar = chipBar.current
    if (!chip || !bar) return
    const chipRect = chip.getBoundingClientRect()
    const barRect = bar.getBoundingClientRect()
    bar.scrollTo({ left: bar.scrollLeft + chipRect.left - barRect.left - (barRect.width - chipRect.width) / 2, behavior: 'smooth' })
  }, [current])

  function jumpTo(id: string) {
    lockUntil.current = Date.now() + 1000
    setActiveId(id)
    document.getElementById(`menu-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <MenuSkeleton />
  if (!restaurant) return <Navigate to="/restaurants" replace />

  const openNow = isOpenNow(restaurant.openingHours)

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-5 md:pt-8">
        <Link to={restaurantPath(restaurant.slug)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-soft hover:text-green">
          <ArrowLeft size={15} />
          {name}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          {(restaurant.logo || restaurant.coverImage) && (
            <img src={sized(restaurant.logo || restaurant.coverImage, 160, 160)} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shrink-0 bg-cream-2 border border-border" />
          )}
          <div className="min-w-0">
            <h1 className="text-[24px] md:text-[34px] font-extrabold text-ink tracking-tight leading-tight">
              {name} <span className="text-ink-faint font-bold">· {t('menu_title')}</span>
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13.5px] text-ink-soft">
              <span className="font-semibold text-green">{categoryMap[restaurant.category]?.label[lang]}</span>
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {neighborhoodMap[restaurant.neighborhood]?.label[lang]}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${openNow ? 'bg-green-light text-green' : 'bg-cream-2 text-ink-faint'}`}>
                {openNow ? t('restaurant_open_now') : t('restaurant_closed_now')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {itemCount === 0 ? (
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="mt-10 flex flex-col items-center text-center py-16 rounded-3xl border border-dashed border-border bg-white">
            <div className="w-14 h-14 rounded-full bg-cream-2 flex items-center justify-center text-ink-faint mb-4">
              <UtensilsCrossed size={24} />
            </div>
            <h2 className="text-[18px] font-bold text-ink">{t('menu_empty_title')}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-soft max-w-xs">{t('menu_empty_text')}</p>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green text-cream font-bold text-[14px]">
                <Phone size={16} />
                {t('restaurant_call')}
              </a>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Sticky search + category chips */}
          <div ref={stickyBar} className="sticky top-16 md:top-[72px] z-20 mt-5 bg-cream/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-6xl mx-auto px-5 md:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative md:w-72 shrink-0">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('menu_search_placeholder')}
                  aria-label={t('menu_search_placeholder')}
                  className="w-full h-11 rounded-full border border-border bg-white pl-11 pr-10 text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div ref={chipBar} className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 scroll-smooth">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    data-chip={section.id}
                    onClick={() => jumpTo(section.id)}
                    className={`h-10 px-4 rounded-full text-[13.5px] font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      current === section.id ? 'bg-green text-cream' : 'bg-white border border-border text-ink-soft hover:border-green hover:text-green'
                    }`}
                  >
                    {tx(section.name)}
                    <span className={`text-[11.5px] tabular-nums ${current === section.id ? 'text-cream/75' : 'text-ink-faint'}`}>{section.items.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            {sections.length === 0 && (
              <div className="flex flex-col items-center text-center py-16">
                <div className="w-14 h-14 rounded-full bg-cream-2 flex items-center justify-center text-ink-faint mb-4">
                  <SearchX size={24} />
                </div>
                <h2 className="text-[17px] font-bold text-ink">{t('no_results_title')}</h2>
                <button type="button" onClick={() => setQuery('')} className="mt-2 text-[14px] font-bold text-green">
                  {t('filter_clear')}
                </button>
              </div>
            )}
            {sections.map((section) => (
              <section key={section.id} id={`menu-${section.id}`} className="pt-8 scroll-mt-[180px] md:scroll-mt-[136px]">
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-[20px] md:text-[23px] font-extrabold text-ink tracking-tight">{tx(section.name)}</h2>
                  <span className="text-[13px] font-semibold text-ink-faint">{section.items.length}</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {section.items.map((item) => (
                    <ItemCard key={item.id} item={item} onOpen={() => setOpenItem(item)} />
                  ))}
                </ul>
              </section>
            ))}
            <p className="mt-10 text-center text-[12.5px] text-ink-faint">{t('menu_price_note')}</p>
          </div>
        </>
      )}

      <AnimatePresence>{openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />}</AnimatePresence>
    </div>
  )
}
