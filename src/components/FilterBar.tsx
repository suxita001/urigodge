import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Clock3, ScrollText, QrCode } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { categories, cuisines, neighborhoods } from '../data/categories'
import { type FilterState, type SortOption, countActiveFilters } from '../lib/filters'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  resultCount: number
}

const selectClass =
  'appearance-none bg-white border border-border rounded-full pl-4 pr-9 py-2.5 text-[13.5px] font-semibold text-ink-soft hover:border-green cursor-pointer focus:outline-none focus:ring-2 focus:ring-green/30 transition-colors'

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
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

function FilterControls({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  const { t, lang } = useLanguage()
  return (
    <>
      <Select
        value={filters.category ?? ''}
        onChange={(v) => onChange({ ...filters, category: (v || null) as FilterState['category'] })}
        placeholder={t('filter_category')}
        options={categories.map((c) => ({ value: c.id, label: c.label[lang] }))}
      />
      <Select
        value={filters.cuisine ?? ''}
        onChange={(v) => onChange({ ...filters, cuisine: (v || null) as FilterState['cuisine'] })}
        placeholder={t('filter_cuisine')}
        options={cuisines.map((c) => ({ value: c.id, label: c.label[lang] }))}
      />
      <Select
        value={filters.neighborhood ?? ''}
        onChange={(v) => onChange({ ...filters, neighborhood: (v || null) as FilterState['neighborhood'] })}
        placeholder={t('filter_neighborhood')}
        options={neighborhoods.map((n) => ({ value: n.id, label: n.label[lang] }))}
      />
      <Select
        value={filters.price ? String(filters.price) : ''}
        onChange={(v) => onChange({ ...filters, price: (v ? Number(v) : null) as FilterState['price'] })}
        placeholder={t('filter_price')}
        options={[
          { value: '1', label: '₾' },
          { value: '2', label: '₾₾' },
          { value: '3', label: '₾₾₾' },
        ]}
      />
      <ToggleChip
        active={filters.openNow}
        onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
        icon={<Clock3 size={14} />}
        label={t('filter_open_now')}
      />
      <ToggleChip
        active={filters.hasMenu}
        onClick={() => onChange({ ...filters, hasMenu: !filters.hasMenu })}
        icon={<ScrollText size={14} />}
        label={t('filter_has_menu')}
      />
      <ToggleChip
        active={filters.hasQr}
        onClick={() => onChange({ ...filters, hasQr: !filters.hasQr })}
        icon={<QrCode size={14} />}
        label={t('filter_has_qr')}
      />
    </>
  )
}

export default function FilterBar({ filters, onChange, sort, onSortChange, resultCount }: FilterBarProps) {
  const { t } = useLanguage()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<FilterState>(filters)
  const active = countActiveFilters(filters)

  function openSheet() {
    setDraft(filters)
    setSheetOpen(true)
  }

  return (
    <div>
      {/* Desktop inline bar */}
      <div className="hidden md:flex flex-wrap items-center gap-2.5">
        <FilterControls filters={filters} onChange={onChange} />
        {active > 0 && (
          <button
            onClick={() => onChange({ category: null, cuisine: null, neighborhood: null, price: null, openNow: false, hasMenu: false, hasQr: false })}
            className="flex items-center gap-1 px-3 py-2.5 text-[13.5px] font-semibold text-ink-faint hover:text-terracotta transition-colors"
          >
            <X size={14} />
            {t('filter_clear')}
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[13.5px] text-ink-faint hidden lg:inline">{t('results_count', { count: resultCount })}</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={selectClass}
            >
              <option value="recommended">{t('sort_recommended')}</option>
              <option value="popular">{t('sort_popular')}</option>
              <option value="nearby">{t('sort_nearby')}</option>
              <option value="az">{t('sort_az')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Mobile trigger row */}
      <div className="flex md:hidden items-center gap-2.5">
        <button
          onClick={openSheet}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-white text-[13.5px] font-semibold text-ink"
        >
          <SlidersHorizontal size={15} />
          {t('filter_title')}
          {active > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green text-cream text-[11px] font-bold flex items-center justify-center">
              {active}
            </span>
          )}
        </button>
        <div className="relative flex-1">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={`${selectClass} w-full`}
          >
            <option value="recommended">{t('sort_recommended')}</option>
            <option value="popular">{t('sort_popular')}</option>
            <option value="nearby">{t('sort_nearby')}</option>
            <option value="az">{t('sort_az')}</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden bg-ink/40"
            onClick={() => setSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 bg-cream rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h3 className="text-[17px] font-bold text-ink">{t('filter_title')}</h3>
                <button onClick={() => setSheetOpen(false)} className="w-9 h-9 rounded-full hover:bg-cream-2 flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-5 flex flex-wrap gap-2.5">
                <FilterControls filters={draft} onChange={setDraft} />
              </div>

              <div className="p-5 border-t border-border flex gap-3 shrink-0">
                <button
                  onClick={() => setDraft({ category: null, cuisine: null, neighborhood: null, price: null, openNow: false, hasMenu: false, hasQr: false })}
                  className="flex-1 h-12 rounded-full border border-border font-semibold text-ink"
                >
                  {t('filter_clear')}
                </button>
                <button
                  onClick={() => {
                    onChange(draft)
                    setSheetOpen(false)
                  }}
                  className="flex-1 h-12 rounded-full bg-green text-cream font-semibold"
                >
                  {t('filter_apply')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
