import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair } from 'lucide-react'
import type { Coordinates } from '../../data/types'
import { TextInput } from '../ui/Inputs'

const pin = L.divIcon({
  className: 'urigod-pin',
  html: `<div style="width:40px;height:40px;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 6px rgba(28,26,22,0.28));"><svg width="40" height="40" viewBox="0 0 40 48" fill="none"><path d="M20 47C20 47 37 30.5 37 18C37 8.6 29.4 1 20 1C10.6 1 3 8.6 3 18C3 30.5 20 47 20 47Z" fill="#C1652F" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="7.5" fill="white"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

function ClickHandler({ onPick }: { onPick: (c: Coordinates) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }) })
  return null
}

function Recenter({ value }: { value: Coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (!map.getBounds().contains([value.lat, value.lng])) map.setView([value.lat, value.lng])
  }, [value, map])
  return null
}

function CoordField({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(value))
  const [synced, setSynced] = useState(value)
  // Adopt external changes (map click / drag) without clobbering what is being typed.
  if (synced !== value) {
    setSynced(value)
    if (Number(text) !== value) setText(String(value))
  }
  return (
    <TextInput
      label={label}
      inputMode="decimal"
      value={text}
      onValueChange={(v) => {
        setText(v)
        const n = Number(v)
        if (v.trim() !== '' && Number.isFinite(n)) onCommit(n)
      }}
    />
  )
}

export default function LocationPicker({ value, onChange }: { value: Coordinates; onChange: (c: Coordinates) => void }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <CoordField label="Latitude" value={value.lat} onCommit={(lat) => onChange({ ...value, lat })} />
        <CoordField label="Longitude" value={value.lng} onCommit={(lng) => onChange({ ...value, lng })} />
      </div>
      <p className="mt-3 mb-2 flex items-center gap-1.5 text-[12.5px] text-ink-faint">
        <Crosshair size={14} /> დააჭირე რუკაზე ან გადაათრიე პინი ზუსტი ლოკაციის ასარჩევად.
      </p>
      <div className="h-[280px] md:h-[340px] rounded-2xl overflow-hidden border border-border">
        <MapContainer center={[value.lat, value.lng]} zoom={15} minZoom={6} maxZoom={19} bounceAtZoomLimits={false} scrollWheelZoom className="w-full h-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} maxNativeZoom={19} />
          <ClickHandler onPick={onChange} />
          <Recenter value={value} />
          <Marker
            position={[value.lat, value.lng]}
            icon={pin}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = (e.target as L.Marker).getLatLng()
                onChange({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) })
              },
            }}
          />
        </MapContainer>
      </div>
    </div>
  )
}
