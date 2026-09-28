export default function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  )
}
