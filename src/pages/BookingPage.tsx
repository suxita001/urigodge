import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Hourglass, Minus, Plus, Users } from 'lucide-react'
import { useRestaurant } from '../hooks/useRestaurants'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { useSeo } from '../hooks/useSeo'
import { useToast } from '../hooks/useToast'
import { venueName } from '../lib/format'
import { restaurantPath } from '../lib/site'
import { loginPathFor } from '../utils/redirect'
import FloorMap, { type TableState } from '../components/booking/FloorMap'
import { addDays, createReservation, prefsOf, slotsOf, startTimes, subscribeFloors, subscribeTakenTables, tableFree, tbilisiToday } from '../services/bookingService'
import type { Floor, FloorItem, Reservation } from '../data/booking'

const WEEK = { ka: ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }

/** Whether a table suits the party: big enough, and not wastefully big. */
const fits = (it: FloorItem, party: number) => (it.seats ?? 0) >= party && (it.seats ?? 0) - party <= 4

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, lang } = useLanguage()
  const { pathname } = useLocation()
  const { currentUser, profile } = useAuth()
  const toast = useToast()
  const { restaurant, loading } = useRestaurant(slug)
  const prefs = restaurant ? prefsOf(restaurant) : null
  const name = restaurant ? venueName(restaurant, lang) : ''
  useSeo(restaurant ? `${t('book_title')} — ${name} | urigod.ge` : 'urigod.ge', undefined, { noindex: true })

  const today = tbilisiToday()
  const [date, setDate] = useState(today)
  const [party, setParty] = useState(2)
  const [time, setTime] = useState<string | null>(null)
  const [floors, setFloors] = useState<Floor[] | null>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [table, setTable] = useState<FloorItem | null>(null)
  const [taken, setTaken] = useState<Map<string, Set<string>>>(new Map())
  const [contact, setContact] = useState({ name: '', phone: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Reservation | null>(null)

  const useMap = !!restaurant?.booking.floorPlan
  useEffect(() => { if (restaurant && useMap) return subscribeFloors(restaurant.id, setFloors) }, [restaurant, useMap])
  useEffect(() => { if (restaurant && useMap) return subscribeTakenTables(restaurant.id, date, setTaken) }, [restaurant, useMap, date])
  useEffect(() => { setContact((c) => ({ ...c, name: c.name || profile?.name || '', phone: c.phone || profile?.phone || '' })) }, [profile])

  const days = useMemo(() => Array.from({ length: prefs?.daysAhead ?? 14 }, (_, i) => addDays(today, i)), [today, prefs?.daysAhead])
  const times = useMemo(() => (restaurant && prefs ? startTimes(restaurant.openingHours, date, prefs) : []), [restaurant, prefs, date])
  const slots = time && prefs ? slotsOf(time, prefs) : []
  const floor = floors?.find((f) => f.id === floorId) ?? floors?.[0] ?? null

  // a table that just got taken by someone else, or no longer fits the party, is let go
  useEffect(() => { if (table && (!fits(table, party) || !tableFree(taken, table.id, slots))) setTable(null) }, [table, party, taken, slots.join()])
  useEffect(() => { if (time && !times.includes(time)) setTime(null) }, [times, time])

  if (loading) return <div className="max-w-3xl mx-auto px-5 py-16 animate-pulse"><div className="h-10 w-60 rounded-full bg-cream-2" /><div className="mt-8 h-96 rounded-3xl bg-cream-2" /></div>
  if (!restaurant || !prefs) return <Navigate to="/restaurants" replace />
  if (!restaurant.booking.enabled) return <Navigate to={restaurantPath(restaurant.slug)} replace />

  const freeCount = floor ? floor.items.filter((it) => it.type === 'table' && fits(it, party) && (!time || tableFree(taken, it.id, slots))).length : 0
  const tableState = (it: FloorItem): TableState => {
    if (!time) return fits(it, party) ? 'free' : 'unfit'
    if (!tableFree(taken, it.id, slots)) return 'taken'
    if (!fits(it, party)) return 'unfit'
    return table?.id === it.id ? 'selected' : 'free'
  }
  const ready = !!time && (!useMap || !!table) && contact.name.trim().length > 1 && contact.phone.replace(/\D/g, '').length >= 9

  async function submit() {
    if (!restaurant || !time) return
    setBusy(true)
    try {
      const res = await createReservation({
        restaurant, date, start: time, partySize: party, name: contact.name, phone: contact.phone, note: contact.note,
        table: useMap && table && floor ? { floorId: floor.id, floorName: floor.name[lang] || floor.name.ka, tableId: table.id, tableLabel: table.label || '' } : undefined,
      })
      setDone(res)
    } catch (e) {
      console.warn(e)
      // most likely somebody booked the same table a moment earlier
      toast.error(t('book_failed'))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const confirmed = done.status === 'confirmed'
    return (
      <div className="max-w-xl mx-auto px-5 py-16 md:py-24 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${confirmed ? 'bg-green-light text-green' : 'bg-amber-bg text-amber-fg'}`}>{confirmed ? <CheckCircle2 size={40} /> : <Hourglass size={36} />}</div>
        <h1 className="mt-6 text-[28px] md:text-[34px] font-extrabold text-ink">{confirmed ? t('book_done_confirmed') : t('book_done_pending')}</h1>
        <p className="mt-3 text-[15.5px] text-ink-soft leading-relaxed">{confirmed ? t('book_done_confirmed_text') : t('book_done_pending_text')}</p>
        <div className="mt-8 rounded-3xl border border-border bg-white p-6 text-left">
          <p className="font-extrabold text-[18px] text-ink">{name}</p>
          <p className="mt-2 text-[15px] text-ink-soft">{date} · {done.start}–{done.end} · {done.partySize} {t('book_people')}</p>
          {done.tableLabel && <p className="mt-1 text-[15px] text-ink-soft">{done.floorName} · {t('book_table')} {done.tableLabel}</p>}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/profile#reservations" className="px-6 py-3.5 rounded-full bg-green text-cream font-bold">{t('book_my')}</Link>
          <Link to={restaurantPath(restaurant.slug)} className="px-6 py-3.5 rounded-full border border-border bg-white font-bold text-ink">{t('book_back')}</Link>
        </div>
      </div>
    )
  }

  const chip = (on: boolean) => `shrink-0 rounded-2xl border px-4 py-3 text-center transition-colors ${on ? 'bg-green text-cream border-green' : 'bg-white border-border text-ink hover:border-green'}`

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-6 md:py-10 pb-36">
      <Link to={restaurantPath(restaurant.slug)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-soft hover:text-green"><ArrowLeft size={15} /> {name}</Link>
      <h1 className="mt-3 text-[30px] md:text-[40px] font-extrabold text-ink tracking-tight">{t('book_title')}</h1>
      <p className="mt-1 text-[15px] text-ink-soft">{useMap ? t('book_sub_map') : t('book_sub_form')}</p>

      {/* when */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink mb-3"><CalendarDays size={17} className="text-green" /> {t('book_date')}</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {days.map((d) => { const wd = new Date(`${d}T12:00:00Z`).getUTCDay(); const closed = restaurant.openingHours[(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[wd]]?.closed; return (
            <button key={d} type="button" disabled={closed} onClick={() => setDate(d)} className={`${chip(d === date)} w-[74px] disabled:opacity-40`}>
              <span className="block text-[12px] font-semibold opacity-75">{d === today ? t('book_today') : WEEK[lang][wd]}</span>
              <span className="block text-[20px] font-extrabold leading-tight">{Number(d.slice(8))}</span>
            </button>) })}
        </div>
      </section>

      <section className="mt-6 grid sm:grid-cols-[auto_1fr] gap-6 items-start">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink mb-3"><Users size={17} className="text-green" /> {t('book_guests')}</h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white p-1.5">
            <button type="button" onClick={() => setParty((p) => Math.max(1, p - 1))} aria-label="−" className="w-11 h-11 rounded-full hover:bg-cream-2 flex items-center justify-center"><Minus size={18} /></button>
            <span className="w-12 text-center text-[20px] font-extrabold tabular-nums">{party}</span>
            <button type="button" onClick={() => setParty((p) => Math.min(prefs.maxParty, p + 1))} aria-label="+" className="w-11 h-11 rounded-full hover:bg-cream-2 flex items-center justify-center"><Plus size={18} /></button>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink mb-3"><Clock size={17} className="text-green" /> {t('book_time')}</h2>
          {times.length === 0 ? <p className="text-[14px] text-ink-faint">{t('book_no_times')}</p> : (
            <div className="flex flex-wrap gap-2">{times.map((tm) => <button key={tm} type="button" onClick={() => setTime(tm)} className={`${chip(tm === time)} min-w-[78px] py-2.5 font-bold tabular-nums`}>{tm}</button>)}</div>
          )}
        </div>
      </section>

      {/* where — the floor plan */}
      {useMap && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-[15px] font-bold text-ink">{t('book_pick_table')}</h2>
            {floors && floors.length > 1 && (
              <div className="inline-flex p-1 rounded-full bg-cream-2">{floors.map((f) => <button key={f.id} type="button" onClick={() => { setFloorId(f.id); setTable(null) }} className={`h-9 px-4 rounded-full text-[13.5px] font-bold ${floor?.id === f.id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>{f.name[lang] || f.name.ka}</button>)}</div>
            )}
          </div>
          {floors === null ? <div className="h-80 rounded-3xl bg-cream-2 animate-pulse" /> : !floor ? <p className="text-[14px] text-ink-faint">{t('book_no_plan')}</p> : (
            <div className="rounded-3xl border border-border bg-white p-3 sm:p-5">
              <FloorMap floor={floor} lang={lang} tableState={tableState} onTableClick={(it) => setTable(it)} />
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-soft">
                <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-3.5 rounded-full border-[3px] border-green bg-white" /> {t('book_legend_free')}</span>
                <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-3.5 rounded-full bg-green" /> {t('book_legend_selected')}</span>
                <span className="inline-flex items-center gap-1.5"><i className="w-3.5 h-3.5 rounded-full bg-[#ddd5c6]" /> {t('book_legend_taken')}</span>
                <span className="ml-auto font-semibold text-ink">{time ? t('book_free_count', { n: freeCount }) : t('book_choose_time_first')}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* who */}
      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-ink mb-3">{t('book_contact')}</h2>
        {!currentUser ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-6 text-center">
            <p className="text-[14.5px] text-ink-soft">{t('book_login_needed')}</p>
            <Link to={loginPathFor(pathname)} className="mt-4 inline-flex px-6 py-3 rounded-full bg-green text-cream font-bold">{t('nav_login')}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder={t('book_name')} className="h-13 py-3.5 px-4 rounded-2xl border border-border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-green/30" />
            <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} inputMode="tel" placeholder={t('book_phone')} className="h-13 py-3.5 px-4 rounded-2xl border border-border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-green/30" />
            <textarea value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} rows={2} placeholder={t('book_note')} className="sm:col-span-2 py-3.5 px-4 rounded-2xl border border-border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-green/30 resize-none" />
          </div>
        )}
      </section>

      {/* summary bar */}
      {currentUser && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-white/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-3 flex items-center gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="flex-1 min-w-0 text-[13.5px] text-ink-soft truncate">
              {Number(date.slice(8))}.{date.slice(5, 7)} · {time ?? '—'} · {party} {t('book_people')}{useMap ? ` · ${table ? `${t('book_table')} ${table.label ?? ''}` : t('book_no_table')}` : ''}
            </p>
            <button type="button" disabled={!ready || busy} onClick={submit} className="shrink-0 h-12 px-7 rounded-full bg-green text-cream font-bold text-[15px] disabled:bg-border disabled:text-ink-faint">
              {busy ? '…' : t('book_submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
