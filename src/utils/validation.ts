import type { TranslationKey } from '../i18n/translations'

export const MIN_PASSWORD_LENGTH = 6

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateName(name: string): TranslationKey | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'val_name_required'
  if (trimmed.length < 2) return 'val_name_short'
  return undefined
}

export function validateEmail(email: string): TranslationKey | undefined {
  const trimmed = email.trim()
  if (!trimmed) return 'val_email_required'
  if (!EMAIL_RE.test(trimmed)) return 'val_email_invalid'
  return undefined
}

export function validatePassword(password: string, checkLength = true): TranslationKey | undefined {
  if (!password) return 'val_password_required'
  if (checkLength && password.length < MIN_PASSWORD_LENGTH) return 'val_password_short'
  return undefined
}

export function validatePasswordMatch(password: string, confirm: string): TranslationKey | undefined {
  if (!confirm) return 'val_password_required'
  if (password !== confirm) return 'val_password_mismatch'
  return undefined
}
