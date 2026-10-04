import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import FilterBar from '../components/FilterBar'
import RestaurantGrid from '../components/RestaurantGrid'
import SearchBar from '../components/SearchBar'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { useToast } from '../hooks/useToast'
import { useUserLocation } from '../context/LocationContext'
import { defaultFilters, applyFilters, sortRestaurants, type FilterState, type SortOption } from '../lib/filters'
import { searchRestaurants } from '../lib/search'
import { categoryMap, cuisineMap } from '../data/categories'
import { dishMap } from '../data/dishes'
import { breadcrumbJsonLd, restaurantListJsonLd } from '../lib/seo'
import type { CategoryId, CuisineId } from '../data/types'

const listParam = (value: string | null) => (value ? value.split(',').filter(Boolean) : [])

export default function Restaurants() {
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sort, setSort] = useState<SortOption>('recommended')
  const [query, setQuery] = useState('')
  const toast = useToast()
  const { location, locate } = useUserLocation()

  // "Nearby" needs the visitor's position; without permission it falls back to the city centre.
  async function changeSort(next: SortOption) {
    setSort(next)
    if (next === 'nearby' && !location) {
      const result = await locate()
      if (typeof result === 'string') toast.info(t('nearby_fallback'))
    }
  }

  // Deep links: /restaurants?category=pizza&cuisine=italian,french&dish=khinkali&q=...
  useEffect(() => {
    const category = searchParams.get('category')
    const cuisinesParam = listParam(searchParams.get('cuisine')).filter((c) => c in cuisineMap) as CuisineId[]
    const dishesParam = listParam(searchParams.get('dish')).filter((d) => d in dishMap)
    setFilters((f) => ({
      ...f,
      category: category && category in categoryMap ? (category as CategoryId) : f.category,
      cuisines: cuisinesParam.length ? cuisinesParam : f.cuisines,
      dishes: dishesParam.length ? dishesParam : f.dishes,
    }))
    const q = searchParams.get('q')
    if (q) setQuery(q)
  }, [searchParams])

  const results = useMemo(() => {
    let list = restaurants
    if (query.trim()) {
      const matched = new Set(searchRestaurants(restaurants, query, lang).map((r) => r.restaurant.id))
      list = list.filter((r) => matched.has(r.id))
    }
    list = applyFilters(list, filters)
    list = sortRestaurants(list, sort, lang, location)
    return list
  }, [restaurants, filters, sort, query, lang, location])

  useSeo(`${t('restaurants_title')} — ${t('seo_restaurants_title')} | urigod.ge`, t('seo_restaurants_description'), {
    path: '/restaurants',
    jsonLd: [breadcrumbJsonLd([{ name: t('nav_restaurants'), path: '/restaurants' }]), ...(restaurants.length ? [restaurantListJsonLd(restaurants.slice(0, 30))] : [])],
  })

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-[28px] md:text-[36px] font-extrabold text-ink tracking-tight">{t('restaurants_title')}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{t('restaurants_subtitle')}</p>
      </motion.div>

      <div className="mt-7 max-w-xl">
        <SearchBar showDropdown={false} value={query} onQueryChange={setQuery} />
      </div>
      {query && (
        <div className="mt-3 flex items-center gap-2 text-[13.5px] text-ink-soft">
          <span>
            "{query}" — {t('results_count', { count: results.length })}
          </span>
          <button onClick={() => setQuery('')} className="text-green font-semibold">
            {t('filter_clear')}
          </button>
        </div>
      )}

      <div className="mt-6 sticky top-16 md:top-[72px] z-20 bg-cream/95 py-3 -mx-5 px-5 md:mx-0 md:px-0 md:bg-transparent md:static">
        <FilterBar filters={filters} onChange={setFilters} sort={sort} onSortChange={changeSort} resultCount={results.length} />
      </div>

      {!loading && <p className="mt-5 text-[13.5px] text-ink-faint md:hidden">{t('results_count', { count: results.length })}</p>}

      <div className="mt-6">
        <RestaurantGrid restaurants={results} loading={loading} />
      </div>
    </div>
  )
}
