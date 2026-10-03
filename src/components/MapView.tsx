import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { Restaurant, Coordinates } from '../data/types'

function pinIcon(active: boolean) {
  const size = active ? 44 : 36
  const fill = active ? '#C1652F' : '#3A5A40'
  return L.divIcon({
    className: 'urigod-pin',
    html: `
      <div style="width:${size}px;height:${size}px;transform:translate(-50%,-100%);filter:drop-shadow(0 4px 6px rgba(28,26,22,0.28));">
        <svg width="${size}" height="${size}" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 47C20 47 37 30.5 37 18C37 8.6 29.4 1 20 1C10.6 1 3 8.6 3 18C3 30.5 20 47 20 47Z" fill="${fill}" stroke="white" stroke-width="2"/>
          <circle cx="20" cy="18" r="7.5" fill="white"/>
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

function clusterIcon(count: number) {
  const size = count < 10 ? 40 : count < 30 ? 46 : 54
  return L.divIcon({
    className: 'urigod-cluster',
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:#3A5A40;color:#FAF7F1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${
      count < 10 ? 14 : 15
    }px;border:3px solid rgba(250,247,241,0.9);box-shadow:0 6px 16px rgba(28,26,22,0.28);">${count}</div>`,
    iconSize: [size, size],
  })
}

function FlyToController({ target, zoom }: { target?: Coordinates; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], zoom ?? 16, { duration: 0.9 })
    }
  }, [target, zoom, map])
  return null
}

interface MapViewProps {
  restaurants: Restaurant[]
  selectedId?: string
  onSelect: (r: Restaurant) => void
  focusTarget?: Coordinates
  focusZoom?: number
  center?: Coordinates
  zoom?: number
  className?: string
}

const TBILISI_CENTER: Coordinates = { lat: 41.7025, lng: 44.7925 }

export default function MapView({
  restaurants,
  selectedId,
  onSelect,
  focusTarget,
  focusZoom,
  center = TBILISI_CENTER,
  zoom = 13,
  className = '',
}: MapViewProps) {
  const mapRef = useRef(null)

  return (
    <div className={`relative isolate w-full h-full ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToController target={focusTarget} zoom={focusZoom} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster: { getChildCount: () => number }) => clusterIcon(cluster.getChildCount())}
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {restaurants.map((r) => (
            <Marker
              key={r.id}
              position={[r.coordinates.lat, r.coordinates.lng]}
              icon={pinIcon(r.id === selectedId)}
              eventHandlers={{ click: () => onSelect(r) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
