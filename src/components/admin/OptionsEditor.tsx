import { CircleDot, ListChecks, Plus, Ruler, Trash2, X } from 'lucide-react'
import type { MenuOption, MenuOptionGroup, MenuOptionKind } from '../../data/types'
import { newId } from '../../services/menuService'

/** Prices are edited as text so "2." or "2,5" can be typed; they are parsed when the dish is saved. */
export interface DraftOption extends Omit<MenuOption, 'price'> {
  price: string
}
export interface DraftGroup extends Omit<MenuOptionGroup, 'options'> {
  options: DraftOption[]
}

const KINDS: Record<MenuOptionKind, { icon: typeof Ruler; title: string; hint: string; name: { ka: string; en: string }; sample: { ka: string; en: string }; priceLabel: string }> = {
  variant: {
    icon: Ruler,
    title: 'ზომები / ვარიანტები',
    hint: 'თითოს თავისი ფასი აქვს — მაგ. პატარა 8 ₾, დიდი 12 ₾. სტუმარი ირჩევს ერთს.',
    name: { ka: 'ზომა', en: 'Size' },
    sample: { ka: 'მაგ. პატარა', en: 'e.g. Small' },
    priceLabel: 'ფასი ₾',
  },
  choice: {
    icon: CircleDot,
    title: 'ასარჩევი (ერთი)',
    hint: 'მაგ. მენიუში შემავალი სასმელი: კოლა, ფანტა. ფასი 0 = შედის ფასში, სხვა შემთხვევაში ემატება.',
    name: { ka: 'სასმელი', en: 'Drink' },
    sample: { ka: 'მაგ. კოკა-კოლა', en: 'e.g. Coca-Cola' },
    priceLabel: '+ ₾',
  },
  addon: {
    icon: ListChecks,
    title: 'დამატებები (რამდენიმე)',
    hint: 'მაგ. ტოპინგები ან ზედმეტი ყველი. ფასი ემატება კერძის ფასს.',
    name: { ka: 'დამატება', en: 'Extras' },
    sample: { ka: 'მაგ. შოკოლადის ტოპინგი', en: 'e.g. Chocolate topping' },
    priceLabel: '+ ₾',
  },
}

const emptyOption = (): DraftOption => ({ id: newId('opt'), name: { ka: '', en: '' }, price: '' })

export const toDraftGroups = (groups: MenuOptionGroup[] | undefined): DraftGroup[] =>
  (groups ?? []).map((g) => ({ ...g, options: g.options.map((o) => ({ ...o, price: o.price ? String(o.price) : '' })) }))

const parsePrice = (raw: string) => Number(raw.trim().replace(',', '.') || '0')

/** Returns the cleaned groups, or an error message when something is filled in wrongly. */
export function fromDraftGroups(groups: DraftGroup[]): { groups: MenuOptionGroup[] } | { error: string } {
  const out: MenuOptionGroup[] = []
  for (const group of groups) {
    const options: MenuOption[] = []
    for (const option of group.options) {
      const ka = option.name.ka.trim()
      const en = option.name.en.trim()
      if (!ka && !en && !option.price.trim()) continue // an untouched row
      const price = parsePrice(option.price)
      if (!ka && !en) return { error: 'ყველა ვარიანტს სჭირდება სახელი.' }
      if (!Number.isFinite(price) || price < 0) return { error: `„${ka || en}“ — ფასი არასწორია.` }
      if (group.kind === 'variant' && price <= 0) return { error: `„${ka || en}“ — ზომას სჭირდება ფასი.` }
      options.push({ id: option.id, name: { ka: ka || en, en }, price: Math.round(price * 100) / 100 })
    }
    if (options.length === 0) continue
    out.push({ id: group.id, kind: group.kind, name: { ka: group.name.ka.trim() || KINDS[group.kind].name.ka, en: group.name.en.trim() }, options })
  }
  return { groups: out }
}

const field = 'h-10 w-full rounded-lg border border-border bg-white px-3 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green/25 focus:border-green'

export default function OptionsEditor({ value, onChange }: { value: DraftGroup[]; onChange: (groups: DraftGroup[]) => void }) {
  const hasVariants = value.some((g) => g.kind === 'variant')
  const patchGroup = (id: string, patch: Partial<DraftGroup>) => onChange(value.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const patchOption = (group: DraftGroup, id: string, patch: Partial<DraftOption>) =>
    patchGroup(group.id, { options: group.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })

  function addGroup(kind: MenuOptionKind) {
    const group: DraftGroup = { id: newId('grp'), kind, name: { ...KINDS[kind].name }, options: [emptyOption(), emptyOption()] }
    // Sizes decide the price, so they always come first.
    onChange(kind === 'variant' ? [group, ...value] : [...value, group])
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-ink">ოფციები</p>
      <p className="mb-3 text-[12.5px] text-ink-faint">ზომები, ასარჩევი სასმელი, ტოპინგები — სტუმარი მენიუში აირჩევს და ჯამურ ფასს დაინახავს. არ არის სავალდებულო.</p>

      <div className="flex flex-col gap-3">
        {value.map((group) => {
          const kind = KINDS[group.kind]
          return (
            <div key={group.id} className="rounded-xl border border-border bg-cream/50 p-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-green-light text-green flex items-center justify-center shrink-0">
                  <kind.icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-ink">{kind.title}</p>
                  <p className="text-[12px] text-ink-faint leading-snug">{kind.hint}</p>
                </div>
                <button type="button" onClick={() => onChange(value.filter((g) => g.id !== group.id))} aria-label="ჯგუფის წაშლა" className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input className={field} aria-label="ჯგუფის სახელი (ქართ.)" placeholder="სათაური (ქართ.)" value={group.name.ka} onChange={(e) => patchGroup(group.id, { name: { ...group.name, ka: e.target.value } })} />
                <input className={field} aria-label="ჯგუფის სახელი (English)" placeholder="Title (English)" value={group.name.en} onChange={(e) => patchGroup(group.id, { name: { ...group.name, en: e.target.value } })} />
              </div>

              <ul className="mt-2 flex flex-col gap-2">
                {group.options.map((option) => (
                  <li key={option.id} className="grid grid-cols-[1fr_1fr_76px_32px] gap-2 items-center">
                    <input className={field} aria-label="სახელი (ქართ.)" placeholder={kind.sample.ka} value={option.name.ka} onChange={(e) => patchOption(group, option.id, { name: { ...option.name, ka: e.target.value } })} />
                    <input className={field} aria-label="სახელი (English)" placeholder={kind.sample.en} value={option.name.en} onChange={(e) => patchOption(group, option.id, { name: { ...option.name, en: e.target.value } })} />
                    <input className={`${field} px-2 text-right tabular-nums`} aria-label={kind.priceLabel} inputMode="decimal" placeholder={kind.priceLabel} value={option.price} onChange={(e) => patchOption(group, option.id, { price: e.target.value })} />
                    <button
                      type="button"
                      onClick={() => patchGroup(group.id, { options: group.options.filter((o) => o.id !== option.id) })}
                      aria-label="წაშლა"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-ink-faint hover:bg-cream-2 hover:text-ink"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => patchGroup(group.id, { options: [...group.options, emptyOption()] })} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-green hover:underline">
                <Plus size={14} /> ვარიანტის დამატება
              </button>
            </div>
          )
        })}
      </div>

      <div className={`flex flex-wrap gap-2 ${value.length ? 'mt-3' : ''}`}>
        {(Object.keys(KINDS) as MenuOptionKind[])
          .filter((kind) => !(kind === 'variant' && hasVariants))
          .map((kind) => {
            const Icon = KINDS[kind].icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => addGroup(kind)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-dashed border-border text-[13px] font-bold text-ink-soft hover:border-green hover:text-green hover:bg-green-light/40"
              >
                <Icon size={14} />
                {KINDS[kind].title}
              </button>
            )
          })}
      </div>
    </div>
  )
}
