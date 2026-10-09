import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { fetchDailyStats, type DayStats } from '../../services/analyticsService'
import { Card } from './AdminUI'

const DAYS = 30
const MONTHS = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
const WEEKDAYS = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']

const shortDate = (day: string) => `${Number(day.slice(8))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`
const weekday = (day: string) => WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()]
const sum = (rows: DayStats[], key: 'views' | 'visitors') => rows.reduce((n, r) => n + r[key], 0)

/** A round number at or just above the tallest bar, so the axis label reads cleanly. */
function niceMax(value: number): number {
  if (value <= 5) return 5
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((m) => m >= value) ?? value
}

function Tile({ label, value, sub }: { label: string; value: number | null; sub: string }) {
  return (
    <div className="px-4 md:px-5 py-4">
      <p className="text-[12.5px] font-semibold text-ink-faint">{label}</p>
      <p className="mt-1.5 text-[26px] md:text-[30px] font-extrabold text-ink tracking-tight leading-none tabular-nums">
        {value === null ? <span className="inline-block w-14 h-7 rounded-lg bg-cream-2 animate-pulse align-middle" /> : value.toLocaleString('ka-GE')}
      </p>
      <p className="mt-1.5 text-[12.5px] text-ink-soft tabular-nums">{sub}</p>
    </div>
  )
}

/** Site traffic for admins: headline numbers plus one bar per day for the last month. */
export default function VisitsCard() {
  const [rows, setRows] = useState<DayStats[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchDailyStats(DAYS)
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  const today = rows?.[rows.length - 1] ?? null
  const week = rows?.slice(-7) ?? null
  const max = niceMax(Math.max(...(rows ?? []).map((r) => r.views), 0))
  const active = hover !== null && rows ? rows[hover] : null
  const empty = rows !== null && sum(rows, 'views') === 0

  return (
    <Card className="mt-6 md:mt-8 overflow-hidden">
      <div className="px-4 md:px-5 pt-5 pb-4 flex items-center gap-3 border-b border-border">
        <span className="w-10 h-10 rounded-xl bg-green-light text-green flex items-center justify-center shrink-0">
          <BarChart3 size={19} />
        </span>
        <div>
          <h2 className="text-[17px] font-extrabold text-ink">საიტის ნახვები</h2>
          <p className="text-[12.5px] text-ink-faint">ვიზიტორი = სხვადასხვა ბრაუზერი დღეში. ადმინებისა და მენეჯერების ნახვები არ ითვლება.</p>
        </div>
      </div>

      {failed ? (
        <p className="px-5 py-8 text-[13.5px] font-semibold text-terracotta">სტატისტიკა ვერ ჩაიტვირთა. სცადე გვერდის განახლება.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
            <Tile label="დღეს" value={today?.views ?? null} sub={today ? `${today.visitors.toLocaleString('ka-GE')} ვიზიტორი` : ' '} />
            <Tile label="ბოლო 7 დღე" value={week ? sum(week, 'views') : null} sub={week ? `${sum(week, 'visitors').toLocaleString('ka-GE')} ვიზიტორი` : ' '} />
            <Tile label={`ბოლო ${DAYS} დღე`} value={rows ? sum(rows, 'views') : null} sub={rows ? `${sum(rows, 'visitors').toLocaleString('ka-GE')} ვიზიტორი` : ' '} />
          </div>

          <div className="px-4 md:px-5 pt-4 pb-5">
            <div className="flex items-baseline justify-between gap-3 min-h-6">
              <p className="text-[13px] font-bold text-ink">ნახვები დღეების მიხედვით</p>
              {/* Reads out the bar under the pointer; falls back to the scale when nothing is hovered. */}
              <p className="text-[12.5px] text-ink-soft tabular-nums" aria-live="polite">
                {active ? (
                  <>
                    <span className="font-bold text-ink">
                      {weekday(active.day)}, {shortDate(active.day)}
                    </span>{' '}
                    · {active.views.toLocaleString('ka-GE')} ნახვა · {active.visitors.toLocaleString('ka-GE')} ვიზიტორი
                  </>
                ) : (
                  <span className="text-ink-faint">მაქს. {max.toLocaleString('ka-GE')}</span>
                )}
              </p>
            </div>

            {rows === null ? (
              <div className="mt-3 h-40 rounded-xl bg-cream-2 animate-pulse" />
            ) : empty ? (
              <p className="mt-3 h-40 flex items-center justify-center text-center rounded-xl border border-dashed border-border text-[13.5px] text-ink-faint px-6">
                ჯერ მონაცემები არ არის — დათვლა ახლა დაიწყო. პირველი ნახვები რამდენიმე წუთში გამოჩნდება.
              </p>
            ) : (
              <>
                <div className="relative mt-3 h-40" onMouseLeave={() => setHover(null)}>
                  {/* recessive guides at the top, the middle and the baseline */}
                  <div className="absolute inset-x-0 top-0 border-t border-border/70" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" />
                  <div className="absolute inset-x-0 bottom-0 border-t border-border" />
                  <div className="absolute inset-0 flex items-end gap-[2px]">
                    {rows.map((r, i) => (
                      <button
                        key={r.day}
                        type="button"
                        onMouseEnter={() => setHover(i)}
                        onFocus={() => setHover(i)}
                        onBlur={() => setHover(null)}
                        onClick={() => setHover(i)}
                        aria-label={`${shortDate(r.day)}: ${r.views} ნახვა, ${r.visitors} ვიზიტორი`}
                        className="group relative flex-1 h-full flex items-end focus-visible:outline-none"
                      >
                        <span
                          style={{ height: r.views ? `max(3px, ${(r.views / max) * 100}%)` : 0 }}
                          className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-green-dark' : 'bg-green'} ${hover !== null && hover !== i ? 'opacity-55' : ''}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 flex justify-between text-[11.5px] text-ink-faint tabular-nums">
                  <span>{shortDate(rows[0].day)}</span>
                  <span>{shortDate(rows[Math.floor(rows.length / 2)].day)}</span>
                  <span>დღეს</span>
                </div>

                <table className="sr-only">
                  <caption>ნახვები და ვიზიტორები ბოლო {DAYS} დღეში</caption>
                  <thead>
                    <tr>
                      <th>დღე</th>
                      <th>ნახვები</th>
                      <th>ვიზიტორები</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.day}>
                        <td>{r.day}</td>
                        <td>{r.views}</td>
                        <td>{r.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
