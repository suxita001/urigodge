import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../i18n/LanguageContext'
import { subscribeToFavorites, addFavorite, removeFavorite } from '../services/favoriteService'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import type { Favorite } from '../data/types'
import AuthPromptModal from '../components/AuthPromptModal'

export interface FavoritesContextValue {
  favorites: Favorite[]
  favoriteIds: Set<string>
  loading: boolean
  isFavorite: (restaurantId: string) => boolean
  toggleFavorite: (restaurantId: string) => Promise<void>
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const { lang } = useLanguage()
  const [state, setState] = useState<{ uid: string; favorites: Favorite[] } | null>(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(new Set<string>())
  const uid = currentUser?.uid

  useEffect(() => {
    if (!uid) return
    return subscribeToFavorites(
      uid,
      (favorites) => setState({ uid, favorites }),
      () => setState({ uid, favorites: [] })
    )
  }, [uid])

  const favorites = useMemo(() => (uid && state?.uid === uid ? state.favorites : []), [uid, state])
  const loading = !!uid && state?.uid !== uid
  const closePrompt = useCallback(() => setPromptOpen(false), [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(timer)
  }, [error])

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.restaurantId)), [favorites])
  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds])

  const toggleFavorite = useCallback(
    async (restaurantId: string) => {
      if (!uid) {
        setPromptOpen(true)
        return
      }
      if (pending.current.has(restaurantId)) return
      pending.current.add(restaurantId)
      try {
        if (favoriteIds.has(restaurantId)) await removeFavorite(uid, restaurantId)
        else await addFavorite(uid, restaurantId)
      } catch (err) {
        setError(getFirebaseErrorMessage(err, lang))
      } finally {
        pending.current.delete(restaurantId)
      }
    },
    [uid, favoriteIds, lang]
  )

  const value = useMemo(
    () => ({ favorites, favoriteIds, loading, isFavorite, toggleFavorite }),
    [favorites, favoriteIds, loading, isFavorite, toggleFavorite]
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <AuthPromptModal open={promptOpen} onClose={closePrompt} />
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="alert"
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[700] max-w-[calc(100vw-32px)] px-5 py-3 rounded-full bg-ink text-cream text-[13.5px] font-semibold shadow-card-hover"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </FavoritesContext.Provider>
  )
}
