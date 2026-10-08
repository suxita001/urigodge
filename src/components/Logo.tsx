import { Link } from 'react-router-dom'

// BASE_URL keeps the path right on hosts that serve the site from a sub-folder.
const MARK = `${import.meta.env.BASE_URL}logo.png`
const MARK_LIGHT = `${import.meta.env.BASE_URL}logo-light.png`

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="urigod.ge">
      {dark ? (
        <img src={MARK_LIGHT} alt="" width={32} height={32} className="w-8 h-8 shrink-0" />
      ) : (
        <>
          <img src={MARK} alt="" width={32} height={32} className="w-8 h-8 shrink-0 dark:hidden" />
          <img src={MARK_LIGHT} alt="" width={32} height={32} className="w-8 h-8 shrink-0 hidden dark:block" />
        </>
      )}
      <span className={`text-[19px] font-extrabold tracking-tight ${dark ? 'text-snow' : 'text-ink'}`}>
        urigod<span className={dark ? 'text-[#9cc5a1]' : 'text-green'}>.ge</span>
      </span>
    </Link>
  )
}
