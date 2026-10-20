import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../i18n/LanguageContext'
import { useRestaurants } from '../../hooks/useRestaurants'
import { useToast } from '../../hooks/useToast'
import { prefsOf, setReservationStatus, subscribeMyReservations, tbilisiToday } from '../../services/bookingService'
import { restaurantPath } from '../../lib/site'
import type { Reservation, ReservationStatus } from '../../data/booking'
import type { TranslationKey } from '../../i18n/translations'

const TONE: Record<ReservationStatus, string> = { pending: 'bg-amber-bg text-amber-fg', confirmed: 'bg-green-light text-green', declined: 'bg-terracotta-light text-terracotta', cancelled: 'bg-cream-2 text-ink-soft' }

/** Profile section: the guest's own reservations, with cancelling. */
export default function MyReservations() {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const { getBySlug } = useRestaurants()
  const toast = useToast()
  const [list, setList] = useState<Reservation[] | null>(null)
  useEffect(() => (currentUser ? subscribeMyReservations(currentUser.uid, setList) : undefined), [currentUser])
  if (!list || list.length === 0) return null

  const today = tbilisiToday()
  const upcoming = list.filter((r) => r.date >= today)
  const past = list.filter((r) => r.date < today).reverse().slice(0, 5)

  async function cancel(r: Reservation) {
    const rest = getBySlug(r.restaurantId)
    try {
      await setReservationStatus(r, 'cancelled', prefsOf(rest ?? { bookingPrefs: undefined }))
      toast.success(t('res_cancelled'))
    } catch {
      toast.error(t('res_cancel_failed'))
    }
  }

  const row = (r: Reservation) => (
    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3.5">
      <div className="w-16 text-center shrink-0"><p className="text-[18px] font-extrabold tabular-nums">{r.start}</p><p className="text-[11.5px] text-ink-faint tabular-nums">{r.date.slice(8)}.{r.date.slice(5, 7)}</p></div>
      <div className="min-w-0 flex-1">
        <Link to={restaurantPath(r.restaurantId)} className="block font-bold text-[15px] text-ink truncate hover:text-green">{r.restaurantName}</Link>
        <p className="text-[12.5px] text-ink-faint truncate">{r.partySize} {t('book_people')}{r.tableLabel ? ` · ${r.floorName} · ${t('book_table')} ${r.tableLabel}` : ''}</p>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold ${TONE[r.status]}`}>{t(`res_status_${r.status}` as TranslationKey)}</span>
      {(r.status === 'pending' || r.status === 'confirmed') && r.date >= today && (
        <button type="button" onClick={() => cancel(r)} className="text-[12.5px] font-bold text-terracotta hover:underline">{t('res_cancel')}</button>
      )}
    </li>
  )

  return (
    <section id="reservations" className="mt-12 scroll-mt-24">
      <h2 className="flex items-center gap-2 text-[20px] font-extrabold text-ink mb-4"><CalendarCheck2 size={20} className="text-green" /> {t('res_title')}</h2>
      {upcoming.length > 0 ? <ul className="flex flex-col gap-2.5">{upcoming.map(row)}</ul> : <p className="text-[14px] text-ink-faint">{t('res_none_upcoming')}</p>}
      {past.length > 0 && (<><p className="mt-6 mb-2 text-[13px] font-bold text-ink-faint">{t('res_past')}</p><ul className="flex flex-col gap-2.5 opacity-70">{past.map(row)}</ul></>)}
    </section>
  )
}
