import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Search, MapPin, ScrollText, Sparkles, UtensilsCrossed } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import HeroSlideshow from '../components/HeroSlideshow'
import CategoryPill from '../components/CategoryPill'
import RestaurantGrid from '../components/RestaurantGrid'
import { useLanguage } from '../i18n/LanguageContext'
import { categories } from '../data/categories'
import { areaList, landingPath } from '../../shared/taxonomy'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { websiteJsonLd } from '../lib/seo'

export default function Home() {
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  useSeo(t('seo_home_title'), t('seo_home_description'), {
    path: '/',
    jsonLd: websiteJsonLd(),
  })
  const featured = useMemo(() => [...restaurants].sort((a, b) => b.popularity - a.popularity).slice(0, 6), [restaurants])

  const stats = useMemo(() => {
    const areas = new Set(restaurants.map((r) => r.neighborhood))
    const dishes = restaurants.reduce((sum, r) => sum + r.menu.reduce((n, c) => n + c.items.length, 0), 0)
    return { places: restaurants.length, dishes, areas: areas.size }
  }, [restaurants])

  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of restaurants) counts.set(r.neighborhood, (counts.get(r.neighborhood) ?? 0) + 1)
    return counts
  }, [restaurants])

  const empty = !loading && restaurants.length === 0

  // The hero backdrop: the five most popular places that have a photo. Without any, the plain hero is shown.
  const slides = useMemo(() => featured.filter((r) => r.coverImage).slice(0, 5), [featured])
  const onPhoto = slides.length > 0

  return (
    <div>
      {/* Hero */}
      <section className={onPhoto ? 'relative isolate overflow-hidden mx-3 md:mx-6 mt-1 rounded-[28px] md:rounded-[36px]' : 'relative overflow-hidden'}>
        {onPhoto && <HeroSlideshow slides={slides} />}
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

        <div className={`max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-20 ${onPhoto ? 'pb-24 md:pb-28' : 'pb-12 md:pb-16'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`inline-flex items-center gap-1.5 mb-5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold tracking-wide ${onPhoto ? 'bg-snow/15 text-snow backdrop-blur-md border border-snow/20' : 'bg-green-light text-green'}`}
            >
              <Sparkles size={14} />
              {t('hero_badge')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`text-[34px] leading-[1.15] sm:text-[44px] md:text-[56px] md:leading-[1.1] font-extrabold tracking-tight text-balance ${onPhoto ? 'text-snow [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]' : 'text-ink'}`}
            >
              {t('hero_title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
              className={`mt-5 text-[16px] md:text-[18px] leading-relaxed max-w-xl mx-auto ${onPhoto ? 'text-snow/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]' : 'text-ink-soft'}`}
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
              className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto"
            >
              {categories.map((c) => (
                <Link key={c.id} to={`/restaurants?category=${c.id}`}>
                  <CategoryPill category={c} />
                </Link>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.34, ease: 'easeOut' }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/restaurants" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card">
                {t('hero_cta_explore')}
                <ArrowRight size={17} />
              </Link>
              <Link to="/map" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-white text-ink font-bold text-[15px] hover:bg-cream-2 transition-colors">
                {t('hero_cta_map')}
              </Link>
            </motion.div>

            {stats.places > 0 && (
              <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className={`mt-12 mx-auto max-w-md grid grid-cols-3 divide-x ${onPhoto ? 'divide-snow/25' : 'divide-border'}`}>
                {[
                  { n: stats.places, label: t('stat_places') },
                  { n: stats.dishes, label: t('stat_dishes') },
                  { n: stats.areas, label: t('stat_areas') },
                ].map((s) => (
                  <div key={s.label} className="px-3">
                    <dt className={`text-[24px] md:text-[28px] font-extrabold tabular-nums leading-none ${onPhoto ? 'text-snow' : 'text-ink'}`}>{s.n}</dt>
                    <dd className={`mt-1.5 text-[12.5px] font-medium ${onPhoto ? 'text-snow/75' : 'text-ink-faint'}`}>{s.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-green text-center mb-3">{t('how_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          {[
            { icon: Search, title: t('how_1_title'), text: t('how_1_text') },
            {
              icon: ScrollText,
              title: t('how_2_title'),
              text: t('how_2_text'),
            },
            { icon: MapPin, title: t('how_3_title'), text: t('how_3_text') },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="text-center px-4"
            >
              <div className="relative w-14 h-14 rounded-2xl bg-green-light text-green flex items-center justify-center mx-auto mb-4">
                <step.icon size={24} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green text-cream text-[12px] font-extrabold flex items-center justify-center ring-4 ring-cream">{i + 1}</span>
              </div>
              <h3 className="font-bold text-[17px] text-ink mb-1.5">{step.title}</h3>
              <p className="text-[14.5px] text-ink-soft leading-relaxed">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Nothing published yet */}
      {empty && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-6">
          <div className="flex flex-col items-center text-center py-14 px-6 rounded-3xl border border-dashed border-border bg-white">
            <div className="w-14 h-14 rounded-2xl bg-green-light text-green flex items-center justify-center mb-4">
              <UtensilsCrossed size={24} />
            </div>
            <h2 className="text-[20px] font-extrabold text-ink">{t('soon_title')}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-soft max-w-sm leading-relaxed">{t('soon_text')}</p>
          </div>
        </section>
      )}

      {/* Featured */}
      {!empty && (
        <>
          <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight">{t('featured_title')}</h2>
                <p className="mt-1.5 text-[14.5px] text-ink-soft">{t('featured_subtitle')}</p>
              </div>
              <Link to="/restaurants" className="hidden sm:inline-flex items-center gap-1 text-[14px] font-bold text-green whitespace-nowrap hover:gap-1.5 transition-all">
                {t('featured_view_all')}
                <ArrowRight size={15} />
              </Link>
            </div>

            <RestaurantGrid restaurants={featured} loading={loading} />

            <div className="mt-8 text-center sm:hidden">
              <Link to="/restaurants" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border bg-white text-ink font-bold text-[14.5px]">
                {t('featured_view_all')}
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          {/* Areas */}
          <section className="max-w-7xl mx-auto px-5 md:px-8 pb-6 md:pb-10">
            <h2 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight">{t('areas_title')}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-soft">{t('areas_subtitle')}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {areaList
                .filter((a) => areaCounts.has(a.id))
                .sort((a, b) => (areaCounts.get(b.id) ?? 0) - (areaCounts.get(a.id) ?? 0))
                .map((a) => (
                  <Link
                    key={a.id}
                    to={landingPath('area', a.id)}
                    className="group inline-flex items-center gap-2 pl-4 pr-2.5 h-11 rounded-full border border-border bg-white text-[14.5px] font-semibold text-ink hover:border-green hover:text-green transition-colors"
                  >
                    {a.label[lang]}
                    <span className="min-w-6 h-6 px-1.5 rounded-full bg-cream-2 group-hover:bg-green-light text-[12px] font-bold text-ink-soft group-hover:text-green flex items-center justify-center tabular-nums transition-colors">
                      {areaCounts.get(a.id)}
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}

      {/* Owners */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-forest px-7 py-10 md:px-14 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-snow/10" aria-hidden="true" />
          <div className="absolute -bottom-24 right-40 w-60 h-60 rounded-full bg-snow/5" aria-hidden="true" />
          <div className="relative max-w-xl">
            <h2 className="text-[24px] md:text-[32px] font-extrabold text-snow tracking-tight leading-tight">{t('owner_cta_title')}</h2>
            <p className="mt-2.5 text-[15px] md:text-[16px] text-snow/80 leading-relaxed">{t('owner_cta_text')}</p>
          </div>
          <Link
            to="/about#partners"
            className="relative shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-snow text-night font-bold text-[15px] hover:brightness-95 transition shadow-card"
          >
            {t('owner_cta_button')}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  )
}
