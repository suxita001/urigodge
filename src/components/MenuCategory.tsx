import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { MenuCategoryData } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'

export default function MenuCategory({
  category,
  open,
  onToggle,
}: {
  category: MenuCategoryData
  open: boolean
  onToggle: () => void
}) {
  const { t, tx, lang } = useLanguage()

  return (
    <div className="border border-border rounded-2xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-baseline gap-2.5">
          <span className="font-bold text-[16px] text-ink">{category.name[lang]}</span>
          <span className="text-[13px] text-ink-faint">({category.items.length})</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-ink-faint shrink-0">
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="px-5 pb-4 flex flex-col divide-y divide-border">
              {category.items.map((item) => {
                const unavailable = item.available === false
                return (
                  <li key={item.id} className={`flex items-start gap-3.5 py-3.5 first:pt-0 ${unavailable ? 'opacity-55' : ''}`}>
                    {item.image && (
                      <img src={item.image} alt={tx(item.name)} className={`w-16 h-16 rounded-xl object-cover shrink-0 ${unavailable ? 'grayscale' : ''}`} loading="lazy" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-[14.5px] text-ink leading-snug">{tx(item.name)}</h4>
                        <span className="font-bold text-[14.5px] text-green whitespace-nowrap">
                          {unavailable ? <span className="text-ink-faint text-[12.5px]">{t('menu_unavailable')}</span> : `${item.price.toFixed(2)} ₾`}
                        </span>
                      </div>
                      {tx(item.description) && <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">{tx(item.description)}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
