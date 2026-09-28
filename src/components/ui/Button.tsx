import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-green text-cream hover:bg-green-dark shadow-card',
  secondary: 'bg-white text-ink border border-border hover:bg-cream-2',
  danger: 'bg-terracotta text-cream hover:brightness-95',
  ghost: 'text-ink-soft hover:bg-cream-2 hover:text-ink',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export default function Button({
  variant = 'primary',
  loading = false,
  icon,
  size = 'md',
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:opacity-55 disabled:cursor-not-allowed whitespace-nowrap ${
        size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-11 px-5 text-[14px]'
      } ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={15} /> : icon}
      {children}
    </button>
  )
}
