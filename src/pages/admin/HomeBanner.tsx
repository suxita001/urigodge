import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Monitor, Moon, Save, Smartphone, Sun, Trash2, Undo2 } from 'lucide-react'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { guessTone, saveBrandSlides, subscribeBrandSlides, type BrandSlide } from '../../services/homeService'
import { newId } from '../../services/menuService'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import { Card, EmptyState, PageHeader } from '../../components/admin/AdminUI'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { TextInput } from '../../components/ui/Inputs'
import Button from '../../components/ui/Button'

// Uploads for site-wide artwork live next to the restaurants' folders on Cloudinary.
const UPLOAD_FOLDER = 'site'

const emptySlide = (): BrandSlide => ({ id: newId('slide'), image: '', tone: 'light' })

/** Admin page: urigod's own banner artwork, shown first in the home-page banner. */
export default function HomeBanner() {
  useSeo('მთავარი გვერდის ბანერი | მართვის პანელი')
  const toast = useToast()
  const [saved, setSaved] = useState<BrandSlide[] | null>(null)
  const [draft, setDraft] = useState<BrandSlide[] | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeBrandSlides(setSaved), [])

  const slides = draft ?? saved ?? []
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved)
  const set = (next: BrandSlide[]) => setDraft(next)
  const patch = (id: string, p: Partial<BrandSlide>) => setDraft((prev) => (prev ?? saved ?? []).map((s) => (s.id === id ? { ...s, ...p } : s)))
  const move = (i: number, d: number) => {
    const next = [...slides]
    const [s] = next.splice(i, 1)
    next.splice(i + d, 0, s)
    set(next)
  }

  async function save() {
    // A slide without its desktop picture cannot be shown, so it is dropped instead of saved.
    const clean = slides
      .filter((s) => s.image)
      .map((s) => {
        const label = s.label && (s.label.ka.trim() || s.label.en.trim()) ? { ka: s.label.ka.trim(), en: s.label.en.trim() } : undefined
        const out: BrandSlide = { id: s.id, image: s.image, tone: s.tone }
        if (s.imageMobile) out.imageMobile = s.imageMobile
        if (label) out.label = label
        if (label && s.link?.trim()) out.link = s.link.trim()
        return out
      })
    setSaving(true)
    try {
      await saveBrandSlides(clean)
      setDraft(null)
      toast.success('ბანერი შენახულია — საიტზე უკვე ჩანს.')
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={dirty ? 'pb-24' : ''}>
      <PageHeader
        title="მთავარი გვერდის ბანერი"
        description="urigod.ge-ის საკუთარი დიზაინები. ბანერში ჯერ ესენი ჩანს, მერე — რესტორნები, რომლებსაც „ბანერში ჩვენება“ აქვთ ჩართული."
        actions={
          <Button icon={<ImagePlus size={16} />} onClick={() => set([...slides, emptySlide()])}>
            სლაიდის დამატება
          </Button>
        }
      />

      <Card className="p-4 md:p-5 mb-5 text-[13px] text-ink-soft leading-relaxed">
        <b className="text-ink">ზომები:</b> კომპიუტერი 1920 × 1080 px (16:9), ტელეფონი 1080 × 1920 px (9:16). ფოტოს შუაში საიტის სათაური და ძებნა ედება — მნიშვნელოვანი ტექსტი ან
        ლოგო შუაში ნუ იქნება. ფონის ტიპს (ღია/მუქი) ატვირთვისას თავად ვარჩევ, საჭიროებისას შეცვალე.
      </Card>

      {saved === null ? (
        <Card className="h-64 animate-pulse" />
      ) : slides.length === 0 ? (
        <Card>
          <EmptyState icon={ImagePlus} title="საკუთარი სლაიდები ჯერ არ არის" text="დაამატე სლაიდი — ბანერში რესტორნებამდე გამოჩნდება." />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((s, i) => (
            <Card key={s.id} className="p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[15px] font-extrabold text-ink">სლაიდი {i + 1}</p>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="ზემოთ" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 disabled:opacity-30">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" disabled={i === slides.length - 1} onClick={() => move(i, 1)} aria-label="ქვემოთ" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 disabled:opacity-30">
                    <ArrowDown size={16} />
                  </button>
                  <button type="button" onClick={() => set(slides.filter((x) => x.id !== s.id))} aria-label="წაშლა" className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-[1.9fr_1fr] gap-5 items-start">
                <ImageUploader
                  restaurantId={UPLOAD_FOLDER}
                  kind="banner"
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor size={14} /> კომპიუტერისთვის — 1920 × 1080
                    </span>
                  }
                  value={s.image || undefined}
                  onChange={async (image) => {
                    patch(s.id, { image: image ?? '' })
                    if (image) patch(s.id, { tone: await guessTone(image) })
                  }}
                />
                <ImageUploader
                  restaurantId={UPLOAD_FOLDER}
                  kind="banner"
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone size={14} /> ტელეფონისთვის — 1080 × 1920
                    </span>
                  }
                  aspect="aspect-[9/16] max-w-[200px]"
                  value={s.imageMobile}
                  onChange={(imageMobile) => patch(s.id, { imageMobile })}
                  hint="არ არის სავალდებულო."
                />
              </div>

              <div className="mt-5">
                <p className="mb-1.5 text-[13px] font-semibold text-ink">ფონის ტიპი</p>
                <div className="inline-flex p-1 rounded-full bg-cream-2 gap-1">
                  {(
                    [
                      ['light', 'ღია ფონი — მუქი ტექსტი', Sun],
                      ['dark', 'მუქი ფონი — თეთრი ტექსტი', Moon],
                    ] as const
                  ).map(([tone, text, Icon]) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => patch(s.id, { tone })}
                      className={`h-9 px-3.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors ${s.tone === tone ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
                    >
                      <Icon size={14} />
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <TextInput label="წარწერა ქვემოთ (ქართ.)" placeholder="არ არის სავალდებულო" value={s.label?.ka ?? ''} onValueChange={(ka) => patch(s.id, { label: { ka, en: s.label?.en ?? '' } })} />
                <TextInput label="წარწერა (English)" value={s.label?.en ?? ''} onValueChange={(en) => patch(s.id, { label: { ka: s.label?.ka ?? '', en } })} />
                <TextInput label="ბმული" placeholder="/about ან https://…" value={s.link ?? ''} onValueChange={(link) => patch(s.id, { link })} hint="წარწერაზე დაჭერით აქ გადავა." />
              </div>
            </Card>
          ))}
        </div>
      )}

      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[264px] z-30 border-t border-border bg-white/95 backdrop-blur-md">
          <div className="max-w-[1280px] px-4 md:px-8 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-[13.5px] font-semibold text-ink-soft truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-terracotta mr-2 align-middle" />
              შეუნახავი ცვლილებები
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Undo2 size={15} />} onClick={() => setDraft(null)} disabled={saving}>
                <span className="hidden sm:inline">გაუქმება</span>
              </Button>
              <Button icon={<Save size={15} />} onClick={save} loading={saving}>
                შენახვა
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
