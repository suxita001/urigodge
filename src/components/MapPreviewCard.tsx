import { Link } from 'react-router-dom'
import { X, MapPin, ArrowUpRight } from 'lucide-react'
import type { Restaurant } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryMap } from '../data/categories'
import { priceSymbol } from '../lib/format'

export default function MapPreviewCard({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const { t, tx, lang } = useLanguage()

  return (
    <div className="bg-white rounded-2xl md:rounded-2xl shadow-card-hover overflow-hidden w-full">
      <div className="relative">
        <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-36 md:h-32 object-cover" />
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-ink shadow-sm"
          aria-label={t('close_modal')}
        >
          <X size={16} />
        </button>
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11.5px] font-semibold text-ink">
          {categoryMap[restaurant.category]?.label[lang]}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[16px] text-ink leading-snug">{restaurant.name}</h3>
          <span className="text-[12.5px] font-semibold text-ink-faint shrink-0 pt-0.5">{priceSymbol(restaurant.priceLevel)}</span>
        </div>
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-ink-soft leading-relaxed">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          {tx(restaurant.address)}
        </p>
        <Link
          to={`/restaurant/${restaurant.slug}`}
          className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-green text-cream font-bold text-[13.5px] hover:bg-green-dark transition-colors"
        >
          {t('card_view')}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}
