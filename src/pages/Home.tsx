import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Map as MapIcon, MapPin, QrCode, ScrollText, Search, Sparkles, UtensilsCrossed } from 'lucide-react'
import RestaurantCard from '../components/RestaurantCard'
import SearchBar from '../components/SearchBar'
import HeroSlideshow, { slideTone, type HeroSlide } from '../components/HeroSlideshow'
import { hasCachedSlides, readCachedSlides, subscribeBrandSlides, type BrandSlide } from '../services/homeService'
import { setHeroOverlay } from '../lib/heroOverlay'
import CategoryPill from '../components/CategoryPill'
import RestaurantGrid from '../components/RestaurantGrid'
import { useLanguage } from '../i18n/LanguageContext'
import { categories } from '../data/categories'
import { MAX_FEATURED } from '../lib/site'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { websiteJsonLd } from '../lib/seo'

export default function Home() {
  const { t } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  useSeo(t('seo_home_title'), t('seo_home_description'), {
    path: '/',
    jsonLd: websiteJsonLd(),
  })
  const byPopularity = useMemo(() => [...restaurants].sort((a, b) => b.popularity - a.popularity), [restaurants])
  // "Featured places" are only the ones an admin ticked — nothing shows up here on its own.
  const featured = useMemo(() => byPopularity.filter((r) => r.home.featured).slice(0, MAX_FEATURED), [byPopularity])
  // A shelf with the rest, so the page never looks empty while there are only a few featured places.
  const discover = useMemo(() => {
    const shown = new Set(featured.map((r) => r.id))
    return byPopularity.filter((r) => !shown.has(r.id)).slice(0, 10)
  }, [byPopularity, featured])

  const stats = useMemo(() => {
    const areas = new Set(restaurants.map((r) => r.neighborhood))
    const dishes = restaurants.reduce((sum, r) => sum + r.menu.reduce((n, c) => n + c.items.length, 0), 0)
    return { places: restaurants.length, dishes, areas: areas.size }
  }, [restaurants])

  const empty = !loading && restaurants.length === 0

  // The banner opens with urigod's own artwork (admin → "Home banner"), then the places an admin
  // ticked for it. Without either, the plain hero is shown.
  const [brand, setBrand] = useState<BrandSlide[] | null>(() => (hasCachedSlides() ? readCachedSlides() : null))
  useEffect(() => subscribeBrandSlides(setBrand), [])
  const slides = useMemo<HeroSlide[]>(
    () => [
      ...(brand ?? []).map((slide) => ({ kind: 'brand' as const, slide })),
      ...byPopularity
        .filter((r) => r.home.banner && (r.home.bannerImage || r.coverImage))
        .slice(0, 6)
        .map((restaurant) => ({ kind: 'venue' as const, restaurant })),
    ],
    [brand, byPopularity]
  )
  const onPhoto = brand !== null && slides.length > 0
  const [tone, setTone] = useState<'light' | 'dark'>('dark')
  const heroTone = onPhoto ? (slides.some((s) => slideTone(s) === tone) ? tone : slideTone(slides[0])) : null
  // White text only over dark photos; light artwork keeps dark text, whatever the site theme.
  const dark = heroTone === 'dark'
  const lightArt = heroTone === 'light'

  // The navbar floats over the photo instead of sitting above it.
  useEffect(() => {
    setHeroOverlay(heroTone)
    return () => setHeroOverlay(null)
  }, [heroTone])

  return (
    <div>
      {/* Hero */}
      <section className={onPhoto ? 'relative isolate overflow-hidden -mt-16 md:-mt-[72px] min-h-[calc(100svh-var(--tabbar-h))] flex flex-col justify-center' : 'relative overflow-hidden'}>
        {onPhoto && <HeroSlideshow slides={slides} onTone={setTone} />}
        <div className={onPhoto ? 'hidden' : 'absolute inset-0 -z-10'}>
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-green-light blur-3xl opacity-70" />
          <div className="absolute top-40 -left-40 w-[420px] h-[420px] rounded-full bg-terracotta-light blur-3xl opacity-50" />
          {/* faint dot grid that fades out toward the edges */}
          <div
            className="absolute inset-0 opacity-[0.5] text-border"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.2px)',
              backgroundSize: '26px 26px',
              maskImage: 'radial-gradient(ellipse 60% 55% at 50% 38%, #000 25%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 38%, #000 25%, transparent 75%)',
            }}
          />
        </div>

        <div className={`w-full max-w-7xl mx-auto px-5 md:px-8 ${onPhoto ? 'pt-20 md:pt-24 pb-32 sm:pb-24' : 'pt-12 md:pt-20 pb-12 md:pb-16'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`inline-flex items-center gap-1.5 mb-5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold tracking-wide transition-colors duration-700 ${dark ? 'bg-snow/15 text-snow backdrop-blur-md border border-snow/20' : lightArt ? 'bg-forest/10 text-forest border border-forest/15' : 'bg-green-light text-green'}`}
            >
              <Sparkles size={14} />
              {t('hero_badge')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-[34px] leading-[1.15] sm:text-[44px] md:text-[56px] md:leading-[1.1] font-extrabold tracking-tight text-balance transition-colors duration-700 ${dark ? 'text-snow [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]' : lightArt ? 'text-night' : 'text-ink'}`}
            >
              {t('hero_title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
              className={`mt-5 text-[16px] md:text-[18px] leading-relaxed max-w-xl mx-auto transition-colors duration-700 ${onPhoto ? 'hidden sm:block [@media(max-height:720px)]:!hidden' : ''} ${dark ? 'text-snow/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]' : lightArt ? 'text-night/75' : 'text-ink-soft'}`}
            >
              {t('hero_subtitle')}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }} className="mt-8 max-w-xl mx-auto">
              <SearchBar large />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease: 'easeOut' }}
              className={
                onPhoto
                  ? // Phones get one swipeable row so the whole hero fits on the first screen.
                    'mt-5 flex flex-nowrap sm:flex-wrap items-center sm:justify-center gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-auto sm:px-0 sm:max-w-2xl'
                  : 'mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto'
              }
            >
              {categories.map((c) => (
                <Link key={c.id} to={`/restaurants?category=${c.id}`} className="shrink-0">
                  <CategoryPill category={c} />
                </Link>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.34, ease: 'easeOut' }}
              className={`flex flex-wrap items-center justify-center gap-3 ${onPhoto ? 'mt-7 sm:mt-9' : 'mt-9'}`}
            >
              <Link to="/restaurants" className="group inline-flex items-center gap-2 pl-6 pr-5 py-3.5 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-float ring-1 ring-inset ring-snow/10">
                {t('hero_cta_explore')}
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/map"
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full border font-bold text-[15px] transition-colors ${dark ? 'border-snow/30 bg-snow/10 text-snow backdrop-blur-md hover:bg-snow/20' : 'border-border bg-white/80 backdrop-blur text-ink hover:bg-white'}`}
              >
                <MapIcon size={17} />
                {t('hero_cta_map')}
              </Link>
            </motion.div>

            {stats.places > 0 && (
              <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className={`mx-auto max-w-md grid-cols-3 divide-x ${onPhoto ? `mt-9 hidden sm:grid [@media(max-height:860px)]:!hidden ${dark ? 'divide-snow/25' : 'divide-night/15'}` : 'mt-12 grid divide-border'}`}>
                {[
                  { n: stats.places, label: t('stat_places') },
                  { n: stats.dishes, label: t('stat_dishes') },
                  { n: stats.areas, label: t('stat_areas') },
                ].map((s) => (
                  <div key={s.label} className="px-3">
                    <dt className={`text-[24px] md:text-[28px] font-extrabold tabular-nums leading-none ${dark ? 'text-snow' : lightArt ? 'text-night' : 'text-ink'}`}>{s.n}</dt>
                    <dd className={`mt-1.5 text-[12.5px] font-medium ${dark ? 'text-snow/75' : lightArt ? 'text-night/60' : 'text-ink-faint'}`}>{s.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-4">
        <SectionHead eyebrow={t('how_title')} />
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
          {[
            { icon: Search, title: t('how_1_title'), text: t('how_1_text') },
            { icon: ScrollText, title: t('how_2_title'), text: t('how_2_text') },
            { icon: MapPin, title: t('how_3_title'), text: t('how_3_text') },
          ].map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden flex md:flex-col items-center md:items-start gap-4 md:gap-5 p-4 md:p-7 rounded-[22px] bg-white border border-border/80 shadow-card"
            >
              <span className="absolute -right-1 -top-4 md:-top-6 text-[72px] md:text-[104px] font-extrabold leading-none text-green/[0.07] select-none tabular-nums" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-light text-green flex items-center justify-center transition-transform duration-500 group-hover:-rotate-6">
                <step.icon size={22} />
              </div>
              <div className="relative min-w-0">
                <h3 className="font-extrabold text-[16px] md:text-[18px] text-ink tracking-tight">{step.title}</h3>
                <p className="mt-0.5 md:mt-1.5 text-[13.5px] md:text-[14.5px] text-ink-soft leading-relaxed">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Nothing published yet */}
      {empty && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-10">
          <div className="flex flex-col items-center text-center py-14 px-6 rounded-[28px] border border-dashed border-border bg-white">
            <div className="w-14 h-14 rounded-2xl bg-green-light text-green flex items-center justify-center mb-4">
              <UtensilsCrossed size={24} />
            </div>
            <h2 className="text-[20px] font-extrabold text-ink">{t('soon_title')}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-soft max-w-sm leading-relaxed">{t('soon_text')}</p>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24">
          <SectionHead title={t('featured_title')} subtitle={t('featured_subtitle')} link={{ to: '/restaurants', label: t('featured_view_all') }} />
          <RestaurantGrid restaurants={featured} loading={loading} />
        </section>
      )}

      {/* More places: a swipeable shelf on phones, a grid on wide screens */}
      {discover.length > 0 && (
        <section className="max-w-7xl mx-auto pt-14 md:pt-24">
          <div className="px-5 md:px-8">
            <SectionHead title={t('home_all_title')} subtitle={t('home_all_sub')} link={{ to: '/restaurants', label: t('home_all_more') }} />
          </div>
          <div className="shelf flex lg:grid lg:grid-cols-4 gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible no-scrollbar px-5 md:px-8 pb-4 -mb-4">
            {discover.slice(0, 8).map((r, i) => (
              <div key={r.id} className="shrink-0 w-[78%] min-[480px]:w-[300px] lg:w-auto">
                <RestaurantCard restaurant={r} index={i} />
              </div>
            ))}
            <Link
              to="/restaurants"
              className="lg:hidden shrink-0 w-[44%] min-[480px]:w-[180px] flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-border bg-white/60 text-green font-extrabold text-[14.5px] text-center px-4"
            >
              <span className="w-12 h-12 rounded-full bg-green-light flex items-center justify-center">
                <ArrowRight size={20} />
              </span>
              {t('home_all_more')}
            </Link>
          </div>
        </section>
      )}

      {/* Owners */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-28">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-forest px-6 py-9 sm:px-10 md:px-14 md:py-14 shadow-float">
          {/* soft light + a faint dotted texture */}
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-snow/10 blur-2xl -z-10" aria-hidden="true" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[#9cc5a1]/15 blur-3xl -z-10" aria-hidden="true" />
          <div
            className="absolute inset-0 -z-10 opacity-[0.12] text-snow"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              maskImage: 'linear-gradient(115deg, transparent 35%, #000 100%)',
              WebkitMaskImage: 'linear-gradient(115deg, transparent 35%, #000 100%)',
            }}
            aria-hidden="true"
          />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-[26px] md:text-[34px] font-extrabold text-snow tracking-tight leading-[1.15] text-balance">{t('owner_cta_title')}</h2>
              <p className="mt-3 text-[15px] md:text-[16px] text-snow/80 leading-relaxed">{t('owner_cta_text')}</p>
              <ul className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
                {[
                  { icon: Check, text: t('owner_perk_1') },
                  { icon: QrCode, text: t('owner_perk_2') },
                  { icon: ScrollText, text: t('owner_perk_3') },
                ].map((perk) => (
                  <li key={perk.text} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-snow/10 border border-snow/15 text-snow text-[13.5px] font-semibold w-fit">
                    <perk.icon size={15} className="text-[#9cc5a1]" />
                    {perk.text}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/about#partners"
              className="group shrink-0 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-snow text-night font-extrabold text-[15px] hover:bg-white transition-colors shadow-card self-start lg:self-center"
            >
              {t('owner_cta_button')}
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHead({ eyebrow, title, subtitle, link }: { eyebrow?: string; title?: string; subtitle?: string; link?: { to: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-9">
      <div className="min-w-0">
        {eyebrow && (
          <p className="inline-flex items-center gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-green">
            <span className="w-6 h-px bg-green/50" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        {title && <h2 className="text-[24px] md:text-[34px] font-extrabold text-ink tracking-tight leading-tight text-balance">{title}</h2>}
        {subtitle && <p className="mt-1.5 text-[14px] md:text-[15px] text-ink-soft leading-relaxed">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="group shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border bg-white text-[13.5px] font-bold text-ink hover:border-green hover:text-green transition-colors" aria-label={link.label}>
          <span className="hidden sm:inline">{link.label}</span>
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
