import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../lib/firebase'
import type { ImageKind } from '../data/types'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const MAX_DIMENSION: Record<ImageKind, number> = { cover: 2000, gallery: 1800, menu: 900, logo: 600 }

export interface UploadResult {
  url: string
  path: string
}

// Layout: restaurants/{restaurantId}/{cover|gallery|menu|logo}/{timestamp}-{name}
// storage.rules: public read; writes by admins or managers of that restaurant only.
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
  const task = uploadBytesResumable(ref(storage, path), blob, {
    contentType: blob.type || file.type,
    cacheControl: 'public, max-age=31536000',
  })

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path })
    )
  })
}

export function isStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('/v0/b/')
}

/** Deletes an uploaded file by its download URL. External URLs (e.g. demo images) are ignored. */
export async function deleteImageByUrl(url: string): Promise<void> {
  if (!isStorageUrl(url)) return
  try {
    await deleteObject(ref(storage, url))
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[urigod] could not delete image', error)
  }
}

export async function deleteStorageFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path))
}
