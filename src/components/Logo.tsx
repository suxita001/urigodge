import { Link } from 'react-router-dom'

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="urigod.ge">
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <rect width="64" height="64" rx="16" fill="#3A5A40" />
        <path d="M20 16v16.5c0 3.6 2.9 6.5 6.5 6.5S33 36.1 33 32.5V16" stroke="#FAF7F1" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M20 24h13" stroke="#FAF7F1" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M44 16v11c0 3-2 5-4.5 5.6V48" stroke="#FAF7F1" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M39.5 16v13" stroke="#FAF7F1" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      <span className={`text-[19px] font-extrabold tracking-tight ${dark ? 'text-cream' : 'text-ink'}`}>
        urigod<span className="text-green">.ge</span>
      </span>
    </Link>
  )
}
