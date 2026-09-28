import type { MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../i18n/LanguageContext'

interface FavoriteButtonProps {
  restaurantId: string
  variant?: 'icon' | 'pill'
  className?: string
}

export default function FavoriteButton({ restaurantId, variant = 'icon', className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLanguage()
  const active = isFavorite(restaurantId)

  function handleClick(e: MouseEvent) {
    // Cards are wrapped in a <Link>; keep the click from navigating.
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(restaurantId)
  }

  const heart = (
    <motion.span
      key={active ? 'on' : 'off'}
      initial={{ scale: active ? 0.5 : 1 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className="flex"
    >
      <Heart size={16} fill={active ? 'currentColor' : 'none'} strokeWidth={2.2} />
    </motion.span>
  )

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        aria-label={active ? t('fav_remove') : t('fav_add')}
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border font-bold text-[14px] transition-colors ${
          active
            ? 'border-terracotta bg-terracotta-light text-terracotta'
            : 'border-border bg-white text-ink hover:bg-cream-2'
        } ${className}`}
      >
        {heart}
        {active ? t('fav_saved') : t('fav_save')}
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={active ? t('fav_remove') : t('fav_add')}
      className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm transition-colors ${
        active ? 'text-terracotta' : 'text-ink-soft hover:text-terracotta'
      } ${className}`}
    >
      {heart}
    </motion.button>
  )
}
