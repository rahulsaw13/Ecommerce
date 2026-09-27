import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

const storeIcon = L.icon({
  iconUrl: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24S32 28 32 16C32 7.2 24.8 0 16 0z" fill="#1a5c2e"/><circle cx="16" cy="15" r="6" fill="white"/><rect x="12" y="14" width="8" height="5" fill="#1a5c2e"/></svg>`),
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});

const agentIcon = L.icon({
  iconUrl: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24S32 28 32 16C32 7.2 24.8 0 16 0z" fill="#F5B800"/><circle cx="16" cy="15" r="6" fill="#1a5c2e"/><ellipse cx="16" cy="16" rx="5" ry="3" fill="#F5B800"/></svg>`),
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});

const customerIcon = L.icon({
  iconUrl: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24S32 28 32 16C32 7.2 24.8 0 16 0z" fill="#2563eb"/><circle cx="16" cy="13" r="4" fill="white"/><path d="M10 22c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white"/></svg>`),
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});

/**
 * Isolated Leaflet map component — no Google Maps, no API key.
 *
 * Props:
 *   storeLocation    { lat, lng }  — store pin (green)
 *   agentLocation    { lat, lng }  — delivery boy pin (yellow), optional
 *   customerLocation { lat, lng }  — customer pin (blue), optional
 *   height           string        — CSS height, default "400px"
 */
const DeliveryMap = ({ storeLocation, agentLocation, customerLocation, height = '400px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = agentLocation || customerLocation || storeLocation || { lat: 25.5, lng: 85.1 };
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    map.setView([center.lat, center.lng], 13);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Update markers whenever locations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = [];

    const setMarker = (key, loc, icon, popup) => {
      if (!loc || !loc.lat || !loc.lng) {
        if (markersRef.current[key]) { markersRef.current[key].remove(); delete markersRef.current[key]; }
        return;
      }
      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([loc.lat, loc.lng]);
      } else {
        markersRef.current[key] = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(popup);
      }
      bounds.push([loc.lat, loc.lng]);
    };

    setMarker('store', storeLocation, storeIcon, '<b>Store</b>');
    setMarker('agent', agentLocation, agentIcon, '<b>Delivery Agent</b>');
    setMarker('customer', customerLocation, customerIcon, '<b>Delivery Address</b>');

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
  }, [storeLocation, agentLocation, customerLocation]);

  return <div ref={mapRef} style={{ width: '100%', height, borderRadius: '8px', zIndex: 1 }} />;
};

export default DeliveryMap;
