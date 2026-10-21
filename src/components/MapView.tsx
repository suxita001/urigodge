import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { Branch, Restaurant, Coordinates } from '../data/types'
import { distanceMeters } from '../lib/geo'

/** One pin on the map: a restaurant's main address or one of its branches. */
export interface MapPoint {
  key: string
  restaurant: Restaurant
  branch?: Branch
  coordinates: Coordinates
}

/**
 * Pins for a restaurant: its main address and each branch. A branch that sits on the main address
 * (often the "main branch" entry) is not drawn twice.
 */
export function mapPoints(r: Restaurant): MapPoint[] {
  const points: MapPoint[] = [{ key: r.id, restaurant: r, coordinates: r.coordinates }]
  for (const b of r.branches) {
    if (!b.coordinates || !Number.isFinite(b.coordinates.lat)) continue
    if (points.some((p) => distanceMeters(p.coordinates, b.coordinates) < 25)) continue
    points.push({ key: `${r.id}:${b.id}`, restaurant: r, branch: b, coordinates: b.coordinates })
  }
  return points
}
import type { UserLocation } from '../context/LocationContext'

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

const userIcon = L.divIcon({
  className: 'urigod-user',
  html: '<span class="urigod-user-pulse"></span><span class="urigod-user-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

/** Opens the map so that every given point is in view (used when a restaurant has several branches). */
function FitPoints({ points }: { points: Coordinates[] }) {
  const map = useMap()
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|')
  useEffect(() => {
    if (points.length < 2) return
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 15, animate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
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
  /** A specific pin (`restaurantId` or `restaurantId:branchId`); wins over selectedId. */
  selectedKey?: string
  /** Start with all pins in view instead of the given centre and zoom. */
  fitAll?: boolean
  onSelect: (r: Restaurant, branch?: Branch) => void
  focusTarget?: Coordinates
  focusZoom?: number
  userLocation?: UserLocation | null
  center?: Coordinates
  zoom?: number
  className?: string
}

const TBILISI_CENTER: Coordinates = { lat: 41.7025, lng: 44.7925 }
const MIN_ZOOM = 7
const MAX_ZOOM = 19
// Georgia with a generous margin; panning further only shows places the site does not cover.
const GEORGIA_BOUNDS: [[number, number], [number, number]] = [
  [39.6, 38.6],
  [44.8, 48.2],
]

export default function MapView({
  restaurants,
  selectedId,
  selectedKey,
  fitAll = false,
  onSelect,
  focusTarget,
  focusZoom,
  userLocation,
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
        // Hard stops at both ends: without them a pinch past the limit stretches the map and then
        // snaps back, which feels like the zoom is broken. 19 is the closest OpenStreetMap draws.
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        bounceAtZoomLimits={false}
        maxBounds={GEORGIA_BOUNDS}
        maxBoundsViscosity={0.85}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          keepBuffer={4}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={MAX_ZOOM}
        />
        {fitAll && <FitPoints points={restaurants.flatMap(mapPoints).map((p) => p.coordinates)} />}
        <FlyToController target={focusTarget} zoom={focusZoom} />
        {userLocation && (
          <>
            {userLocation.accuracy > 25 && userLocation.accuracy < 3000 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                interactive={false}
                pathOptions={{ color: '#2f6fed', weight: 1, opacity: 0.45, fillColor: '#2f6fed', fillOpacity: 0.1 }}
              />
            )}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} interactive={false} keyboard={false} zIndexOffset={1000} />
          </>
        )}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster: { getChildCount: () => number }) => clusterIcon(cluster.getChildCount())}
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {restaurants.flatMap(mapPoints).map((p) => (
            <Marker
              key={p.key}
              position={[p.coordinates.lat, p.coordinates.lng]}
              icon={pinIcon(selectedKey ? p.key === selectedKey : p.restaurant.id === selectedId && !p.branch)}
              eventHandlers={{ click: () => onSelect(p.restaurant, p.branch) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
