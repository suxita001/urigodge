import { useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GitBranch, GripVertical, MapPin, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react'
import type { ActivityAction, Branch, Restaurant } from '../../data/types'
import { emptyBranch } from '../../services/menuService'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { TextInput, Toggle } from '../ui/Inputs'
import HoursEditor from './HoursEditor'
import LocationPicker from './LocationPicker'
import { EmptyState } from './AdminUI'

export interface BranchChangeLog {
  action: ActivityAction
  description: string
}

interface BranchManagerProps {
  restaurant: Restaurant
  value: Branch[]
  onChange: (branches: Branch[], log: BranchChangeLog) => void | Promise<void>
}

const branchName = (b: Branch) => b.name.ka || b.name.en || 'ფილიალი'

export default function BranchManager({ restaurant, value, onChange }: BranchManagerProps) {
  const [editing, setEditing] = useState<{ branch: Branch; isNew: boolean } | null>(null)
  const [deleting, setDeleting] = useState<Branch | null>(null)
  const [order, setOrder] = useState<Branch[] | null>(null)
  const list = order ?? value

  function withSingleMain(branches: Branch[], mainId?: string): Branch[] {
    if (!mainId) return branches
    return branches.map((b) => ({ ...b, isMain: b.id === mainId }))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[13.5px] text-ink-soft">
          <span className="font-bold text-ink">{value.length}</span> ფილიალი
        </p>
        <Button icon={<Plus size={16} />} onClick={() => setEditing({ branch: emptyBranch({ ...restaurant, branches: value }), isNew: true })}>
          ფილიალის დამატება
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white">
          <EmptyState icon={GitBranch} title="ფილიალები არ არის" text="დაამატე მთავარი ფილიალი, რომ ის რესტორნის გვერდზე და რუკაზე გამოჩნდეს." />
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={list}
          onReorder={setOrder}
          as="div"
          className="flex flex-col gap-3"
        >
          {list.map((b) => (
            <BranchRow
              key={b.id}
              branch={b}
              onDragEnd={() => {
                if (order && order.map((x) => x.id).join() !== value.map((x) => x.id).join()) {
                  onChange(order, { action: 'BRANCH_UPDATED', description: 'ფილიალების რიგითობა შეიცვალა' })
                }
                setOrder(null)
              }}
              onEdit={() => setEditing({ branch: b, isNew: false })}
              onDelete={() => setDeleting(b)}
            />
          ))}
        </Reorder.Group>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.isNew ? 'ახალი ფილიალი' : 'ფილიალის რედაქტირება'} size="lg">
        {editing && (
          <BranchForm
            key={editing.branch.id}
            initial={editing.branch}
            onCancel={() => setEditing(null)}
            onSave={async (branch) => {
              const next = editing.isNew ? [...value, branch] : value.map((b) => (b.id === branch.id ? branch : b))
              await onChange(withSingleMain(next, branch.isMain ? branch.id : undefined), {
                action: editing.isNew ? 'BRANCH_CREATED' : 'BRANCH_UPDATED',
                description: `${editing.isNew ? 'დაემატა' : 'განახლდა'} ფილიალი „${branchName(branch)}“`,
              })
              setEditing(null)
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="ფილიალის წაშლა"
        message={
          <>
            ნამდვილად გსურთ ფილიალის „<b className="text-ink">{deleting && branchName(deleting)}</b>“ წაშლა?
          </>
        }
        confirmLabel="წაშლა"
        onConfirm={async () => {
          if (!deleting) return
          await onChange(
            value.filter((b) => b.id !== deleting.id),
            { action: 'BRANCH_DELETED', description: `წაიშალა ფილიალი „${branchName(deleting)}“` }
          )
        }}
      />
    </div>
  )
}

function BranchRow({ branch, onEdit, onDelete, onDragEnd }: { branch: Branch; onEdit: () => void; onDelete: () => void; onDragEnd: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={branch} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} as="div" className="flex items-center gap-2 rounded-2xl border border-border bg-white shadow-card pl-1.5 pr-2 py-3">
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
        aria-label="გადაადგილება"
      >
        <GripVertical size={17} />
      </button>
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className="flex items-center gap-2">
          <span className="font-bold text-[15px] text-ink truncate">{branchName(branch)}</span>
          {branch.isMain && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-light text-green text-[11px] font-bold shrink-0">
              <Star size={11} fill="currentColor" /> მთავარი
            </span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12.5px] text-ink-faint">
          <span className="flex items-center gap-1 min-w-0">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{branch.address.ka || branch.address.en || '—'}</span>
          </span>
          {branch.phone && (
            <span className="flex items-center gap-1">
              <Phone size={12} /> {branch.phone}
            </span>
          )}
        </span>
      </button>
      <button type="button" onClick={onEdit} className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-2" aria-label="რედაქტირება">
        <Pencil size={16} />
      </button>
      <button type="button" onClick={onDelete} className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-terracotta-light hover:text-terracotta" aria-label="წაშლა">
        <Trash2 size={16} />
      </button>
    </Reorder.Item>
  )
}

function BranchForm({ initial, onCancel, onSave }: { initial: Branch; onCancel: () => void; onSave: (b: Branch) => Promise<void> }) {
  const [b, setB] = useState<Branch>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Branch>) => setB((x) => ({ ...x, ...patch }))
  const nameError = submitted && !b.name.ka.trim() ? 'შეიყვანე ფილიალის სახელი.' : undefined
  const addressError = submitted && !b.address.ka.trim() ? 'შეიყვანე მისამართი.' : undefined

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSubmitted(true)
        if (!b.name.ka.trim() || !b.address.ka.trim()) return
        setSaving(true)
        try {
          await onSave({ ...b, name: { ka: b.name.ka.trim(), en: b.name.en.trim() }, address: { ka: b.address.ka.trim(), en: b.address.en.trim() }, phone: b.phone.trim() })
        } finally {
          setSaving(false)
        }
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="ფილიალის სახელი (ქართ.)" placeholder="მაგ. ვაკის ფილიალი" value={b.name.ka} onValueChange={(ka) => set({ name: { ...b.name, ka } })} error={nameError} />
        <TextInput label="ფილიალის სახელი (English)" value={b.name.en} onValueChange={(en) => set({ name: { ...b.name, en } })} />
        <TextInput label="მისამართი (ქართ.)" value={b.address.ka} onValueChange={(ka) => set({ address: { ...b.address, ka } })} error={addressError} />
        <TextInput label="მისამართი (English)" value={b.address.en} onValueChange={(en) => set({ address: { ...b.address, en } })} />
        <TextInput label="ტელეფონი" type="tel" value={b.phone} onValueChange={(phone) => set({ phone })} />
        <div className="sm:pt-8">
          <Toggle checked={!!b.isMain} onChange={(isMain) => set({ isMain })} label="მთავარი ფილიალი" />
        </div>
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-ink mb-2">ლოკაცია</h3>
        <LocationPicker value={b.coordinates} onChange={(coordinates) => set({ coordinates })} />
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-ink mb-2">სამუშაო საათები</h3>
        <HoursEditor value={b.openingHours} onChange={(openingHours) => set({ openingHours })} />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          გაუქმება
        </Button>
        <Button type="submit" loading={saving}>
          შენახვა
        </Button>
      </div>
    </form>
  )
}
