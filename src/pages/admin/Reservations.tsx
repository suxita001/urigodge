import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2 } from 'lucide-react'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { useManagedRestaurants } from '../../hooks/useAdmin'
import { prefsOf, setReservationStatus, subscribeAllReservations, tbilisiToday } from '../../services/bookingService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, EmptyState, PageHeader, StatCard } from '../../components/admin/AdminUI'
import { ReservationRow, STATUS_LABEL } from '../../components/booking/ReservationsPanel'
import type { Reservation, ReservationStatus } from '../../data/booking'

/** Admins: every upcoming reservation on the site, across all restaurants. */
export default function Reservations() {
  useSeo('ჯავშნები | მართვის პანელი')
  const toast = useToast()
  const { restaurants } = useManagedRestaurants()
  const [list, setList] = useState<Reservation[] | null>(null)
  const [status, setStatus] = useState<ReservationStatus | 'all'>('all')
  const today = tbilisiToday()
  useEffect(() => subscribeAllReservations(today, setList), [today])

  const shown = useMemo(() => (list ?? []).filter((r) => status === 'all' || r.status === status), [list, status])
  const count = (s: ReservationStatus) => (list ?? []).filter((r) => r.status === s).length
  const bookable = restaurants.filter((r) => r.booking.enabled)

  async function onStatus(r: Reservation, s: ReservationStatus) {
    try {
      await setReservationStatus(r, s, prefsOf(restaurants.find((x) => x.id === r.restaurantId) ?? { bookingPrefs: undefined }))
      toast.success('ჯავშანი განახლდა.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    }
  }

  return (
    <div>
      <PageHeader title="ჯავშნები" description={`ყველა მომავალი ჯავშანი. ჯავშანი ჩართულია ${bookable.length} რესტორანზე — ჩართვა/გამორთვა რესტორნის „ჯავშნები“ ტაბიდან.`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard index={0} icon={CalendarCheck2} label="სულ მომავალი" value={list ? list.length : null} tone="ink" />
        <StatCard index={1} icon={CalendarCheck2} label="ელოდება" value={list ? count('pending') : null} tone="terracotta" />
        <StatCard index={2} icon={CalendarCheck2} label="დადასტურებული" value={list ? count('confirmed') : null} />
        <StatCard index={3} icon={CalendarCheck2} label="დღეს" value={list ? list.filter((r) => r.date === today).length : null} tone="ink" />
      </div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
          {(['all', 'pending', 'confirmed', 'declined', 'cancelled'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={`shrink-0 h-9 px-4 rounded-full text-[12.5px] font-bold ${status === s ? 'bg-ink text-cream' : 'bg-white border border-border text-ink-soft'}`}>{s === 'all' ? 'ყველა' : STATUS_LABEL[s]}</button>
          ))}
        </div>
        {list === null ? <div className="h-40 animate-pulse bg-cream-2" /> : shown.length === 0 ? <EmptyState icon={CalendarCheck2} title="ჯავშნები არ არის" /> : <ul className="divide-y divide-border">{shown.map((r) => <ReservationRow key={r.id} r={r} onStatus={onStatus} showRestaurant />)}</ul>}
      </Card>
    </div>
  )
}
