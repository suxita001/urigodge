import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast {
  id: number
  type: ToastType
  message: string
}

export interface ToastContextValue {
  show: (type: ToastType, message: string, durationMs?: number) => number
  success: (message: string) => number
  error: (message: string) => number
  info: (message: string) => number
  loading: (message?: string) => number
  dismiss: (id: number) => void
  /** Shows a loading toast while `task` runs, then a success/error toast. */
  promise: <T>(task: Promise<T>, messages: { loading?: string; success: string; error: string | ((e: unknown) => string) }) => Promise<T>
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const icons = {
  success: <CheckCircle2 size={18} className="text-green shrink-0" />,
  error: <AlertCircle size={18} className="text-terracotta shrink-0" />,
  info: <Info size={18} className="text-ink-soft shrink-0" />,
  loading: <Spinner size={16} className="text-green shrink-0" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (type: ToastType, message: string, durationMs?: number) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { id, type, message }])
      const duration = durationMs ?? (type === 'loading' ? 0 : type === 'error' ? 5000 : 3200)
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const value = useMemo<ToastContextValue>(() => {
    const api: ToastContextValue = {
      show,
      dismiss,
      success: (m) => show('success', m),
      error: (m) => show('error', m),
      info: (m) => show('info', m),
      loading: (m = 'იტვირთება...') => show('loading', m),
      promise: async (task, messages) => {
        const id = show('loading', messages.loading ?? 'იტვირთება...')
        try {
          const result = await task
          dismiss(id)
          show('success', messages.success)
          return result
        } catch (e) {
          dismiss(id)
          show('error', typeof messages.error === 'function' ? messages.error(e) : messages.error)
          throw e
        }
      },
    }
    return api
  }, [show, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[900] bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 sm:bottom-5 flex flex-col gap-2 w-[calc(100vw-32px)] sm:w-[360px] pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              role={t.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-white border border-border shadow-card-hover"
            >
              {icons[t.type]}
              <p className="flex-1 text-[14px] font-semibold text-ink leading-snug">{t.message}</p>
              {t.type !== 'loading' && (
                <button onClick={() => dismiss(t.id)} className="text-ink-faint hover:text-ink -mr-1" aria-label="დახურვა">
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
