import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Restaurant } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { neighborhoodMap } from '../data/categories'
import { venueName } from '../lib/format'
import { sized } from '../lib/image'
import { restaurantPath } from '../lib/site'

const INTERVAL_MS = 5000

const photo = (r: Restaurant) => sized(r.coverImage, 1920, 1080)

/**
 * Photo backdrop for the home hero: a handful of venues cross-fade every five seconds with a slow
 * zoom. The caption in the bottom-left corner links to the venue on screen; arrows and dots switch
 * by hand. Everything sits behind/below the headline so the hero text stays the focus.
 */
export default function HeroSlideshow({ slides }: { slides: Restaurant[] }) {
  const { t, lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Only slides that have been on screen (plus the next one) get an <img>, so the first paint loads a single photo.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const count = slides.length
  const current = index % count

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
    const next = new Image()
    next.src = photo(slides[(current + 1) % count])
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

  const slide = slides[current]
  const area = neighborhoodMap[slide.neighborhood]?.label[lang]

  return (
    <>
      <div ref={backdrop} className="absolute inset-0 -z-10 bg-night" aria-hidden="true">
        {slides.map((r, i) =>
          seen.has(i) ? (
            <img
              key={r.slug}
              src={photo(r)}
              alt=""
              fetchPriority={i === 0 ? 'high' : undefined}
              className={`hero-slide keep-bright absolute inset-0 w-full h-full object-cover ${i === current ? 'is-active' : ''}`}
            />
          ) : null
        )}
        {/* Darkens the photo evenly, a little more behind the headline and along the caption row. */}
        <div className="absolute inset-0 bg-night/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,rgba(28,26,22,0.45),transparent_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night/75 to-transparent" />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 px-4 sm:px-6 md:px-8 pb-4 md:pb-6 flex items-end justify-between gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <Link
          key={slide.slug}
          to={restaurantPath(slide.slug)}
          className="hero-caption group min-w-0 flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-night/45 backdrop-blur-md border border-snow/15 text-snow hover:bg-night/65 transition-colors"
        >
          <img src={sized(slide.coverImage, 96, 96)} alt="" className="keep-bright w-10 h-10 rounded-full object-cover shrink-0 border border-snow/25" />
          <span className="min-w-0">
            <span className="block text-[14.5px] font-bold leading-tight truncate">{venueName(slide, lang)}</span>
            {area && (
              <span className="flex items-center gap-1 text-[12px] text-snow/70 leading-tight mt-0.5">
                <MapPin size={11} />
                {area}
              </span>
            )}
          </span>
          <span className="hidden sm:flex items-center gap-1 pl-2 text-[12.5px] font-bold text-snow/85 group-hover:text-snow whitespace-nowrap">
            {t('card_view')}
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>

        {count > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 mr-1" role="tablist">
              {slides.map((r, i) => (
                <button
                  key={r.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={venueName(r, lang)}
                  onClick={() => go(i)}
                  className="group h-6 flex items-center"
                >
                  <span className={`block h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === current ? 'w-8 bg-snow/35' : 'w-1.5 bg-snow/45 group-hover:bg-snow/80'}`}>
                    {i === current && <span key={`${current}-${paused}`} className={`hero-progress block h-full bg-snow rounded-full ${paused ? 'is-paused' : ''}`} />}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go(current - 1)} aria-label={t('hero_prev')} className="w-10 h-10 rounded-full bg-night/45 backdrop-blur-md border border-snow/15 text-snow hover:bg-night/70 flex items-center justify-center transition-colors">
              <ChevronLeft size={19} />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label={t('hero_next')} className="w-10 h-10 rounded-full bg-night/45 backdrop-blur-md border border-snow/15 text-snow hover:bg-night/70 flex items-center justify-center transition-colors">
              <ChevronRight size={19} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
