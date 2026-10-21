import type { ImageKind } from '../data/types'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const MAX_DIMENSION: Record<ImageKind, number> = { cover: 2000, gallery: 1800, menu: 900, logo: 600, banner: 2560 }

// Cloudinary cloud name and unsigned upload preset are public by design (they only allow
// uploads into the preset's configured folder/rules, never reads of secrets); the account's
// API secret is never used here, so nothing sensitive is exposed by hardcoding these.
const CLOUDINARY_CLOUD_NAME = 'wkqchz1o'
const CLOUDINARY_UPLOAD_PRESET = 'urigod_unsigned'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

export interface UploadResult {
  url: string
  path: string
}

// Folder layout: restaurants/{restaurantId}/{cover|gallery|menu|logo|banner}/{timestamp}-{name}
export function restaurantImagePath(restaurantId: string, kind: ImageKind, fileName: string): string {
  const safeName = fileName.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9\-_]/g, '-').slice(0, 40) || 'image'
  return `restaurants/${restaurantId}/${kind}/${Date.now()}-${safeName}`
}

/** Downscales large photos and re-encodes them as WebP (JPEG fallback) before upload. */
export async function compressImage(file: File, maxDimension: number, quality = 0.85): Promise<Blob> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    const blob = (await encode('image/webp')) ?? (await encode('image/jpeg'))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export async function uploadRestaurantImage(
  restaurantId: string,
  kind: ImageKind,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) throw new Error('Only image files can be uploaded')
  const blob = await compressImage(file, MAX_DIMENSION[kind])
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('Image must be 5 MB or smaller')

  const path = restaurantImagePath(restaurantId, kind, file.name)
  const folder = path.slice(0, path.lastIndexOf('/'))
  const publicId = path.slice(path.lastIndexOf('/') + 1)

  const form = new FormData()
  form.append('file', blob, file.name)
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  form.append('folder', folder)
  form.append('public_id', publicId)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', CLOUDINARY_UPLOAD_URL)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({ url: data.secure_url as string, path })
        } else {
          reject(new Error(data?.error?.message || 'Upload failed'))
        }
      } catch {
        reject(new Error('Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(form)
  })
}

export function isStorageUrl(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

// Cloudinary deletion requires a signed request (API secret), which can never be exposed to
// the browser. Replaced/removed images are simply left orphaned in Cloudinary — harmless at
// this scale, and avoids standing up a backend just to sign delete requests.
export async function deleteImageByUrl(_url: string): Promise<void> {
  return
}

export async function deleteStorageFile(_path: string): Promise<void> {
  return
}

export class ImageLinkError extends Error {}

/**
 * Turns common share links into direct image links Cloudinary can download:
 * Google Drive (file must be shared as "anyone with the link"), Dropbox, and plain image URLs.
 * Page links that only show an image (Facebook/Instagram posts) are rejected with a hint.
 */
export function directImageUrl(raw: string): string {
  const s = raw.trim()
  let u: URL
  try {
    u = new URL(s)
  } catch {
    throw new ImageLinkError('ეს ბმული არ არის.')
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const id = u.pathname.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get('id')
    if (!id) throw new ImageLinkError('Google Drive-ის ბმულში ფაილი ვერ ვიპოვე — გამოიყენე ფაილის „ბმულის გაზიარება“.')
    return `https://drive.google.com/thumbnail?id=${id}&sz=w2560`
  }
  if (host.endsWith('dropbox.com')) {
    u.searchParams.delete('dl')
    u.searchParams.set('raw', '1')
    return u.toString()
  }
  if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host)) {
    throw new ImageLinkError('ეს პოსტის ბმულია და არა ფოტოსი. გახსენი ფოტო, დააჭირე მარჯვენა ღილაკს → „სურათის მისამართის კოპირება“ და ის ჩასვი.')
  }
  return u.toString()
}

/** Cloudinary downloads the picture itself, so links work even when the other site blocks browsers from copying it. */
export async function uploadRestaurantImageFromUrl(restaurantId: string, kind: ImageKind, link: string): Promise<UploadResult> {
  const src = directImageUrl(link)
  const path = restaurantImagePath(restaurantId, kind, 'link')
  const form = new FormData()
  form.append('file', src)
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  form.append('folder', path.slice(0, path.lastIndexOf('/')))
  form.append('public_id', path.slice(path.lastIndexOf('/') + 1))
  const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: form })
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null
  if (!res.ok || !data?.secure_url) {
    throw new ImageLinkError('ფოტო ამ ბმულიდან ვერ ჩამოვტვირთე. დარწმუნდი, რომ ბმული საჯაროა (Drive-ზე — „ნებისმიერს, ვისაც ბმული აქვს“) და პირდაპირ ფოტოზე მიუთითებს.')
  }
  return { url: data.secure_url, path }
}
