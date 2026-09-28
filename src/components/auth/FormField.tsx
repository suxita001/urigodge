import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  icon?: LucideIcon
  error?: string
  hint?: string
  labelAside?: ReactNode
  onValueChange: (value: string) => void
}

export default function FormField({
  label,
  icon: Icon,
  error,
  hint,
  labelAside,
  type = 'text',
  onValueChange,
  ...inputProps
}: FormFieldProps) {
  const { t } = useLanguage()
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-[13.5px] font-semibold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {Icon && (
          <Icon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        )}
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full h-12 rounded-xl border bg-white text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${isPassword ? 'pr-12' : 'pr-4'} ${
            error
              ? 'border-terracotta focus:ring-terracotta/25 focus:border-terracotta'
              : 'border-border focus:ring-green/25 focus:border-green'
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-cream-2 transition-colors"
            aria-label={reveal ? t('auth_hide_password') : t('auth_show_password')}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-1.5 text-[12.5px] font-medium text-terracotta"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={`${id}-hint`} className="mt-1.5 text-[12.5px] text-ink-faint">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
