import { useRef, useState, type ReactNode } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ImagePlus, RefreshCw, Trash2, GripVertical, UploadCloud } from 'lucide-react'
import type { ImageKind } from '../../data/types'
import { uploadRestaurantImage } from '../../services/storageService'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { useToast } from '../../hooks/useToast'

function useUploader(restaurantId: string, kind: ImageKind) {
  const toast = useToast()
  const [progress, setProgress] = useState<number | null>(null)

  async function upload(file: File): Promise<string | null> {
    setProgress(0)
    try {
      const { url } = await uploadRestaurantImage(restaurantId, kind, file, setProgress)
      return url
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error, 'ka', 'სურათის ატვირთვა ვერ მოხერხდა.'))
      return null
    } finally {
      setProgress(null)
    }
  }
  return { upload, progress }
}

function ProgressOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 bg-night/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-snow">
      <UploadCloud size={22} />
      <div className="w-2/3 h-1.5 rounded-full bg-white/25 overflow-hidden">
        <div className="h-full bg-snow transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[12px] font-bold">{progress}%</span>
    </div>
  )
}

interface ImageUploaderProps {
  restaurantId: string
  kind: ImageKind
  value?: string
  onChange: (url: string | undefined) => void
  label?: ReactNode
  aspect?: string
  hint?: string
}

export function ImageUploader({ restaurantId, kind, value, onChange, label, aspect = 'aspect-[16/9]', hint }: ImageUploaderProps) {
  const input = useRef<HTMLInputElement>(null)
  const { upload, progress } = useUploader(restaurantId, kind)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const url = await upload(file)
    if (url) onChange(url)
  }

  return (
    <div>
      {label && <p className="mb-1.5 text-[13px] font-semibold text-ink">{label}</p>}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
      {value ? (
        <div className={`relative ${aspect} rounded-2xl overflow-hidden border border-border bg-cream-2 group`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          {progress !== null && <ProgressOverlay progress={progress} />}
          {progress === null && (
            <div className="absolute bottom-2.5 right-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="h-9 px-3 rounded-full bg-white/95 text-ink text-[12.5px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-white"
              >
                <RefreshCw size={14} /> შეცვლა
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="w-9 h-9 rounded-full bg-white/95 text-terracotta flex items-center justify-center shadow-sm hover:bg-white"
                aria-label="წაშლა"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={progress !== null}
          className={`relative w-full ${aspect} rounded-2xl border-2 border-dashed border-border bg-white hover:border-green hover:bg-green-light/40 transition-colors flex flex-col items-center justify-center gap-2 text-ink-faint overflow-hidden`}
        >
          {progress !== null ? (
            <ProgressOverlay progress={progress} />
          ) : (
            <>
              <ImagePlus size={24} />
              <span className="text-[13px] font-semibold">სურათის ატვირთვა</span>
            </>
          )}
        </button>
      )}
      {hint && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
    </div>
  )
}

function GalleryTile({ url, onRemove }: { url: string; onRemove: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={url} dragListener={false} dragControls={controls} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-cream-2 list-none">
      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="absolute top-1.5 left-1.5 w-8 h-8 rounded-full bg-white/95 text-ink-soft flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing touch-none"
        aria-label="გადაადგილება"
      >
        <GripVertical size={15} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/95 text-terracotta flex items-center justify-center shadow-sm"
        aria-label="წაშლა"
      >
        <Trash2 size={14} />
      </button>
    </Reorder.Item>
  )
}

export function GalleryUploader({ restaurantId, value, onChange }: { restaurantId: string; value: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const { upload, progress } = useUploader(restaurantId, 'gallery')

  async function handleFiles(files: FileList | null) {
    if (!files) return
    let next = value
    for (const file of Array.from(files)) {
      const url = await upload(file)
      if (url) {
        next = [...next, url]
        onChange(next)
      }
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files).finally(() => (e.target.value = ''))} />
      <Reorder.Group axis="x" values={value} onReorder={onChange} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" as="ul">
        {value.map((url) => (
          <GalleryTile key={url} url={url} onRemove={() => onChange(value.filter((u) => u !== url))} />
        ))}
        <li className="list-none">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={progress !== null}
            className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-white hover:border-green hover:bg-green-light/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink-faint overflow-hidden"
          >
            {progress !== null ? (
              <ProgressOverlay progress={progress} />
            ) : (
              <>
                <ImagePlus size={22} />
                <span className="text-[12.5px] font-semibold">დამატება</span>
              </>
            )}
          </button>
        </li>
      </Reorder.Group>
    </div>
  )
}
