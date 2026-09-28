import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Heart, ScrollText, Compass } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useRestaurants } from '../../hooks/useRestaurants'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useLanguage()
  const { restaurants } = useRestaurants()
  const collage = restaurants.slice(0, 3)

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-green-light blur-3xl opacity-70" />
        <div className="absolute top-60 -left-40 w-[420px] h-[420px] rounded-full bg-terracotta-light blur-3xl opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-8 py-8 md:py-16 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
        {/* Brand panel (desktop) */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="hidden lg:block"
        >
          <div className="relative h-[260px] mb-10">
            {[0, 1, 2].map((i) => {
              const r = collage[i]
              const style = { left: [0, 150, 60][i], top: [30, 0, 95][i], zIndex: i === 2 ? 3 : i + 1 }
              const className = 'absolute w-[230px] h-[170px] rounded-2xl border-4 border-white shadow-card-hover'
              return r ? (
                <motion.img
                  key={r.id}
                  src={r.coverImage}
                  alt=""
                  initial={{ opacity: 0, y: 20, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, rotate: [-6, 3, -2][i] }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
                  className={`${className} object-cover`}
                  style={style}
                />
              ) : (
                <div
                  key={`placeholder-${i}`}
                  className={`${className} bg-cream-2 animate-pulse`}
                  style={{ ...style, rotate: `${[-6, 3, -2][i]}deg` }}
                />
              )
            })}
          </div>
          <h2 className="text-[30px] leading-[1.2] font-extrabold text-ink tracking-tight text-balance">
            {t('auth_side_title')}
          </h2>
          <ul className="mt-6 flex flex-col gap-3.5">
            {[
              { icon: Heart, text: t('auth_side_1') },
              { icon: ScrollText, text: t('auth_side_2') },
              { icon: Compass, text: t('auth_side_3') },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-ink-soft">
                <span className="w-9 h-9 rounded-xl bg-green-light text-green flex items-center justify-center shrink-0">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.aside>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end"
        >
          <div className="bg-white rounded-3xl border border-border shadow-card p-6 sm:p-8">
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-ink tracking-tight">{title}</h1>
            <p className="mt-1.5 text-[14.5px] text-ink-soft leading-relaxed">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-[14px] text-ink-soft">{footer}</div>}
        </motion.div>
      </div>
    </section>
  )
}
