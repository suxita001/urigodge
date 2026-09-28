import { MapPin, Phone, Clock3, Star } from 'lucide-react'
import type { Branch } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { todayHoursLabel } from '../data/helpers'

export default function BranchCard({
  branch,
  active,
  onFocus,
}: {
  branch: Branch
  active?: boolean
  onFocus: () => void
}) {
  const { t, tx } = useLanguage()
  const today = todayHoursLabel(branch.openingHours)

  return (
    <button
      onClick={onFocus}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        active ? 'border-green bg-green-light' : 'border-border bg-white hover:border-green/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-[15px] text-ink">{tx(branch.name)}</h4>
        {branch.isMain && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-terracotta shrink-0">
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
  )
}
