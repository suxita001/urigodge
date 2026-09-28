import { Copy } from 'lucide-react'
import type { OpeningHours } from '../../data/types'
import { DAYS } from '../../services/restaurantService'
import { Toggle } from '../ui/Inputs'

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  mon: 'ორშაბათი',
  tue: 'სამშაბათი',
  wed: 'ოთხშაბათი',
  thu: 'ხუთშაბათი',
  fri: 'პარასკევი',
  sat: 'შაბათი',
  sun: 'კვირა',
}

const timeInput =
  'h-10 w-full sm:w-[112px] rounded-xl border border-border bg-white px-2.5 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-green/25 focus:border-green disabled:opacity-40'

export default function HoursEditor({ value, onChange }: { value: OpeningHours; onChange: (hours: OpeningHours) => void }) {
  function set(day: keyof OpeningHours, patch: Partial<OpeningHours[keyof OpeningHours]>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  function copyToAll(day: keyof OpeningHours) {
    const src = value[day]
    const next = {} as OpeningHours
    DAYS.forEach((d) => (next[d] = { ...src }))
    onChange(next)
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-white">
      {DAYS.map((day) => {
        const h = value[day]
        const open = !h.closed
        return (
          <div key={day} className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2.5 px-4 py-3">
            <div className="w-full sm:w-32 flex items-center justify-between sm:block">
              <span className="font-semibold text-[14px] text-ink">{DAY_LABELS[day]}</span>
              <span className="sm:hidden">
                <Toggle checked={open} onChange={(v) => set(day, { closed: !v })} />
              </span>
            </div>
            <span className="hidden sm:block w-[140px]">
              <Toggle checked={open} onChange={(v) => set(day, { closed: !v })} label={open ? 'ღიაა' : 'დაკეტილია'} />
            </span>
            <div className="flex items-center gap-2 flex-1">
              <input type="time" value={h.open} disabled={!open} onChange={(e) => set(day, { open: e.target.value })} className={timeInput} aria-label={`${DAY_LABELS[day]} — გახსნა`} />
              <span className="text-ink-faint">—</span>
              <input type="time" value={h.close} disabled={!open} onChange={(e) => set(day, { close: e.target.value })} className={timeInput} aria-label={`${DAY_LABELS[day]} — დახურვა`} />
            </div>
            <button
              type="button"
              onClick={() => copyToAll(day)}
              className="h-9 px-3 rounded-full text-[12.5px] font-semibold text-ink-soft hover:bg-cream-2 flex items-center gap-1.5"
              title="ყველა დღეზე გადატანა"
            >
              <Copy size={14} />
              <span className="sm:hidden lg:inline">ყველაზე</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
