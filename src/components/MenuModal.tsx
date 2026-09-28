import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Restaurant } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import MenuCategory from './MenuCategory'

export default function MenuModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const { t } = useLanguage()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(restaurant.menu[0] ? [restaurant.menu[0].id] : []))

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-ink/45 backdrop-blur-[2px] flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-2xl mx-auto md:mx-4 bg-cream rounded-t-3xl md:rounded-3xl h-[92vh] md:h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 md:px-7 py-4 md:py-5 border-b border-border bg-white shrink-0">
            <div>
              <h2 className="text-[19px] md:text-[22px] font-extrabold text-ink">{t('menu_title')}</h2>
              <p className="text-[13px] text-ink-faint">{restaurant.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-cream-2 flex items-center justify-center text-ink shrink-0"
              aria-label={t('menu_close')}
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 md:px-7 py-5 flex flex-col gap-3">
            {restaurant.menu.map((category) => (
              <MenuCategory
                key={category.id}
                category={category}
                open={openIds.has(category.id)}
                onToggle={() => toggle(category.id)}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
