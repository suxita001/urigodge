import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { TextInput } from './Inputs'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: ReactNode
  confirmLabel: string
  /** If set, the user must type this exact text to enable the confirm button. */
  confirmText?: string
  danger?: boolean
}

export default function ConfirmDialog({ open, onClose, ...props }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={props.title} size="sm">
      {/* Remounted on every open so the typed text resets. */}
      {open && <ConfirmBody onClose={onClose} {...props} />}
    </Modal>
  )
}

function ConfirmBody({ onClose, onConfirm, message, confirmLabel, confirmText, danger = true }: Omit<ConfirmDialogProps, 'open' | 'title'>) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const matches = !confirmText || typed.trim() === confirmText.trim()

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // The caller reports the error (toast); keep the dialog open.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex gap-3.5">
        {danger && (
          <span className="w-11 h-11 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </span>
        )}
        <div className="text-[14.5px] text-ink-soft leading-relaxed pt-1">{message}</div>
      </div>
      {confirmText && (
        <TextInput
          wrapperClassName="mt-5"
          label={
            <>
              დასადასტურებლად ჩაწერე: <span className="font-extrabold text-ink select-all">{confirmText}</span>
            </>
          }
          value={typed}
          onValueChange={setTyped}
          autoComplete="off"
          autoFocus
        />
      )}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          გაუქმება
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} disabled={!matches} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
