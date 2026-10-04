import { Suspense, useEffect, useState } from 'react'
import Spinner from '../ui/Spinner'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Store,
  Users,
  UserCog,
  ShieldCheck,
  History,
  Settings,
  UtensilsCrossed,
  GitBranch,
  User,
  Menu,
  X,
  ArrowUpRight,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import UserMenu from '../UserMenu'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Custom matcher (query-string tabs share a pathname). */
  match?: (pathname: string, search: string) => boolean
}

function useNavItems(): NavItem[] {
  const { isAdmin, profile } = useAuth()
  if (isAdmin) {
    return [
      { to: '/admin', label: 'მთავარი დაფა', icon: LayoutDashboard, match: (p) => p === '/admin' },
      { to: '/admin/restaurants', label: 'რესტორნები', icon: Store },
      { to: '/admin/users', label: 'მომხმარებლები', icon: Users },
      { to: '/admin/managers', label: 'რესტორნის მენეჯერები', icon: UserCog },
      { to: '/admin/admins', label: 'ადმინები', icon: ShieldCheck },
      { to: '/admin/logs', label: 'აქტივობები', icon: History },
      { to: '/admin/settings', label: 'პარამეტრები', icon: Settings },
    ]
  }
  const first = profile?.managedRestaurantIds[0]
  const base = first ? `/admin/restaurants/${first}` : '/admin'
  const tab = (name: string) => (p: string, s: string) => p === base && (new URLSearchParams(s).get('tab') ?? 'info') === name
  return [
    { to: '/admin', label: 'მთავარი დაფა', icon: LayoutDashboard, match: (p) => p === '/admin' },
    { to: `${base}?tab=info`, label: 'ჩემი რესტორანი', icon: Store, match: tab('info') },
    { to: `${base}?tab=branches`, label: 'ფილიალები', icon: GitBranch, match: tab('branches') },
    { to: `${base}?tab=menu`, label: 'მენიუ', icon: UtensilsCrossed, match: tab('menu') },
    { to: '/admin/logs', label: 'აქტივობა', icon: History },
    { to: '/profile', label: 'პროფილი', icon: User },
  ]
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const items = useNavItems()
  const { pathname, search } = useLocation()
  const { isSuperAdmin, isAdmin } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 h-16 md:h-[72px] flex items-center border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="" width={30} height={30} className="w-[30px] h-[30px]" />
          <span className="text-[18px] font-extrabold tracking-tight text-cream">
            urigod<span className="text-[#9cc5a1]">.ge</span>
          </span>
        </Link>
      </div>

      <div className="px-5 pt-5 pb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cream/45">
          {isSuperAdmin ? (
            <>
              <Crown size={12} className="text-[#e3b95f]" /> Super Admin
            </>
          ) : isAdmin ? (
            'ადმინ პანელი'
          ) : (
            'რესტორნის მართვა'
          )}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = item.match ? item.match(pathname, search) : pathname === item.to || pathname.startsWith(item.to + '/')
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-3 px-3.5 h-11 rounded-xl text-[14px] font-semibold transition-colors ${
                    active ? 'bg-white/10 text-cream' : 'text-cream/65 hover:text-cream hover:bg-white/5'
                  }`}
                >
                  {active && <motion.span layoutId="admin-nav-active" className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#9cc5a1]" />}
                  <item.icon size={18} className={active ? 'text-[#9cc5a1]' : ''} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center justify-between px-3.5 h-11 rounded-xl text-[13.5px] font-semibold text-cream/65 hover:text-cream hover:bg-white/5 transition-colors"
        >
          საიტზე დაბრუნება
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[264px] bg-ink z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-ink/50"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 w-[84%] max-w-[300px] bg-ink"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3.5 right-3 w-10 h-10 rounded-full text-cream/70 hover:bg-white/10 flex items-center justify-center"
                aria-label="დახურვა"
              >
                <X size={20} />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[264px] min-w-0">
        <header className="sticky top-0 z-20 h-16 md:h-[72px] bg-[#f6f3ee]/85 backdrop-blur-md border-b border-border flex items-center justify-between gap-3 px-4 md:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-11 h-11 -ml-1.5 rounded-full flex items-center justify-center text-ink hover:bg-cream-2"
            aria-label="მენიუ"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <UserMenu />
        </header>
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1280px]">
          <Suspense
            fallback={
              <div className="flex justify-center py-24 text-green">
                <Spinner size={28} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
