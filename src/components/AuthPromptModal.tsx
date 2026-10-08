import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function AuthPromptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  const location = useLocation()
  const redirect = encodeURIComponent(location.pathname + location.search)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-night/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-sm bg-cream rounded-3xl p-7 text-center shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-cream-2 flex items-center justify-center text-ink-soft"
              aria-label={t('close_modal')}
            >
              <X size={18} />
            </button>

            <motion.div
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.08 }}
              className="w-16 h-16 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto"
            >
              <Heart size={28} fill="currentColor" />
            </motion.div>

            <h2 id="auth-prompt-title" className="mt-5 text-[20px] font-extrabold text-ink tracking-tight">
              {t('fav_prompt_title')}
            </h2>
            <p className="mt-2 text-[14.5px] text-ink-soft leading-relaxed">„{t('fav_prompt_text')}“</p>

            <Link
              to={`/login?redirect=${redirect}`}
              className="mt-6 flex items-center justify-center h-12 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card"
            >
              {t('nav_login')}
            </Link>
            <p className="mt-4 text-[13.5px] text-ink-soft">
              {t('fav_prompt_no_account')}{' '}
              <Link to={`/register?redirect=${redirect}`} className="font-bold text-green hover:underline">
                {t('nav_register')}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
