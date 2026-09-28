function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Avatar({ name, size = 36, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={`inline-flex items-center justify-center rounded-full bg-green text-cream font-bold select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
