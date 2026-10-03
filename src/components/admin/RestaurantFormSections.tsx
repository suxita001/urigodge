import { useState, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import type { CuisineId, LocalizedText, PriceLevel } from '../../data/types'
import { normalizeHours, type RestaurantInput } from '../../services/restaurantService'
import { categories, cuisines, neighborhoods } from '../../data/categories'
import { Select, TextArea, TextInput, Toggle } from '../ui/Inputs'
import { ImageUploader, GalleryUploader } from './ImageUploader'
import HoursEditor from './HoursEditor'
import LocationPicker from './LocationPicker'
import { aiPriceLevel } from '../../services/aiService'
import { priceLabel, priceSymbol } from '../../lib/format'

export type Draft = RestaurantInput
export type SetDraft = (patch: Partial<Draft>) => void
export type DraftErrors = Partial<Record<'nameKa' | 'nameEn' | 'descriptionKa' | 'addressKa' | 'phone' | 'website', string>>

const cuisineList = (c: Draft['cuisine']): CuisineId[] => (Array.isArray(c) ? c : c ? [c] : [])

export function validateBasic(d: Draft): DraftErrors {
  const e: DraftErrors = {}
  if (!d.name.ka.trim()) e.nameKa = 'შეიყვანე ქართული სახელი.'
  if (!d.name.en.trim()) e.nameEn = 'შეიყვანე ინგლისური სახელი (URL-ისთვის).'
  if (!d.description.ka.trim()) e.descriptionKa = 'დაამატე მოკლე აღწერა.'
  return e
}

export function validateContact(d: Draft): DraftErrors {
  const e: DraftErrors = {}
  if (!d.address.ka.trim()) e.addressKa = 'შეიყვანე მისამართი.'
  if (d.phone && !/^[+\d\s()-]{5,20}$/.test(d.phone)) e.phone = 'ტელეფონის ფორმატი არასწორია.'
  if (d.website && !/^https?:\/\/\S+\.\S+/.test(d.website)) e.website = 'ბმული უნდა იწყებოდეს https://-ით.'
  return e
}

export function SectionTitle({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-extrabold text-ink tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-[13.5px] text-ink-soft">{description}</p>}
    </div>
  )
}

function Bilingual({ label, value, onChange, multiline, errorKa, errorEn, placeholderKa }: { label: string; value: LocalizedText; onChange: (v: LocalizedText) => void; multiline?: boolean; errorKa?: string; errorEn?: string; placeholderKa?: string }) {
  const Field = multiline ? TextArea : TextInput
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label={`${label} (ქართ.)`} placeholder={placeholderKa} value={value.ka} onValueChange={(ka) => onChange({ ...value, ka })} error={errorKa} />
      <Field label={`${label} (English)`} value={value.en} onValueChange={(en) => onChange({ ...value, en })} error={errorEn} />
    </div>
  )
}

export function BasicInfoFields({ draft, set, errors = {}, showStatus }: { draft: Draft; set: SetDraft; errors?: DraftErrors; showStatus?: boolean }) {
  const selected = cuisineList(draft.cuisine)
  return (
    <div className="flex flex-col gap-5">
      <Bilingual label="რესტორნის სახელი" value={draft.name} onChange={(name) => set({ name })} errorKa={errors.nameKa} errorEn={errors.nameEn} />
      <Bilingual label="აღწერა" multiline value={draft.description} onChange={(description) => set({ description })} errorKa={errors.descriptionKa} />
      <Bilingual label="მოკლე აღწერა (ბარათისთვის)" value={draft.shortDescription ?? { ka: '', en: '' }} onChange={(shortDescription) => set({ shortDescription })} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="კატეგორია" value={draft.category} onValueChange={(v) => set({ category: v as Draft['category'] })} options={categories.map((c) => ({ value: c.id, label: c.label.ka }))} />
        <PriceLevelField draft={draft} set={set} />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink">სამზარეულო</p>
        <div className="flex flex-wrap gap-2">
          {cuisines.map((c) => {
            const on = selected.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ cuisine: on ? selected.filter((x) => x !== c.id) : [...selected, c.id] })}
                className={`h-10 px-4 rounded-full border text-[13.5px] font-semibold transition-colors ${
                  on ? 'bg-green text-cream border-green' : 'bg-white text-ink-soft border-border hover:bg-cream-2'
                }`}
              >
                {c.label.ka}
              </button>
            )
          })}
        </div>
      </div>
      {showStatus && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Toggle
            checked={draft.status !== 'draft'}
            onChange={(v) => set({ status: v ? 'published' : 'draft' })}
            label="გამოქვეყნებულია"
            description="გამორთვისას რესტორანი საიტზე აღარ გამოჩნდება."
          />
        </div>
      )}
    </div>
  )
}

/** The ₾ level is no longer picked by hand: AI derives it from the menu prices (also re-run on every menu save). */
function PriceLevelField({ draft, set }: { draft: Draft; set: SetDraft }) {
  const [busy, setBusy] = useState(false)
  const hasPrices = draft.menu.some((c) => c.items.some((i) => i.price > 0))
  const level = (draft.priceLevel || 2) as PriceLevel

  async function evaluate() {
    setBusy(true)
    try {
      set({ priceLevel: await aiPriceLevel({ name: draft.name.ka || draft.name.en, category: draft.category, cuisine: cuisineList(draft.cuisine), menu: draft.menu }, level) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-ink">ფასის დონე</p>
      <div className="h-12 px-4 rounded-xl border border-border bg-cream-2/50 flex items-center justify-between gap-3">
        <span className="text-[14.5px] font-bold text-ink">
          {priceSymbol(level)} <span className="font-semibold text-ink-soft">— {priceLabel(level, 'ka')}</span>
        </span>
        <button
          type="button"
          onClick={evaluate}
          disabled={busy || !hasPrices}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-green disabled:text-ink-faint disabled:cursor-not-allowed"
        >
          <Sparkles size={14} className={busy ? 'animate-pulse' : ''} />
          {busy ? 'ფასდება…' : 'AI-ით შეფასება'}
        </button>
      </div>
      <p className="mt-1.5 text-[12px] text-ink-faint">{hasPrices ? 'AI ადგენს მენიუს ფასების მიხედვით — ახლდება მენიუს შენახვისას.' : 'დაადგენს AI, როცა მენიუს დაამატებ.'}</p>
    </div>
  )
}

export function ContactFields({ draft, set, errors = {} }: { draft: Draft; set: SetDraft; errors?: DraftErrors }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="ტელეფონი" type="tel" placeholder="+995 5XX XX XX XX" value={draft.phone} onValueChange={(phone) => set({ phone })} error={errors.phone} />
        <TextInput label="ვებსაიტი" type="url" placeholder="https://" value={draft.website ?? ''} onValueChange={(website) => set({ website })} error={errors.website} />
        <TextInput label="Instagram" type="url" placeholder="https://instagram.com/..." value={draft.socialLinks?.instagram ?? ''} onValueChange={(instagram) => set({ socialLinks: { ...draft.socialLinks, instagram } })} />
        <TextInput label="Facebook" type="url" placeholder="https://facebook.com/..." value={draft.socialLinks?.facebook ?? ''} onValueChange={(facebook) => set({ socialLinks: { ...draft.socialLinks, facebook } })} />
      </div>
      <Bilingual label="მისამართი" value={draft.address} onChange={(address) => set({ address })} errorKa={errors.addressKa} placeholderKa="ქუჩა, ნომერი, ქალაქი" />
      <Select label="უბანი" wrapperClassName="sm:max-w-[calc(50%-8px)]" value={draft.neighborhood} onValueChange={(v) => set({ neighborhood: v as Draft['neighborhood'] })} options={neighborhoods.map((n) => ({ value: n.id, label: n.label.ka }))} />
    </div>
  )
}

export function LocationFields({ draft, set }: { draft: Draft; set: SetDraft }) {
  return <LocationPicker value={draft.coordinates} onChange={(coordinates) => set({ coordinates })} />
}

export function HoursFields({ draft, set }: { draft: Draft; set: SetDraft }) {
  return <HoursEditor value={normalizeHours(draft.openingHours)} onChange={(openingHours) => set({ openingHours })} />
}

export function PhotosFields({ restaurantId, draft, set }: { restaurantId: string; draft: Draft; set: SetDraft }) {
  return (
    <div className="flex flex-col gap-7">
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-5">
        <ImageUploader restaurantId={restaurantId} kind="cover" label="მთავარი ფოტო (cover)" value={draft.coverImage} onChange={(coverImage) => set({ coverImage: coverImage ?? '' })} hint="ჩანს ბარათებზე და გვერდის თავში." />
        <ImageUploader restaurantId={restaurantId} kind="logo" label="ლოგო" aspect="aspect-square max-w-[220px]" value={draft.logo} onChange={(logo) => set({ logo })} />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink">გალერეა</p>
        <GalleryUploader restaurantId={restaurantId} value={draft.images} onChange={(images) => set({ images })} />
        <p className="mt-2 text-[12px] text-ink-faint">გადაათრიე ფოტოები რიგითობის შესაცვლელად. სურათები ავტომატურად იკუმშება ატვირთვამდე.</p>
      </div>
    </div>
  )
}

/** Normalises form input before it is written to Firestore. */
export function cleanDraft(d: Draft): Draft {
  const trimText = (t: LocalizedText | undefined): LocalizedText => ({ ka: t?.ka.trim() ?? '', en: t?.en.trim() ?? '' })
  const short = trimText(d.shortDescription)
  return {
    ...d,
    name: trimText(d.name),
    description: trimText(d.description),
    shortDescription: short.ka || short.en ? short : trimText(d.description),
    address: trimText(d.address),
    phone: d.phone.trim(),
    website: d.website?.trim() || undefined,
    socialLinks: { instagram: d.socialLinks?.instagram?.trim() || undefined, facebook: d.socialLinks?.facebook?.trim() || undefined },
    coverImage: d.coverImage || d.images[0] || '',
    images: d.coverImage && !d.images.includes(d.coverImage) ? [d.coverImage, ...d.images] : d.images,
  }
}
