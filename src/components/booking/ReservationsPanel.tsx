import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, Check, Map as MapIcon, Phone, Settings2, X } from 'lucide-react'
import type { Restaurant } from '../../data/types'
import { DEFAULT_BOOKING_ACCESS, type Floor, type Reservation, type ReservationStatus } from '../../data/booking'
import { addDays, prefsOf, setReservationStatus, subscribeFloors, subscribeRestaurantReservations, subscribeTakenTables, tbilisiToday } from '../../services/bookingService'
import { updateRestaurant } from '../../services/restaurantService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Toggle } from '../ui/Inputs'
import { StatusBadge } from '../admin/AdminUI'
import FloorMap from './FloorMap'

export const STATUS_LABEL: Record<ReservationStatus, string> = { pending: 'ელოდება', confirmed: 'დადასტურებული', declined: 'უარყოფილი', cancelled: 'გაუქმებული' }
export const STATUS_TONE: Record<ReservationStatus, 'amber' | 'green' | 'neutral' | 'terracotta'> = { pending: 'amber', confirmed: 'green', declined: 'terracotta', cancelled: 'neutral' }

/** One reservation row with the manager's actions. */
export function ReservationRow({ r, onStatus, showRestaurant = false }: { r: Reservation; onStatus?: (r: Reservation, s: ReservationStatus) => void; showRestaurant?: boolean }) {
  const active = r.status === 'pending' || r.status === 'confirmed'
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3.5">
      <div className="w-[72px] text-center shrink-0">
        <p className="text-[19px] font-extrabold text-ink tabular-nums leading-none">{r.start}</p>
        <p className="mt-1 text-[11.5px] text-ink-faint tabular-nums">{r.date.slice(8)}.{r.date.slice(5, 7)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[14.5px] text-ink truncate">{r.name} · {r.partySize} სტუმარი{r.tableLabel ? ` · მაგიდა ${r.tableLabel}` : ''}</p>
        <p className="text-[12.5px] text-ink-faint truncate">
          {showRestaurant && <b className="text-ink-soft">{r.restaurantName} · </b>}
          <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-green"><Phone size={11} /> {r.phone}</a>
          {r.floorName ? ` · ${r.floorName}` : ''}{r.note ? ` · „${r.note}“` : ''}
        </p>
      </div>
      <StatusBadge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge>
      {onStatus && active && (
        <div className="flex gap-1.5">
          {r.status === 'pending' && <button type="button" onClick={() => onStatus(r, 'confirmed')} className="h-9 px-3 rounded-full bg-green text-cream text-[12.5px] font-bold inline-flex items-center gap-1"><Check size={14} /> დადასტურება</button>}
          <button type="button" onClick={() => onStatus(r, r.status === 'pending' ? 'declined' : 'cancelled')} className="h-9 px-3 rounded-full border border-border text-[12.5px] font-bold text-terracotta inline-flex items-center gap-1"><X size={14} /> {r.status === 'pending' ? 'უარყოფა' : 'გაუქმება'}</button>
        </div>
      )}
    </li>
  )
}

/** Restaurant dashboard: who can book (admin), how bookings work (manager), and the bookings themselves. */
export default function ReservationsPanel({ restaurant }: { restaurant: Restaurant }) {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const access = { ...DEFAULT_BOOKING_ACCESS, ...restaurant.booking }
  const prefs = prefsOf(restaurant)
  const [list, setList] = useState<Reservation[] | null>(null)
  const [day, setDay] = useState<string | 'upcoming'>('upcoming')
  const [showMap, setShowMap] = useState(false)
  const [floors, setFloors] = useState<Floor[]>([])
  const [taken, setTaken] = useState<Map<string, Set<string>>>(new Map())
  const today = tbilisiToday()

  useEffect(() => subscribeRestaurantReservations(restaurant.id, setList), [restaurant.id])
  useEffect(() => (access.floorPlan ? subscribeFloors(restaurant.id, setFloors) : undefined), [restaurant.id, access.floorPlan])
  const mapDay = day === 'upcoming' ? today : day
  useEffect(() => (showMap ? subscribeTakenTables(restaurant.id, mapDay, setTaken) : undefined), [restaurant.id, mapDay, showMap])

  const shown = useMemo(() => (list ?? []).filter((r) => (day === 'upcoming' ? r.date >= today : r.date === day)), [list, day, today])
  const pending = (list ?? []).filter((r) => r.status === 'pending' && r.date >= today).length

  async function patch(p: Record<string, unknown>, label: string) {
    try {
      await updateRestaurant(restaurant, p, [{ action: 'RESTAURANT_UPDATED', description: `„${restaurant.nameI18n.ka || restaurant.name}“ — ${label}` }])
      toast.success('შენახულია.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    }
  }
  async function onStatus(r: Reservation, s: ReservationStatus) {
    try {
      await setReservationStatus(r, s, prefs)
      toast.success(s === 'confirmed' ? 'ჯავშანი დადასტურდა.' : s === 'declined' ? 'ჯავშანი უარყოფილია — მაგიდა გათავისუფლდა.' : 'ჯავშანი გაუქმდა.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <div className="rounded-2xl border border-border p-4 md:p-5 bg-cream/50">
          <p className="text-[13px] font-bold text-ink-faint mb-3">მხოლოდ ადმინი ხედავს</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Toggle checked={access.enabled} onChange={(enabled) => patch({ booking: { ...access, enabled } }, enabled ? 'ჯავშანი ჩაირთო' : 'ჯავშანი გამოირთო')} label="ჯავშნის ფუნქცია" description="სტუმრები ხედავენ ღილაკს „დაჯავშნე მაგიდა“." />
            <Toggle checked={access.floorPlan} disabled={!access.enabled} onChange={(floorPlan) => patch({ booking: { ...access, floorPlan } }, floorPlan ? 'რუკით ჯავშანი ჩაირთო' : 'რუკით ჯავშანი გამოირთო')} label="ჯავშანი დარბაზის რუკით" description="სტუმარი მაგიდას რუკაზე ირჩევს. გამორთვისას — მარტივი ფორმა." />
          </div>
        </div>
      )}

      {!access.enabled ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-[14px] text-ink-soft">ამ რესტორანზე ჯავშანი გამორთულია. მის ჩართვას მხოლოდ urigod.ge-ის ადმინისტრაცია ახერხებს.</div>
      ) : (
        <>
          <div className="rounded-2xl border border-border p-4 md:p-5">
            <p className="flex items-center gap-2 text-[14.5px] font-extrabold text-ink mb-4"><Settings2 size={16} /> ჯავშნის წესები</p>
            <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-4 items-start">
              <Toggle checked={prefs.autoConfirm} onChange={(autoConfirm) => patch({ bookingPrefs: { ...prefs, autoConfirm } }, autoConfirm ? 'ჯავშნები ავტომატურად დასტურდება' : 'ჯავშნებს მენეჯერი ადასტურებს')} label="ავტომატური დადასტურება" description="გამორთვისას თითოეულ ჯავშანს შენ ადასტურებ." />
              <label className="text-[13px] font-semibold text-ink">მაგიდა იკავებს
                <select className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px]" value={prefs.durationMinutes} onChange={(e) => patch({ bookingPrefs: { ...prefs, durationMinutes: +e.target.value } }, 'ჯავშნის ხანგრძლივობა შეიცვალა')}>
                  {[60, 90, 120, 150, 180, 240].map((m) => <option key={m} value={m}>{m / 60} საათს</option>)}
                </select>
              </label>
              <label className="text-[13px] font-semibold text-ink">მაქს. სტუმარი
                <select className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px]" value={prefs.maxParty} onChange={(e) => patch({ bookingPrefs: { ...prefs, maxParty: +e.target.value } }, 'მაქს. სტუმრების რაოდენობა შეიცვალა')}>
                  {[4, 6, 8, 10, 12, 16, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex flex-wrap items-center gap-2 border-b border-border">
              <p className="flex items-center gap-2 text-[14.5px] font-extrabold text-ink mr-auto"><CalendarCheck2 size={16} /> ჯავშნები {pending > 0 && <StatusBadge tone="amber">{pending} ელოდება</StatusBadge>}</p>
              {access.floorPlan && <button type="button" onClick={() => setShowMap((v) => !v)} className={`h-9 px-3 rounded-full text-[12.5px] font-bold inline-flex items-center gap-1.5 ${showMap ? 'bg-ink text-cream' : 'border border-border text-ink-soft'}`}><MapIcon size={14} /> რუკაზე</button>}
            </div>
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border">
              <button type="button" onClick={() => setDay('upcoming')} className={`shrink-0 h-9 px-4 rounded-full text-[12.5px] font-bold ${day === 'upcoming' ? 'bg-green text-cream' : 'bg-white border border-border text-ink-soft'}`}>ყველა მომავალი</button>
              {Array.from({ length: 14 }, (_, i) => addDays(today, i)).map((d) => {
                const n = (list ?? []).filter((r) => r.date === d && (r.status === 'pending' || r.status === 'confirmed')).length
                return <button key={d} type="button" onClick={() => setDay(d)} className={`shrink-0 h-9 px-3 rounded-full text-[12.5px] font-bold tabular-nums ${day === d ? 'bg-green text-cream' : 'bg-white border border-border text-ink-soft'}`}>{d === today ? 'დღეს' : `${d.slice(8)}.${d.slice(5, 7)}`}{n ? ` · ${n}` : ''}</button>
              })}
            </div>
            {showMap && floors.length > 0 && (
              <div className="p-4 border-b border-border grid md:grid-cols-2 gap-4">
                {floors.map((f) => (
                  <div key={f.id}>
                    <p className="text-[13px] font-bold text-ink mb-2">{f.name.ka} · {mapDay === today ? 'დღეს' : mapDay}</p>
                    <FloorMap floor={f} lang="ka" tableState={(it) => (taken.has(it.id) ? 'selected' : 'free')} />
                  </div>
                ))}
                <p className="md:col-span-2 text-[12px] text-ink-faint">მწვანე მაგიდებს ამ დღეს ერთი ან მეტი ჯავშანი აქვს.</p>
              </div>
            )}
            {list === null ? <div className="h-32 animate-pulse bg-cream-2" /> : shown.length === 0 ? (
              <p className="px-4 py-10 text-center text-[14px] text-ink-faint">ამ პერიოდში ჯავშანი არ არის.</p>
            ) : (
              <ul className="divide-y divide-border">{shown.map((r) => <ReservationRow key={r.id} r={r} onStatus={onStatus} />)}</ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
