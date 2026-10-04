import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import RestaurantGrid from '../components/RestaurantGrid'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { useSeo } from '../hooks/useSeo'
import { restaurantDishIds } from '../data/dishes'
import { breadcrumbJsonLd, restaurantListJsonLd } from '../lib/seo'
import { menuPath } from '../lib/site'
import { venueName } from '../lib/format'
import { areaList, cuisineList, dishItems, dishList, getArea, getCuisine, getDish, landingCopy, landingPath, listLandings, matchesLanding, type LandingKind } from '../../shared/taxonomy'

const formatPrice = (price: number) => (Number.isInteger(price) ? String(price) : price.toFixed(2))

/**
 * Search-friendly list pages: /dishes/khinkali, /dishes/khinkali/vake, /cuisines/italian,
 * /cuisines/italian/vake and /areas/vake. Each shows the matching venues and links to related pages.
 */
export default function Landing({ kind }: { kind: LandingKind }) {
  const { id = '', area } = useParams<{ id: string; area?: string }>()
  const { t, lang } = useLanguage()
  const { restaurants, loading } = useRestaurants()

  const known = (kind === 'dish' ? getDish(id) : kind === 'cuisine' ? getCuisine(id) : getArea(id)) && (!area || getArea(area))

  const results = useMemo(
    () => restaurants.filter((r) => matchesLanding(r, kind, id, area, restaurantDishIds(r))).sort((a, b) => b.popularity - a.popularity),
    [restaurants, kind, id, area]
  )
  const landings = useMemo(() => listLandings(restaurants), [restaurants])

  const copy = landingCopy(kind, id, area, lang, results.length)
  const path = landingPath(kind, id, area)

  useSeo(copy?.title ?? 'urigod.ge', copy?.description, {
    path,
    image: results[0]?.coverImage || undefined,
    // An empty list has nothing for a searcher, so it stays out of the index until venues appear.
    noindex: !loading && results.length === 0,
    jsonLd: copy ? [breadcrumbJsonLd([{ name: t('nav_restaurants'), path: '/restaurants' }, { name: copy.heading, path }]), ...(results.length ? [restaurantListJsonLd(results)] : [])] : undefined,
  })

  if (!known || !copy) return <Navigate to="/restaurants" replace />

  // Related pages: the same thing in other neighbourhoods, and other things in the same place.
  const sameElsewhere = kind === 'area' ? [] : landings.filter((l) => l.kind === kind && l.id === id && l.areaId !== area)
  const scopeArea = kind === 'area' ? id : area
  const othersHere = landings.filter((l) => l.kind !== 'area' && (l.areaId ?? undefined) === scopeArea && !(l.kind === kind && l.id === id))
  const otherDishes = othersHere.filter((l) => l.kind === 'dish').slice(0, 14)
  const otherCuisines = othersHere.filter((l) => l.kind === 'cuisine').slice(0, 12)
  const otherAreas = kind === 'area' ? landings.filter((l) => l.kind === 'area' && l.id !== id) : []

  const linkLabel = (l: { kind: LandingKind; id: string; areaId?: string }) => {
    if (l.kind === 'area') return areaList.find((a) => a.id === l.id)?.label[lang] ?? l.id
    const name = (l.kind === 'dish' ? dishList : cuisineList).find((x) => x.id === l.id)?.label[lang] ?? l.id
    return name
  }

  const priced = kind === 'dish' ? results.map((r) => ({ r, items: dishItems(r.menu, id).slice(0, 4) })).filter((x) => x.items.length) : []

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-faint" aria-label="Breadcrumb">
        <Link to="/restaurants" className="hover:text-green">
          {t('nav_restaurants')}
        </Link>
        <span>/</span>
        {area && kind !== 'area' && (
          <>
            <Link to={landingPath(kind, id)} className="hover:text-green">
              {linkLabel({ kind, id })}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink">{area ? getArea(area)?.label[lang] : linkLabel({ kind, id })}</span>
      </nav>

      <h1 className="mt-3 text-[28px] md:text-[38px] font-extrabold text-ink tracking-tight text-balance">{copy.heading}</h1>
      <p className="mt-2 text-[15px] text-ink-soft max-w-2xl">{copy.description}</p>

      <div className="mt-8">
        <RestaurantGrid restaurants={results} loading={loading} skeletonCount={3} />
      </div>

      {priced.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[20px] md:text-[24px] font-extrabold text-ink tracking-tight">
            {getDish(id)?.label[lang]} — {t('landing_prices')}
          </h2>
          <ul className="mt-5 grid md:grid-cols-2 gap-3">
            {priced.map(({ r, items }) => (
              <li key={r.id} className="rounded-2xl border border-border bg-white p-4">
                <Link to={menuPath(r.slug)} className="flex items-center justify-between gap-3 font-bold text-[15px] text-ink hover:text-green">
                  {venueName(r, lang)}
                  <ArrowRight size={15} className="shrink-0" />
                </Link>
                <ul className="mt-2 flex flex-col gap-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="text-ink-soft truncate">{item.name[lang] || item.name.ka}</span>
                      <span className="font-bold text-green tabular-nums whitespace-nowrap">{formatPrice(item.price)} ₾</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {[
        { title: t('landing_other_areas'), links: sameElsewhere.length ? sameElsewhere.map((l) => ({ ...l, label: l.areaId ? (getArea(l.areaId)?.label[lang] ?? l.areaId) : t('landing_all_city') })) : [] },
        { title: t('landing_other_areas'), links: otherAreas.map((l) => ({ ...l, label: linkLabel(l) })) },
        { title: t('landing_dishes_here'), links: otherDishes.map((l) => ({ ...l, label: linkLabel(l) })) },
        { title: t('landing_cuisines_here'), links: otherCuisines.map((l) => ({ ...l, label: linkLabel(l) })) },
      ]
        .filter((group) => group.links.length > 0)
        .map((group, i) => (
          <section key={i} className="mt-10">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-faint mb-3">{group.title}</h2>
            <div className="flex flex-wrap gap-2">
              {group.links.map((l) => (
                <Link
                  key={landingPath(l.kind, l.id, l.areaId)}
                  to={landingPath(l.kind, l.id, l.areaId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-[13.5px] font-semibold text-ink-soft hover:border-green hover:text-green transition-colors"
                >
                  {l.label}
                  <span className="text-[11.5px] text-ink-faint tabular-nums">{l.count}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
