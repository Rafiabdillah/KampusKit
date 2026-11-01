import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Radio, Signal, Battery, BatteryCharging, Compass, 
  Clock, Share2, ExternalLink, Copy, Check, AlertTriangle, 
  ShieldCheck, Eye, Locate, RefreshCw, Trash2, Layers, 
  Send, Smartphone, Sparkles, LogIn, ChevronRight, Activity,
  Heart, MessageCircle, Navigation as NavIcon, User, Users,
  CheckCheck, Smile, Bell, Edit3, Route, PhoneCall, Volume2,
  Zap, Key, Link as LinkIcon, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth, db, signInWithPopup, googleProvider } from '../services/firebase';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { StorageService } from '../services/storage';
import { useStore } from '../store/useStore';
import { LiveLocationData, PartnerMessage, GeofenceZone } from '../types';
import { audioService } from '../services/audio';
import { gpsTrackerService, GpsPowerMode } from '../services/gpsTrackerService';
import { BackgroundPermissionModal } from './BackgroundPermissionModal';
import { GeofenceManagerModal } from './GeofenceManagerModal';
import { LovePingOverlay } from './LovePingOverlay';
import { 
  DEFAULT_GEOFENCE_ZONES, 
  getActiveZone, 
  getMovementState, 
  getGoogleMapsDirectionsUrl 
} from '../utils/geoUtils';

const ACTIVITY_PRESETS = [
  'Di Gedung Kuliah / Kelas',
  'Di Perpustakaan Kampus',
  'Di Laboratorium Praktikum',
  'Di Kantin / Makan Siang',
  'Di Kosan / Asrama',
  'OTW / Sedang di Jalan',
  'Di Ruang Himpunan / BEM',
  'Olahraga di Lapangan'
];

const QUICK_MESSAGES = [
  'Lagi di mana sekarang? 📍',
  'Aku sudah sampai lokasi dengan aman ya! 📍',
  'Sedang ada kelas kuliah / praktikum 📚',
  'Lagi di jalan menuju kampus / pulang 🛵',
  'Kondisi aman, tenang, dan sehat selalu ✨',
  'Minta tolong jemput di titik lokasi ini ya! 🚨'
];

// Calculate Distance between two LatLng (Haversine formula in meters)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 50) return 'Di lokasi yang sama (sangat dekat) ❤️';
  if (meters < 1000) return `${Math.round(meters)} meter`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export const LocationTracker: React.FC = () => {
  const userProfile = useStore(state => state.userProfile);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Device Role: 'primary' (Rafi / Cowok) vs 'secondary' (Ayang / Cewek)
  const [deviceRole, setDeviceRole] = useState<'primary' | 'secondary'>(() => {
    return (localStorage.getItem('partner_tracker_role') as 'primary' | 'secondary') || 'primary';
  });

  const [primaryName, setPrimaryName] = useState<string>(() => {
    return localStorage.getItem('partner_primary_name') || userProfile?.name || 'Mahasiswa (Pengguna)';
  });
  const [secondaryName, setSecondaryName] = useState<string>(() => {
    return localStorage.getItem('partner_secondary_name') || 'Orang Tua / Teman';
  });

  // Modal edit name
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [editPrimaryInput, setEditPrimaryInput] = useState<string>(primaryName);
  const [editSecondaryInput, setEditSecondaryInput] = useState<string>(secondaryName);

  // Power Mode & GPS Room Pairing States
  const [powerMode, setPowerMode] = useState<GpsPowerMode>(() => gpsTrackerService.getState().powerMode);
  const [roomId, setRoomId] = useState<string>(() => gpsTrackerService.getState().roomId || currentUser?.uid || '');
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [pairCodeInput, setPairCodeInput] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [movementSpeed, setMovementSpeed] = useState<number>(0);
  const [isStationary, setIsStationary] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'map' | 'chat'>('map');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastIntervalSec, setBroadcastIntervalSec] = useState<number>(30);
  const [statusNote, setStatusNote] = useState<string>('Di Kampus');

  // Both Location states
  const [primaryLocation, setPrimaryLocation] = useState<LiveLocationData | null>(null);
  const [secondaryLocation, setSecondaryLocation] = useState<LiveLocationData | null>(null);

  // Chat state
  const [messages, setMessages] = useState<PartnerMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);
  const [showHistoryTrail, setShowHistoryTrail] = useState<boolean>(true);
  const [showBackgroundModal, setShowBackgroundModal] = useState<boolean>(false);

  // Geofence Zones state
  const [zones, setZones] = useState<GeofenceZone[]>(() => {
    return StorageService.getItem<GeofenceZone[]>('geofence_zones_cache', DEFAULT_GEOFENCE_ZONES);
  });
  const [showGeofenceModal, setShowGeofenceModal] = useState<boolean>(false);

  // Love Ping & SOS states
  const [showLovePingOverlay, setShowLovePingOverlay] = useState<boolean>(false);
  const [lovePingSender, setLovePingSender] = useState<string>('');
  const [latestSos, setLatestSos] = useState<PartnerMessage | null>(null);

  // References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const primaryMarkerRef = useRef<L.Marker | null>(null);
  const secondaryMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const historyPolylineRef = useRef<L.Polyline | null>(null);
  const geofenceCirclesRef = useRef<L.Circle[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const broadcastIntervalRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const lastKnownMsgIdRef = useRef<string | null>(null);

  // Current active profile names
  const currentDeviceName = deviceRole === 'primary' ? primaryName : secondaryName;
  const partnerDeviceName = deviceRole === 'primary' ? secondaryName : primaryName;

  // Persist role change
  const handleSelectRole = (newRole: 'primary' | 'secondary') => {
    setDeviceRole(newRole);
    gpsTrackerService.setRole(newRole);
    audioService.playAmbientClick();
  };

  const handleSaveNames = () => {
    const pName = editPrimaryInput.trim() || 'Mahasiswa (Pengguna)';
    const sName = editSecondaryInput.trim() || 'Orang Tua / Teman';
    setPrimaryName(pName);
    setSecondaryName(sName);
    gpsTrackerService.setNames(pName, sName);
    setShowNameModal(false);
    audioService.playAmbientClick();
  };

  // URL Query Parameters: Auto-connect to Room & set Role when opened via shared link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('gps_room');
    const roleParam = urlParams.get('role');

    if (roomParam) {
      const clean = roomParam.trim().toUpperCase();
      setRoomId(clean);
      gpsTrackerService.setRoomId(clean);
    }
    if (roleParam === 'primary' || roleParam === 'secondary') {
      handleSelectRole(roleParam);
    }
  }, []);

  // Monitor Auth & sync to GPS service
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      gpsTrackerService.updateUser(user);
      if (user && !roomId) {
        setRoomId(user.uid);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to persistent background GPS Tracker Service
  useEffect(() => {
    const unsub = gpsTrackerService.subscribe((gpsState) => {
      setIsBroadcasting(gpsState.isBroadcasting);
      setIsLocating(gpsState.isLocating);
      setPowerMode(gpsState.powerMode);
      setMovementSpeed(gpsState.movementSpeed);
      setIsStationary(gpsState.isStationary);
      if (gpsState.roomId) {
        setRoomId(gpsState.roomId);
      }
      if (gpsState.errorMsg) {
        setErrorMsg(gpsState.errorMsg);
      } else {
        setErrorMsg(null);
      }
      if (gpsState.currentLocation) {
        if (gpsState.role === 'primary') {
          setPrimaryLocation(gpsState.currentLocation);
        } else {
          setSecondaryLocation(gpsState.currentLocation);
        }
      }
      if (gpsState.batteryLevel !== null) {
        setBatteryInfo({
          level: gpsState.batteryLevel,
          charging: gpsState.isCharging
        });
      }
    });
    return () => unsub();
  }, []);

  // Monitor Battery API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  // Firestore Sync: Listen to shared gps_rooms & fallback user store
  useEffect(() => {
    const activeRoomId = roomId || currentUser?.uid;

    if (!currentUser && !activeRoomId) {
      const localPrimary = StorageService.getItem<LiveLocationData | null>('loc_primary_cache', null);
      const localSecondary = StorageService.getItem<LiveLocationData | null>('loc_secondary_cache', null);
      const localChat = StorageService.getItem<PartnerMessage[]>('partner_chat_cache', []);
      if (localPrimary) setPrimaryLocation(localPrimary);
      if (localSecondary) setSecondaryLocation(localSecondary);
      if (localChat) setMessages(localChat);
      return;
    }

    const unsubscribers: Array<() => void> = [];

    // Helper: process incoming partner chat & sound alerts
    const handleIncomingChatMessages = (parsed: PartnerMessage[]) => {
      setMessages(parsed);
      StorageService.setItem('partner_chat_cache', parsed);

      if (parsed.length > 0) {
        const latest = parsed[parsed.length - 1];
        if (latest.id !== lastKnownMsgIdRef.current) {
          if (latest.senderRole !== deviceRole) {
            if (latest.type === 'LOVE_PING') {
              audioService.playLovePing();
              setLovePingSender(latest.senderName);
              setShowLovePingOverlay(true);
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (err) { void err; }
              }
            } else if (latest.type === 'SOS_ALERT') {
              audioService.playSosAlert();
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (err) { void err; }
              }
            } else {
              audioService.playPartnerPing();
            }
          }
          lastKnownMsgIdRef.current = latest.id;
        }
      }
    };

    // 1. Shared GPS Room Listener (Allows 2 phones with different Google accounts or guest link to sync in real time)
    if (activeRoomId && currentUser) {
      try {
        const unsubRoom = onSnapshot(doc(db, 'gps_rooms', activeRoomId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.primaryLocation) {
              try {
                const parsed = typeof data.primaryLocation === 'string' ? JSON.parse(data.primaryLocation) : data.primaryLocation;
                setPrimaryLocation(parsed);
                StorageService.setItem('loc_primary_cache', parsed);
              } catch (err) { void err; }
            }
            if (data.secondaryLocation) {
              try {
                const parsed = typeof data.secondaryLocation === 'string' ? JSON.parse(data.secondaryLocation) : data.secondaryLocation;
                setSecondaryLocation(parsed);
                StorageService.setItem('loc_secondary_cache', parsed);
              } catch (err) { void err; }
            }
            if (data.messages) {
              try {
                const parsed = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages;
                if (Array.isArray(parsed)) {
                  handleIncomingChatMessages(parsed);
                }
              } catch (err) { void err; }
            }
            if (data.geofenceZones) {
              try {
                const parsed = typeof data.geofenceZones === 'string' ? JSON.parse(data.geofenceZones) : data.geofenceZones;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setZones(parsed);
                  StorageService.setItem('geofence_zones_cache', parsed);
                }
              } catch (err) { void err; }
            }
            if (data.primaryName && data.primaryName !== primaryName) {
              setPrimaryName(data.primaryName);
            }
            if (data.secondaryName && data.secondaryName !== secondaryName) {
              setSecondaryName(data.secondaryName);
            }
          }
        }, (err) => {
          console.warn('[GPS Sync] Room listener notice:', err.message);
        });
        unsubscribers.push(unsubRoom);
      } catch (e) {
        console.warn('Room listener init notice:', e);
      }
    }

    // 2. Fallback User Store Listeners (for single-account usage)
    if (currentUser) {
      const unsubPrimary = onSnapshot(doc(db, 'users', currentUser.uid, 'store', 'loc_primary'), (docSnap) => {
        if (docSnap.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try {
            const parsed = JSON.parse(docSnap.data().value) as LiveLocationData;
            setPrimaryLocation(parsed);
            StorageService.setItem('loc_primary_cache', parsed);
          } catch {
            setPrimaryLocation(docSnap.data() as any);
          }
        }
      });
      unsubscribers.push(unsubPrimary);

      const unsubSecondary = onSnapshot(doc(db, 'users', currentUser.uid, 'store', 'loc_secondary'), (docSnap) => {
        if (docSnap.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try {
            const parsed = JSON.parse(docSnap.data().value) as LiveLocationData;
            setSecondaryLocation(parsed);
            StorageService.setItem('loc_secondary_cache', parsed);
          } catch {
            setSecondaryLocation(docSnap.data() as any);
          }
        }
      });
      unsubscribers.push(unsubSecondary);

      const unsubChat = onSnapshot(doc(db, 'users', currentUser.uid, 'store', 'partner_chat'), (docSnap) => {
        if (docSnap.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try {
            const parsed = JSON.parse(docSnap.data().value) as PartnerMessage[];
            if (Array.isArray(parsed)) {
              handleIncomingChatMessages(parsed);
            }
          } catch (err) { void err; }
        }
      });
      unsubscribers.push(unsubChat);

      const unsubZones = onSnapshot(doc(db, 'users', currentUser.uid, 'store', 'geofence_zones'), (docSnap) => {
        if (docSnap.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try {
            const parsed = JSON.parse(docSnap.data().value) as GeofenceZone[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setZones(parsed);
              StorageService.setItem('geofence_zones_cache', parsed);
            }
          } catch (err) { void err; }
        }
      });
      unsubscribers.push(unsubZones);
    }

    // 3. Immediate one-shot pull on visibility/tab focus to guarantee zero-lag update
    const fetchLatestLocations = async () => {
      if (!currentUser) return;
      try {
        if (activeRoomId) {
          const roomSnap = await getDoc(doc(db, 'gps_rooms', activeRoomId));
          if (roomSnap.exists()) {
            const data = roomSnap.data();
            if (data.primaryLocation) {
              try { setPrimaryLocation(JSON.parse(data.primaryLocation)); } catch (err) { void err; }
            }
            if (data.secondaryLocation) {
              try { setSecondaryLocation(JSON.parse(data.secondaryLocation)); } catch (err) { void err; }
            }
            if (data.messages) {
              try { setMessages(JSON.parse(data.messages)); } catch (err) { void err; }
            }
          }
        }

        const [snapPrimary, snapSec] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid, 'store', 'loc_primary')),
          getDoc(doc(db, 'users', currentUser.uid, 'store', 'loc_secondary'))
        ]);
        if (snapPrimary.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try { setPrimaryLocation(JSON.parse(snapPrimary.data().value)); } catch (err) { void err; }
        }
        if (snapSec.exists() && (!activeRoomId || activeRoomId === currentUser.uid)) {
          try { setSecondaryLocation(JSON.parse(snapSec.data().value)); } catch (err) { void err; }
        }
      } catch (err) { void err; }
    };

    const pollInterval = setInterval(fetchLatestLocations, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestLocations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, deviceRole, roomId]);

  // Check for active SOS alert within last 30 minutes
  useEffect(() => {
    const sosMsg = [...messages].reverse().find(
      (m) => m.type === 'SOS_ALERT' && Date.now() - m.timestamp < 30 * 60 * 1000
    );
    setLatestSos(sosMsg || null);
  }, [messages]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Leaflet Map Init
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = primaryLocation?.latitude || secondaryLocation?.latitude || -6.2088;
    const initialLng = primaryLocation?.longitude || secondaryLocation?.longitude || 106.8456;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map tile layer style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapStyle === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    const newLayer = L.tileLayer(url, { maxZoom: 19, subdomains: 'abcd' }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Markers, Polyline, and History Breadcrumbs
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Helper create custom marker icon
    const createMarkerIcon = (
      role: 'primary' | 'secondary',
      label: string,
      isLive: boolean
    ) => {
      const isBoy = role === 'primary';
      const mainColor = isBoy ? 'bg-indigo-600 ring-indigo-500/40' : 'bg-rose-500 ring-rose-400/50';
      const iconEmoji = isBoy ? '👦' : '👧';

      return L.divIcon({
        className: 'custom-partner-marker',
        html: `
          <div class="relative flex flex-col items-center group -translate-x-1/2 -translate-y-full">
            <!-- Floating Bubble Label -->
            <div class="mb-1.5 px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md bg-zinc-950/90 border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
              <span class="text-xs">${iconEmoji}</span>
              <span class="text-[11px] font-bold text-white">${label}</span>
              ${isLive ? '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>' : ''}
            </div>

            <!-- Avatar Icon -->
            <div class="relative flex items-center justify-center">
              ${isLive ? `<div class="absolute -inset-2 ${isBoy ? 'bg-indigo-500/30' : 'bg-rose-500/30'} rounded-full animate-pulse"></div>` : ''}
              <div class="w-10 h-10 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-lg ${mainColor} ring-4">
                <span>${iconEmoji}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${isLive ? 'bg-emerald-500' : 'bg-zinc-600'}">
                <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
            </div>

            <!-- Pointer Triangle -->
            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] ${isBoy ? 'border-t-indigo-600' : 'border-t-rose-500'} -mt-0.5"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    // 1. Primary Marker (Rafi)
    if (primaryLocation) {
      const latLng: [number, number] = [primaryLocation.latitude, primaryLocation.longitude];
      const isLive = primaryLocation.isBroadcasting && (Date.now() - primaryLocation.timestamp < 180000);
      const icon = createMarkerIcon('primary', primaryName, isLive);

      if (!primaryMarkerRef.current) {
        primaryMarkerRef.current = L.marker(latLng, { icon }).addTo(map);
      } else {
        primaryMarkerRef.current.setLatLng(latLng);
        primaryMarkerRef.current.setIcon(icon);
      }
    } else if (primaryMarkerRef.current) {
      map.removeLayer(primaryMarkerRef.current);
      primaryMarkerRef.current = null;
    }

    // 2. Secondary Marker (Ayang)
    if (secondaryLocation) {
      const latLng: [number, number] = [secondaryLocation.latitude, secondaryLocation.longitude];
      const isLive = secondaryLocation.isBroadcasting && (Date.now() - secondaryLocation.timestamp < 180000);
      const icon = createMarkerIcon('secondary', secondaryName, isLive);

      if (!secondaryMarkerRef.current) {
        secondaryMarkerRef.current = L.marker(latLng, { icon }).addTo(map);
      } else {
        secondaryMarkerRef.current.setLatLng(latLng);
        secondaryMarkerRef.current.setIcon(icon);
      }
    } else if (secondaryMarkerRef.current) {
      map.removeLayer(secondaryMarkerRef.current);
      secondaryMarkerRef.current = null;
    }

    // 3. Polyline distance between both if both exist
    if (primaryLocation && secondaryLocation) {
      const p1: [number, number] = [primaryLocation.latitude, primaryLocation.longitude];
      const p2: [number, number] = [secondaryLocation.latitude, secondaryLocation.longitude];

      if (!polylineRef.current) {
        polylineRef.current = L.polyline([p1, p2], {
          color: '#f43f5e',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.8
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs([p1, p2]);
      }
    } else if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // 4. History trail polyline for current partner
    const activePartnerLoc = deviceRole === 'primary' ? secondaryLocation : primaryLocation;
    if (showHistoryTrail && activePartnerLoc?.history && activePartnerLoc.history.length > 1) {
      const trailCoords = activePartnerLoc.history.map(h => [h.latitude, h.longitude] as [number, number]);
      if (!historyPolylineRef.current) {
        historyPolylineRef.current = L.polyline(trailCoords, {
          color: deviceRole === 'primary' ? '#ec4899' : '#6366f1',
          weight: 2,
          opacity: 0.5,
          dashArray: '4, 6'
        }).addTo(map);
      } else {
        historyPolylineRef.current.setLatLngs(trailCoords);
      }
    } else if (historyPolylineRef.current) {
      map.removeLayer(historyPolylineRef.current);
      historyPolylineRef.current = null;
    }

    // 5. Geofence Zones Circles
    if (geofenceCirclesRef.current.length > 0) {
      geofenceCirclesRef.current.forEach((c) => map.removeLayer(c));
      geofenceCirclesRef.current = [];
    }

    zones.forEach((zone) => {
      const color =
        zone.category === 'CAMPUS'
          ? '#3b82f6'
          : zone.category === 'HOME'
          ? '#10b981'
          : zone.category === 'LIBRARY'
          ? '#f59e0b'
          : '#ec4899';

      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius,
        color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(map);

      circle.bindTooltip(`📍 ${zone.name} (${zone.radius}m)`, {
        permanent: false,
        direction: 'top',
        className: 'bg-zinc-950/90 text-white text-[11px] font-bold border border-white/10 rounded-lg px-2 py-1 shadow-md'
      });

      geofenceCirclesRef.current.push(circle);
    });
  }, [primaryLocation, secondaryLocation, primaryName, secondaryName, showHistoryTrail, deviceRole, zones]);

  // Reverse Geocoding helper
  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'id,en' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 3).join(',').trim();
        }
      }
    } catch (e) {
      console.warn('Geocoding notice:', e);
    }
    return `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Push Location update for current device role
  const pushLocationUpdate = async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;
    const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
    const heading = pos.coords.heading || null;
    const altitude = pos.coords.altitude || null;

    const currentLoc = deviceRole === 'primary' ? primaryLocation : secondaryLocation;
    let placeName = currentLoc?.placeName;
    if (!placeName || Math.abs((currentLoc?.latitude || 0) - lat) > 0.001) {
      placeName = await fetchAddress(lat, lng);
    }

    const newLocationData: LiveLocationData = {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
      role: deviceRole,
      holderName: currentDeviceName,
      deviceName: navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Laptop/Desktop',
      isBroadcasting: true,
      statusNote: statusNote || 'Sedang Aktif',
      placeName,
      batteryLevel: batteryInfo?.level || null,
      isCharging: batteryInfo?.charging || false,
      history: [
        { latitude: lat, longitude: lng, timestamp: Date.now(), placeName },
        ...(currentLoc?.history?.slice(0, 9) || [])
      ]
    };

    const docKey = deviceRole === 'primary' ? 'loc_primary' : 'loc_secondary';
    const cacheKey = deviceRole === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';

    if (deviceRole === 'primary') {
      setPrimaryLocation(newLocationData);
    } else {
      setSecondaryLocation(newLocationData);
    }
    StorageService.setItem(cacheKey, newLocationData);

    // Sync to Cloud Firestore
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', docKey);
        await setDoc(docRef, {
          value: JSON.stringify(newLocationData),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn(`Failed to update ${docKey} in cloud:`, err);
      }
    }
  };

  // Start Broadcasting with persistent background service
  const startBroadcasting = () => {
    setErrorMsg(null);
    audioService.playAmbientClick();
    const activeRoomId = roomId || currentUser?.uid;
    gpsTrackerService.startTracking({
      role: deviceRole,
      name: currentDeviceName,
      statusNote: statusNote,
      powerMode: powerMode,
      roomId: activeRoomId
    });
  };

  // Power mode selector handler
  const handleSelectPowerMode = (mode: GpsPowerMode) => {
    audioService.playAmbientClick();
    setPowerMode(mode);
    gpsTrackerService.setPowerMode(mode);
  };

  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // Join Room with PIN code
  const handleJoinRoom = async () => {
    const clean = pairCodeInput.trim().toUpperCase();
    if (!clean) return;
    setIsJoiningRoom(true);
    audioService.playAmbientClick();
    const result = await gpsTrackerService.joinRoom(clean);
    setIsJoiningRoom(false);
    if (result.success) {
      setRoomId(clean);
      setShowPairModal(false);
      setPairCodeInput('');
      audioService.playAmbientSuccess();
    } else {
      alert(result.message);
    }
  };

  // Generate new Room code
  const handleGenerateNewRoom = () => {
    audioService.playAmbientClick();
    const newCode = gpsTrackerService.generateRoomCode();
    setRoomId(newCode);
  };

  // Delete Room and Location Data
  const handleDeleteRoomAndData = async () => {
    const confirmed = confirm('Apakah Anda yakin ingin menghapus ruang ini dan seluruh data riwayat lokasi Anda? Tindakan ini tidak dapat dibatalkan.');
    if (!confirmed) return;
    setIsDeletingRoom(true);
    const res = await gpsTrackerService.deleteRoomAndLocationData();
    setIsDeletingRoom(false);
    setShowPairModal(false);
    setRoomId('');
    setPrimaryLocation(null);
    setSecondaryLocation(null);
    setMessages([]);
    if (res.success) {
      audioService.playAmbientSuccess();
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  // Copy 1-Tap Share Link for Partner / Parents
  const handleCopyShareLink = () => {
    const activeRoomId = roomId || currentUser?.uid || 'KMP-GPS';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?gps_room=${activeRoomId}&role=secondary`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedToast(true);
        audioService.playAmbientSuccess();
        setTimeout(() => setCopiedToast(false), 3000);
      }).catch(() => {});
    }
  };

  // Stop Broadcasting (Only when user explicitly clicks this button)
  const stopBroadcasting = async () => {
    audioService.playAmbientClick();
    await gpsTrackerService.stopTracking();
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string, withLocation?: boolean) => {
    const text = (textToSend || chatInput).trim();
    if (!text && !withLocation) return;

    const myCurrentLoc = deviceRole === 'primary' ? primaryLocation : secondaryLocation;

    const newMsg: PartnerMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderRole: deviceRole,
      senderName: currentDeviceName,
      text: text || (withLocation ? '📍 Membagikan titik lokasi saya saat ini' : ''),
      timestamp: Date.now(),
      locationAttachment: withLocation && myCurrentLoc ? {
        latitude: myCurrentLoc.latitude,
        longitude: myCurrentLoc.longitude,
        placeName: myCurrentLoc.placeName
      } : undefined
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setChatInput('');
    audioService.playAmbientClick();
    StorageService.setItem('partner_chat_cache', updatedMessages);

    const activeRoomId = roomId || currentUser?.uid;

    // Sync to Shared GPS Room
    if (activeRoomId && currentUser) {
      try {
        const roomRef = doc(db, 'gps_rooms', activeRoomId);
        setDoc(roomRef, {
          roomId: activeRoomId,
          messages: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        }, { merge: true }).catch(() => {});
      } catch (err) { void err; }
    }

    // Sync to user store for fallback
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', 'partner_chat');
        setDoc(docRef, {
          value: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        }).catch(() => {});
      } catch (err) {
        console.warn("Failed to send partner message:", err);
      }
    }
  };

  // Send Ping/Buzz to Partner
  const handleSendBuzz = () => {
    audioService.playPartnerPing();
    handleSendMessage(`🔔 *PING!* Memanggil ${partnerDeviceName}... ada pesan baru ❤️`);
  };

  // Send Love Ping with heart animation & audio
  const handleSendLovePing = async () => {
    audioService.playLovePing();
    setLovePingSender(currentDeviceName);
    setShowLovePingOverlay(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100, 50, 200]);
      } catch (err) {
        void err;
      }
    }

    const myCurrentLoc = deviceRole === 'primary' ? primaryLocation : secondaryLocation;
    const newMsg: PartnerMessage = {
      id: `love_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderRole: deviceRole,
      senderName: currentDeviceName,
      text: `✨ Mengirimkan sinyal ping perhatian untuk ${partnerDeviceName}!`,
      type: 'LOVE_PING',
      timestamp: Date.now(),
      locationAttachment: myCurrentLoc ? {
        latitude: myCurrentLoc.latitude,
        longitude: myCurrentLoc.longitude,
        placeName: myCurrentLoc.placeName
      } : undefined
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    StorageService.setItem('partner_chat_cache', updatedMessages);

    const activeRoomId = roomId || currentUser?.uid;
    if (activeRoomId && currentUser) {
      try {
        const roomRef = doc(db, 'gps_rooms', activeRoomId);
        setDoc(roomRef, {
          roomId: activeRoomId,
          messages: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        }, { merge: true }).catch(() => {});
      } catch (err) { void err; }
    }

    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', 'partner_chat');
        await setDoc(docRef, {
          value: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn("Failed to send love ping to firestore:", err);
      }
    }
  };

  // Send Emergency S.O.S Alert
  const handleSendSosAlert = async () => {
    const isConfirmed = confirm(`Kirimkan sinyal S.O.S DARURAT / BUTUH JEMPUT ke ${partnerDeviceName}?`);
    if (!isConfirmed) return;

    audioService.playSosAlert();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (err) {
        void err;
      }
    }

    const myCurrentLoc = deviceRole === 'primary' ? primaryLocation : secondaryLocation;
    const locText = myCurrentLoc?.placeName ? ` di ${myCurrentLoc.placeName}` : '';
    const newMsg: PartnerMessage = {
      id: `sos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderRole: deviceRole,
      senderName: currentDeviceName,
      text: `🚨 PERINGATAN DARURAT S.O.S! ${currentDeviceName} butuh bantuan atau jemput segera${locText}!`,
      type: 'SOS_ALERT',
      timestamp: Date.now(),
      locationAttachment: myCurrentLoc ? {
        latitude: myCurrentLoc.latitude,
        longitude: myCurrentLoc.longitude,
        placeName: myCurrentLoc.placeName
      } : undefined
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    StorageService.setItem('partner_chat_cache', updatedMessages);

    const activeRoomId = roomId || currentUser?.uid;
    if (activeRoomId && currentUser) {
      try {
        const roomRef = doc(db, 'gps_rooms', activeRoomId);
        setDoc(roomRef, {
          roomId: activeRoomId,
          messages: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        }, { merge: true }).catch(() => {});
      } catch (err) { void err; }
    }

    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', 'partner_chat');
        await setDoc(docRef, {
          value: JSON.stringify(updatedMessages),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn("Failed to send SOS alert to firestore:", err);
      }
    }
  };

  // Save Geofence Zones
  const handleSaveZones = async (newZones: GeofenceZone[]) => {
    setZones(newZones);
    StorageService.setItem('geofence_zones_cache', newZones);

    const activeRoomId = roomId || currentUser?.uid;
    if (activeRoomId && currentUser) {
      try {
        const roomRef = doc(db, 'gps_rooms', activeRoomId);
        setDoc(roomRef, {
          roomId: activeRoomId,
          geofenceZones: JSON.stringify(newZones),
          updatedAt: new Date()
        }, { merge: true }).catch(() => {});
      } catch (err) { void err; }
    }

    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', 'geofence_zones');
        await setDoc(docRef, {
          value: JSON.stringify(newZones),
          updatedAt: new Date()
        });
      } catch (e) {
        console.warn('Failed to sync geofence zones to cloud:', e);
      }
    }
  };

  // Clear Chat History
  const handleClearChat = async () => {
    if (!confirm('Hapus seluruh riwayat pesan obrolan ini?')) return;
    setMessages([]);
    StorageService.setItem('partner_chat_cache', []);
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'store', 'partner_chat');
        await setDoc(docRef, {
          value: JSON.stringify([]),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn("Error clearing chat:", err);
      }
    }
  };

  // Focus Map to Selected Target
  const handleFocus = (target: 'primary' | 'secondary' | 'both') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (target === 'primary' && primaryLocation) {
      map.setView([primaryLocation.latitude, primaryLocation.longitude], 17, { animate: true });
    } else if (target === 'secondary' && secondaryLocation) {
      map.setView([secondaryLocation.latitude, secondaryLocation.longitude], 17, { animate: true });
    } else if (target === 'both' && primaryLocation && secondaryLocation) {
      const bounds = L.latLngBounds([
        [primaryLocation.latitude, primaryLocation.longitude],
        [secondaryLocation.latitude, secondaryLocation.longitude]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  // Google Login
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      alert("Gagal login dengan Google: " + (error?.message || "Coba lagi"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Distance computation
  const hasBothLocations = !!(primaryLocation && secondaryLocation);
  const distanceMeters = hasBothLocations
    ? calculateDistanceMeters(
        primaryLocation!.latitude,
        primaryLocation!.longitude,
        secondaryLocation!.latitude,
        secondaryLocation!.longitude
      )
    : null;

  // Format relative time helper
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Belum pernah';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Baru saja';
    if (diffSec < 60) return `${diffSec} dtk lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} jam lalu`;
  };

  const isPrimaryLive = primaryLocation?.isBroadcasting && primaryLocation?.timestamp && (Date.now() - primaryLocation.timestamp < 180000);
  const isSecondaryLive = secondaryLocation?.isBroadcasting && secondaryLocation?.timestamp && (Date.now() - secondaryLocation.timestamp < 180000);

  return (
    <div className="min-h-full w-full max-w-6xl mx-auto p-4 md:p-6 animate-fade-in pb-20">
      
      {/* Top Banner & Device Identity Selector */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-emerald-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-sm relative">
            <Radio size={28} className="text-indigo-400 animate-pulse" />
            {(isPrimaryLive || isSecondaryLive) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                GPS
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Radio size={10} className="text-emerald-400" /> Live Tracking • Keamanan & Pemantauan
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Pantau posisi real-time, zona aman kampus/kos, dan sinyal darurat S.O.S dua arah agar orang tua, keluarga, atau teman terdekat dapat memantau keselamatan serta keberadaan Anda setiap saat.
            </p>
          </div>
        </div>

        {/* Current Device Identifier Switcher + Edit Button */}
        <div className="bg-zinc-900/90 border border-white/10 p-2 rounded-2xl shadow-xl flex flex-col gap-1.5 self-start md:self-auto">
          <div className="flex items-center justify-between px-1 gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              📱 HP Ini:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  audioService.playAmbientClick();
                  setShowBackgroundModal(true);
                }}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
                title="Buka pengaturan izin latar belakang & baterai HP"
              >
                <ShieldCheck size={11} /> Izin Background
              </button>
              <button
                onClick={() => {
                  audioService.playAmbientClick();
                  setShowPairModal(true);
                }}
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors"
                title="Hubungkan HP orang tua atau teman via Kode Hubung / Link"
              >
                <Share2 size={11} /> Hubungkan Teman/Ortu
              </button>
              <button
                onClick={() => {
                  setEditPrimaryInput(primaryName);
                  setEditSecondaryInput(secondaryName);
                  setShowNameModal(true);
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                <Edit3 size={10} /> Ubah Nama
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => handleSelectRole('primary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                deviceRole === 'primary'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>📱</span>
              <span className="max-w-[110px] truncate">{primaryName}</span>
            </button>
            <button
              onClick={() => handleSelectRole('secondary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                deviceRole === 'secondary'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>👥</span>
              <span className="max-w-[110px] truncate">{secondaryName}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Names Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNameModal(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 size={16} className="text-indigo-400" /> Kustomisasi Nama Perangkat
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">📱 HP Pengguna (Mahasiswa):</label>
                <input
                  type="text"
                  value={editPrimaryInput}
                  onChange={(e) => setEditPrimaryInput(e.target.value)}
                  placeholder="Contoh: Rafi / Mahasiswa"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">👥 HP Pemantau (Orang Tua / Teman / Pasangan):</label>
                <input
                  type="text"
                  value={editSecondaryInput}
                  onChange={(e) => setEditSecondaryInput(e.target.value)}
                  placeholder="Contoh: Ibu / Ayah / Sahabat"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNames}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Pairing & Link Share Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPairModal(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 size={18} className="text-purple-400" /> Hubungkan Teman / Orang Tua
              </h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Kedua HP dapat terhubung secara real-time walaupun menggunakan akun Google yang berbeda. Cukup bagikan link pelacakan atau masukkan Kode Hubung di bawah ini.
            </p>

            {/* Current Room Code */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Kode Hubung GPS Anda:</span>
                <span className="text-lg font-mono font-black text-purple-300 tracking-wider">
                  {roomId ? (roomId.length > 14 ? `${roomId.slice(0, 10)}...` : roomId) : 'Belum Ada Kode'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGenerateNewRoom}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold border border-white/10 transition-colors"
                  title="Buat kode acak baru"
                >
                  Acak Kode
                </button>
              </div>
            </div>

            {/* 1-Tap Copy Share Link Button */}
            <button
              onClick={handleCopyShareLink}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-98 transition-all"
            >
              {copiedToast ? (
                <>
                  <Check size={16} className="text-emerald-300" />
                  <span>Link Pelacakan Disalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  <span>Salin Link Pelacakan untuk Teman / Orang Tua</span>
                </>
              )}
            </button>

            {/* Enter Friend's Code */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="text-[11px] font-bold text-zinc-300 block">
                Atau Gabung ke Kode HP Teman / Orang Tua:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pairCodeInput}
                  onChange={(e) => setPairCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: KMP-7X9K2M4P8QRT"
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!pairCodeInput.trim() || isJoiningRoom}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isJoiningRoom ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <span>Hubungkan</span>
                  )}
                </button>
              </div>
            </div>

            {/* Delete Room and Location Data Button */}
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleDeleteRoomAndData}
                disabled={isDeletingRoom}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} className="text-rose-400" />
                <span>{isDeletingRoom ? 'Menghapus data...' : 'Hapus Ruang & Data Lokasi Saya'}</span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center mt-1">
                Menghapus ruang GPS cloud dan seluruh jejak lokasi Anda dari server dan perangkat.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowPairModal(false)}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Login Notice if not logged in */}
      {!currentUser && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Login Google untuk Sinkronisasi Antar HP</h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Login akun Google agar kedua perangkat dapat saling memantau titik lokasi, zona aman, dan bertukar kabar darurat secara real-time di latar belakang.
              </p>
            </div>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0"
          >
            <LogIn size={15} />
            {isAuthLoading ? 'Menghubungkan...' : 'Login Akun Google'}
          </button>
        </div>
      )}

      {/* SOS Emergency Banner if active */}
      {latestSos && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-600/25 via-rose-950/80 to-red-600/25 border-2 border-red-500 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                  🚨 PERINGATAN DARURAT S.O.S ({latestSos.senderName})
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatTimeAgo(latestSos.timestamp)}
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 leading-relaxed">
                {latestSos.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {latestSos.locationAttachment && (
              <a
                href={getGoogleMapsDirectionsUrl(
                  latestSos.locationAttachment.latitude,
                  latestSos.locationAttachment.longitude,
                  (deviceRole === 'primary' ? primaryLocation : secondaryLocation)?.latitude,
                  (deviceRole === 'primary' ? primaryLocation : secondaryLocation)?.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-red-600 font-black text-xs rounded-xl flex items-center gap-1.5 hover:bg-zinc-100 shadow-lg transition-all active:scale-95"
              >
                <NavIcon size={13} className="text-red-600" /> Buka Rute Jemput
              </a>
            )}
            <button
              onClick={() => setLatestSos(null)}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 text-xs transition-colors"
              title="Tutup banner darurat"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Distance & Status Ribbon */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pengguna (Mahasiswa) Card */}
        {(() => {
          const pZone = primaryLocation ? getActiveZone(primaryLocation.latitude, primaryLocation.longitude, zones) : null;
          const pMovement = getMovementState(primaryLocation?.speed, isPrimaryLive);
          return (
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              deviceRole === 'primary' 
                ? 'bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/30' 
                : 'bg-zinc-900/60 border-white/10'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📱</span>
                    <span className="text-xs font-bold text-white truncate max-w-[110px]">{primaryName}</span>
                    {deviceRole === 'primary' && (
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold shrink-0">HP Ini</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                    isPrimaryLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold animate-pulse' : 'bg-zinc-800 text-zinc-400 border-white/5'
                  }`}>
                    {isPrimaryLive ? '● Sedang Live' : formatTimeAgo(primaryLocation?.timestamp)}
                  </span>
                </div>

                {/* Status and Zone Badge */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <p className="text-xs text-zinc-200 font-medium truncate">
                    {primaryLocation?.statusNote || 'Belum siaran lokasi'}
                  </p>
                  {pZone && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck size={10} /> {pZone.name}
                    </span>
                  )}
                </div>

                {/* Movement state */}
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-2">
                  <span>{pMovement.icon}</span>
                  <span>{pMovement.text}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5">
                  <span className="truncate max-w-[170px]">{primaryLocation?.placeName || 'Titik belum tercatat'}</span>
                  {primaryLocation?.batteryLevel && (
                    <span className={`flex items-center gap-1 font-mono ${primaryLocation.batteryLevel <= 20 ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                      {primaryLocation.batteryLevel}% {primaryLocation.isCharging && <BatteryCharging size={11} className="text-emerald-400" />}
                    </span>
                  )}
                </div>
              </div>

              {/* 1-Tap Google Maps Navigation if deviceRole is secondary */}
              {primaryLocation && deviceRole === 'secondary' && (
                <a
                  href={getGoogleMapsDirectionsUrl(
                    primaryLocation.latitude,
                    primaryLocation.longitude,
                    secondaryLocation?.latitude,
                    secondaryLocation?.longitude
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600/25 to-emerald-600/25 hover:from-indigo-600/40 hover:to-emerald-600/40 border border-indigo-500/30 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                >
                  <NavIcon size={12} className="text-indigo-400" />
                  <span>Navigasi Rute ke {primaryName}</span>
                </a>
              )}
            </div>
          );
        })()}

        {/* Center Distance Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900/80 to-indigo-950/40 border border-purple-500/20 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <NavIcon size={11} className="text-indigo-400" /> Jarak Dua Perangkat
          </span>
          {distanceMeters !== null ? (
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white tracking-tight">
                {formatDistance(distanceMeters)}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {distanceMeters < 50 ? 'Sedang bersama atau berdekatan ✨' : 'Terpantau saling terhubung'}
              </p>
              {primaryLocation && secondaryLocation && (
                <button
                  onClick={() => handleFocus('both')}
                  className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-[10px] font-bold transition-all active:scale-95"
                >
                  <Users size={11} /> Lihat Berdua di Peta
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Menunggu kedua HP menyiarkan koordinat GPS
            </p>
          )}
        </div>

        {/* Pemantau (Orang Tua / Teman) Card */}
        {(() => {
          const sZone = secondaryLocation ? getActiveZone(secondaryLocation.latitude, secondaryLocation.longitude, zones) : null;
          const sMovement = getMovementState(secondaryLocation?.speed, isSecondaryLive);
          return (
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              deviceRole === 'secondary' 
                ? 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                : 'bg-zinc-900/60 border-white/10'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <span className="text-xs font-bold text-white truncate max-w-[110px]">{secondaryName}</span>
                    {deviceRole === 'secondary' && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">HP Ini</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                    isSecondaryLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold animate-pulse' : 'bg-zinc-800 text-zinc-400 border-white/5'
                  }`}>
                    {isSecondaryLive ? '● Sedang Live' : formatTimeAgo(secondaryLocation?.timestamp)}
                  </span>
                </div>

                {/* Status and Zone Badge */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <p className="text-xs text-zinc-200 font-medium truncate">
                    {secondaryLocation?.statusNote || 'Belum siaran lokasi'}
                  </p>
                  {sZone && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck size={10} /> {sZone.name}
                    </span>
                  )}
                </div>

                {/* Movement state */}
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-2">
                  <span>{sMovement.icon}</span>
                  <span>{sMovement.text}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5">
                  <span className="truncate max-w-[170px]">{secondaryLocation?.placeName || 'Titik belum tercatat'}</span>
                  {secondaryLocation?.batteryLevel && (
                    <span className={`flex items-center gap-1 font-mono ${secondaryLocation.batteryLevel <= 20 ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                      {secondaryLocation.batteryLevel}% {secondaryLocation.isCharging && <BatteryCharging size={11} className="text-emerald-400" />}
                    </span>
                  )}
                </div>
              </div>

              {/* 1-Tap Google Maps Navigation if deviceRole is primary */}
              {secondaryLocation && deviceRole === 'primary' && (
                <a
                  href={getGoogleMapsDirectionsUrl(
                    secondaryLocation.latitude,
                    secondaryLocation.longitude,
                    primaryLocation?.latitude,
                    primaryLocation?.longitude
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600/25 to-pink-600/25 hover:from-rose-600/40 hover:to-pink-600/40 border border-rose-500/30 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                >
                  <NavIcon size={12} className="text-rose-400" />
                  <span>Navigasi Rute ke {secondaryName}</span>
                </a>
              )}
            </div>
          );
        })()}
      </div>

      {/* Persistent Background GPS Status Banner & Live Metrics */}
      {isBroadcasting && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-teal-950/40 border border-emerald-500/30 text-emerald-300 text-xs shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">
                  GPS Latar Belakang Aktif ({currentDeviceName})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                  ● Berjalan Layaknya Google Maps
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {powerMode === 'smart' ? '⚡ Mode Cerdas' : powerMode === 'high_accuracy' ? '🚀 Presisi Tinggi' : '🍃 Ultra Hemat'}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] truncate flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-semibold text-emerald-400">
                  {movementSpeed > 2 ? `🛵 Bergerak ${movementSpeed} km/h` : '🟢 Diam di Tempat (Power Save Aktif)'}
                </span>
                <span>•</span>
                <span>Akurasi: ±{(deviceRole === 'primary' ? primaryLocation : secondaryLocation)?.accuracy || 10}m</span>
                {batteryInfo && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-amber-300">
                      Baterai: {batteryInfo.level}% {batteryInfo.charging && '⚡ Mengisi'}
                    </span>
                  </>
                )}
                {roomId && (
                  <>
                    <span>•</span>
                    <button
                      onClick={() => setShowPairModal(true)}
                      className="text-purple-300 hover:text-purple-200 underline font-mono text-[10px]"
                    >
                      Kode: {roomId.slice(0, 8)}
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => {
                audioService.playAmbientClick();
                setShowBackgroundModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5"
              title="Periksa izin baterai & status background"
            >
              <ShieldCheck size={13} />
              <span>Izin Latar Belakang</span>
            </button>
            <button
              onClick={stopBroadcasting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all active:scale-95"
            >
              Hentikan Siaran
            </button>
          </div>
        </div>
      )}

      {/* GPS Power Optimization Control Bar */}
      <div className="mb-4 p-3 rounded-2xl bg-zinc-900/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Zap size={12} className="text-amber-400" /> Mode Daya GPS:
          </span>
          <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/5">
            <button
              onClick={() => handleSelectPowerMode('smart')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                powerMode === 'smart'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Rekomendasi Google Maps: update 15s saat jalan/kendaraan, 60s saat diam di kelas/kos. Hemat baterai hingga 80%!"
            >
              <span>⚡ Cerdas (Google Maps)</span>
            </button>
            <button
              onClick={() => handleSelectPowerMode('high_accuracy')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                powerMode === 'high_accuracy'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Presisi tinggi: update setiap 10-15s dengan satelit GPS aktif."
            >
              <span>🚀 Presisi Tinggi</span>
            </button>
            <button
              onClick={() => handleSelectPowerMode('eco')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                powerMode === 'eco'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Ultra hemat baterai: update 90-120s, cocok untuk pemantauan seharian penuh."
            >
              <span>🍃 Ultra Hemat</span>
            </button>
          </div>
        </div>

        {/* Room Pairing Quick Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioService.playAmbientClick();
              setShowPairModal(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5"
          >
            <Share2 size={12} />
            <span>Kode Hubung: {roomId ? (roomId.length > 10 ? `${roomId.slice(0, 8)}...` : roomId) : 'Belum Ada'}</span>
          </button>
        </div>
      </div>

      {/* GPS Warning or Disconnected Banner */}
      {errorMsg && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 animate-bounce" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button
            onClick={startBroadcasting}
            className="shrink-0 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-all"
          >
            Coba Hubungkan GPS
          </button>
        </div>
      )}

      {/* Navigation Tab Toggle & Broadcast Controls */}
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('map'); audioService.playAmbientClick(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'map'
                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MapPin size={15} className="text-indigo-400" />
            <span>Peta Lokasi Bersama</span>
          </button>

          <button
            onClick={() => { setActiveTab('chat'); audioService.playAmbientClick(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageCircle size={15} className="text-indigo-400" />
            <span>Pesan & Obrolan</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-mono font-bold">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Action buttons: Love Ping, SOS, Geofence, Buzz & Broadcast */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleSendLovePing}
            className="px-3 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-95 transition-all"
            title="Kirim Ping Perhatian & getaran ke perangkat terhubung"
          >
            <Heart size={13} className="fill-white animate-pulse" />
            <span>Kirim Ping</span>
          </button>

          <button
            onClick={handleSendSosAlert}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all"
            title="Kirim sinyal darurat S.O.S butuh jemput/bantuan beserta koordinat GPS"
          >
            <AlertTriangle size={13} />
            <span>S.O.S Darurat</span>
          </button>

          <button
            onClick={() => setShowGeofenceModal(true)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-blue-300 hover:text-white rounded-xl border border-white/10 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Kelola zona aman kampus, kosan, dan lainnya"
          >
            <ShieldCheck size={13} className="text-blue-400" />
            <span className="hidden sm:inline">Zona Aman</span>
            <span className="px-1 py-0.2 bg-blue-500/20 text-blue-300 rounded text-[10px]">{zones.length}</span>
          </button>

          <button
            onClick={handleSendBuzz}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Kirim notifikasi panggil ke perangkat terhubung"
          >
            <Bell size={13} className="text-amber-400 animate-bounce" />
            <span className="hidden sm:inline">Panggil</span>
          </button>

          {!isBroadcasting ? (
            <button
              onClick={startBroadcasting}
              disabled={isLocating}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {isLocating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mencari GPS...</span>
                </>
              ) : (
                <>
                  <Radio size={14} className="animate-pulse" />
                  <span>Mulai Siarkan ({currentDeviceName})</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopBroadcasting}
              className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Hentikan Siaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Status & Activity Broadcast Settings */}
            <div className="glass-panel p-4 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-indigo-400" /> Status {currentDeviceName}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {isBroadcasting ? 'Broadcasting' : 'Standby'}
                </span>
              </div>

              {/* Status input */}
              <div className="space-y-2">
                <label className="text-[11px] text-zinc-400 font-medium">Aktivitas Sekarang:</label>
                <div className="flex gap-1 flex-wrap">
                  {ACTIVITY_PRESETS.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setStatusNote(p);
                        gpsTrackerService.setStatusNote(p);
                      }}
                      className={`px-2 py-0.5 text-[10px] rounded-lg border transition-all ${
                        statusNote === p
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                          : 'bg-zinc-800 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => {
                    setStatusNote(e.target.value);
                    gpsTrackerService.setStatusNote(e.target.value);
                  }}
                  placeholder="Ketik status Anda..."
                  className="w-full bg-zinc-800/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Quick Send Pin to Chat */}
              <button
                onClick={() => handleSendMessage(undefined, true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-blue-600/20 hover:from-indigo-600/30 hover:to-blue-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <MapPin size={13} />
                <span>Kirim Pin Titik Lokasi Saya ke Chat</span>
              </button>
            </div>

            {/* View & Focus Quick Buttons */}
            <div className="glass-panel p-4 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Fokuskan Tampilan Peta:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleFocus('both')}
                  disabled={!hasBothLocations}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-zinc-200 border border-white/5 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Users size={14} className="text-purple-400" />
                  <span className="text-[10px]">Keduanya</span>
                </button>
                <button
                  onClick={() => handleFocus('primary')}
                  disabled={!primaryLocation}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-zinc-200 border border-white/5 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <span className="text-xs">👦</span>
                  <span className="text-[10px] truncate">{primaryName}</span>
                </button>
                <button
                  onClick={() => handleFocus('secondary')}
                  disabled={!secondaryLocation}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-zinc-200 border border-white/5 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <span className="text-xs">👧</span>
                  <span className="text-[10px] truncate">{secondaryName}</span>
                </button>
              </div>

              {/* Toggle Route Breadcrumbs */}
              <div className="pt-1 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Route size={13} /> Jejak Rute Perjalanan
                </span>
                <button
                  onClick={() => setShowHistoryTrail(!showHistoryTrail)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    showHistoryTrail ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-zinc-800 text-zinc-500 border-white/5'
                  }`}
                >
                  {showHistoryTrail ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Direct External Navigation */}
              {secondaryLocation && deviceRole === 'primary' && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${secondaryLocation.latitude},${secondaryLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  <ExternalLink size={13} /> Rute Navigasi ke Lokasi {secondaryName}
                </a>
              )}
              {primaryLocation && deviceRole === 'secondary' && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${primaryLocation.latitude},${primaryLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  <ExternalLink size={13} /> Rute Navigasi ke Lokasi {primaryName}
                </a>
              )}
            </div>

            {/* Quick Chat Teaser Card */}
            <div className="glass-panel p-4 rounded-3xl border border-white/10 bg-zinc-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-rose-400" /> Pesan Terakhir
                </span>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
                >
                  Buka Chat <ChevronRight size={12} />
                </button>
              </div>
              {messages.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                    {messages[messages.length - 1].senderName}:
                  </span>
                  <p className="text-zinc-200 line-clamp-2">
                    {messages[messages.length - 1].text}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Belum ada obrolan pesan.</p>
              )}
            </div>

          </div>

          {/* Right Map Canvas (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            
            {/* Map Controls Top Bar */}
            <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-400" />
                <span className="text-xs font-bold text-white">Peta Pemantauan Posisi Real-time</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-white/5">
                  <button
                    onClick={() => setMapStyle('streets')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                      mapStyle === 'streets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Jalan
                  </button>
                  <button
                    onClick={() => setMapStyle('dark')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                      mapStyle === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Gelap
                  </button>
                  <button
                    onClick={() => setMapStyle('satellite')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                      mapStyle === 'satellite' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Satelit
                  </button>
                </div>

                <button
                  onClick={() => handleFocus('both')}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-white/5 transition-all"
                  title="Fokuskan Peta"
                >
                  <Locate size={15} />
                </button>
              </div>
            </div>

            {/* Leaflet Map Box */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 flex-1 min-h-[500px] lg:min-h-[580px]">
              <div ref={mapContainerRef} className="w-full h-full min-h-[500px] lg:min-h-[580px] z-0" />

              {/* Map Overlay Badge */}
              <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
                {isPrimaryLive && (
                  <div className="bg-zinc-950/80 backdrop-blur-md border border-indigo-500/30 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>👦 {primaryName} (Live GPS)</span>
                  </div>
                )}
                {isSecondaryLive && (
                  <div className="bg-zinc-950/80 backdrop-blur-md border border-rose-500/30 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>👧 {secondaryName} (Live GPS)</span>
                  </div>
                )}
              </div>

              {/* Bottom Distance & Summary Banner */}
              {hasBothLocations && distanceMeters !== null && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                        <Heart size={16} className="fill-rose-500/40" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          Garis Jarak: {formatDistance(distanceMeters)}
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {primaryLocation?.placeName || 'Posisi 1'} ↔ {secondaryLocation?.placeName || 'Posisi 2'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFocus('both')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                    >
                      <Users size={13} /> Lihat Keduanya
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Chat & Quick Pings Tab */
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Chat Container Card */}
          <div className="glass-panel rounded-3xl border border-white/10 bg-zinc-900/80 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white text-base shadow-md">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Obrolan & Kabar: {primaryName} & {secondaryName}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Kamu mengetik sebagai: <span className="font-bold text-indigo-300">{currentDeviceName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendBuzz}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  title="Kirim Bel Panggil ke Perangkat Terhubung"
                >
                  <Bell size={13} /> Panggil
                </button>
                <button
                  onClick={handleClearChat}
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Hapus riwayat obrolan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-zinc-950/20 to-black/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Smile size={24} />
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">Belum ada pesan obrolan.</p>
                  <p className="text-[11px] text-zinc-600 max-w-xs">
                    Kirim kabar atau bagikan pin titik lokasi Anda kepada keluarga atau teman di bawah ini!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === deviceRole;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-zinc-500 mb-1 px-1 font-mono">
                        {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      <div className={`max-w-[80%] rounded-2xl p-3 shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none'
                          : 'bg-zinc-800/90 text-zinc-100 border border-white/10 rounded-bl-none'
                      }`}>
                        <p className="text-xs leading-relaxed break-words">{msg.text}</p>

                        {/* Location Attachment Card inside Message */}
                        {msg.locationAttachment && (
                          <div className="mt-2 p-2.5 rounded-xl bg-black/30 border border-white/10 text-[11px] space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                              <MapPin size={13} />
                              <span>Titik Lokasi Terlampir</span>
                            </div>
                            {msg.locationAttachment.placeName && (
                              <p className="text-zinc-300 text-[10px]">{msg.locationAttachment.placeName}</p>
                            )}
                            <a
                              href={`https://www.google.com/maps?q=${msg.locationAttachment.latitude},${msg.locationAttachment.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:underline pt-0.5"
                            >
                              <ExternalLink size={11} /> Buka di Peta Google
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Messages Ribbon */}
            <div className="px-3 py-2 bg-zinc-950/70 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Pesan Cepat:</span>
              {QUICK_MESSAGES.map((qm, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qm)}
                  className="px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 text-[11px] whitespace-nowrap transition-all active:scale-95"
                >
                  {qm}
                </button>
              ))}
            </div>

            {/* Chat Input Box */}
            <div className="p-3 bg-zinc-950 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendMessage(undefined, true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 rounded-xl border border-white/5 transition-all"
                title="Kirim Lokasi Terkini Saya ke Chat"
              >
                <MapPin size={17} />
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={`Tulis pesan untuk ${partnerDeviceName}...`}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim()}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Background & Battery Permission Modal */}
      <BackgroundPermissionModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
      />

      {/* Geofence Manager Modal */}
      <GeofenceManagerModal
        isOpen={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
        zones={zones}
        onSaveZones={handleSaveZones}
        currentLocation={
          (deviceRole === 'primary' ? primaryLocation : secondaryLocation)
            ? {
                latitude: (deviceRole === 'primary' ? primaryLocation : secondaryLocation)!.latitude,
                longitude: (deviceRole === 'primary' ? primaryLocation : secondaryLocation)!.longitude
              }
            : undefined
        }
      />

      {/* Love Ping Fullscreen Heart Animation Overlay */}
      <LovePingOverlay
        isVisible={showLovePingOverlay}
        onClose={() => setShowLovePingOverlay(false)}
        senderName={lovePingSender}
      />

    </div>
  );
};
