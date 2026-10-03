import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { searchRestaurants, type SearchResult } from '../lib/search'
import { categoryMap } from '../data/categories'
import { restaurantPath } from '../lib/site'
import { venueName } from '../lib/format'

interface SearchBarProps {
  large?: boolean
  autoFocus?: boolean
  onNavigate?: () => void
  onQueryChange?: (query: string) => void
  showDropdown?: boolean
  value?: string
}

export default function SearchBar({ large = false, autoFocus = false, onNavigate, onQueryChange, showDropdown = true, value }: SearchBarProps) {
  const { t, lang } = useLanguage()
  const { restaurants } = useRestaurants()
  const navigate = useNavigate()
  const [query, setQuery] = useState(value ?? '')
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value !== undefined && value !== query) setQuery(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function updateQuery(next: string) {
    setQuery(next)
    onQueryChange?.(next)
  }

  const results: SearchResult[] = showDropdown && query.trim() ? searchRestaurants(restaurants, query, lang).slice(0, 6) : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function goTo(slug: string) {
    updateQuery('')
    setFocused(false)
    onNavigate?.()
    navigate(restaurantPath(slug))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!showDropdown) {
      setFocused(false)
      return
    }
    if (results.length > 0) {
      goTo(results[0].restaurant.slug)
    } else if (query.trim()) {
      onNavigate?.()
      navigate(`/restaurants?q=${encodeURIComponent(query.trim())}`)
      setFocused(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={large ? 20 : 18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t('search_placeholder')}
          className={`w-full rounded-full border border-border bg-white text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green transition-colors ${
            large ? 'py-4 pl-12 pr-12 text-[16px] shadow-card' : 'py-2.5 pl-11 pr-9 text-[14px]'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => updateQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        )}
      </form>

      <AnimatePresence>
        {showDropdown && focused && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-border shadow-card-hover overflow-hidden z-50 text-left"
          >
            {results.length > 0 ? (
              <ul className="max-h-[360px] overflow-y-auto py-2">
                {results.map((res) => (
                  <li key={res.restaurant.id}>
                    <button
                      type="button"
                      onClick={() => goTo(res.restaurant.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream-2 transition-colors text-left"
                    >
                      <img
                        src={res.restaurant.coverImage}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[14px] text-ink truncate">{venueName(res.restaurant, lang)}</span>
                        <span className="block text-[12.5px] text-ink-faint truncate">
                          {categoryMap[res.restaurant.category]?.label[lang]}
                          {res.matchType === 'menu' && res.matchLabel ? ` · ${res.matchLabel}` : ''}
                          {res.matchType === 'neighborhood' && res.matchLabel ? ` · ${res.matchLabel}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-ink-faint text-[14px]">{t('search_no_results')}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
