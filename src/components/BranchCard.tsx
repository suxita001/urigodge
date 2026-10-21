import { MapPin, Phone, Clock3, Star, ExternalLink } from 'lucide-react'
import { placeLink } from '../lib/maps'
import type { Branch } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { todayHoursLabel } from '../data/helpers'
import CopyLinkButton from './CopyLinkButton'

export default function BranchCard({
  branch,
  active,
  onFocus,
  sharePath,
}: {
  branch: Branch
  active?: boolean
  onFocus: () => void
  /** Link that opens the restaurant page with this branch selected. */
  sharePath?: string
}) {
  const { t, tx } = useLanguage()
  const today = todayHoursLabel(branch.openingHours)

  return (
    <div className={`relative rounded-2xl border transition-colors ${active ? 'border-green bg-green-light' : 'border-border bg-white hover:border-green/50'}`}>
      <button onClick={onFocus} className="w-full text-left p-4 rounded-2xl">
        <div className="flex items-start gap-2 pr-10">
          <h4 className="font-bold text-[15px] text-ink">{tx(branch.name)}</h4>
          {branch.isMain && (
            <span className="flex items-center text-terracotta shrink-0 pt-1">
              <Star size={11} fill="currentColor" />
            </span>
          )}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[13.5px] text-ink-soft leading-relaxed">
          <MapPin size={14} className="mt-0.5 shrink-0 text-ink-faint" />
          {tx(branch.address)}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
          <Phone size={13} className="shrink-0 text-ink-faint" />
          {branch.phone}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
          <Clock3 size={13} className="shrink-0 text-ink-faint" />
          {today.closed ? t('restaurant_closed_now') : `${today.open} – ${today.close}`}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-green">
          <MapPin size={13} />
          {t('map_view_btn')}
        </span>
      </button>
      <a
        href={placeLink(branch.mapsUrl, branch.coordinates)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-white text-[12.5px] font-bold text-ink hover:border-green hover:text-green"
      >
        <ExternalLink size={13} /> Google Maps
      </a>
      {sharePath && (
        <div className="absolute top-3 right-3">
          <CopyLinkButton path={sharePath} variant="icon" label={t('share_copy_branch')} />
        </div>
      )}
    </div>
  )
}
