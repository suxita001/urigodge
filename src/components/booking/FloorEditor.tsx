import { useEffect, useState } from 'react'
import { Copy, Layers, Plus, Save, Trash2, Undo2 } from 'lucide-react'
import FloorMap from './FloorMap'
import { ITEM_LABELS, type Floor, type FloorItem, type FloorItemType } from '../../data/booking'
import { saveFloors, subscribeFloors } from '../../services/bookingService'
import { newId } from '../../services/menuService'
import { useToast } from '../../hooks/useToast'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import Button from '../ui/Button'

const PRESETS: { type: FloorItemType; label: string; make: () => Partial<FloorItem> }[] = [
  { type: 'table', label: 'მრგვალი მაგიდა', make: () => ({ shape: 'round', seats: 4, w: 70, h: 70 }) },
  { type: 'table', label: 'მართკუთხა მაგიდა', make: () => ({ shape: 'rect', seats: 6, w: 130, h: 60 }) },
  { type: 'entrance', label: 'შესასვლელი', make: () => ({ w: 110, h: 50 }) },
  { type: 'toilet', label: 'ტუალეტი', make: () => ({ w: 110, h: 90 }) },
  { type: 'stage', label: 'სცენა', make: () => ({ w: 260, h: 110 }) },
  { type: 'bar', label: 'ბარი', make: () => ({ w: 220, h: 70 }) },
  { type: 'kitchen', label: 'სამზარეულო', make: () => ({ w: 180, h: 130 }) },
  { type: 'stairs', label: 'კიბე', make: () => ({ w: 120, h: 70 }) },
  { type: 'window', label: 'ფანჯარა', make: () => ({ w: 160, h: 14 }) },
  { type: 'wall', label: 'კედელი', make: () => ({ w: 200, h: 14 }) },
  { type: 'plant', label: 'მცენარე', make: () => ({ w: 50, h: 50 }) },
]

const emptyFloor = (n: number): Floor => ({ id: newId('floor'), name: { ka: `${n} სართული`, en: `Floor ${n}` }, order: n, width: 1000, height: 700, items: [] })

/** Draw the restaurant's halls: floors, tables with seats, toilets, entrance, stage… */
export default function FloorEditor({ restaurantId }: { restaurantId: string }) {
  const toast = useToast()
  const [saved, setSaved] = useState<Floor[] | null>(null)
  const [floors, setFloors] = useState<Floor[] | null>(null)
  const [active, setActive] = useState(0)
  const [sel, setSel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeFloors(restaurantId, (f) => { setSaved(f); setFloors((cur) => cur ?? f) }), [restaurantId])
  if (!floors || !saved) return <div className="h-96 rounded-2xl bg-cream-2 animate-pulse" />

  const dirty = JSON.stringify(floors) !== JSON.stringify(saved)
  const floor = floors[Math.min(active, floors.length - 1)]
  const item = floor?.items.find((i) => i.id === sel) ?? null
  const setFloor = (patch: Partial<Floor>) => setFloors(floors.map((f, i) => (i === Math.min(active, floors.length - 1) ? { ...f, ...patch } : f)))
  const setItem = (id: string, patch: Partial<FloorItem>) => setFloor({ items: floor.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const nextTableLabel = () => `T${floors.reduce((n, f) => n + f.items.filter((i) => i.type === 'table').length, 0) + 1}`

  function addItem(p: (typeof PRESETS)[number]) {
    const base = p.make()
    const it: FloorItem = { id: newId('it'), type: p.type, x: Math.round((floor.width - (base.w ?? 80)) / 2 / 10) * 10, y: Math.round((floor.height - (base.h ?? 80)) / 2 / 10) * 10, w: 80, h: 80, ...base }
    if (p.type === 'table') it.label = nextTableLabel()
    setFloor({ items: [...floor.items, it] })
    setSel(it.id)
  }

  async function save() {
    setSaving(true)
    try {
      const removed = saved!.filter((s) => !floors!.some((f) => f.id === s.id)).map((s) => s.id)
      await saveFloors(restaurantId, floors!, removed)
      setSaved(floors)
      toast.success('რუკა შენახულია — სტუმრები ახლავე ხედავენ.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  const tables = floors.reduce((n, f) => n + f.items.filter((i) => i.type === 'table').length, 0)
  const seats = floors.reduce((n, f) => n + f.items.reduce((s, i) => s + (i.type === 'table' ? i.seats ?? 0 : 0), 0), 0)

  return (
    <div className={dirty ? 'pb-20' : ''}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {floors.map((f, i) => (
          <button key={f.id} type="button" onClick={() => { setActive(i); setSel(null) }} className={`h-10 px-4 rounded-full text-[13.5px] font-bold inline-flex items-center gap-2 ${i === Math.min(active, floors.length - 1) ? 'bg-ink text-cream' : 'bg-white border border-border text-ink-soft'}`}>
            <Layers size={15} /> {f.name.ka}
          </button>
        ))}
        <button type="button" onClick={() => { setFloors([...floors, emptyFloor(floors.length + 1)]); setActive(floors.length); setSel(null) }} className="h-10 px-4 rounded-full border border-dashed border-border text-[13.5px] font-bold text-green inline-flex items-center gap-1.5"><Plus size={15} /> სართულის დამატება</button>
        <span className="ml-auto text-[13px] text-ink-faint">{tables} მაგიდა · {seats} ადგილი</span>
      </div>

      {!floor ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-ink-soft">ჯერ სართული არ არის. დააჭირე „სართულის დამატებას“ და დაიწყე ხატვა.</div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => addItem(p)} className="h-9 px-3 rounded-full bg-white border border-border text-[12.5px] font-bold text-ink hover:border-green hover:text-green inline-flex items-center gap-1"><Plus size={13} /> {p.label}</button>)}
            </div>
            <div className="rounded-2xl border border-border bg-white p-3">
              <FloorMap floor={floor} lang="ka" selectedId={sel} onSelect={setSel} onMove={(id, x, y) => setItem(id, { x: Math.max(0, Math.min(floor.width - 10, x)), y: Math.max(0, Math.min(floor.height - 10, y)) })} />
            </div>
            <p className="mt-2 text-[12px] text-ink-faint">გადაათრიე ელემენტები თითით ან მაუსით. დააჭირე რომელიმეს, რომ გვერდით შეცვალო.</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-4">
            <div>
              <p className="text-[12.5px] font-bold text-ink-faint mb-1.5">სართულის სახელი</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="h-10 rounded-xl border border-border px-3 text-[14px]" value={floor.name.ka} onChange={(e) => setFloor({ name: { ...floor.name, ka: e.target.value } })} />
                <input className="h-10 rounded-xl border border-border px-3 text-[14px]" value={floor.name.en} onChange={(e) => setFloor({ name: { ...floor.name, en: e.target.value } })} placeholder="English" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12.5px] text-ink-soft">
                <label>სიგანე<input type="range" min={500} max={1600} step={50} value={floor.width} onChange={(e) => setFloor({ width: +e.target.value })} className="w-full" /></label>
                <label>სიღრმე<input type="range" min={400} max={1600} step={50} value={floor.height} onChange={(e) => setFloor({ height: +e.target.value })} className="w-full" /></label>
              </div>
            </div>

            {item ? (
              <div className="border-t border-border pt-4 flex flex-col gap-3">
                <p className="text-[14px] font-extrabold text-ink">{ITEM_LABELS[item.type].ka}</p>
                <label className="text-[12.5px] font-bold text-ink-faint">წარწერა
                  <input className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-[14px] text-ink font-normal" value={item.label ?? ''} onChange={(e) => setItem(item.id, { label: e.target.value })} placeholder={ITEM_LABELS[item.type].ka} />
                </label>
                {item.type === 'table' && (
                  <>
                    <div className="text-[12.5px] font-bold text-ink-faint">ადგილები
                      <div className="mt-1 flex items-center gap-2">
                        <button type="button" className="w-10 h-10 rounded-full border border-border" onClick={() => setItem(item.id, { seats: Math.max(1, (item.seats ?? 4) - 1) })}>−</button>
                        <span className="w-10 text-center text-[18px] text-ink">{item.seats}</span>
                        <button type="button" className="w-10 h-10 rounded-full border border-border" onClick={() => setItem(item.id, { seats: Math.min(20, (item.seats ?? 4) + 1) })}>+</button>
                      </div>
                    </div>
                    <div className="inline-flex p-1 rounded-full bg-cream-2 self-start">
                      {(['round', 'rect'] as const).map((s) => <button key={s} type="button" onClick={() => setItem(item.id, { shape: s, ...(s === 'round' ? { w: Math.min(item.w, item.h), h: Math.min(item.w, item.h) } : {}) })} className={`h-8 px-3 rounded-full text-[12.5px] font-bold ${item.shape === s ? 'bg-white shadow-sm text-ink' : 'text-ink-soft'}`}>{s === 'round' ? 'მრგვალი' : 'მართკუთხა'}</button>)}
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2 text-[12.5px] text-ink-soft">
                  <label>სიგანე<input type="range" min={10} max={500} step={10} value={item.w} onChange={(e) => setItem(item.id, { w: +e.target.value, ...(item.shape === 'round' ? { h: +e.target.value } : {}) })} className="w-full" /></label>
                  <label>სიმაღლე<input type="range" min={10} max={500} step={10} value={item.h} disabled={item.shape === 'round'} onChange={(e) => setItem(item.id, { h: +e.target.value })} className="w-full" /></label>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={<Copy size={14} />} onClick={() => { const c = { ...item, id: newId('it'), x: item.x + 30, y: item.y + 30, label: item.type === 'table' ? nextTableLabel() : item.label }; setFloor({ items: [...floor.items, c] }); setSel(c.id) }}>ასლი</Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => { setFloor({ items: floor.items.filter((i) => i.id !== item.id) }); setSel(null) }}>წაშლა</Button>
                </div>
              </div>
            ) : (
              <p className="border-t border-border pt-4 text-[13px] text-ink-faint">აირჩიე ელემენტი რუკაზე, ან დაამატე ზემოდან.</p>
            )}

            {floors.length > 0 && (
              <button type="button" onClick={() => { if (confirm(`წავშალო „${floor.name.ka}“ მთლიანად?`)) { setFloors(floors.filter((f) => f.id !== floor.id)); setActive(0); setSel(null) } }} className="text-[12.5px] font-bold text-terracotta self-start">სართულის წაშლა</button>
            )}
          </div>
        </div>
      )}

      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[264px] z-30 border-t border-border bg-white/95 backdrop-blur-md">
          <div className="max-w-[1280px] px-4 md:px-8 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-[13.5px] font-semibold text-ink-soft"><span className="inline-block w-2 h-2 rounded-full bg-terracotta mr-2 align-middle" />რუკა შეცვლილია</p>
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Undo2 size={15} />} onClick={() => { setFloors(saved); setSel(null) }} disabled={saving}><span className="hidden sm:inline">გაუქმება</span></Button>
              <Button icon={<Save size={15} />} onClick={save} loading={saving}>შენახვა</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
