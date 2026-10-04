import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useToast } from '../hooks/useToast'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Chrome fires the event once, usually before any component has mounted, so it is caught here.
let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((fn) => fn())
  })
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
// iPadOS reports itself as a Mac, hence the touch check.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** "Install the app": native prompt on Android/desktop Chrome, a how-to hint on iPhone (Safari has no prompt). */
export default function InstallButton() {
  const { t } = useLanguage()
  const toast = useToast()
  const [, refresh] = useState(0)

  useEffect(() => {
    const fn = () => refresh((n) => n + 1)
    listeners.add(fn)
    return () => void listeners.delete(fn)
  }, [])

  const ios = isIos()
  if (isStandalone() || (!deferred && !ios)) return null

  async function install() {
    if (!deferred) {
      toast.success(t('install_ios_hint'))
      return
    }
    await deferred.prompt()
    await deferred.userChoice
    deferred = null
    refresh((n) => n + 1)
  }

  return (
    <button
      type="button"
      onClick={install}
      className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-white text-[13.5px] font-bold text-ink hover:border-green hover:text-green transition-colors"
    >
      <Smartphone size={16} />
      {t('install_app')}
    </button>
  )
}
