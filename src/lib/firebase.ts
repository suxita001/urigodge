import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase web config is public by design; access control is enforced by Security Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyCFWrceDRcQVQU8YiNZCDVSJzQcc67mbB4',
  authDomain: 'urigodge-90c46.firebaseapp.com',
  projectId: 'urigodge-90c46',
  storageBucket: 'urigodge-90c46.firebasestorage.app',
  messagingSenderId: '890108318550',
  appId: '1:890108318550:web:f69557edfd680ead977cf7',
  measurementId: 'G-NYWW8RCJBW',
}

export const usingEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const storage = getStorage(app)

if (usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
} else {
  isSupported()
    .then((supported) => {
      if (supported) getAnalytics(app)
    })
    .catch(() => {})
}
