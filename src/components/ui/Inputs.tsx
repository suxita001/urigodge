import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const base =
  'w-full rounded-xl border bg-white text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:bg-cream-2'
const ok = 'border-border focus:ring-green/25 focus:border-green'
const bad = 'border-terracotta focus:ring-terracotta/25 focus:border-terracotta'

interface FieldShellProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  id: string
  children: ReactNode
  className?: string
}

function FieldShell({ label, hint, error, id, children, className = '' }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block mb-1.5 text-[13px] font-semibold text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-terracotta">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  onValueChange: (value: string) => void
  wrapperClassName?: string
}

export function TextInput({ label, hint, error, onValueChange, wrapperClassName, className = '', ...rest }: TextInputProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={wrapperClassName}>
      <input
        id={id}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={!!error}
        className={`${base} ${error ? bad : ok} h-11 px-3.5 ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  onValueChange: (value: string) => void
  wrapperClassName?: string
}

export function TextArea({ label, hint, error, onValueChange, wrapperClassName, rows = 4, ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={wrapperClassName}>
      <textarea
        id={id}
        rows={rows}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={!!error}
        className={`${base} ${error ? bad : ok} px-3.5 py-2.5 resize-y leading-relaxed`}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
  wrapperClassName?: string
}

export function Select({ label, hint, error, options, onValueChange, wrapperClassName, className = '', ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={wrapperClassName}>
      <select
        id={id}
        onChange={(e) => onValueChange(e.target.value)}
        className={`${base} ${error ? bad : ok} h-11 px-3 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238a8478' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-9 ${className}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-55' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-11 h-6 rounded-full shrink-0 transition-colors ${checked ? 'bg-green' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[14px] font-semibold text-ink">{label}</span>}
          {description && <span className="block text-[12.5px] text-ink-faint mt-0.5">{description}</span>}
        </span>
      )}
    </label>
  )
}
