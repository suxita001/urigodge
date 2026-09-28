import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MapView from '../components/MapView'
import MapPreviewCard from '../components/MapPreviewCard'
import SearchBar from '../components/SearchBar'
import CategoryPill from '../components/CategoryPill'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import Spinner from '../components/ui/Spinner'
import { categories } from '../data/categories'
import type { Restaurant, CategoryId } from '../data/types'
import { searchRestaurants } from '../lib/search'

export default function MapPage() {
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = restaurants
    if (query.trim()) {
      const matched = searchRestaurants(restaurants, query, lang).map((r) => r.restaurant.id)
      list = list.filter((r) => matched.includes(r.id))
    }
    if (activeCategory) list = list.filter((r) => r.category === activeCategory)
    return list
  }, [restaurants, activeCategory, query, lang])

  return (
    <div className="relative h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] w-full overflow-hidden">
      <MapView
        restaurants={filtered}
        selectedId={selected?.id}
        onSelect={setSelected}
        focusTarget={selected?.coordinates}
      />

      {/* Top overlay: search + category filters */}
      <div className="absolute top-0 left-0 right-0 z-[400] pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 pt-4 flex flex-col gap-3">
          <div className="pointer-events-auto">
            <SearchBar large showDropdown={false} onQueryChange={setQuery} />
          </div>
          <div className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                category={c}
                active={activeCategory === c.id}
                onClick={() => setActiveCategory((cur) => (cur === c.id ? null : c.id))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop floating preview card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block absolute bottom-6 left-6 z-[400] w-[340px]"
          >
            <MapPreviewCard restaurant={selected} onClose={() => setSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet preview */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[400] p-4"
          >
            <MapPreviewCard restaurant={selected} onClose={() => setSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur px-4 py-2.5 rounded-full shadow-card text-[13px] font-semibold text-ink-soft">
          <Spinner size={14} className="text-green" />
          {t('loading')}
        </div>
      ) : (
        !selected &&
        query === '' && (
          <div className="hidden md:flex absolute bottom-6 right-6 z-[400] items-center gap-2 bg-white/95 backdrop-blur px-4 py-2.5 rounded-full shadow-card text-[13px] font-semibold text-ink-soft">
            {t('results_count', { count: filtered.length })}
          </div>
        )
      )}

    </div>
  )
}
