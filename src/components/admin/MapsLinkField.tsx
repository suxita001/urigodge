import { ExternalLink, MapPinned } from 'lucide-react'
import type { Coordinates } from '../../data/types'
import { coordsFromMapsUrl, isMapsUrl } from '../../lib/maps'
import { TextInput } from '../ui/Inputs'

/**
 * Google Maps place link. When a full link is pasted the pin moves to the place automatically;
 * short share links (maps.app.goo.gl) are kept as they are and the pin stays where it was set.
 */
export default function MapsLinkField({ value, onChange, onCoords }: { value?: string; onChange: (url: string | undefined) => void; onCoords: (c: Coordinates) => void }) {
  const v = value ?? ''
  const bad = v.trim() !== '' && !isMapsUrl(v)
  return (
    <div>
      <TextInput
        label={
          <span className="inline-flex items-center gap-1.5">
            <MapPinned size={14} /> Google Maps-ის ბმული
          </span>
        }
        placeholder="https://maps.app.goo.gl/…"
        value={v}
        onValueChange={(url) => {
          onChange(url.trim() || undefined)
          const c = isMapsUrl(url) ? coordsFromMapsUrl(url) : null
          if (c) onCoords(c)
        }}
        error={bad ? 'ეს Google Maps-ის ბმული არ არის.' : undefined}
        hint="Google Maps-ზე გახსენი ადგილი → „გაზიარება“ → „ბმულის კოპირება“. სტუმრებს „მარშრუტზე“ დაჭერით პირდაპირ ეს ადგილი გაეხსნებათ, სახელით და შეფასებებით. თუ ცარიელია, გაიხსნება ქვემოთ მონიშნული წერტილი."
      />
      {v && !bad && (
        <a href={v} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-green hover:underline">
          <ExternalLink size={13} /> ბმულის შემოწმება
        </a>
      )}
    </div>
  )
}
