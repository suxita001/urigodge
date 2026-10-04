import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useToast } from '../hooks/useToast'

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers and non-secure contexts: fall back to a hidden field.
    const field = document.createElement('textarea')
    field.value = text
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand('copy')
    field.remove()
    return ok
  }
}

/** Copies a link to this site (`path` is appended to the current origin) and confirms with a toast. */
export default function CopyLinkButton({ path, variant = 'pill', label }: { path: string; variant?: 'pill' | 'icon'; label?: string }) {
  const { t } = useLanguage()
  const toast = useToast()
  const [done, setDone] = useState(false)

  async function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (await copy(`${window.location.origin}${path}`)) {
      setDone(true)
      toast.success(t('share_copied'))
      setTimeout(() => setDone(false), 2000)
    } else {
      toast.error(t('share_failed'))
    }
  }

  const Icon = done ? Check : Link2
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label ?? t('share_copy')}
        title={label ?? t('share_copy')}
        className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-ink-soft hover:text-green hover:border-green transition-colors shrink-0"
      >
        <Icon size={15} />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-white text-ink font-bold text-[14px] hover:bg-cream-2 transition-colors"
    >
      <Icon size={16} className={done ? 'text-green' : ''} />
      {label ?? t('share_copy')}
    </button>
  )
}
