import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sized } from '../lib/image'

export default function RestaurantGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  function goTo(i: number) {
    const clamped = (i + images.length) % images.length
    setIndex(clamped)
    trackRef.current?.children[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'start' })
  }

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] md:h-[440px] bg-cream-2 overflow-hidden">
      <div ref={trackRef} className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((src, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-start">
            <img
              src={sized(src, 1600)}
              srcSet={src.includes('res.cloudinary.com') ? `${sized(src, 800)} 800w, ${sized(src, 1600)} 1600w` : undefined}
              sizes="100vw"
              alt={`${alt} ${i + 1}`}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-night/35 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur items-center justify-center text-ink shadow-card hover:bg-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur items-center justify-center text-ink shadow-card hover:bg-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
