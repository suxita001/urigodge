import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Clock3, ScrollText, Search, Check, ChefHat, Soup } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { categories, cuisines, cuisineMap, neighborhoods } from '../data/categories'
import { availableDishes, dishMap } from '../data/dishes'
import { type FilterState, type SortOption, countActiveFilters, defaultFilters } from '../lib/filters'
import type { CuisineId } from '../data/types'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  sort?: SortOption
  onSortChange?: (sort: SortOption) => void
  resultCount: number
  /** Just the "Filters" button, at every screen size; the panel opens as a sheet / dialog. Used on the map. */
  compact?: boolean
}

interface Option {
  value: string
  label: string
  /** Both languages, lowercased — what the search box matches against. */
  haystack: string
  count: number
}

const selectClass =
  'appearance-none bg-white border border-border rounded-full pl-4 pr-9 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:border-green cursor-pointer focus:outline-none focus:ring-2 focus:ring-green/30 transition-colors'

function Select({ value, onChange, options, placeholder, className = '' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} className={`${selectClass} w-full ${value ? '!border-green !text-green' : ''}`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
    </div>
  )
}

function ToggleChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
        active ? 'bg-green border-green text-cream' : 'bg-white border-border text-ink-soft hover:border-green hover:text-green'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/** Searchable list of checkable options; shared by the desktop popover and the mobile sheet. */
function OptionPicker({ options, selected, onToggle, searchPlaceholder, listClassName }: { options: Option[]; selected: string[]; onToggle: (value: string) => void; searchPlaceholder: string; listClassName: string }) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible = q ? options.filter((o) => o.haystack.includes(q)) : options

  return (
    <div>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 rounded-full border border-border bg-white pl-10 pr-9 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
            <X size={15} />
          </button>
        )}
      </div>
      <ul className={`mt-2.5 overflow-y-auto overscroll-contain ${listClassName}`}>
        {visible.length === 0 && <li className="py-6 text-center text-[13.5px] text-ink-faint">{t('filter_nothing_found')}</li>}
        {visible.map((o) => {
          const on = selected.includes(o.value)
          return (
            <li key={o.value}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(o.value)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-colors ${on ? 'bg-green-light' : 'hover:bg-cream-2'} ${
                  o.count === 0 && !on ? 'opacity-50' : ''
                }`}
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-green border-green text-cream' : 'border-border bg-white'}`}>
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[14px] ${on ? 'font-bold text-green' : 'font-medium text-ink'}`}>{o.label}</span>
                <span className="text-[12px] tabular-nums text-ink-faint">{o.count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MultiSelect({ label, icon, options, selected, onChange, searchPlaceholder }: { label: string; icon: React.ReactNode; options: Option[]; selected: string[]; onChange: (next: string[]) => void; searchPlaceholder: string }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
          selected.length ? 'bg-green-light border-green text-green' : 'bg-white border-border text-ink-soft hover:border-green'
        }`}
      >
        {icon}
        {label}
        {selected.length > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-green text-cream text-[11px] font-bold flex items-center justify-center">{selected.length}</span>}
        <ChevronDown size={14} className={`text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-2 z-30 w-[320px] rounded-2xl border border-border bg-white shadow-card-hover p-3"
          >
            <OptionPicker options={options} selected={selected} onToggle={toggle} searchPlaceholder={searchPlaceholder} listClassName="max-h-[300px]" />
            {selected.length > 0 && (
              <div className="mt-2 pt-2.5 border-t border-border flex justify-end">
                <button type="button" onClick={() => onChange([])} className="text-[13px] font-bold text-ink-faint hover:text-terracotta">
                  {t('filter_clear')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function useFilterOptions() {
  const { lang } = useLanguage()
  const { restaurants } = useRestaurants()
  return useMemo(() => {
    const cuisineCounts = new Map<string, number>()
    restaurants.forEach((r) => r.cuisine.forEach((c) => cuisineCounts.set(c, (cuisineCounts.get(c) ?? 0) + 1)))
    const cuisineOptions: Option[] = cuisines
      .map((c) => ({ value: c.id as string, label: c.label[lang], haystack: `${c.label.ka} ${c.label.en}`.toLowerCase(), count: cuisineCounts.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
    const dishOptions: Option[] = availableDishes(restaurants).map(({ dish, count }) => ({
      value: dish.id,
      label: dish.label[lang],
      haystack: `${dish.label.ka} ${dish.label.en} ${dish.keywords.join(' ')}`.toLowerCase(),
      count,
    }))
    return { cuisineOptions, dishOptions }
  }, [restaurants, lang])
}

function SingleSelects({ filters, onChange, className }: { filters: FilterState; onChange: (f: FilterState) => void; className?: string }) {
  const { t, lang } = useLanguage()
  return (
    <>
      <Select
        className={className}
        value={filters.category ?? ''}
        onChange={(v) => onChange({ ...filters, category: (v || null) as FilterState['category'] })}
        placeholder={t('filter_category')}
        options={categories.map((c) => ({ value: c.id, label: c.label[lang] }))}
      />
      <Select
        className={className}
        value={filters.neighborhood ?? ''}
        onChange={(v) => onChange({ ...filters, neighborhood: (v || null) as FilterState['neighborhood'] })}
        placeholder={t('filter_neighborhood')}
        options={neighborhoods.map((n) => ({ value: n.id, label: n.label[lang] }))}
      />
      <Select
        className={className}
        value={filters.price ? String(filters.price) : ''}
        onChange={(v) => onChange({ ...filters, price: (v ? Number(v) : null) as FilterState['price'] })}
        placeholder={t('filter_price')}
        options={[
          { value: '1', label: '₾' },
          { value: '2', label: '₾₾' },
          { value: '3', label: '₾₾₾' },
        ]}
      />
    </>
  )
}

function Toggles({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  const { t } = useLanguage()
  return (
    <>
      <ToggleChip active={filters.openNow} onClick={() => onChange({ ...filters, openNow: !filters.openNow })} icon={<Clock3 size={14} />} label={t('filter_open_now')} />
      <ToggleChip active={filters.hasMenu} onClick={() => onChange({ ...filters, hasMenu: !filters.hasMenu })} icon={<ScrollText size={14} />} label={t('filter_has_menu')} />
    </>
  )
}

function SortSelect({ sort, onSortChange, className = '' }: { sort: SortOption; onSortChange: (s: SortOption) => void; className?: string }) {
  const { t } = useLanguage()
  return (
    <div className={`relative ${className}`}>
      <select value={sort} onChange={(e) => onSortChange(e.target.value as SortOption)} aria-label={t('sort_label')} className={`${selectClass} w-full`}>
        <option value="recommended">{t('sort_recommended')}</option>
        <option value="popular">{t('sort_popular')}</option>
        <option value="nearby">{t('sort_nearby')}</option>
        <option value="az">{t('sort_az')}</option>
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
    </div>
  )
}

export default function FilterBar({ filters, onChange, sort = 'recommended', onSortChange = () => {}, resultCount, compact = false }: FilterBarProps) {
  const { t, lang } = useLanguage()
  const { cuisineOptions, dishOptions } = useFilterOptions()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<FilterState>(filters)
  const [sheetTab, setSheetTab] = useState<'cuisine' | 'dish'>('cuisine')
  const active = countActiveFilters(filters)

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  function openSheet() {
    setDraft(filters)
    setSheetOpen(true)
  }

  const toggleIn = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  return (
    <div className={compact ? 'shrink-0' : ''}>
      {/* Desktop inline bar */}
      <div className={compact ? 'hidden' : 'hidden md:flex flex-wrap items-center gap-2.5'}>
        <MultiSelect
          label={t('filter_cuisine')}
          icon={<ChefHat size={15} />}
          options={cuisineOptions}
          selected={filters.cuisines}
          onChange={(next) => onChange({ ...filters, cuisines: next as CuisineId[] })}
          searchPlaceholder={t('filter_search_cuisine')}
        />
        <MultiSelect
          label={t('filter_dish')}
          icon={<Soup size={15} />}
          options={dishOptions}
          selected={filters.dishes}
          onChange={(next) => onChange({ ...filters, dishes: next })}
          searchPlaceholder={t('filter_search_dish')}
        />
        <SingleSelects filters={filters} onChange={onChange} />
        <Toggles filters={filters} onChange={onChange} />

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[13.5px] text-ink-faint hidden lg:inline">{t('results_count', { count: resultCount })}</span>
          <SortSelect sort={sort} onSortChange={onSortChange} />
        </div>
      </div>

      {/* Mobile trigger row */}
      <div className={compact ? 'flex items-center' : 'flex md:hidden items-center gap-2.5'}>
        <button type="button" onClick={openSheet} className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border bg-white text-[13.5px] font-semibold whitespace-nowrap ${active > 0 && compact ? 'border-green text-green' : 'border-border text-ink'}`}>
          <SlidersHorizontal size={15} />
          {t('filter_title')}
          {active > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-green text-cream text-[11px] font-bold flex items-center justify-center">{active}</span>}
        </button>
        {!compact && <SortSelect sort={sort} onSortChange={onSortChange} className="flex-1" />}
      </div>

      {/* Selected cuisines / dishes, removable one by one */}
      {active > 0 && !compact && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.cuisines.map((c) => (
            <ActiveChip key={c} label={cuisineMap[c]?.label[lang] ?? c} onRemove={() => onChange({ ...filters, cuisines: filters.cuisines.filter((x) => x !== c) })} />
          ))}
          {filters.dishes.map((d) => (
            <ActiveChip key={d} label={dishMap[d]?.label[lang] ?? d} onRemove={() => onChange({ ...filters, dishes: filters.dishes.filter((x) => x !== d) })} />
          ))}
          {(
            <button type="button" onClick={() => onChange(defaultFilters)} className="flex items-center gap-1 px-2 py-1.5 text-[13px] font-semibold text-ink-faint hover:text-terracotta transition-colors">
              <X size={14} />
              {t('filter_clear_all')}
            </button>
          )}
        </div>
      )}

      {/* Mobile bottom sheet — portalled so the sticky/blurred filter row can't become its containing block */}
      {createPortal(
      <AnimatePresence>
        {sheetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-50 bg-night/50 flex items-end md:items-center md:justify-center ${compact ? '' : 'md:hidden'}`} onClick={() => setSheetOpen(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="w-full md:max-w-lg bg-cream rounded-t-3xl md:rounded-3xl h-[88dvh] md:h-[min(720px,86dvh)] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h3 className="text-[17px] font-bold text-ink">{t('filter_title')}</h3>
                <button type="button" onClick={() => setSheetOpen(false)} aria-label={t('close_modal')} className="w-9 h-9 rounded-full hover:bg-cream-2 flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <SingleSelects filters={draft} onChange={setDraft} className="last:col-span-2" />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Toggles filters={draft} onChange={setDraft} />
                </div>

                <div>
                  <div className="flex gap-2 mb-3">
                    {(['cuisine', 'dish'] as const).map((tab) => {
                      const count = tab === 'cuisine' ? draft.cuisines.length : draft.dishes.length
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSheetTab(tab)}
                          className={`flex-1 h-11 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-colors ${
                            sheetTab === tab ? 'bg-ink text-cream' : 'bg-white border border-border text-ink-soft'
                          }`}
                        >
                          {tab === 'cuisine' ? t('filter_cuisine') : t('filter_dish')}
                          {count > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-green text-cream text-[11px] flex items-center justify-center">{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                  {sheetTab === 'cuisine' ? (
                    <OptionPicker
                      key="cuisine"
                      options={cuisineOptions}
                      selected={draft.cuisines}
                      onToggle={(v) => setDraft({ ...draft, cuisines: toggleIn(draft.cuisines, v) as CuisineId[] })}
                      searchPlaceholder={t('filter_search_cuisine')}
                      listClassName=""
                    />
                  ) : (
                    <OptionPicker
                      key="dish"
                      options={dishOptions}
                      selected={draft.dishes}
                      onToggle={(v) => setDraft({ ...draft, dishes: toggleIn(draft.dishes, v) })}
                      searchPlaceholder={t('filter_search_dish')}
                      listClassName=""
                    />
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border flex gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button type="button" onClick={() => setDraft(defaultFilters)} className="flex-1 h-12 rounded-full border border-border font-semibold text-ink">
                  {t('filter_clear')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(draft)
                    setSheetOpen(false)
                  }}
                  className="flex-[1.4] h-12 rounded-full bg-green text-cream font-semibold"
                >
                  {t('filter_apply')}
                  {compact && countActiveFilters(draft) > 0 ? ` (${countActiveFilters(draft)})` : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-green-light text-green text-[13px] font-semibold">
      {label}
      <button type="button" onClick={onRemove} aria-label={`${label} ×`} className="w-6 h-6 rounded-full hover:bg-green/15 flex items-center justify-center">
        <X size={13} />
      </button>
    </span>
  )
}
