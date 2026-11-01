import { GeofenceZone } from '../types';

/**
 * Calculates distance between two GPS coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formats distance into human readable Indonesian string
 */
export const formatDistance = (km: number): string => {
  if (isNaN(km) || km < 0) return '0 m';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }
  return `${km.toFixed(1)} km`;
};

/**
 * Generates direct Google Maps Turn-by-Turn Navigation URL
 */
export const getGoogleMapsDirectionsUrl = (
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number
): string => {
  if (originLat !== undefined && originLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
};

/**
 * Checks if a coordinate is inside any defined geofence zone
 */
export const getActiveZone = (
  lat: number,
  lng: number,
  zones: GeofenceZone[]
): GeofenceZone | null => {
  for (const zone of zones) {
    const distKm = calculateDistanceKm(lat, lng, zone.latitude, zone.longitude);
    const radiusKm = zone.radius / 1000;
    if (distKm <= radiusKm) {
      return zone;
    }
  }
  return null;
};

/**
 * Derives movement activity status from speed (km/h)
 */
export const getMovementState = (
  speedKmh?: number | null,
  isLive?: boolean
): { label: string; icon: string; color: string } => {
  if (!isLive) {
    return { label: 'Offline / Terakhir Dilihat', icon: '⚪', color: 'text-zinc-400' };
  }
  if (speedKmh === undefined || speedKmh === null || speedKmh < 1.5) {
    return { label: 'Diam di Tempat', icon: '📍', color: 'text-emerald-400' };
  }
  if (speedKmh < 8) {
    return { label: `Jalan Kaki (${speedKmh} km/h)`, icon: '🚶', color: 'text-sky-400' };
  }
  if (speedKmh < 25) {
    return { label: `Bersepeda / Santai (${speedKmh} km/h)`, icon: '🚲', color: 'text-amber-400' };
  }
  return { label: `Berkendara (${speedKmh} km/h)`, icon: '🛵', color: 'text-indigo-400' };
};

/**
 * Default preset geofence zones
 */
export const DEFAULT_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'zone-campus',
    name: 'Gedung Kuliah / Kampus',
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 300,
    category: 'CAMPUS',
    notifyOnEntry: true
  },
  {
    id: 'zone-home-primary',
    name: 'Kosan / Rumah Rafi',
    latitude: -6.2105,
    longitude: 106.8420,
    radius: 150,
    category: 'HOME',
    notifyOnEntry: true
  },
  {
    id: 'zone-home-secondary',
    name: 'Rumah / Kosan (Keluarga & Teman)',
    latitude: -6.2150,
    longitude: 106.8480,
    radius: 150,
    category: 'HOME',
    notifyOnEntry: true
  },
  {
    id: 'zone-library',
    name: 'Perpustakaan Kampus',
    latitude: -6.2075,
    longitude: 106.8465,
    radius: 150,
    category: 'LIBRARY',
    notifyOnEntry: false
  }
];
