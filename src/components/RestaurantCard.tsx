import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, ArrowUpRight, ScrollText } from 'lucide-react'
import type { Restaurant } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryMap, neighborhoodMap } from '../data/categories'
import { priceSymbol, venueName } from '../lib/format'
import FavoriteButton from './FavoriteButton'
import { restaurantPath } from '../lib/site'
import { sized, srcSet } from '../lib/image'
import { formatDistance } from '../lib/geo'
import { nearestBranch } from '../lib/filters'
import { isOpenNow } from '../data/helpers'
import { useUserLocation } from '../context/LocationContext'

export default function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const { t, tx, lang } = useLanguage()
  const { location } = useUserLocation()
  const dishes = restaurant.menu.reduce((n, c) => n + c.items.length, 0)
  let open: boolean | null = null
  try {
    open = restaurant.openingHours ? isOpenNow(restaurant.openingHours) : null
  } catch {
    open = null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        to={restaurantPath(restaurant.slug)}
        className="group flex flex-col h-full bg-white rounded-[22px] border border-border/80 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-2 m-1.5 mb-0 rounded-[17px]">
          <img
            src={sized(restaurant.coverImage, 480, 360) || undefined}
            srcSet={srcSet(restaurant.coverImage, 480, 360)}
            alt={venueName(restaurant, lang)}
            width={480}
            height={360}
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
          {/* soft shade so the chips stay readable on bright photos */}
          <div className="absolute inset-0 bg-gradient-to-b from-night/25 via-transparent to-night/35 opacity-80" aria-hidden="true" />
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-snow/90 backdrop-blur-md text-[11.5px] font-bold text-night shadow-sm">
              {categoryMap[restaurant.category]?.label[lang]}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <FavoriteButton restaurantId={restaurant.slug} />
          </div>
          {open !== null && (
            <span className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md text-[11.5px] font-bold ${open ? 'bg-night/55 text-snow' : 'bg-night/55 text-snow/75'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-[#6fdc8c] shadow-[0_0_0_3px_rgba(111,220,140,0.25)]' : 'bg-snow/50'}`} />
              {open ? t('card_open') : t('card_closed')}
            </span>
          )}
        </div>

        <div className="p-4 pt-3.5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-[16.5px] text-ink leading-snug tracking-tight">{venueName(restaurant, lang)}</h3>
            <span className="text-[13px] font-bold text-ink-faint shrink-0 pt-0.5 tabular-nums">{priceSymbol(restaurant.priceLevel)}</span>
          </div>

          <p className="mt-1 mb-3.5 text-[13.5px] text-ink-soft line-clamp-2 leading-relaxed">{tx(restaurant.shortDescription)}</p>

          <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-dashed border-border">
            <span className="flex items-center gap-1 text-[12.5px] text-ink-faint min-w-0">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{neighborhoodMap[restaurant.neighborhood]?.label[lang]}</span>
              {location && <span className="text-ink-soft font-semibold shrink-0">· {formatDistance(nearestBranch(restaurant, location), lang)}</span>}
              {!location && dishes > 0 && (
                <span className="hidden min-[400px]:inline-flex items-center gap-1 shrink-0">
                  <span className="mx-0.5">·</span>
                  <ScrollText size={12} />
                  {dishes} {t('card_dishes')}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-[13px] font-bold text-green shrink-0">
              {t('card_view')}
              <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
