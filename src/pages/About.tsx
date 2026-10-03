import { motion } from 'framer-motion'
import { Compass, ScrollText, MapPin, Sparkles } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useSeo } from '../hooks/useSeo'

export default function About() {
  const { t } = useLanguage()
  useSeo(`${t('about_title')} | urigod.ge`, t('about_body'))

  const features = [
    { icon: Compass, text: t('about_feature_1') },
    { icon: ScrollText, text: t('about_feature_2') },
    { icon: MapPin, text: t('about_feature_3') },
    { icon: Sparkles, text: t('about_feature_4') },
  ]

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center">
        <h1 className="text-[30px] md:text-[42px] font-extrabold text-ink tracking-tight">{t('about_title')}</h1>
        <p className="mt-5 text-[19px] md:text-[22px] font-semibold text-green leading-snug max-w-2xl mx-auto">
          {t('about_lead')}
        </p>
        <p className="mt-5 text-[15.5px] text-ink-soft leading-relaxed max-w-2xl mx-auto">{t('about_body')}</p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45 }}
        className="mt-16"
      >
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-faint text-center mb-8">
          {t('about_features_title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-white"
            >
              <div className="w-11 h-11 rounded-xl bg-green-light text-green flex items-center justify-center shrink-0">
                <f.icon size={20} />
              </div>
              <p className="text-[14.5px] text-ink leading-relaxed pt-2">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="partners"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45 }}
        className="mt-16 rounded-3xl bg-ink text-cream p-8 md:p-12 text-center scroll-mt-24"
      >
        <h2 className="text-[22px] md:text-[26px] font-extrabold tracking-tight">{t('about_partners_title')}</h2>
        <p className="mt-4 text-[15px] text-cream/80 leading-relaxed max-w-xl mx-auto">{t('about_partners_body')}</p>
        <a
          href="mailto:partners@urigod.ge"
          className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-green text-cream font-bold text-[14.5px] hover:bg-green-dark transition-colors"
        >
          {t('about_partners_cta')}
        </a>
      </motion.section>
    </div>
  )
}
