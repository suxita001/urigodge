import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, ArrowUpRight } from 'lucide-react'
import type { Restaurant } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryMap, neighborhoodMap } from '../data/categories'
import { priceSymbol, venueName } from '../lib/format'
import FavoriteButton from './FavoriteButton'
import { restaurantPath } from '../lib/site'

export default function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const { t, tx, lang } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
    >
      <Link
        to={restaurantPath(restaurant.slug)}
        className="group block bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-2">
          <img
            src={restaurant.coverImage}
            alt={venueName(restaurant, lang)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[12px] font-semibold text-ink shadow-sm">
              {categoryMap[restaurant.category]?.label[lang]}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <FavoriteButton restaurantId={restaurant.slug} />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[16.5px] text-ink leading-snug">{venueName(restaurant, lang)}</h3>
            <span className="text-[13px] font-semibold text-ink-faint shrink-0 pt-0.5">{priceSymbol(restaurant.priceLevel)}</span>
          </div>

          <p className="mt-1.5 text-[13.5px] text-ink-soft line-clamp-2 leading-relaxed">
            {tx(restaurant.shortDescription)}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[13px] text-ink-faint">
              <MapPin size={13} />
              {neighborhoodMap[restaurant.neighborhood]?.label[lang]}
            </span>
            <span className="flex items-center gap-1 text-[13px] font-semibold text-green group-hover:gap-1.5 transition-all">
              {t('card_view')}
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
