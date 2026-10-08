import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Search, LogOut, User, Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './Logo'
import SearchBar from './SearchBar'
import UserMenu from './UserMenu'
import Avatar from './ui/Avatar'
import ThemeToggle from './ThemeToggle'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useHeroOverlay } from '../lib/heroOverlay'
import { loginPathFor } from '../utils/redirect'

const links = [
  { to: '/', key: 'nav_home' as const },
  { to: '/map', key: 'nav_map' as const },
  { to: '/restaurants', key: 'nav_restaurants' as const },
  { to: '/about', key: 'nav_about' as const },
]

export default function Navbar() {
  const { t, lang, toggleLang } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const heroPhoto = useHeroOverlay()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { currentUser, profile, loading: authLoading, logout } = useAuth()
  const onAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname)
  const loginHref = onAuthPage || location.pathname === '/' ? '/login' : loginPathFor(location.pathname + location.search)
  const displayName = profile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || ''

  async function handleMobileLogout() {
    setMobileOpen(false)
    navigate('/', { replace: true })
    await logout()
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
      // The home banner is one screen tall; the bar turns solid once it has scrolled away.
      setPastHero(window.scrollY > window.innerHeight - 90)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Over the banner photo the bar is see-through with light text.
  const glass = heroPhoto && !pastHero && !searchOpen
  const quiet = glass ? 'text-snow/85 hover:bg-snow/15 hover:text-snow' : 'text-ink-soft hover:bg-cream-2 hover:text-ink'
  const outline = glass ? 'border-snow/30' : 'border-border'

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          glass ? (scrolled ? 'bg-night/45 backdrop-blur-md' : 'bg-transparent') : scrolled ? 'bg-white/85 backdrop-blur-md shadow-nav' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-5 md:px-8 h-16 md:h-[72px] flex items-center justify-between gap-4">
          <Logo dark={glass} />

          <ul className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-[14.5px] font-semibold transition-colors ${
                      glass ? (isActive ? 'text-snow bg-snow/20' : quiet) : isActive ? 'text-green bg-green-light' : 'text-ink-soft hover:text-ink hover:bg-cream-2'
                    }`
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full transition-colors ${quiet}`}
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            <ThemeToggle className="hidden md:flex" onPhoto={glass} />

            <button
              onClick={toggleLang}
              className={`flex items-center gap-1.5 px-3 h-10 rounded-full border text-[13.5px] font-semibold transition-colors ${outline} ${quiet}`}
            >
              <span>{lang === 'ka' ? '🇬🇪' : '🇬🇧'}</span>
              <span className={currentUser ? 'hidden sm:inline' : ''}>{lang === 'ka' ? 'ქართული' : 'English'}</span>
            </button>

            {authLoading ? (
              <span className="w-10 h-10 rounded-full bg-cream-2 animate-pulse hidden md:block" aria-hidden="true" />
            ) : currentUser ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  to={loginHref}
                  className={`hidden md:inline-flex items-center px-4 h-10 rounded-full text-[14px] font-bold transition-colors ${glass ? 'text-snow hover:bg-snow/15' : 'text-ink hover:bg-cream-2'}`}
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/register"
                  className="hidden lg:inline-flex items-center px-4 h-10 rounded-full bg-green text-cream text-[14px] font-bold hover:bg-green-dark transition-colors"
                >
                  {t('nav_register')}
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors ${glass ? 'text-snow hover:bg-snow/15' : 'text-ink hover:bg-cream-2'}`}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden md:block overflow-visible border-t border-border bg-white/95 backdrop-blur-md"
            >
              <div className="max-w-2xl mx-auto px-8 py-4">
                <SearchBar autoFocus onNavigate={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden bg-night/50"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="absolute right-0 top-0 h-full w-[84%] max-w-sm bg-cream flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-border">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-cream-2 text-ink"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="px-5 py-5">
                <SearchBar onNavigate={() => setMobileOpen(false)} />
              </div>

              <ul className="flex flex-col px-3 gap-1">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl text-[16px] font-semibold transition-colors ${
                          isActive ? 'text-green bg-green-light' : 'text-ink hover:bg-cream-2'
                        }`
                      }
                    >
                      {t(link.key)}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mt-auto p-5 border-t border-border flex flex-col gap-3">
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/profile"
                      className="flex-1 min-w-0 flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-cream-2 transition-colors"
                    >
                      <Avatar name={displayName} size={40} />
                      <span className="min-w-0">
                        <span className="block font-bold text-[15px] text-ink truncate">{displayName}</span>
                        <span className="flex items-center gap-1 text-[12.5px] text-ink-faint">
                          <User size={12} />
                          {t('menu_profile')}
                        </span>
                      </span>
                    </Link>
                    <button
                      onClick={handleMobileLogout}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-terracotta hover:bg-terracotta-light transition-colors"
                      aria-label={t('menu_logout')}
                    >
                      <LogOut size={19} />
                    </button>
                  </div>
                ) : (
                  !authLoading && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <Link
                        to={loginHref}
                        className="flex items-center justify-center h-12 rounded-full bg-green text-cream text-[15px] font-bold hover:bg-green-dark transition-colors"
                      >
                        {t('nav_login')}
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center justify-center h-12 rounded-full border border-border bg-white text-ink text-[15px] font-bold hover:bg-cream-2 transition-colors"
                      >
                        {t('nav_register')}
                      </Link>
                    </div>
                  )
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={toggleLang}
                    className="flex items-center justify-center gap-2 h-12 rounded-full border border-border text-[15px] font-semibold text-ink hover:bg-cream-2 transition-colors"
                  >
                    <span>{lang === 'ka' ? '🇬🇪' : '🇬🇧'}</span>
                    <span>{lang === 'ka' ? 'ქართული' : 'English'}</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 h-12 rounded-full border border-border text-[15px] font-semibold text-ink hover:bg-cream-2 transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                    <span>{theme === 'dark' ? t('theme_light') : t('theme_dark')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
