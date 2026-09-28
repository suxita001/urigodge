import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }

// Centered dialog on desktop, bottom sheet on mobile.
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[800] bg-ink/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className={`w-full ${widths[size]} bg-cream sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-card-hover`}
          >
            <div className="sm:hidden flex justify-center pt-2.5">
              <span className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-[18px] font-extrabold text-ink tracking-tight">{title}</h2>
                {description && <p className="mt-1 text-[13.5px] text-ink-soft">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 -mr-1.5 rounded-full hover:bg-cream-2 flex items-center justify-center text-ink-soft shrink-0"
                aria-label="დახურვა"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 sm:px-6 py-5 flex-1">{children}</div>
            {footer && (
              <div className="px-5 sm:px-6 py-4 border-t border-border bg-white/60 sm:rounded-b-3xl flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
