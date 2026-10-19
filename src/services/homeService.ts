import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { LocalizedText } from '../data/types'
import { logActivity } from './activityLogService'

/**
 * urigod's own banner artwork (campaigns, seasonal designs…). These slides open the home-page
 * banner, before the restaurants an admin ticked for it. Stored in settings/home.
 */
export interface BrandSlide {
  id: string
  /** 16:9 artwork for laptops and desktops. */
  image: string
  /** 9:16 artwork for phones; the desktop image is cropped when missing. */
  imageMobile?: string
  /** `light` artwork gets dark headline text and no darkening; `dark` artwork the reverse. */
  tone: 'light' | 'dark'
  /** Optional caption in the bottom-left corner, e.g. "Add your restaurant". */
  label?: LocalizedText
  /** Where the caption leads: a path on this site (/about) or a full https:// address. */
  link?: string
}

const ref = doc(db, 'settings', 'home')
const CACHE_KEY = 'urigod-home-slides-v1'

export function hasCachedSlides(): boolean {
  try {
    return localStorage.getItem(CACHE_KEY) !== null
  } catch {
    return false
  }
}

export function readCachedSlides(): BrandSlide[] {
  try {
    const list = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') as BrandSlide[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** Live list of brand slides (empty when none are set). The last known list is kept for the next visit. */
export function subscribeBrandSlides(onChange: (slides: BrandSlide[]) => void): () => void {
  return onSnapshot(
    ref,
    (snap) => {
      const slides = ((snap.data()?.slides as BrandSlide[] | undefined) ?? []).filter((s) => s && s.image)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(slides))
      } catch {
        /* storage unavailable — the banner just appears a moment later next time */
      }
      onChange(slides)
    },
    () => onChange(readCachedSlides())
  )
}

export async function saveBrandSlides(slides: BrandSlide[]): Promise<void> {
  await setDoc(ref, { slides, updatedAt: serverTimestamp() })
  await logActivity({ action: 'SETTINGS_UPDATED', targetType: 'settings', targetId: 'home', description: `მთავარი გვერდის ბანერი განახლდა (${slides.length} სლაიდი)` })
}

/** Guesses whether artwork is light or dark from its average brightness, so the text colour can follow. */
export async function guessTone(url: string): Promise<BrandSlide['tone']> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 27
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'dark'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    // The middle of the picture is where the headline sits, so that area decides.
    const { data } = ctx.getImageData(12, 6, 24, 15)
    let sum = 0
    for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    return sum / (data.length / 4) > 150 ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}
