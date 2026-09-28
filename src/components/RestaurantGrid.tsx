import type { Restaurant } from '../data/types'
import RestaurantCard from './RestaurantCard'
import RestaurantCardSkeleton from './RestaurantCardSkeleton'
import { useLanguage } from '../i18n/LanguageContext'
import { SearchX } from 'lucide-react'

interface RestaurantGridProps {
  restaurants: Restaurant[]
  loading?: boolean
  skeletonCount?: number
}

export default function RestaurantGrid({ restaurants, loading = false, skeletonCount = 6 }: RestaurantGridProps) {
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label={t('loading')}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="w-14 h-14 rounded-full bg-cream-2 flex items-center justify-center text-ink-faint mb-4">
          <SearchX size={24} />
        </div>
        <h3 className="text-[18px] font-bold text-ink mb-1.5">{t('no_results_title')}</h3>
        <p className="text-[14.5px] text-ink-soft max-w-xs">{t('no_results_text')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {restaurants.map((r, i) => (
        <RestaurantCard key={r.id} restaurant={r} index={i} />
      ))}
    </div>
  )
}
