import { useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2, UtensilsCrossed, ImageOff, FolderPlus } from 'lucide-react'
import type { MenuCategoryData, MenuItem } from '../../data/types'
import { emptyCategory, emptyItem, menuOps, menuStats } from '../../services/menuService'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { TextArea, TextInput, Toggle } from '../ui/Inputs'
import { ImageUploader } from './ImageUploader'
import { EmptyState } from './AdminUI'
import MenuImport from './MenuImport'
import OptionsEditor, { fromDraftGroups, toDraftGroups } from './OptionsEditor'
import { basePrice, optionGroups, priceVaries } from '../../lib/menuOptions'

interface MenuBuilderProps {
  restaurantId: string
  value: MenuCategoryData[]
  onChange: (menu: MenuCategoryData[]) => void
}

type Editing =
  | { kind: 'category'; category: MenuCategoryData; isNew: boolean }
  | { kind: 'item'; categoryId: string; item: MenuItem; isNew: boolean }
  | null

type Deleting = { kind: 'category'; category: MenuCategoryData } | { kind: 'item'; categoryId: string; item: MenuItem } | null

const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 hover:text-ink transition-colors disabled:opacity-30 disabled:hover:bg-transparent'

export default function MenuBuilder({ restaurantId, value, onChange }: MenuBuilderProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Deleting>(null)
  const stats = menuStats(value)

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[13.5px] text-ink-soft">
          <span className="font-bold text-ink">{stats.categories}</span> კატეგორია · <span className="font-bold text-ink">{stats.items}</span> კერძი
        </p>
        <div className="flex flex-wrap gap-2">
          <MenuImport current={value} onImport={onChange} />
          <Button icon={<FolderPlus size={16} />} onClick={() => setEditing({ kind: 'category', category: emptyCategory(), isNew: true })}>
            კატეგორიის დამატება
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white">
          <EmptyState icon={UtensilsCrossed} title="მენიუ ჯერ ცარიელია" text="ატვირთე მენიუს ფოტო და AI თავად დაალაგებს, ან დაიწყე კატეგორიის დამატებით — მაგ. „საუზმე“." />
        </div>
      ) : (
        <Reorder.Group axis="y" values={value} onReorder={onChange} className="flex flex-col gap-3" as="div">
          {value.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              total={value.length}
              open={!collapsed.has(category.id)}
              onToggle={() => toggle(category.id)}
              onMove={(delta) => onChange(menuOps.moveCategory(value, category.id, delta))}
              onEdit={() => setEditing({ kind: 'category', category, isNew: false })}
              onDelete={() => setDeleting({ kind: 'category', category })}
              onReorderItems={(items) => onChange(menuOps.reorderItems(value, category.id, items))}
              onMoveItem={(itemId, delta) => onChange(menuOps.moveItem(value, category.id, itemId, delta))}
              onAddItem={() => setEditing({ kind: 'item', categoryId: category.id, item: emptyItem(), isNew: true })}
              onEditItem={(item) => setEditing({ kind: 'item', categoryId: category.id, item, isNew: false })}
              onDeleteItem={(item) => setDeleting({ kind: 'item', categoryId: category.id, item })}
            />
          ))}
        </Reorder.Group>
      )}

      <CategoryModal
        editing={editing?.kind === 'category' ? editing : null}
        onClose={() => setEditing(null)}
        onSave={(category, isNew) => {
          onChange(isNew ? menuOps.addCategory(value, category) : menuOps.updateCategory(value, category.id, { name: category.name }))
          setEditing(null)
        }}
      />
      <ItemModal
        restaurantId={restaurantId}
        editing={editing?.kind === 'item' ? editing : null}
        onClose={() => setEditing(null)}
        onSave={(categoryId, item) => {
          onChange(menuOps.upsertItem(value, categoryId, item))
          setEditing(null)
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleting?.kind === 'category' ? 'კატეგორიის წაშლა' : 'კერძის წაშლა'}
        message={
          deleting?.kind === 'category' ? (
            <>
              წაიშლება კატეგორია „<b className="text-ink">{deleting.category.name.ka || deleting.category.name.en}</b>“ და მისი{' '}
              {deleting.category.items.length} კერძი.
            </>
          ) : deleting?.kind === 'item' ? (
            <>
              წაიშლება „<b className="text-ink">{deleting.item.name.ka || deleting.item.name.en}</b>“.
            </>
          ) : null
        }
        confirmLabel="წაშლა"
        onConfirm={() => {
          if (deleting?.kind === 'category') onChange(menuOps.deleteCategory(value, deleting.category.id))
          if (deleting?.kind === 'item') onChange(menuOps.deleteItem(value, deleting.categoryId, deleting.item.id))
        }}
      />
    </div>
  )
}

interface CategoryCardProps {
  category: MenuCategoryData
  index: number
  total: number
  open: boolean
  onToggle: () => void
  onMove: (delta: number) => void
  onEdit: () => void
  onDelete: () => void
  onReorderItems: (items: MenuItem[]) => void
  onMoveItem: (itemId: string, delta: number) => void
  onAddItem: () => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
}

function CategoryCard(props: CategoryCardProps) {
  const { category, index, total, open } = props
  const controls = useDragControls()
  return (
    <Reorder.Item value={category} dragListener={false} dragControls={controls} as="div" className="rounded-2xl border border-border bg-white shadow-card">
      <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-2">
        <button type="button" onPointerDown={(e) => controls.start(e)} className={`${iconBtn} cursor-grab active:cursor-grabbing touch-none`} aria-label="გადაადგილება">
          <GripVertical size={17} />
        </button>
        <button type="button" onClick={props.onToggle} className="flex-1 min-w-0 flex items-center gap-2 text-left py-1.5" aria-expanded={open}>
          <motion.span animate={{ rotate: open ? 0 : -90 }} className="text-ink-faint shrink-0">
            <ChevronDown size={18} />
          </motion.span>
          <span className="min-w-0">
            <span className="block font-bold text-[15.5px] text-ink truncate">{category.name.ka || category.name.en || 'უსახელო კატეგორია'}</span>
            <span className="block text-[12px] text-ink-faint truncate">
              {category.name.en && category.name.ka ? `${category.name.en} · ` : ''}
              {category.items.length} კერძი
            </span>
          </span>
        </button>
        <div className="flex items-center shrink-0">
          <button type="button" className={`${iconBtn} hidden sm:flex`} disabled={index === 0} onClick={() => props.onMove(-1)} aria-label="ზემოთ">
            <ChevronUp size={17} />
          </button>
          <button type="button" className={`${iconBtn} hidden sm:flex`} disabled={index === total - 1} onClick={() => props.onMove(1)} aria-label="ქვემოთ">
            <ChevronDown size={17} />
          </button>
          <button type="button" className={iconBtn} onClick={props.onEdit} aria-label="რედაქტირება">
            <Pencil size={16} />
          </button>
          <button type="button" className={`${iconBtn} hover:!text-terracotta`} onClick={props.onDelete} aria-label="წაშლა">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-border px-2 sm:px-3 pb-3">
              {category.items.length > 0 && (
                <Reorder.Group axis="y" values={category.items} onReorder={props.onReorderItems} as="ul" className="divide-y divide-border">
                  {category.items.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      first={i === 0}
                      last={i === category.items.length - 1}
                      onMove={(d) => props.onMoveItem(item.id, d)}
                      onEdit={() => props.onEditItem(item)}
                      onDelete={() => props.onDeleteItem(item)}
                    />
                  ))}
                </Reorder.Group>
              )}
              <button
                type="button"
                onClick={props.onAddItem}
                className="mt-2 w-full h-11 rounded-xl border border-dashed border-border text-[13.5px] font-bold text-green hover:bg-green-light/50 hover:border-green flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> კერძის დამატება
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

function ItemRow({ item, first, last, onMove, onEdit, onDelete }: { item: MenuItem; first: boolean; last: boolean; onMove: (d: number) => void; onEdit: () => void; onDelete: () => void }) {
  const controls = useDragControls()
  const unavailable = item.available === false
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="flex items-center gap-2 py-2.5 bg-white">
      <button type="button" onPointerDown={(e) => controls.start(e)} className={`${iconBtn} cursor-grab active:cursor-grabbing touch-none shrink-0`} aria-label="გადაადგილება">
        <GripVertical size={16} />
      </button>
      {item.image ? (
        <img src={item.image} alt="" className={`w-12 h-12 rounded-xl object-cover shrink-0 ${unavailable ? 'opacity-50 grayscale' : ''}`} />
      ) : (
        <span className="w-12 h-12 rounded-xl bg-cream-2 text-ink-faint flex items-center justify-center shrink-0">
          <ImageOff size={16} />
        </span>
      )}
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className={`block font-semibold text-[14.5px] truncate ${unavailable ? 'text-ink-faint line-through' : 'text-ink'}`}>
          {item.name.ka || item.name.en || 'უსახელო კერძი'}
        </span>
        <span className="flex items-center gap-2 text-[12.5px]">
          <span className="font-bold text-green">
            {basePrice(item).toFixed(2)} ₾{priceVaries(item) ? '-დან' : ''}
          </span>
          {optionGroups(item).length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-green-light text-green font-semibold">{optionGroups(item).length} ოფცია</span>}
          {unavailable && <span className="px-1.5 py-0.5 rounded-md bg-cream-2 text-ink-faint font-semibold">მიუწვდომელია</span>}
        </span>
      </button>
      <div className="flex items-center shrink-0">
        <button type="button" className={`${iconBtn} hidden sm:flex`} disabled={first} onClick={() => onMove(-1)} aria-label="ზემოთ">
          <ChevronUp size={16} />
        </button>
        <button type="button" className={`${iconBtn} hidden sm:flex`} disabled={last} onClick={() => onMove(1)} aria-label="ქვემოთ">
          <ChevronDown size={16} />
        </button>
        <button type="button" className={iconBtn} onClick={onEdit} aria-label="რედაქტირება">
          <Pencil size={15} />
        </button>
        <button type="button" className={`${iconBtn} hover:!text-terracotta`} onClick={onDelete} aria-label="წაშლა">
          <Trash2 size={15} />
        </button>
      </div>
    </Reorder.Item>
  )
}

function CategoryModal({ editing, onClose, onSave }: { editing: { category: MenuCategoryData; isNew: boolean } | null; onClose: () => void; onSave: (c: MenuCategoryData, isNew: boolean) => void }) {
  return (
    <Modal open={!!editing} onClose={onClose} title={editing?.isNew ? 'ახალი კატეგორია' : 'კატეგორიის რედაქტირება'} size="sm">
      {editing && <CategoryForm key={editing.category.id} initial={editing.category} onCancel={onClose} onSave={(c) => onSave(c, editing.isNew)} />}
    </Modal>
  )
}

function CategoryForm({ initial, onCancel, onSave }: { initial: MenuCategoryData; onCancel: () => void; onSave: (c: MenuCategoryData) => void }) {
  const [ka, setKa] = useState(initial.name.ka)
  const [en, setEn] = useState(initial.name.en)
  const [submitted, setSubmitted] = useState(false)
  const error = submitted && !ka.trim() ? 'შეიყვანე ქართული სახელი.' : undefined
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (ka.trim()) onSave({ ...initial, name: { ka: ka.trim(), en: en.trim() } })
      }}
      className="flex flex-col gap-4"
    >
      <TextInput label="სახელი (ქართ.)" placeholder="მაგ. ძირითადი კერძები" value={ka} onValueChange={setKa} error={error} autoFocus />
      <TextInput label="სახელი (English)" placeholder="e.g. Main dishes" value={en} onValueChange={setEn} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          გაუქმება
        </Button>
        <Button type="submit">შენახვა</Button>
      </div>
    </form>
  )
}

function ItemModal({
  restaurantId,
  editing,
  onClose,
  onSave,
}: {
  restaurantId: string
  editing: { categoryId: string; item: MenuItem; isNew: boolean } | null
  onClose: () => void
  onSave: (categoryId: string, item: MenuItem) => void
}) {
  return (
    <Modal open={!!editing} onClose={onClose} title={editing?.isNew ? 'ახალი კერძი' : 'კერძის რედაქტირება'}>
      {editing && <ItemForm key={editing.item.id} restaurantId={restaurantId} initial={editing.item} onCancel={onClose} onSave={(item) => onSave(editing.categoryId, item)} />}
    </Modal>
  )
}

function ItemForm({ restaurantId, initial, onCancel, onSave }: { restaurantId: string; initial: MenuItem; onCancel: () => void; onSave: (item: MenuItem) => void }) {
  const [item, setItem] = useState<MenuItem>(initial)
  const [price, setPrice] = useState(initial.price ? String(initial.price) : '')
  const [groups, setGroups] = useState(() => toDraftGroups(initial.options))
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<MenuItem>) => setItem((i) => ({ ...i, ...patch }))

  // Sizes carry their own prices, so the single price field is not asked for.
  const hasVariants = groups.some((g) => g.kind === 'variant')
  const parsed = fromDraftGroups(groups)
  const priceNum = Number(price.replace(',', '.'))
  const errors = {
    name: !item.name.ka.trim() ? 'შეიყვანე ქართული სახელი.' : undefined,
    price: !hasVariants && (price.trim() === '' || !Number.isFinite(priceNum) || priceNum < 0) ? 'შეიყვანე სწორი ფასი.' : undefined,
    options: 'error' in parsed ? parsed.error : hasVariants && !parsed.groups.some((g) => g.kind === 'variant') ? 'დაამატე მინიმუმ ერთი ზომა ფასით ან წაშალე ზომების ჯგუფი.' : undefined,
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (errors.name || errors.price || errors.options || 'error' in parsed) return
        const variants = parsed.groups.find((g) => g.kind === 'variant')
        onSave({
          ...item,
          name: { ka: item.name.ka.trim(), en: item.name.en.trim() },
          description: { ka: item.description.ka.trim(), en: item.description.en.trim() },
          price: variants ? Math.min(...variants.options.map((o) => o.price)) : Math.round(priceNum * 100) / 100,
          options: parsed.groups.length ? parsed.groups : undefined,
          image: item.image || undefined,
        })
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="სახელი (ქართ.)" value={item.name.ka} onValueChange={(ka) => set({ name: { ...item.name, ka } })} error={submitted ? errors.name : undefined} autoFocus />
        <TextInput label="სახელი (English)" value={item.name.en} onValueChange={(en) => set({ name: { ...item.name, en } })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextArea label="აღწერა (ქართ.)" rows={3} value={item.description.ka} onValueChange={(ka) => set({ description: { ...item.description, ka } })} />
        <TextArea label="აღწერა (English)" rows={3} value={item.description.en} onValueChange={(en) => set({ description: { ...item.description, en } })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        {hasVariants ? (
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink">ფასი (₾)</p>
            <p className="h-11 px-3.5 flex items-center rounded-xl border border-dashed border-border text-[13.5px] text-ink-faint">ფასი ზომების მიხედვით — იხ. ქვემოთ</p>
          </div>
        ) : (
          <TextInput label="ფასი (₾)" inputMode="decimal" placeholder="0.00" value={price} onValueChange={setPrice} error={submitted ? errors.price : undefined} />
        )}
        <div className="sm:pt-8">
          <Toggle checked={item.available !== false} onChange={(v) => set({ available: v })} label="ხელმისაწვდომია" description="გამორთვისას კერძი მენიუში „მიუწვდომელია“ სტატუსით გამოჩნდება." />
        </div>
      </div>
      <div className="rounded-2xl border border-border p-3.5 sm:p-4">
        <OptionsEditor value={groups} onChange={setGroups} />
        {submitted && errors.options && <p className="mt-2.5 text-[12.5px] font-medium text-terracotta">{errors.options}</p>}
      </div>
      <ImageUploader restaurantId={restaurantId} kind="menu" label="კერძის ფოტო" aspect="aspect-[4/3] sm:max-w-[280px]" value={item.image} onChange={(image) => set({ image })} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          გაუქმება
        </Button>
        <Button type="submit">შენახვა</Button>
      </div>
    </form>
  )
}
