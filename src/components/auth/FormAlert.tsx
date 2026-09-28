import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function FormAlert({ type, message }: { type: 'error' | 'success'; message: string | null }) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            role={type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium leading-snug ${
              type === 'error' ? 'bg-terracotta-light text-terracotta' : 'bg-green-light text-green'
            }`}
          >
            <Icon size={17} className="shrink-0 mt-px" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
