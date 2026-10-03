import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Search, MapPin, ScrollText } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import CategoryPill from '../components/CategoryPill'
import RestaurantGrid from '../components/RestaurantGrid'
import { useLanguage } from '../i18n/LanguageContext'
import { categories } from '../data/categories'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { availableDishes } from '../data/dishes'
import { websiteJsonLd } from '../lib/seo'

export default function Home() {
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()
  useSeo(t('seo_home_title'), t('seo_home_description'), { path: '/', jsonLd: websiteJsonLd() })
  const popularDishes = useMemo(() => availableDishes(restaurants).slice(0, 14), [restaurants])
  const featured = useMemo(
    () => [...restaurants].sort((a, b) => b.popularity - a.popularity).slice(0, 6),
    [restaurants]
  )

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-green-light blur-3xl opacity-70" />
          <div className="absolute top-40 -left-40 w-[420px] h-[420px] rounded-full bg-terracotta-light blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="text-[34px] leading-[1.15] sm:text-[44px] md:text-[56px] md:leading-[1.1] font-extrabold text-ink tracking-tight text-balance"
            >
              {t('hero_title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
              className="mt-5 text-[16px] md:text-[18px] text-ink-soft leading-relaxed max-w-xl mx-auto"
            >
              {t('hero_subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
              className="mt-8 max-w-xl mx-auto"
            >
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
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-green text-cream font-bold text-[15px] hover:bg-green-dark transition-colors shadow-card"
              >
                {t('hero_cta_explore')}
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-white text-ink font-bold text-[15px] hover:bg-cream-2 transition-colors"
              >
                {t('hero_cta_map')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Browse by dish */}
      {popularDishes.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-green text-center mb-4">{t('home_dishes_title')}</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {popularDishes.map(({ dish, count }) => (
              <Link
                key={dish.id}
                to={`/restaurants?dish=${dish.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-[13.5px] font-semibold text-ink-soft hover:border-green hover:text-green transition-colors"
              >
                {dish.label[lang]}
                <span className="text-[11.5px] text-ink-faint tabular-nums">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-green text-center mb-3">{t('how_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          {[
            { icon: Search, title: t('how_1_title'), text: t('how_1_text') },
            { icon: ScrollText, title: t('how_2_title'), text: t('how_2_text') },
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
              <div className="w-14 h-14 rounded-2xl bg-green-light text-green flex items-center justify-center mx-auto mb-4">
                <step.icon size={24} />
              </div>
              <h3 className="font-bold text-[17px] text-ink mb-1.5">{step.title}</h3>
              <p className="text-[14.5px] text-ink-soft leading-relaxed">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-[24px] md:text-[30px] font-extrabold text-ink tracking-tight">{t('featured_title')}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-soft">{t('featured_subtitle')}</p>
          </div>
          <Link
            to="/restaurants"
            className="hidden sm:inline-flex items-center gap-1 text-[14px] font-bold text-green whitespace-nowrap hover:gap-1.5 transition-all"
          >
            {t('featured_view_all')}
            <ArrowRight size={15} />
          </Link>
        </div>

        <RestaurantGrid restaurants={featured} loading={loading} />

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-border bg-white text-ink font-bold text-[14.5px]"
          >
            {t('featured_view_all')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  )
}
