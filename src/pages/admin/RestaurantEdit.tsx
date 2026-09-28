import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Info, MapPin, Clock3, Images, UtensilsCrossed, GitBranch, UserCog, Save, Undo2, ShieldAlert, UserMinus, Plus, Store } from 'lucide-react'
import type { Branch, Restaurant, UserProfile } from '../../data/types'
import { useAuth } from '../../hooks/useAuth'
import { useInvitations, useManagedRestaurant, useManagedRestaurants, useUsers } from '../../hooks/useAdmin'
import { useMenu } from '../../hooks/useMenu'
import { useSeo } from '../../hooks/useSeo'
import { useToast } from '../../hooks/useToast'
import { toRestaurantDoc, updateRestaurant, type RestaurantPatch } from '../../services/restaurantService'
import { saveBranches } from '../../services/menuService'
import { setManagerRestaurants } from '../../services/managerService'
import { deleteImageByUrl } from '../../services/storageService'
import { canManageRestaurant } from '../../utils/roles'
import { getFirebaseErrorMessage, SAVE_FAILED } from '../../utils/firebaseErrors'
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
import BranchManager from '../../components/admin/BranchManager'
import AssignManagerModal from '../../components/admin/AssignManagerModal'
import { Card, EmptyState, StatusBadge } from '../../components/admin/AdminUI'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Avatar from '../../components/ui/Avatar'

type Tab = 'info' | 'location' | 'hours' | 'photos' | 'menu' | 'branches' | 'managers'

const FIELD_LABELS: Partial<Record<keyof Draft, string>> = {
  name: 'სახელი',
  description: 'აღწერა',
  shortDescription: 'მოკლე აღწერა',
  category: 'კატეგორია',
  cuisine: 'სამზარეულო',
  priceLevel: 'ფასის დონე',
  qrEnabled: 'QR მენიუ',
  status: 'სტატუსი',
  phone: 'ტელეფონი',
  website: 'ვებსაიტი',
  socialLinks: 'სოც. ქსელები',
  address: 'მისამართი',
  neighborhood: 'უბანი',
  coordinates: 'ლოკაცია',
  openingHours: 'სამუშაო საათები',
  coverImage: 'მთავარი ფოტო',
  logo: 'ლოგო',
  images: 'გალერეა',
}

export default function RestaurantEdit() {
  const { id } = useParams<{ id: string }>()
  const { profile, isAdmin } = useAuth()
  const { restaurant, loading } = useManagedRestaurant(id)
  useSeo(`${restaurant?.nameI18n.ka || restaurant?.name || 'რესტორანი'} | მართვის პანელი`)

  if (id && profile && !canManageRestaurant(profile, id)) {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="წვდომა შეზღუდულია" text="ამ რესტორნის მართვის უფლება არ გაქვს." action={<Link to="/admin" className="font-bold text-green">დაფაზე დაბრუნება</Link>} />
      </Card>
    )
  }
  if (loading) return <Card className="h-96 animate-pulse" />
  if (!restaurant) {
    return (
      <Card>
        <EmptyState icon={Store} title="რესტორანი ვერ მოიძებნა" text="შესაძლოა წაიშალა." action={<Link to={isAdmin ? '/admin/restaurants' : '/admin'} className="font-bold text-green">უკან დაბრუნება</Link>} />
      </Card>
    )
  }
  return <Editor key={restaurant.id} restaurant={restaurant} />
}

function Editor({ restaurant }: { restaurant: Restaurant }) {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'info'

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: 'info', label: 'ინფორმაცია', icon: Info },
    { id: 'location', label: 'ლოკაცია', icon: MapPin },
    { id: 'hours', label: 'საათები', icon: Clock3 },
    { id: 'photos', label: 'ფოტოები', icon: Images },
    { id: 'menu', label: 'მენიუ', icon: UtensilsCrossed },
    { id: 'branches', label: 'ფილიალები', icon: GitBranch },
    ...(isAdmin ? [{ id: 'managers' as Tab, label: 'მენეჯერები', icon: UserCog }] : []),
  ]

  // ---- Shared draft for the info / location / hours / photos tabs ----
  const saved = useMemo(() => toRestaurantDoc(restaurant), [restaurant])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [saving, setSaving] = useState(false)
  const current = draft ?? saved
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...(d ?? saved), ...patch }))
  const changedKeys = draft ? (Object.keys(draft) as (keyof Draft)[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k])) : []
  const dirty = changedKeys.length > 0

  const menu = useMenu(restaurant)

  async function saveDraft() {
    if (!draft) return
    const e = { ...validateBasic(draft), ...validateContact(draft) }
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error('შეავსე აუცილებელი ველები.')
      setParams({ tab: 'info' }, { replace: true })
      return
    }
    const clean = cleanDraft(draft)
    const keys = (Object.keys(clean) as (keyof Draft)[]).filter((k) => k !== 'slug' && JSON.stringify(clean[k]) !== JSON.stringify(saved[k]))
    if (!isAdmin) keys.splice(0, keys.length, ...keys.filter((k) => k !== 'status' && k !== 'popularity'))
    if (keys.length === 0) {
      setDraft(null)
      return
    }
    const patch = Object.fromEntries(keys.map((k) => [k, clean[k]])) as RestaurantPatch
    const label = keys.map((k) => FIELD_LABELS[k] ?? k).join(', ')
    setSaving(true)
    try {
      await updateRestaurant(restaurant, patch, [{ action: 'RESTAURANT_UPDATED', description: `„${restaurant.nameI18n.ka || restaurant.name}“ — შეიცვალა: ${label}` }])
      const before = [saved.coverImage, saved.logo, ...saved.images].filter(Boolean) as string[]
      const after = new Set([clean.coverImage, clean.logo, ...clean.images].filter(Boolean) as string[])
      before.filter((u) => !after.has(u)).forEach((u) => deleteImageByUrl(u))
      setDraft(null)
      toast.success('ცვლილებები შენახულია.')
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err, 'ka', SAVE_FAILED))
    } finally {
      setSaving(false)
    }
  }

  async function saveMenuNow() {
    try {
      await menu.save()
      toast.success('მენიუ განახლდა.')
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err, 'ka', SAVE_FAILED))
    }
  }

  async function onBranchesChange(branches: Branch[], log: { action: Parameters<typeof saveBranches>[2]['action']; description: string }) {
    try {
      await saveBranches(restaurant, branches, log)
      toast.success(log.action === 'BRANCH_DELETED' ? 'ფილიალი წაიშალა.' : 'ფილიალები განახლდა.')
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err, 'ka', SAVE_FAILED))
      throw err
    }
  }

  const barVisible = (['info', 'location', 'hours', 'photos'].includes(tab) && dirty) || (tab === 'menu' && menu.dirty)

  return (
    <div className={barVisible ? 'pb-24' : ''}>
      <Link to={isAdmin ? '/admin/restaurants' : '/admin'} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={15} /> {isAdmin ? 'რესტორნები' : 'დაფა'}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {restaurant.coverImage ? (
          <img src={restaurant.coverImage} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-cream-2 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight truncate">{restaurant.nameI18n.ka || restaurant.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge tone={restaurant.status === 'published' ? 'green' : 'neutral'}>{restaurant.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}</StatusBadge>
            <span className="text-[12.5px] text-ink-faint">/{restaurant.slug}</span>
          </div>
        </div>
        <a
          href={`/restaurant/${restaurant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-white text-[13.5px] font-bold text-ink hover:bg-cream-2 self-start sm:self-center"
        >
          <ExternalLink size={15} /> საიტზე ნახვა
        </a>
      </div>

      <div className="sticky top-16 md:top-[72px] z-10 -mx-4 md:mx-0 px-4 md:px-0 py-2 bg-[#f6f3ee]/90 backdrop-blur-md mb-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setParams({ tab: t.id }, { replace: true })}
              className={`h-10 px-4 rounded-full text-[13.5px] font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                tab === t.id ? 'bg-ink text-cream' : 'bg-white border border-border text-ink-soft hover:bg-cream-2'
              }`}
            >
              <t.icon size={15} />
              {t.label}
              {t.id === 'menu' && menu.dirty && <span className="w-2 h-2 rounded-full bg-terracotta" />}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Card className="p-5 md:p-7">
            {tab === 'info' && (
              <div className="flex flex-col gap-10">
                <div>
                  <SectionTitle title="ძირითადი ინფორმაცია" />
                  <BasicInfoFields draft={current} set={set} errors={errors} showStatus={isAdmin} />
                </div>
                <div>
                  <SectionTitle title="საკონტაქტო ინფორმაცია" />
                  <ContactFields draft={current} set={set} errors={errors} />
                </div>
              </div>
            )}
            {tab === 'location' && (
              <>
                <SectionTitle title="ლოკაცია" description="რესტორნის მთავარი წერტილი რუკაზე." />
                <LocationFields draft={current} set={set} />
              </>
            )}
            {tab === 'hours' && (
              <>
                <SectionTitle title="სამუშაო საათები" />
                <HoursFields draft={current} set={set} />
              </>
            )}
            {tab === 'photos' && (
              <>
                <SectionTitle title="ფოტოები" />
                <PhotosFields restaurantId={restaurant.id} draft={current} set={set} />
              </>
            )}
            {tab === 'menu' && (
              <>
                <SectionTitle title="მენიუ" description="ცვლილებები საიტზე შენახვისთანავე გამოჩნდება." />
                <MenuBuilder restaurantId={restaurant.id} value={menu.menu} onChange={menu.setMenu} />
              </>
            )}
            {tab === 'branches' && (
              <>
                <SectionTitle title="ფილიალები" description="ცვლილებები ინახება მაშინვე." />
                <BranchManager restaurant={restaurant} value={restaurant.branches} onChange={onBranchesChange} />
              </>
            )}
            {tab === 'managers' && isAdmin && <ManagersTab restaurant={restaurant} />}
          </Card>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {barVisible && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed bottom-0 inset-x-0 lg:left-[264px] z-30 border-t border-border bg-white/95 backdrop-blur-md"
          >
            <div className="max-w-[1280px] px-4 md:px-8 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <p className="text-[13.5px] font-semibold text-ink-soft truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta mr-2 align-middle" />
                შეუნახავი ცვლილებები
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<Undo2 size={15} />}
                  onClick={() => (tab === 'menu' ? menu.discard() : (setDraft(null), setErrors({})))}
                  disabled={saving || menu.saving}
                >
                  <span className="hidden sm:inline">გაუქმება</span>
                </Button>
                <Button icon={<Save size={15} />} onClick={tab === 'menu' ? saveMenuNow : saveDraft} loading={tab === 'menu' ? menu.saving : saving}>
                  შენახვა
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ManagersTab({ restaurant }: { restaurant: Restaurant }) {
  const toast = useToast()
  const { users } = useUsers()
  const { invitations } = useInvitations()
  const { restaurants } = useManagedRestaurants()
  const [assignOpen, setAssignOpen] = useState(false)
  const [removing, setRemoving] = useState<UserProfile | null>(null)
  const managers = users.filter((u) => u.role === 'restaurant_manager' && u.managedRestaurantIds.includes(restaurant.id))
  const pending = invitations.filter((i) => i.status === 'pending' && i.role === 'restaurant_manager' && i.restaurantIds.includes(restaurant.id))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <SectionTitle title="რესტორნის მენეჯერები" description="მენეჯერს შეუძლია მხოლოდ ამ რესტორნის რედაქტირება." />
        <Button icon={<Plus size={16} />} onClick={() => setAssignOpen(true)}>
          მენეჯერის დამატება
        </Button>
      </div>
      {managers.length === 0 && pending.length === 0 ? (
        <EmptyState icon={UserCog} title="მენეჯერი არ არის მინიჭებული" />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {managers.map((m) => (
            <li key={m.uid} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name || m.email} size={38} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14.5px] text-ink truncate">{m.name}</p>
                <p className="text-[12.5px] text-ink-faint truncate">{m.email}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<UserMinus size={15} />} onClick={() => setRemoving(m)}>
                <span className="hidden sm:inline">მოხსნა</span>
              </Button>
            </li>
          ))}
          {pending.map((i) => (
            <li key={i.email} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={i.name || i.email} size={38} className="!bg-[#e9d9b0] !text-[#7a5500]" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14.5px] text-ink truncate">{i.name || i.email}</p>
                <p className="text-[12.5px] text-ink-faint truncate">{i.email}</p>
              </div>
              <StatusBadge tone="amber">Pending invitation</StatusBadge>
            </li>
          ))}
        </ul>
      )}
      <AssignManagerModal open={assignOpen} onClose={() => setAssignOpen(false)} restaurants={restaurants} initialRestaurantIds={[restaurant.id]} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="მენეჯერის მოხსნა"
        message={
          <>
            <b className="text-ink">{removing?.name || removing?.email}</b> ვეღარ შეძლებს „{restaurant.nameI18n.ka || restaurant.name}“-ის მართვას.
          </>
        }
        confirmLabel="მოხსნა"
        onConfirm={async () => {
          if (!removing) return
          try {
            await setManagerRestaurants(removing, removing.managedRestaurantIds.filter((x) => x !== restaurant.id))
            toast.success('მენეჯერი მოიხსნა.')
          } catch (e) {
            toast.error(getFirebaseErrorMessage(e, 'ka', SAVE_FAILED))
            throw e
          }
        }}
      />
    </>
  )
}
