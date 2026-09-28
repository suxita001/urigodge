// Only allow same-origin relative paths so ?redirect= can't be abused as an open redirect.
export function getSafeRedirect(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

export function loginPathFor(currentPath: string): string {
  return `/login?redirect=${encodeURIComponent(currentPath)}`
}
