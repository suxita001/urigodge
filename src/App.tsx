import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Link, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import PageViewTracker from './components/PageViewTracker'
import Maintenance from './pages/Maintenance'
import { useSiteStatus } from './services/siteStatusService'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { RestaurantsProvider } from './context/RestaurantsContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { LocationProvider } from './context/LocationContext'
import { RequireAuth, RequireRole } from './components/RouteGuards'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home'
import Restaurants from './pages/Restaurants'
import About from './pages/About'

// Map/Leaflet is the heaviest dependency in the app, so the pages that use it are code-split,
// as is the whole admin dashboard.
const MapPage = lazy(() => import('./pages/MapPage'))
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'))
const MenuPage = lazy(() => import('./pages/MenuPage'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const ReservationsAdmin = lazy(() => import('./pages/admin/Reservations'))
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const InviteComplete = lazy(() => import('./pages/auth/InviteComplete'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Overview = lazy(() => import('./pages/admin/Overview'))
const RestaurantsList = lazy(() => import('./pages/admin/RestaurantsList'))
const RestaurantCreate = lazy(() => import('./pages/admin/RestaurantCreate'))
const RestaurantEdit = lazy(() => import('./pages/admin/RestaurantEdit'))
const Users = lazy(() => import('./pages/admin/Users'))
const Managers = lazy(() => import('./pages/admin/Managers'))
const Admins = lazy(() => import('./pages/admin/Admins'))
const Logs = lazy(() => import('./pages/admin/Logs'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const HomeBanner = lazy(() => import('./pages/admin/HomeBanner'))

// The map and restaurant pages are separate chunks; fetching them once the browser is idle makes
// the first click on them feel instant.
function usePrefetchPages() {
  useEffect(() => {
    const run = () => {
      void import('./pages/RestaurantDetail')
      void import('./pages/MenuPage')
      void import('./pages/MapPage')
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(run, 2500)
    return () => clearTimeout(timer)
  }, [])
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

// Short links (urigod.ge/menu/:slug, urigod.ge/r/:slug) go straight to the menu page.
function MenuRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/restaurants/${slug}/menu`} replace />
}

// Restaurant pages used to live at /restaurant/:slug.
function LegacyRestaurantRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/restaurants/${slug}`} replace />
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-green animate-spin" />
    </div>
  )
}

// Pages a visitor can still open while the site is hidden, so staff can sign in and invitations work.
const OPEN_DURING_MAINTENANCE = ['/login', '/forgot-password', '/invite']

function MaintenanceStrip() {
  return (
    <div className="relative z-50 bg-terracotta text-snow text-center text-[13px] font-bold px-4 py-2">
      საიტი სტუმრებისთვის დამალულია — შენ ხედავ, რადგან შესული ხარ.{' '}
      <Link to="/admin/settings" className="underline underline-offset-2">
        გახსნა
      </Link>
    </div>
  )
}

function PublicLayout() {
  const { pathname } = useLocation()
  const site = useSiteStatus()
  const { loading: authLoading, isStaff } = useAuth()
  usePrefetchPages()
  if (site.maintenance && !OPEN_DURING_MAINTENANCE.includes(pathname)) {
    // wait for the sign-in check so staff never see the closed page flash by
    if (authLoading) return <PageFallback />
    if (!isStaff) return <Maintenance message={site.message} />
  }
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {site.maintenance && isStaff && <MaintenanceStrip />}
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {pathname !== '/map' && <Footer />}
      <ChatWidget />
      <PageViewTracker />
    </div>
  )
}

const adminOnly = (el: React.ReactNode) => <RequireRole allow="admin">{el}</RequireRole>

export default function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <RestaurantsProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <FavoritesProvider>
               <LocationProvider>
                <ScrollToTop />
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/restaurants" element={<Restaurants />} />
                      <Route path="/map" element={<MapPage />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/dishes/:id" element={<Landing kind="dish" />} />
                      <Route path="/dishes/:id/:area" element={<Landing kind="dish" />} />
                      <Route path="/cuisines/:id" element={<Landing kind="cuisine" />} />
                      <Route path="/cuisines/:id/:area" element={<Landing kind="cuisine" />} />
                      <Route path="/areas/:id" element={<Landing kind="area" />} />
                      <Route path="/restaurants/:slug" element={<RestaurantDetail />} />
                      <Route path="/restaurants/:slug/menu" element={<MenuPage />} />
                      <Route path="/restaurants/:slug/book" element={<BookingPage />} />
                      <Route path="/restaurant/:slug" element={<LegacyRestaurantRedirect />} />
                      <Route path="/r/:slug" element={<MenuRedirect />} />
                      <Route path="/menu/:slug" element={<MenuRedirect />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/invite" element={<InviteComplete />} />
                      <Route
                        path="/profile"
                        element={
                          <RequireAuth>
                            <Profile />
                          </RequireAuth>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route
                      path="/admin"
                      element={
                        <RequireAuth>
                          <RequireRole allow="staff">
                            <AdminLayout />
                          </RequireRole>
                        </RequireAuth>
                      }
                    >
                      <Route index element={<Overview />} />
                      <Route path="restaurants" element={adminOnly(<RestaurantsList />)} />
                      <Route path="restaurants/new" element={adminOnly(<RestaurantCreate />)} />
                      <Route path="restaurants/:id" element={<RestaurantEdit />} />
                      <Route path="users" element={adminOnly(<Users />)} />
                      <Route path="managers" element={adminOnly(<Managers />)} />
                      <Route path="admins" element={adminOnly(<Admins />)} />
                      <Route path="logs" element={<Logs />} />
                      <Route path="settings" element={adminOnly(<Settings />)} />
                      <Route path="banner" element={adminOnly(<HomeBanner />)} />
                      <Route path="reservations" element={adminOnly(<ReservationsAdmin />)} />
                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Route>
                    <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </Suspense>
               </LocationProvider>
              </FavoritesProvider>
            </BrowserRouter>
          </RestaurantsProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}
