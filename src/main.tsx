import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './index.css'
import App from './App.tsx'

// Fallback used by the server renderer: /index.html?route=/restaurants/x restores the real URL before the router starts.
const route = new URLSearchParams(window.location.search).get('route')
if (window.location.pathname.endsWith('/index.html') && route?.startsWith('/') && !route.startsWith('//')) {
  window.history.replaceState(null, '', route)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
