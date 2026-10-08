import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, type Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Favorite } from '../data/types'

// Favorites are keyed by restaurant slug, which is also the Firestore restaurant doc ID.
const favoritesCol = (uid: string) => collection(db, 'users', uid, 'favorites')
const favoriteRef = (uid: string, restaurantId: string) => doc(db, 'users', uid, 'favorites', restaurantId)

export function subscribeToFavorites(
  uid: string,
  onChange: (favorites: Favorite[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    favoritesCol(uid),
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          restaurantId: d.id,
          createdAt: (d.data().createdAt as Timestamp | null)?.toDate?.() ?? null,
        }))
      ),
    (error) => onError?.(error)
  )
}

export async function addFavorite(uid: string, restaurantId: string): Promise<void> {
  await setDoc(favoriteRef(uid, restaurantId), { restaurantId, createdAt: serverTimestamp() })
}

export async function removeFavorite(uid: string, restaurantId: string): Promise<void> {
  await deleteDoc(favoriteRef(uid, restaurantId))
}
