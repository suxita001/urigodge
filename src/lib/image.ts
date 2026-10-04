// Photos live on Cloudinary, which can resize and re-encode on the fly. Asking for the size a
// component actually shows (instead of the 1280px original) is the biggest page-speed win we have.

const MARKER = '/image/upload/'
// A leading transformation segment looks like "c_fill,w_1280,q_auto"; a version looks like "v1791038139".
const TRANSFORM = /^(?:[a-z]{1,3}_[^/,]+)(?:,[a-z]{1,3}_[^/,]+)*$/

/**
 * Returns the same image sized for display. `height` crops to that box; without it the image is
 * only scaled down. Non-Cloudinary URLs are returned unchanged.
 */
export function sized(url: string | undefined, width: number, height?: number): string {
  if (!url) return ''
  const at = url.indexOf(MARKER)
  if (at < 0 || !url.includes('res.cloudinary.com')) return url
  const head = url.slice(0, at + MARKER.length)
  const rest = url.slice(at + MARKER.length).split('/')
  if (rest.length > 1 && TRANSFORM.test(rest[0]) && !/^v\d+$/.test(rest[0])) rest.shift()
  const transform = height ? `c_fill,w_${width},h_${height},q_auto,f_auto` : `c_limit,w_${width},q_auto,f_auto`
  return `${head}${transform}/${rest.join('/')}`
}

/** `srcset` with 1x and 2x variants for sharp images on phone screens. */
export function srcSet(url: string | undefined, width: number, height?: number): string | undefined {
  if (!url || !url.includes('res.cloudinary.com')) return undefined
  return `${sized(url, width, height)} 1x, ${sized(url, width * 2, height ? height * 2 : undefined)} 2x`
}
