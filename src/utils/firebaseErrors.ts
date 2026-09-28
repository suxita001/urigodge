import type { Lang, LocalizedText } from '../data/types'

const messages: Record<string, LocalizedText> = {
  'auth/invalid-credential': { ka: 'ელფოსტა ან პაროლი არასწორია.', en: 'Incorrect email or password.' },
  'auth/invalid-login-credentials': { ka: 'ელფოსტა ან პაროლი არასწორია.', en: 'Incorrect email or password.' },
  'auth/wrong-password': { ka: 'პაროლი არასწორია.', en: 'Incorrect password.' },
  'auth/user-not-found': { ka: 'ამ ელფოსტით მომხმარებელი ვერ მოიძებნა.', en: 'No account found with this email.' },
  'auth/email-already-in-use': { ka: 'ეს ელფოსტა უკვე რეგისტრირებულია.', en: 'This email is already registered.' },
  'auth/invalid-email': { ka: 'ელფოსტის ფორმატი არასწორია.', en: 'Invalid email address.' },
  'auth/missing-email': { ka: 'შეიყვანე ელფოსტა.', en: 'Please enter your email.' },
  'auth/missing-password': { ka: 'შეიყვანე პაროლი.', en: 'Please enter your password.' },
  'auth/weak-password': { ka: 'პაროლი ძალიან სუსტია.', en: 'The password is too weak.' },
  'auth/password-does-not-meet-requirements': { ka: 'პაროლი არ აკმაყოფილებს მოთხოვნებს.', en: 'The password does not meet the requirements.' },
  'auth/too-many-requests': {
    ka: 'ძალიან ბევრი მცდელობაა. გთხოვ, ცოტა ხანში სცადე თავიდან.',
    en: 'Too many attempts. Please try again in a little while.',
  },
  'auth/user-disabled': { ka: 'ეს ანგარიში დაბლოკილია.', en: 'This account has been disabled.' },
  'auth/network-request-failed': {
    ka: 'ქსელთან კავშირი ვერ მოხერხდა. შეამოწმე ინტერნეტი.',
    en: 'Network error. Please check your connection.',
  },
  'auth/requires-recent-login': {
    ka: 'უსაფრთხოების მიზნით, გთხოვ, თავიდან შეხვიდე ანგარიშზე.',
    en: 'For security, please sign in again.',
  },
  'auth/operation-not-allowed': {
    ka: 'ეს ავტორიზაციის მეთოდი ჯერ არ არის ჩართული.',
    en: 'This sign-in method is not enabled.',
  },
  'auth/popup-closed-by-user': { ka: 'ავტორიზაციის ფანჯარა დაიხურა.', en: 'The sign-in window was closed.' },
  'auth/configuration-not-found': {
    ka: 'ავტორიზაცია ჯერ არ არის კონფიგურირებული.',
    en: 'Authentication is not configured yet.',
  },
  'permission-denied': { ka: 'ამ მოქმედების უფლება არ გაქვს.', en: "You don't have permission to do this." },
  unavailable: { ka: 'სერვისი დროებით მიუწვდომელია. სცადე თავიდან.', en: 'Service temporarily unavailable. Try again.' },
  'not-found': { ka: 'მონაცემები ვერ მოიძებნა.', en: 'Data not found.' },
  'deadline-exceeded': { ka: 'მოთხოვნას ძალიან დიდი დრო დასჭირდა. სცადე თავიდან.', en: 'The request timed out. Try again.' },
  'storage/unauthorized': { ka: 'ფაილის ატვირთვის უფლება არ გაქვს.', en: "You don't have permission to upload this file." },
  'storage/canceled': { ka: 'ატვირთვა გაუქმდა.', en: 'Upload canceled.' },
  'storage/quota-exceeded': { ka: 'საცავის ლიმიტი ამოიწურა.', en: 'Storage quota exceeded.' },
}

const fallback: LocalizedText = {
  ka: 'რაღაც შეცდომა მოხდა. გთხოვ, სცადე თავიდან.',
  en: 'Something went wrong. Please try again.',
}

export function getFirebaseErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code.replace(/^firestore\//, '')
  }
  return undefined
}

export function getFirebaseErrorMessage(error: unknown, lang: Lang = 'ka', fallbackText?: string): string {
  const code = getFirebaseErrorCode(error)
  return (code && messages[code]?.[lang]) || fallbackText || fallback[lang]
}

export const SAVE_FAILED = 'ცვლილების შენახვა ვერ მოხერხდა.'
