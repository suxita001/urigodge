import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LocateFixed } from 'lucide-react'
import MapView from '../components/MapView'
import MapPreviewCard from '../components/MapPreviewCard'
import SearchBar from '../components/SearchBar'
import CategoryPill from '../components/CategoryPill'
import FilterBar from '../components/FilterBar'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { useToast } from '../hooks/useToast'
import { useUserLocation } from '../context/LocationContext'
import Spinner from '../components/ui/Spinner'
import { categories } from '../data/categories'
import type { Restaurant, Coordinates } from '../data/types'
import { searchRestaurants } from '../lib/search'
import { applyFilters, defaultFilters, type FilterState } from '../lib/filters'

export default function MapPage() {
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [query, setQuery] = useState('')
  const toast = useToast()
  const { location, locating, locate } = useUserLocation()
  // What the map should fly to: a tapped restaurant or the visitor's own position.
  const [focus, setFocus] = useState<Coordinates | undefined>(undefined)
  useSeo(`${t('seo_map_title')} | urigod.ge`, t('seo_map_description'), { path: '/map' })

  const filtered = useMemo(() => {
    let list = restaurants
    if (query.trim()) {
      const matched = new Set(searchRestaurants(restaurants, query, lang).map((r) => r.restaurant.id))
      list = list.filter((r) => matched.has(r.id))
    }
    return applyFilters(list, filters)
  }, [restaurants, filters, query, lang])

  function select(r: Restaurant) {
    setSelected(r)
    setFocus(r.coordinates)
  }

  async function goToMe() {
    const result = await locate()
    if (typeof result === 'string') {
      toast.error(t(result === 'denied' ? 'map_locate_denied' : result === 'unsupported' ? 'map_locate_unsupported' : 'map_locate_failed'))
      return
    }
    // A fresh object every time, so pressing the button again flies back even if the position is unchanged.
    setFocus({ lat: result.lat, lng: result.lng })
  }

  return (
    <div className="relative isolate h-[calc(100dvh-64px)] md:h-[calc(100dvh-72px)] w-full overflow-hidden">
      <MapView restaurants={filtered} selectedId={selected?.id} onSelect={select} focusTarget={focus} userLocation={location} />

      <button
        type="button"
        onClick={goToMe}
        disabled={locating}
        aria-label={t('map_locate')}
        title={t('map_locate')}
        className={`absolute z-[400] right-4 top-[136px] md:top-auto md:bottom-24 md:right-6 w-12 h-12 rounded-full bg-white shadow-card-hover border border-border flex items-center justify-center transition-colors hover:bg-cream-2 ${
          location ? 'text-[#2f6fed]' : 'text-ink'
        }`}
      >
        {locating ? <Spinner size={18} className="text-green" /> : <LocateFixed size={21} />}
      </button>

      {/* Top overlay: search, full filters and quick category pills */}
      <div className="absolute top-0 left-0 right-0 z-[400] pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 pt-4 flex flex-col gap-3">
          <div className="pointer-events-auto">
            <SearchBar large showDropdown={false} onQueryChange={setQuery} />
          </div>
          <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-2 -mt-2">
            <FilterBar compact filters={filters} onChange={setFilters} resultCount={filtered.length} />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                category={c}
                active={filters.category === c.id}
                onClick={() => setFilters((f) => ({ ...f, category: f.category === c.id ? null : c.id }))}
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur px-4 py-2.5 rounded-full shadow-card text-[13px] font-semibold text-ink-soft">
          <Spinner size={14} className="text-green" />
          {t('loading')}
        </div>
      ) : (
        !selected && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-[400] bg-white/95 backdrop-blur px-4 py-2.5 rounded-full shadow-card text-[13px] font-semibold text-ink-soft whitespace-nowrap">
            {t('results_count', { count: filtered.length })}
          </div>
        )
      )}
    </div>
  )
}
