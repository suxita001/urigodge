import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Phone,
  Clock3,
  Globe,
  Navigation2,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react'
import { InstagramIcon, FacebookIcon } from '../components/SocialIcons'
import { useRestaurant } from '../hooks/useRestaurants'
import FavoriteButton from '../components/FavoriteButton'
import { categoryMap, cuisineMap, neighborhoodMap } from '../data/categories'
import { useLanguage } from '../i18n/LanguageContext'
import { priceSymbol, priceLabel, venueName } from '../lib/format'
import { isOpenNow } from '../data/helpers'
import { useSeo } from '../hooks/useSeo'
import RestaurantGallery from '../components/RestaurantGallery'
import BranchCard from '../components/BranchCard'
import MapView from '../components/MapView'
import { breadcrumbJsonLd, restaurantJsonLd, seoName } from '../lib/seo'
import { menuPath, restaurantPath } from '../lib/site'
import type { Coordinates } from '../data/types'

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const dayKeys = {
  mon: 'days_mon',
  tue: 'days_tue',
  wed: 'days_wed',
  thu: 'days_thu',
  fri: 'days_fri',
  sat: 'days_sat',
  sun: 'days_sun',
} as const

function RestaurantDetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="w-full h-[260px] sm:h-[340px] md:h-[440px] bg-cream-2" />
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-6 md:pt-8">
        <div className="h-3 w-40 rounded-full bg-cream-2" />
        <div className="mt-4 h-8 w-64 max-w-full rounded-full bg-cream-2" />
        <div className="mt-3 h-3.5 w-80 max-w-full rounded-full bg-cream-2" />
        <div className="mt-7 flex gap-3">
          {[120, 100, 130].map((w) => (
            <div key={w} style={{ width: w }} className="h-11 rounded-full bg-cream-2" />
          ))}
        </div>
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
          <div className="flex flex-col gap-2.5">
            <div className="h-3.5 w-full rounded-full bg-cream-2" />
            <div className="h-3.5 w-11/12 rounded-full bg-cream-2" />
            <div className="h-3.5 w-4/5 rounded-full bg-cream-2" />
          </div>
          <div className="h-64 rounded-2xl bg-cream-2" />
        </div>
      </div>
    </div>
  )
}

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t, tx, lang } = useLanguage()
  const [focusTarget, setFocusTarget] = useState<Coordinates | undefined>(undefined)
  const [activeBranchId, setActiveBranchId] = useState<string | undefined>(undefined)

  const { restaurant, loading } = useRestaurant(slug)
  const name = restaurant ? venueName(restaurant, lang) : ''

  useSeo(
    restaurant ? `${seoName(restaurant, lang)} — ${t('seo_restaurant_title')} | urigod.ge` : 'urigod.ge',
    restaurant ? `${tx(restaurant.shortDescription)} ${tx(restaurant.address)}`.trim() : undefined,
    restaurant
      ? {
          path: restaurantPath(restaurant.slug),
          image: restaurant.coverImage || undefined,
          jsonLd: [
            restaurantJsonLd(restaurant, lang),
            breadcrumbJsonLd([
              { name: t('nav_restaurants'), path: '/restaurants' },
              { name, path: restaurantPath(restaurant.slug) },
            ]),
          ],
        }
      : {}
  )

  if (loading) return <RestaurantDetailSkeleton />
  if (!restaurant) return <Navigate to="/restaurants" replace />

  const openNow = isOpenNow(restaurant.openingHours)
  const mapRestaurants = [restaurant]
  // A taste of the menu: items with photos first, six at most.
  const allItems = restaurant.menu.flatMap((c) => c.items).filter((i) => i.available !== false)
  const menuPreview = [...allItems.filter((i) => i.image), ...allItems.filter((i) => !i.image)].slice(0, 6)

  return (
    <div>
      <RestaurantGallery images={restaurant.images} alt={name} />

      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="pt-6 md:pt-8">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-faint">
            <Link to="/restaurants" className="hover:text-green">{t('nav_restaurants')}</Link>
            <span>/</span>
            <span className="text-ink">{name}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] md:text-[36px] font-extrabold text-ink tracking-tight">{name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-ink-soft">
                <span className="font-semibold text-green">{categoryMap[restaurant.category]?.label[lang]}</span>
                <span className="text-border">•</span>
                <span>{restaurant.cuisine.map((c) => cuisineMap[c]?.label[lang]).join(', ')}</span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1"><MapPin size={13} />{neighborhoodMap[restaurant.neighborhood]?.label[lang]}</span>
                <span className="text-border">•</span>
                <span className="font-semibold">{priceSymbol(restaurant.priceLevel)} · {priceLabel(restaurant.priceLevel, lang)}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap ${
                openNow ? 'bg-green-light text-green' : 'bg-cream-2 text-ink-faint'
              }`}
            >
              {openNow ? t('restaurant_open_now') : t('restaurant_closed_now')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green text-cream font-bold text-[14px] hover:bg-green-dark transition-colors"
            >
              <Navigation2 size={16} />
              {t('restaurant_route')}
            </a>
            <a
              href={`tel:${restaurant.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-white text-ink font-bold text-[14px] hover:bg-cream-2 transition-colors"
            >
              <Phone size={16} />
              {t('restaurant_call')}
            </a>
            <Link
              to={menuPath(restaurant.slug)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-green text-green font-bold text-[14px] hover:bg-green-light transition-colors"
            >
              <UtensilsCrossed size={16} />
              {t('restaurant_menu')}
            </Link>
            <FavoriteButton restaurantId={restaurant.slug} variant="pill" />
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
          <div className="min-w-0">
            <section>
              <h2 className="text-[18px] font-bold text-ink mb-3">{t('restaurant_info')}</h2>
              <p className="text-[15px] text-ink-soft leading-relaxed">{tx(restaurant.description)}</p>
            </section>

            {menuPreview.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-[18px] font-bold text-ink">{t('menu_title')}</h2>
                  <Link to={menuPath(restaurant.slug)} className="inline-flex items-center gap-1 text-[14px] font-bold text-green hover:gap-1.5 transition-all">
                    {t('menu_full')}
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menuPreview.map((item) => (
                    <li key={item.id}>
                      <Link to={menuPath(restaurant.slug)} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-white hover:border-green/50 transition-colors">
                        {item.image && <img src={item.image} alt={tx(item.name)} loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-cream-2" />}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-[14.5px] text-ink truncate">{tx(item.name)}</span>
                          <span className="block text-[12.5px] text-ink-faint truncate">{tx(item.description)}</span>
                        </span>
                        <span className="font-bold text-[14.5px] text-green whitespace-nowrap">{Number.isInteger(item.price) ? item.price : item.price.toFixed(2)} ₾</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-[18px] font-bold text-ink mb-4">{t('restaurant_branches')} ({restaurant.branches.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {restaurant.branches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    active={activeBranchId === branch.id}
                    onFocus={() => {
                      setActiveBranchId(branch.id)
                      setFocusTarget(branch.coordinates)
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10 rounded-2xl overflow-hidden border border-border h-[320px] md:h-[380px]">
              <MapView
                restaurants={mapRestaurants}
                selectedId={restaurant.id}
                onSelect={() => {}}
                focusTarget={focusTarget}
                focusZoom={16}
                center={restaurant.coordinates}
                zoom={15}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-bold text-[15px] text-ink mb-4">{t('restaurant_info')}</h3>

              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <MapPin size={17} className="text-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">{t('restaurant_address')}</p>
                    <p className="text-[14px] text-ink mt-0.5">{tx(restaurant.address)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone size={17} className="text-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">{t('restaurant_phone')}</p>
                    <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="text-[14px] text-ink mt-0.5 hover:text-green">
                      {restaurant.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 size={17} className="text-green shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint mb-1.5">{t('restaurant_hours')}</p>
                    <ul className="flex flex-col gap-0.5">
                      {dayOrder.map((day) => {
                        const hours = restaurant.openingHours[day]
                        return (
                          <li key={day} className="flex items-center justify-between text-[13px] text-ink-soft">
                            <span>{t(dayKeys[day])}</span>
                            <span className="font-medium text-ink">{hours.closed ? '—' : `${hours.open}–${hours.close}`}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                {restaurant.website && (
                  <div className="flex gap-3">
                    <Globe size={17} className="text-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-faint">{t('restaurant_website')}</p>
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-green mt-0.5 hover:underline break-all"
                      >
                        {restaurant.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                {restaurant.socialLinks && (restaurant.socialLinks.instagram || restaurant.socialLinks.facebook) && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {restaurant.socialLinks.instagram && (
                      <a
                        href={restaurant.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors"
                        aria-label="Instagram"
                      >
                        <InstagramIcon size={16} />
                      </a>
                    )}
                    {restaurant.socialLinks.facebook && (
                      <a
                        href={restaurant.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors"
                        aria-label="Facebook"
                      >
                        <FacebookIcon size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

    </div>
  )
}
