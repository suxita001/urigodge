import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { RestaurantsProvider } from './context/RestaurantsContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { RequireAuth, RequireRole } from './components/RouteGuards'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Restaurants from './pages/Restaurants'
import About from './pages/About'

// Map/Leaflet is the heaviest dependency in the app, so the pages that use it are code-split,
// as is the whole admin dashboard.
const MapPage = lazy(() => import('./pages/MapPage'))
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'))
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

// QR entry points: urigod.ge/r/:slug and urigod.ge/menu/:slug open the restaurant page with the menu already open.
function QrRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/restaurant/${slug}?menu=1`} replace />
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-green animate-spin" />
    </div>
  )
}

function PublicLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {pathname !== '/map' && <Footer />}
    </div>
  )
}

const adminOnly = (el: React.ReactNode) => <RequireRole allow="admin">{el}</RequireRole>

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <RestaurantsProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <FavoritesProvider>
                <ScrollToTop />
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/restaurants" element={<Restaurants />} />
                      <Route path="/map" element={<MapPage />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/restaurant/:slug" element={<RestaurantDetail />} />
                      <Route path="/r/:slug" element={<QrRedirect />} />
                      <Route path="/menu/:slug" element={<QrRedirect />} />
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
                      <Route path="*" element={<Navigate to="/" replace />} />
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
                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Route>
                    <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </Suspense>
              </FavoritesProvider>
            </BrowserRouter>
          </RestaurantsProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
