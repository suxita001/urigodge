import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Restaurant } from '../data/types'
import type { BrandSlide } from '../services/homeService'
import { useLanguage } from '../i18n/LanguageContext'
import { neighborhoodMap } from '../data/categories'
import { venueName } from '../lib/format'
import { sized } from '../lib/image'
import { restaurantPath } from '../lib/site'

const INTERVAL_MS = 5000
const PHONE = '(max-width: 639px)'

/** urigod's own artwork comes first, then the restaurants an admin ticked for the banner. */
export type HeroSlide = { kind: 'brand'; slide: BrandSlide } | { kind: 'venue'; restaurant: Restaurant }

const slideKey = (s: HeroSlide) => (s.kind === 'brand' ? `brand-${s.slide.id}` : s.restaurant.slug)
export const slideTone = (s: HeroSlide): 'light' | 'dark' => (s.kind === 'brand' ? s.slide.tone : 'dark')

/** Wide artwork for laptops and desktops (16:9). */
function wide(s: HeroSlide) {
  if (s.kind === 'brand') return sized(s.slide.image, 1920, 1080)
  return sized(s.restaurant.home.bannerImage || s.restaurant.coverImage, 1920, 1080)
}
/** Tall crop for phones (9:16) — the dedicated phone artwork when one was uploaded. */
function tall(s: HeroSlide) {
  if (s.kind === 'brand') return sized(s.slide.imageMobile || s.slide.image, 900, 1600)
  const r = s.restaurant
  return sized(r.home.bannerImageMobile || r.home.bannerImage || r.coverImage, 900, 1600)
}

/**
 * Photo backdrop for the home hero. Slides cross-fade every five seconds with a slow zoom; arrows,
 * dots and swipes switch by hand. Dark photos get a shade so white text stays readable; light
 * artwork is left as designed and the page switches its text to dark (reported via `onTone`).
 */
export default function HeroSlideshow({ slides, onTone }: { slides: HeroSlide[]; onTone: (tone: 'light' | 'dark') => void }) {
  const { t, lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Only slides that have been on screen get an <img>, so the first paint loads a single photo.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const count = slides.length
  const current = index % count
  const slide = slides[current]
  const light = slideTone(slide) === 'light'

  useEffect(() => onTone(slideTone(slide)), [slide, onTone])

  const go = useCallback(
    (to: number) => {
      const next = ((to % count) + count) % count
      setSeen((s) => (s.has(next) ? s : new Set(s).add(next)))
      setIndex(next)
    },
    [count]
  )

  // Restarting the timer on every change means a manual switch also gets its full five seconds.
  useEffect(() => {
    if (count < 2 || paused) return
    const timer = setInterval(() => {
      // A background tab keeps its slide, so coming back never lands mid-flurry.
      if (!document.hidden) go(current + 1)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [current, count, paused, go])

  // Fetch the upcoming photo ahead of time so the cross-fade never reveals a blank frame.
  useEffect(() => {
    if (count < 2) return
    const upcoming = slides[(current + 1) % count]
    const next = new Image()
    next.src = window.matchMedia(PHONE).matches ? tall(upcoming) : wide(upcoming)
  }, [current, count, slides])

  // Swiping anywhere on the hero switches photos on touch screens.
  const backdrop = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const hero = backdrop.current?.parentElement
    if (!hero || count < 2) return
    let startX = 0
    let startY = 0
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1))
    }
    hero.addEventListener('touchstart', onStart, { passive: true })
    hero.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      hero.removeEventListener('touchstart', onStart)
      hero.removeEventListener('touchend', onEnd)
    }
  }, [current, count, go])

  const label = (s: HeroSlide) => (s.kind === 'venue' ? venueName(s.restaurant, lang) : s.slide.label?.[lang] || s.slide.label?.ka || 'urigod.ge')

  const dots = (
    <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-night/40 backdrop-blur-md border border-snow/10" role="tablist">
      {slides.map((s, i) => (
        <button key={slideKey(s)} type="button" role="tab" aria-selected={i === current} aria-label={label(s)} onClick={() => go(i)} className="group h-6 flex items-center">
          <span
            className={`block h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === current ? 'w-8 bg-snow/35' : 'w-1.5 bg-snow/50 group-hover:bg-snow/80'}`}
          >
            {i === current && <span key={`${current}-${paused}`} className={`hero-progress block h-full rounded-full bg-snow ${paused ? 'is-paused' : ''}`} />}
          </span>
        </button>
      ))}
    </div>
  )

  const arrow = 'w-10 h-10 rounded-full bg-night/45 backdrop-blur-md border border-snow/15 text-snow hover:bg-night/70 flex items-center justify-center transition-colors'
  const pill = 'hero-caption group self-start max-w-[calc(100%-72px)] sm:max-w-md min-w-0 flex items-center gap-3 py-1.5 rounded-full bg-night/50 backdrop-blur-md border border-snow/15 text-snow hover:bg-night/70 transition-colors'

  let caption = null
  if (slide.kind === 'venue') {
    const r = slide.restaurant
    const area = neighborhoodMap[r.neighborhood]?.label[lang]
    caption = (
      <Link key={slideKey(slide)} to={restaurantPath(r.slug)} className={`${pill} pl-1.5 pr-4`}>
        <img src={sized(r.logo || r.coverImage || r.home.bannerImage, 96, 96)} alt="" className="keep-bright w-10 h-10 rounded-full object-cover shrink-0 border border-snow/25" />
        <span className="min-w-0">
          <span className="block text-[14.5px] font-bold leading-tight truncate">{venueName(r, lang)}</span>
          {area && (
            <span className="flex items-center gap-1 text-[12px] text-snow/70 leading-tight mt-0.5">
              <MapPin size={11} />
              {area}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 pl-1 sm:pl-2 text-[12.5px] font-bold text-snow/85 group-hover:text-snow whitespace-nowrap">
          <span className="hidden sm:inline">{t('card_view')}</span>
          <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>
    )
  } else if (slide.slide.label && (slide.slide.label.ka || slide.slide.label.en)) {
    const text = label(slide)
    const href = slide.slide.link?.trim()
    const inner = (
      <>
        <span className="block min-w-0 truncate text-[14.5px] font-bold leading-tight">{text}</span>
        {href && <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
      </>
    )
    caption = !href ? (
      <span key={slideKey(slide)} className={`${pill} px-4 py-2.5`}>
        {inner}
      </span>
    ) : /^https?:\/\//.test(href) ? (
      <a key={slideKey(slide)} href={href} target="_blank" rel="noreferrer" className={`${pill} px-4 py-2.5`}>
        {inner}
      </a>
    ) : (
      <Link key={slideKey(slide)} to={href.startsWith('/') ? href : `/${href}`} className={`${pill} px-4 py-2.5`}>
        {inner}
      </Link>
    )
  }

  return (
    <>
      <div ref={backdrop} className="absolute inset-0 -z-10 bg-night" aria-hidden="true">
        {slides.map((s, i) =>
          seen.has(i) ? (
            <picture key={slideKey(s)}>
              <source media={PHONE} srcSet={tall(s)} />
              <img src={wide(s)} alt="" fetchPriority={i === 0 ? 'high' : undefined} className={`hero-slide keep-bright absolute inset-0 w-full h-full object-cover ${i === current ? 'is-active' : ''}`} />
            </picture>
          ) : null
        )}
        {/* Photos: an even tint plus extra shade under the navbar, behind the headline and along the caption row. */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${light ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-night/55" />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-night/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_48%,rgba(28,26,22,0.5),transparent_78%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night/85 to-transparent" />
        </div>
        {/* Light artwork: only a soft glow behind the headline so dark text always reads. */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_45%,rgba(250,247,241,0.7),transparent_75%)] transition-opacity duration-700 ${light ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-5 md:px-8 pb-5 md:pb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2.5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* Phones: dots sit above the caption (the corner is taken by the assistant button) and swiping replaces the arrows. */}
        {count > 1 && <div className="sm:hidden self-start">{dots}</div>}

        {caption ?? <span />}

        {count > 1 && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="mr-1">{dots}</div>
            <button type="button" onClick={() => go(current - 1)} aria-label={t('hero_prev')} className={arrow}>
              <ChevronLeft size={19} />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label={t('hero_next')} className={arrow}>
              <ChevronRight size={19} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
