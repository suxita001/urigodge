import { useLanguage } from '../i18n/LanguageContext'
import { useSeo } from '../hooks/useSeo'
import { terms, TERMS_UPDATED } from '../data/terms'
import { formatDate } from '../lib/format'
import { breadcrumbJsonLd } from '../lib/seo'

export default function Terms() {
  const { t, lang } = useLanguage()
  const sections = terms[lang]
  useSeo(`${t('terms_title')} | urigod.ge`, t('terms_intro'), { path: '/terms', jsonLd: breadcrumbJsonLd([{ name: t('terms_title'), path: '/terms' }]) })

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
      <h1 className="text-[30px] md:text-[40px] font-extrabold text-ink tracking-tight">{t('terms_title')}</h1>
      <p className="mt-2 text-[13.5px] text-ink-faint">{t('terms_updated', { date: formatDate(new Date(TERMS_UPDATED), lang) })}</p>
      <p className="mt-5 text-[15.5px] text-ink-soft leading-relaxed">{t('terms_intro')}</p>

      <nav aria-label={t('terms_contents')} className="mt-8 rounded-2xl border border-border bg-white p-5">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink-faint mb-3">{t('terms_contents')}</p>
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-decimal list-inside text-[14px] text-ink-soft marker:text-ink-faint">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-green">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
          <h2 className="text-[19px] md:text-[21px] font-extrabold text-ink tracking-tight">
            <span className="text-green tabular-nums">{i + 1}.</span> {s.title}
          </h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="mt-3 text-[15px] text-ink-soft leading-relaxed">
              {p}
            </p>
          ))}
          {s.bullets && (
            <ul className="mt-3 flex flex-col gap-2 list-disc pl-5 text-[15px] text-ink-soft leading-relaxed marker:text-green">
              {s.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
