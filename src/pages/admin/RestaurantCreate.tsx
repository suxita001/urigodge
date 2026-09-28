import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Info, Phone, MapPin, Clock3, Images, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { dailyHours } from '../../data/helpers'
import { createRestaurant, restaurantExists, slugify } from '../../services/restaurantService'
import { newId } from '../../services/menuService'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
import type { Restaurant } from '../../data/types'
import {
  BasicInfoFields,
  ContactFields,
  HoursFields,
  LocationFields,
  PhotosFields,
  SectionTitle,
  cleanDraft,
  validateBasic,
  validateContact,
  type Draft,
  type DraftErrors,
} from '../../components/admin/RestaurantFormSections'
import MenuBuilder from '../../components/admin/MenuBuilder'
import { Card } from '../../components/admin/AdminUI'
import Button from '../../components/ui/Button'
import { TextInput, Toggle } from '../../components/ui/Inputs'

const STEPS: { title: string; icon: LucideIcon; description: string }[] = [
  { title: 'ძირითადი ინფორმაცია', icon: Info, description: 'სახელი, აღწერა, კატეგორია და ფასი.' },
  { title: 'საკონტაქტო ინფორმაცია', icon: Phone, description: 'ტელეფონი, ბმულები და მისამართი.' },
  { title: 'ლოკაცია', icon: MapPin, description: 'მონიშნე რესტორანი რუკაზე.' },
  { title: 'სამუშაო საათები', icon: Clock3, description: 'როდის არის რესტორანი ღია.' },
  { title: 'ფოტოები', icon: Images, description: 'მთავარი ფოტო, ლოგო და გალერეა.' },
  { title: 'მენიუ', icon: UtensilsCrossed, description: 'შექმენი ციფრული მენიუ ახლავე ან მოგვიანებით.' },
]

function emptyDraft(): Draft {
  return {
    name: { ka: '', en: '' },
    slug: '',
    description: { ka: '', en: '' },
    shortDescription: { ka: '', en: '' },
    category: 'restaurant',
    cuisine: ['georgian'],
    priceLevel: 2,
    images: [],
    coverImage: '',
    address: { ka: '', en: '' },
    neighborhood: 'old-tbilisi',
    phone: '',
    website: '',
    socialLinks: {},
    coordinates: { lat: 41.6938, lng: 44.8015 },
    openingHours: dailyHours('10:00', '23:00'),
    branches: [],
    menu: [],
    features: [],
    qrEnabled: true,
    popularity: 0,
    status: 'published',
  }
}

export default function RestaurantCreate() {
  useSeo('რესტორნის დამატება | მართვის პანელი')
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<DraftErrors & { slug?: string }>({})
  const [creating, setCreating] = useState(false)

  const slug = slugTouched ? draft.slug : slugify(draft.name.en)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  function validateStep(i: number): boolean {
    let e: DraftErrors & { slug?: string } = {}
    if (i === 0) {
      e = validateBasic(draft)
      if (!slug) e.slug = 'URL-ისთვის საჭიროა ლათინური სახელი.'
      else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) e.slug = 'მხოლოდ a-z, 0-9 და ტირე.'
    }
    if (i === 1) e = validateContact(draft)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function go(to: number) {
    if (to > step && !validateStep(step)) {
      toast.error('შეავსე აუცილებელი ველები.')
      return
    }
    setDir(to > step ? 1 : -1)
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function create() {
    if (!validateStep(0) || !validateStep(1)) {
      toast.error('შეავსე აუცილებელი ველები.')
      return
    }
    setCreating(true)
    try {
      if (await restaurantExists(slug)) {
        setStep(0)
        setErrors({ slug: 'ეს URL უკვე დაკავებულია — შეცვალე.' })
        toast.error('რესტორანი ამ URL-ით უკვე არსებობს.')
        return
      }
      const clean = cleanDraft({ ...draft, slug })
      if (clean.branches.length === 0) {
        clean.branches = [
          {
            id: newId('branch'),
            name: { ka: `${clean.name.ka} — მთავარი`, en: `${clean.name.en} — Main` },
            address: clean.address,
            phone: clean.phone,
            coordinates: clean.coordinates,
            openingHours: clean.openingHours as Restaurant['openingHours'],
            isMain: true,
          },
        ]
      }
      const id = await createRestaurant(clean)
      toast.success('რესტორანი წარმატებით დაემატა.')
      navigate(`/admin/restaurants/${id}`, { replace: true })
    } catch (e) {
      toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
    } finally {
      setCreating(false)
    }
  }

  const StepIcon = STEPS[step].icon
  const last = step === STEPS.length - 1

  return (
    <div className="pb-24">
      <Link to="/admin/restaurants" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={15} /> რესტორნები
      </Link>
      <h1 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight">რესტორნის დამატება</h1>

      {/* Stepper */}
      <div className="mt-5 mb-6">
        <div className="md:hidden">
          <div className="flex items-center justify-between text-[13px] font-semibold">
            <span className="text-ink">{STEPS[step].title}</span>
            <span className="text-ink-faint">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div className="h-full bg-green rounded-full" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
        <ol className="hidden md:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => (i < step ? go(i) : i === step + 1 ? go(i) : undefined)}
                className={`flex items-center gap-2 min-w-0 ${i <= step + 1 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors ${
                    i < step ? 'bg-green text-cream' : i === step ? 'bg-ink text-cream' : 'bg-white border border-border text-ink-faint'
                  }`}
                >
                  {i < step ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className={`text-[12.5px] font-semibold truncate ${i === step ? 'text-ink' : 'text-ink-faint'}`}>{s.title}</span>
              </button>
              {i < STEPS.length - 1 && <span className={`h-px flex-1 min-w-3 ${i < step ? 'bg-green' : 'bg-border'}`} />}
            </li>
          ))}
        </ol>
      </div>

      <Card className="p-5 md:p-7 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={step} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ duration: 0.2 }}>
            <div className="flex items-start gap-3 mb-1">
              <span className="w-10 h-10 rounded-xl bg-green-light text-green flex items-center justify-center shrink-0">
                <StepIcon size={19} />
              </span>
              <SectionTitle title={STEPS[step].title} description={STEPS[step].description} />
            </div>

            {step === 0 && (
              <div className="flex flex-col gap-5">
                <BasicInfoFields draft={draft} set={set} errors={errors} />
                <TextInput
                  label="URL (slug)"
                  hint={`urigod.ge/restaurant/${slug || '...'}`}
                  value={slug}
                  onValueChange={(v) => {
                    setSlugTouched(true)
                    set({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60) })
                  }}
                  error={errors.slug}
                />
              </div>
            )}
            {step === 1 && <ContactFields draft={draft} set={set} errors={errors} />}
            {step === 2 && <LocationFields draft={draft} set={set} />}
            {step === 3 && <HoursFields draft={draft} set={set} />}
            {step === 4 && <PhotosFields restaurantId={slug} draft={draft} set={set} />}
            {step === 5 && (
              <div className="flex flex-col gap-6">
                <MenuBuilder restaurantId={slug} value={draft.menu} onChange={(menu) => set({ menu })} />
                <div className="rounded-2xl bg-cream-2/60 p-4">
                  <Toggle
                    checked={draft.status !== 'draft'}
                    onChange={(v) => set({ status: v ? 'published' : 'draft' })}
                    label="დაუყოვნებლივ გამოქვეყნება"
                    description="გამორთვისას რესტორანი დრაფტად შეინახება და საიტზე არ გამოჩნდება."
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 lg:left-[264px] z-20 border-t border-border bg-white/90 backdrop-blur-md">
        <div className="max-w-[1280px] px-4 md:px-8 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => go(step - 1)} disabled={step === 0 || creating}>
            <span className="hidden sm:inline">უკან</span>
          </Button>
          {last ? (
            <Button icon={<Check size={16} />} onClick={create} loading={creating}>
              რესტორნის შექმნა
            </Button>
          ) : (
            <div className="flex gap-2.5">
              {step >= 4 && (
                <Button variant="ghost" onClick={create} loading={creating} className="hidden sm:inline-flex">
                  შექმნა მენიუს გარეშე
                </Button>
              )}
              <Button onClick={() => go(step + 1)}>
                შემდეგი <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
