import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, ArrowUp, RotateCcw, MapPin } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useRestaurants } from '../hooks/useRestaurants'
import { ChatError, sendChat, type ChatMessage } from '../services/aiService'
import { neighborhoodMap } from '../data/categories'
import { priceSymbol, venueName } from '../lib/format'
import { restaurantPath } from '../lib/site'
import type { TranslationKey } from '../i18n/translations'

const STORAGE_KEY = 'urigod-chat'
const SUGGESTIONS: TranslationKey[] = ['chat_suggestion_1', 'chat_suggestion_2', 'chat_suggestion_3', 'chat_suggestion_4']

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 h-5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-faint" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
      ))}
    </span>
  )
}

export default function ChatWidget() {
  const { t, lang } = useLanguage()
  const { getBySlug } = useRestaurants()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<TranslationKey | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      /* storage unavailable (private mode) — the chat simply won't survive a reload */
    }
  }, [messages])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    // On phones the chat is a full-screen sheet, so the page behind must not scroll.
    const mobile = window.matchMedia('(max-width: 639px)').matches
    if (mobile) document.body.style.overflow = 'hidden'
    else inputRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      if (mobile) document.body.style.overflow = ''
    }
  }, [open])

  async function send(text: string) {
    const question = text.trim()
    if (!question || sending) return
    const next: ChatMessage[] = [...messages, { role: 'user', text: question }]
    setMessages(next)
    setInput('')
    setError(null)
    setSending(true)
    try {
      const reply = await sendChat(next, lang)
      setMessages([...next, reply])
    } catch (e) {
      const code = e instanceof ChatError ? e.code : 'unavailable'
      setError(code === 'rate_limited' ? 'chat_error_rate' : code === 'not_configured' ? 'chat_error_config' : 'chat_error_generic')
    } finally {
      setSending(false)
    }
  }

  // The map page keeps its bottom edge for the restaurant preview sheet on phones.
  const hideFabOnMobile = pathname === '/map'

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(true)}
            aria-label={t('chat_open')}
            className={`fixed z-40 right-4 sm:right-6 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 w-14 h-14 sm:w-auto sm:h-auto sm:pl-4 sm:pr-5 sm:py-3.5 justify-center rounded-full bg-ink text-cream shadow-card-hover items-center gap-2 text-[14px] font-bold hover:bg-green-dark transition-colors ${
              hideFabOnMobile ? 'hidden md:flex' : 'flex'
            }`}
          >
            <Sparkles size={18} className="text-[#f0c987]" />
            <span className="hidden sm:inline">{t('chat_fab')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t('chat_title')}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[60] inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:h-[min(640px,calc(100dvh-48px))] bg-cream sm:rounded-3xl sm:border sm:border-border shadow-card-hover flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3.5 bg-ink text-cream shrink-0">
              <span className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center shrink-0">
                <Sparkles size={17} className="text-[#f0c987]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[15px] leading-tight">{t('chat_title')}</p>
                <p className="text-[12px] text-cream/65 truncate">{t('chat_subtitle')}</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setError(null)
                  }}
                  aria-label={t('chat_reset')}
                  title={t('chat_reset')}
                  className="w-9 h-9 rounded-full hover:bg-cream/10 flex items-center justify-center"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label={t('close_modal')} className="w-9 h-9 rounded-full hover:bg-cream/10 flex items-center justify-center">
                <X size={19} />
              </button>
            </header>

            <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="my-auto">
                  <p className="text-[15px] font-bold text-ink">{t('chat_welcome_title')}</p>
                  <p className="mt-1 text-[13.5px] text-ink-soft leading-relaxed">{t('chat_welcome_text')}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {SUGGESTIONS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => send(t(key))}
                        className="text-left px-4 py-3 rounded-2xl bg-white border border-border text-[13.5px] font-semibold text-ink hover:border-green hover:text-green transition-colors"
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-green text-cream text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="self-start max-w-[92%] flex flex-col gap-2">
                    <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-border text-[14px] text-ink leading-relaxed whitespace-pre-wrap break-words">{m.text}</div>
                    {m.restaurants?.map((slug) => {
                      const r = getBySlug(slug)
                      if (!r) return null
                      return (
                        <Link
                          key={slug}
                          to={restaurantPath(r.slug)}
                          onClick={() => window.matchMedia('(max-width: 639px)').matches && setOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-border hover:border-green transition-colors"
                        >
                          {r.coverImage ? <img src={r.coverImage} alt="" loading="lazy" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-cream-2" /> : <span className="w-12 h-12 rounded-xl bg-cream-2 shrink-0" />}
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold text-[14px] text-ink truncate">{venueName(r, lang)}</span>
                            <span className="flex items-center gap-1 text-[12.5px] text-ink-faint truncate">
                              <MapPin size={11} />
                              {neighborhoodMap[r.neighborhood]?.label[lang]} · {priceSymbol(r.priceLevel)}
                            </span>
                          </span>
                          <span className="text-[12.5px] font-bold text-green shrink-0 pr-1">{t('card_view')}</span>
                        </Link>
                      )
                    })}
                  </div>
                )
              )}

              {sending && (
                <div className="self-start px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-border" aria-label={t('loading')}>
                  <TypingDots />
                </div>
              )}
              {error && <p className="self-start max-w-[92%] px-4 py-2.5 rounded-2xl bg-terracotta-light text-terracotta text-[13.5px] font-semibold">{t(error)}</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="shrink-0 p-3 border-t border-border bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  rows={1}
                  placeholder={t('chat_placeholder')}
                  aria-label={t('chat_placeholder')}
                  className="flex-1 max-h-28 min-h-11 resize-none rounded-2xl border border-border bg-cream/60 px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label={t('chat_send')}
                  className="w-11 h-11 rounded-full bg-green text-cream flex items-center justify-center shrink-0 disabled:bg-border disabled:text-ink-faint transition-colors"
                >
                  <ArrowUp size={19} />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-ink-faint">{t('chat_disclaimer')}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
