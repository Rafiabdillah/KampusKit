import { LiveLocationData } from '../types';
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { backgroundService } from './backgroundService';

export type GpsPowerMode = 'smart' | 'high_accuracy' | 'eco';

export interface GpsTrackerState {
  isBroadcasting: boolean;
  isLocating: boolean;
  currentLocation: LiveLocationData | null;
  errorMsg: string | null;
  role: 'primary' | 'secondary';
  deviceName: string;
  partnerName: string;
  statusNote: string;
  powerMode: GpsPowerMode;
  roomId: string;
  lastUpdated: number | null;
  lastPushTimestamp: number | null;
  batteryLevel: number | null;
  isCharging: boolean;
  isStationary: boolean;
  movementSpeed: number; // in km/h
}

type GpsSubscriber = (state: GpsTrackerState) => void;

// Helper: Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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

class GpsTrackerService {
  private subscribers: Set<GpsSubscriber> = new Set();
  private watchId: number | null = null;
  private heartbeatWorker: Worker | null = null;
  private currentUser: User | null = null;
  private lastUpdateTimestamp: number = 0;
  private lastPushTimestamp: number = 0;
  private lastPushedCoords: { lat: number; lng: number } | null = null;
  private lastGeocodedCoord: { lat: number; lng: number; placeName: string; time: number } | null = null;
  private isGeocoding: boolean = false;
  private consecutiveErrors: number = 0;

  private state: GpsTrackerState = {
    isBroadcasting: false,
    isLocating: false,
    currentLocation: null,
    errorMsg: null,
    role: (localStorage.getItem('partner_tracker_role') as 'primary' | 'secondary') || 'primary',
    deviceName: localStorage.getItem('partner_primary_name') || 'Mahasiswa (Pengguna)',
    partnerName: localStorage.getItem('partner_secondary_name') || 'Orang Tua / Teman',
    statusNote: localStorage.getItem('kampuskit_gps_status_note') || 'Sedang Aktif',
    powerMode: (localStorage.getItem('kampuskit_gps_powermode') as GpsPowerMode) || 'smart',
    roomId: localStorage.getItem('kampuskit_gps_room_id') || '',
    lastUpdated: null,
    lastPushTimestamp: null,
    batteryLevel: null,
    isCharging: false,
    isStationary: true,
    movementSpeed: 0,
  };

  constructor() {
    this.initBatteryListener();
    this.initVisibilityListener();
    this.initHeartbeatWorker();

    // Load initial cached location if available
    const cacheKey = this.state.role === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        this.state.currentLocation = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Could not parse cached location:', e);
    }
  }

  // Dedicated Web Worker Heartbeat:
  // Operates on a separate background thread to bypass standard DOM timer throttling
  // when screen is locked or phone is in pocket
  private initHeartbeatWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;
    try {
      const code = `
        var timer = null;
        var intervalMs = 20000;
        self.onmessage = function(e) {
          if (e.data && e.data.cmd === 'start') {
            if (timer) clearInterval(timer);
            intervalMs = e.data.interval || 20000;
            timer = setInterval(function() {
              self.postMessage('tick');
            }, intervalMs);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      this.heartbeatWorker = new Worker(URL.createObjectURL(blob));
      this.heartbeatWorker.onmessage = (e) => {
        if (e.data === 'tick' && this.state.isBroadcasting) {
          this.handleHeartbeatTick();
        }
      };
    } catch (e) {
      console.warn('[GPS Service] Heartbeat worker note:', e);
    }
  }

  // Update heartbeat worker interval based on current movement and power mode
  private updateWorkerInterval() {
    if (!this.heartbeatWorker) return;
    let intervalMs: number;

    if (this.state.powerMode === 'eco') {
      intervalMs = this.state.isStationary ? 90000 : 30000;
    } else if (this.state.powerMode === 'high_accuracy') {
      intervalMs = 12000;
    } else {
      // 'smart' (Google Maps style)
      intervalMs = this.state.isStationary ? 60000 : 18000;
    }

    try {
      this.heartbeatWorker.postMessage({ cmd: 'start', interval: intervalMs });
    } catch {
      // ignore
    }
  }

  // Initialize service with Firebase User and auto-resume if active
  public init(user: User | null) {
    this.currentUser = user;
    if (!this.state.roomId && user) {
      this.state.roomId = user.uid;
    }
    const shouldBeBroadcasting = localStorage.getItem('kampuskit_gps_active') === 'true';

    if (shouldBeBroadcasting && !this.state.isBroadcasting) {
      console.log('🔄 [GPS Service] Auto-resuming persistent live GPS broadcast...');
      this.startTracking();
    }
  }

  public updateUser(user: User | null) {
    this.currentUser = user;
    if (!this.state.roomId && user) {
      this.state.roomId = user.uid;
    }
  }

  public getState(): GpsTrackerState {
    return { ...this.state };
  }

  public subscribe(callback: GpsSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.subscribers.forEach((cb) => cb(currentState));
  }

  // Battery monitoring
  private initBatteryListener() {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const newLevel = Math.round(battery.level * 100);
          const newCharging = battery.charging;
          const hasChanged = this.state.batteryLevel !== newLevel || this.state.isCharging !== newCharging;
          this.state.batteryLevel = newLevel;
          this.state.isCharging = newCharging;
          if (hasChanged) {
            this.notify();
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }

  // Handle tab switching & screen unlock
  private initVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state.isBroadcasting) {
        backgroundService.requestWakeLock().catch(() => {});
        this.updateWorkerInterval();
        // Ping position if stale (> 30s)
        if (Date.now() - this.lastUpdateTimestamp > 30000) {
          this.pingPosition(false);
        }
      }
    });

    window.addEventListener('focus', () => {
      if (this.state.isBroadcasting && Date.now() - this.lastUpdateTimestamp > 30000) {
        this.pingPosition(false);
      }
    });
  }

  // Reverse Geocoding with 150m & 5-minute smart throttle
  private async fetchAddress(lat: number, lng: number): Promise<string> {
    const now = Date.now();
    if (this.lastGeocodedCoord) {
      const dist = calculateDistanceMeters(this.lastGeocodedCoord.lat, this.lastGeocodedCoord.lng, lat, lng);
      // Reuse cached address if moved less than 150m and cached within last 5 minutes
      if (dist < 150 && now - this.lastGeocodedCoord.time < 300000) {
        return this.lastGeocodedCoord.placeName;
      }
    }

    if (this.isGeocoding) {
      return this.lastGeocodedCoord?.placeName || `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    this.isGeocoding = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'id,en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          const place = parts.slice(0, 3).join(',').trim();
          this.lastGeocodedCoord = { lat, lng, placeName: place, time: now };
          this.isGeocoding = false;
          return place;
        }
      }
    } catch {
      // Nominatim might timeout or rate-limit; ignore gracefully
    } finally {
      this.isGeocoding = false;
    }

    return this.lastGeocodedCoord?.placeName || `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  // Core Location Processor: Adaptive Battery-Aware Dispatcher
  private handlePositionUpdate(pos: GeolocationPosition) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy);
    const speed = pos.coords.speed !== null && pos.coords.speed !== undefined ? Math.round(pos.coords.speed * 3.6) : 0;
    const heading = pos.coords.heading || null;
    const altitude = pos.coords.altitude || null;

    this.consecutiveErrors = 0;
    this.lastUpdateTimestamp = Date.now();
    this.state.lastUpdated = this.lastUpdateTimestamp;
    this.state.errorMsg = null;
    this.state.isLocating = false;
    this.state.movementSpeed = speed;

    const prevLoc = this.state.currentLocation;

    // Movement detection using distance from last known point
    let distanceMoved = 0;
    if (prevLoc) {
      distanceMoved = calculateDistanceMeters(prevLoc.latitude, prevLoc.longitude, lat, lng);
    }

    // Determine stationary vs moving state:
    // Stationary: moved < 15m and speed < 2 km/h
    const wasStationary = this.state.isStationary;
    const isNowStationary = distanceMoved < 15 && speed < 2;
    this.state.isStationary = isNowStationary;

    // If movement state transitioned, adapt worker interval
    if (wasStationary !== isNowStationary) {
      this.updateWorkerInterval();
    }

    // Fast synchronous place name from cache or fallback
    let placeName = prevLoc?.placeName || `Koordinat ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (this.lastGeocodedCoord) {
      const dist = calculateDistanceMeters(this.lastGeocodedCoord.lat, this.lastGeocodedCoord.lng, lat, lng);
      if (dist < 150) {
        placeName = this.lastGeocodedCoord.placeName;
      }
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
      role: this.state.role,
      holderName: this.state.deviceName,
      deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Laptop/Desktop',
      isBroadcasting: true,
      statusNote: this.state.statusNote || 'Sedang Aktif',
      placeName,
      batteryLevel: this.state.batteryLevel,
      isCharging: this.state.isCharging,
      history: [
        { latitude: lat, longitude: lng, timestamp: Date.now(), placeName },
        ...(prevLoc?.history?.slice(0, 9) || [])
      ]
    };

    this.state.currentLocation = newLocationData;

    const cacheKey = this.state.role === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newLocationData));
    } catch {
      // ignore
    }

    this.notify();

    // SMART CLOUD DISPATCH:
    // Check if we should push to Firestore right now or throttle to save battery
    this.maybePushToCloud(newLocationData, distanceMoved);

    // Refresh address in background if moved significantly (> 150m)
    if (distanceMoved > 150 || !this.lastGeocodedCoord) {
      this.refreshAddressAsync(lat, lng);
    }
  }

  // Throttle & Delta Filter for Cloud Push:
  // Cuts Firestore network requests and mobile modem wakeups by ~80%
  private maybePushToCloud(loc: LiveLocationData, distanceMoved: number) {
    const now = Date.now();
    const timeSinceLastPush = now - this.lastPushTimestamp;

    // Movement threshold based on power mode
    let movementThreshold = 15; // meters
    let maxStationaryHeartbeat = 60000; // 60s

    if (this.state.powerMode === 'eco') {
      movementThreshold = 25;
      maxStationaryHeartbeat = 90000;
    } else if (this.state.powerMode === 'high_accuracy') {
      movementThreshold = 8;
      maxStationaryHeartbeat = 30000;
    }

    const hasSignificantMovement = distanceMoved >= movementThreshold;
    const isHeartbeatDue = timeSinceLastPush >= maxStationaryHeartbeat;
    const isFirstPush = this.lastPushTimestamp === 0;

    if (hasSignificantMovement || isHeartbeatDue || isFirstPush) {
      this.pushToFirestore(loc);
    }
  }

  // Push coordinates to Firestore (supports both shared gps_rooms and personal user store)
  private async pushToFirestore(loc: LiveLocationData) {
    this.lastPushTimestamp = Date.now();
    this.state.lastPushTimestamp = this.lastPushTimestamp;
    this.lastPushedCoords = { lat: loc.latitude, lng: loc.longitude };

    const roleField = this.state.role === 'primary' ? 'primaryLocation' : 'secondaryLocation';
    const docKey = this.state.role === 'primary' ? 'loc_primary' : 'loc_secondary';
    const locJson = JSON.stringify(loc);

    // 1. Push to shared GPS room if configured (allows 2 devices / friends with different Google accounts to connect)
    const roomId = this.state.roomId || this.currentUser?.uid;
    if (roomId && this.currentUser) {
      try {
        const roomRef = doc(db, 'gps_rooms', roomId);
        const roomUpdate: Record<string, unknown> = {
          roomId,
          members: arrayUnion(this.currentUser.uid),
          [roleField]: locJson,
          [this.state.role === 'primary' ? 'primaryName' : 'secondaryName']: this.state.deviceName,
          updatedAt: new Date()
        };
        // Only the room creator claims ownership; a paired device must not
        // overwrite ownerUid (security rules reject that update).
        if (this.state.role === 'primary') {
          roomUpdate.ownerUid = this.currentUser.uid;
          roomUpdate.joinCode = roomId;
        }
        setDoc(roomRef, roomUpdate, { merge: true }).catch((err) => {
          console.warn('[GPS Service] Shared room sync notice:', err.message);
        });
      } catch {
        // ignore
      }
    }

    // 2. Also push to personal user store for backward compatibility
    if (this.currentUser) {
      try {
        const userDocRef = doc(db, 'users', this.currentUser.uid, 'store', docKey);
        setDoc(userDocRef, {
          value: locJson,
          updatedAt: new Date()
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  // Asynchronous reverse geocoder that runs in background without stalling GPS broadcast
  private async refreshAddressAsync(lat: number, lng: number) {
    if (this.isGeocoding) return;
    const place = await this.fetchAddress(lat, lng);
    if (place && this.state.currentLocation && this.state.currentLocation.placeName !== place) {
      this.state.currentLocation.placeName = place;
      this.notify();
      this.pushToFirestore(this.state.currentLocation);
    }
  }

  // Single shot current position ping with graceful accuracy fallback
  public pingPosition(highAccuracy: boolean = true) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    // If high accuracy is requested, try with modest timeout; if it fails, fallback to network fused location
    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => {
        if (err.code === 1) {
          this.state.errorMsg = 'Izin GPS ditolak atau GPS ponsel dinonaktifkan.';
          this.notify();
          return;
        }

        // If high accuracy timed out (common when phone is locked or indoors),
        // fallback to fused low-power network location with cached maximumAge
        if (highAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => this.handlePositionUpdate(fallbackPos),
            (fErr) => {
              this.consecutiveErrors++;
              if (this.consecutiveErrors > 4) {
                this.state.errorMsg = 'Mencari sinyal GPS/jaringan lokasi...';
                this.notify();
              }
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 45000 }
          );
        }
      },
      {
        enableHighAccuracy: highAccuracy && this.state.powerMode !== 'eco',
        timeout: 15000,
        maximumAge: this.state.isStationary ? 30000 : 10000
      }
    );
  }

  // Periodic heartbeat from Web Worker
  private handleHeartbeatTick() {
    if (!this.state.isBroadcasting) return;

    const elapsed = Date.now() - this.lastUpdateTimestamp;
    let expectedMaxInterval = 25000;
    if (this.state.powerMode === 'eco') expectedMaxInterval = 90000;
    else if (this.state.isStationary) expectedMaxInterval = 60000;

    // If watchPosition hasn't fired within expected interval, gently ping location
    if (elapsed > expectedMaxInterval) {
      this.pingPosition(this.state.powerMode === 'high_accuracy');
    }

    // If watchPosition has gone completely silent for > 3 minutes, self-heal restart
    if (elapsed > 180000) {
      console.warn('[GPS Service] Watchdog detected stalled watchPosition. Self-healing restart...');
      this.restartWatch();
    }
  }

  private restartWatch() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch {
        // ignore
      }
      this.watchId = null;
    }
    this.attachWatchPosition();
  }

  private attachWatchPosition() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.state.errorMsg = 'Perangkat Anda tidak mendukung fitur Geolocation GPS.';
      this.notify();
      return;
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePositionUpdate(pos),
        (err) => {
          if (err.code === 1) {
            this.state.errorMsg = 'GPS perangkat dimatikan atau izin lokasi ditolak.';
            this.notify();
          } else {
            // Transient timeout or satellite loss: fallback gently to fused position
            this.pingPosition(false);
          }
        },
        {
          enableHighAccuracy: this.state.powerMode !== 'eco',
          timeout: 25000,
          maximumAge: this.state.powerMode === 'high_accuracy' ? 5000 : 15000
        }
      );
    } catch (e) {
      console.warn('[GPS Service] Failed to attach watchPosition:', e);
    }
  }

  // Public: Start Real-Time Tracking
  public startTracking(options?: {
    role?: 'primary' | 'secondary';
    name?: string;
    statusNote?: string;
    powerMode?: GpsPowerMode;
    roomId?: string;
  }) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.state.errorMsg = 'Perangkat tidak mendukung fitur Geolocation GPS.';
      this.notify();
      return;
    }

    if (options?.role) {
      this.state.role = options.role;
      localStorage.setItem('partner_tracker_role', options.role);
    }
    if (options?.name) {
      this.state.deviceName = options.name;
    }
    if (options?.statusNote) {
      this.state.statusNote = options.statusNote;
      localStorage.setItem('kampuskit_gps_status_note', options.statusNote);
    }
    if (options?.powerMode) {
      this.state.powerMode = options.powerMode;
      localStorage.setItem('kampuskit_gps_powermode', options.powerMode);
    }
    if (options?.roomId) {
      this.state.roomId = options.roomId;
      localStorage.setItem('kampuskit_gps_room_id', options.roomId);
    } else if (!this.state.roomId && this.currentUser) {
      this.state.roomId = this.currentUser.uid;
      localStorage.setItem('kampuskit_gps_room_id', this.state.roomId);
    }

    this.state.isBroadcasting = true;
    this.state.isLocating = true;
    this.state.errorMsg = null;
    localStorage.setItem('kampuskit_gps_active', 'true');
    this.notify();

    // 1. Initial immediate location fetch
    this.pingPosition(true);

    // 2. Attach continuous watchPosition
    this.attachWatchPosition();

    // 3. Start Background Keep-Alive Audio & Foreground Media Session
    backgroundService.startKeepAlive().catch(() => {});

    // 4. Start Worker Heartbeat with adaptive interval
    this.updateWorkerInterval();

    // 5. Post system foreground notification for Android/PWA
    backgroundService.showForegroundNotification(
      '📍 GPS Latar Belakang Aktif',
      `Memantau posisi (${this.state.deviceName}) berjalan di latar belakang layaknya Google Maps.`
    );
  }

  // Public: Stop Tracking
  public async stopTracking() {
    this.state.isBroadcasting = false;
    this.state.isLocating = false;
    this.state.errorMsg = null;
    localStorage.setItem('kampuskit_gps_active', 'false');

    // Stop keep-alive engine & background worker
    backgroundService.stopKeepAlive();
    this.heartbeatWorker?.postMessage('stop');

    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch {
        // ignore
      }
      this.watchId = null;
    }

    // Update state and cloud that broadcast is turned off
    const currentLoc = this.state.currentLocation;
    if (currentLoc) {
      const updated: LiveLocationData = {
        ...currentLoc,
        isBroadcasting: false,
        updatedAt: new Date().toISOString()
      };
      this.state.currentLocation = updated;

      const cacheKey = this.state.role === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';
      localStorage.setItem(cacheKey, JSON.stringify(updated));

      this.pushToFirestore(updated);
    }

    this.notify();
  }

  // Update Status Note
  public setStatusNote(note: string) {
    this.state.statusNote = note;
    localStorage.setItem('kampuskit_gps_status_note', note);
    if (this.state.currentLocation) {
      this.state.currentLocation.statusNote = note;
      if (this.state.isBroadcasting) {
        this.pushToFirestore(this.state.currentLocation);
      }
    }
    this.notify();
  }

  // Change Power Profile Mode ('smart' | 'high_accuracy' | 'eco')
  public setPowerMode(mode: GpsPowerMode) {
    this.state.powerMode = mode;
    localStorage.setItem('kampuskit_gps_powermode', mode);
    this.notify();
    this.updateWorkerInterval();
    if (this.state.isBroadcasting) {
      this.restartWatch();
    }
  }

  // Set Shared Room / Pairing ID
  public setRoomId(roomId: string) {
    const clean = roomId.trim().toUpperCase();
    this.state.roomId = clean;
    localStorage.setItem('kampuskit_gps_room_id', clean);
    this.notify();
    if (this.state.isBroadcasting && this.state.currentLocation) {
      this.pushToFirestore(this.state.currentLocation);
    }
  }

  // Generate a cryptographically strong room code (12 characters, unambiguous alphabet)
  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randBytes = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randBytes);
    } else {
      for (let i = 0; i < 12; i++) randBytes[i] = Math.floor(Math.random() * 256);
    }
    let code = 'KMP-';
    for (let i = 0; i < 12; i++) {
      code += chars[randBytes[i] % chars.length];
    }
    this.setRoomId(code);
    return code;
  }

  // Join a shared GPS room securely with verification
  public async joinRoom(code: string): Promise<{ success: boolean; message: string }> {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Kode ruang tidak boleh kosong.' };
    if (!this.currentUser) return { success: false, message: 'Harap login akun Google terlebih dahulu untuk bergabung ke ruang GPS.' };

    try {
      const roomRef = doc(db, 'gps_rooms', clean);
      // Security rules do not allow reading a room before joining, so join
      // directly: rules verify the join code and the 10-member cap.
      await updateDoc(roomRef, {
        members: arrayUnion(this.currentUser.uid),
        updatedAt: new Date()
      });
      this.setRoomId(clean);
      return { success: true, message: 'Berhasil bergabung ke ruang GPS!' };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'not-found') {
        return { success: false, message: 'Ruang GPS dengan kode tersebut tidak ditemukan.' };
      }
      if (code === 'permission-denied') {
        return { success: false, message: 'Tidak dapat bergabung: kode tidak valid, kapasitas penuh (maks 10), atau izin ditolak.' };
      }
      return { success: false, message: 'Gagal bergabung ke ruang: ' + (err?.message || 'Izin ditolak') };
    }
  }

  // Permanently delete room (if owner) and all stored location traces
  public async deleteRoomAndLocationData(): Promise<{ success: boolean; message: string }> {
    try {
      await this.stopTracking();
      const currentRoomId = this.state.roomId;
      
      // Delete cloud GPS room if current user is owner
      if (currentRoomId && this.currentUser) {
        try {
          const roomRef = doc(db, 'gps_rooms', currentRoomId);
          const snap = await getDoc(roomRef);
          if (snap.exists() && snap.data().ownerUid === this.currentUser.uid) {
            await deleteDoc(roomRef);
          }
        } catch {
          // ignore
        }
      }

      // Delete personal location stores
      if (this.currentUser) {
        try {
          await deleteDoc(doc(db, 'users', this.currentUser.uid, 'store', 'loc_primary'));
          await deleteDoc(doc(db, 'users', this.currentUser.uid, 'store', 'loc_secondary'));
          await deleteDoc(doc(db, 'users', this.currentUser.uid, 'store', 'partner_chat'));
        } catch {
          // ignore
        }
      }

      // Clear local caches
      localStorage.removeItem('loc_primary_cache');
      localStorage.removeItem('loc_secondary_cache');
      localStorage.removeItem('partner_chat_cache');
      localStorage.removeItem('kampuskit_gps_room_id');
      localStorage.removeItem('kampuskit_gps_active');
      this.state.roomId = '';
      this.state.currentLocation = null;
      this.notify();

      return { success: true, message: 'Ruang GPS dan seluruh riwayat lokasi Anda berhasil dihapus permanen.' };
    } catch (err: any) {
      return { success: false, message: 'Gagal menghapus data lokasi: ' + (err?.message || err) };
    }
  }

  // Switch Device Role
  public setRole(role: 'primary' | 'secondary') {
    if (this.state.role === role) return;
    const wasBroadcasting = this.state.isBroadcasting;
    if (wasBroadcasting) {
      this.stopTracking();
    }
    this.state.role = role;
    localStorage.setItem('partner_tracker_role', role);

    const pName = localStorage.getItem('partner_primary_name') || 'Mahasiswa (Pengguna)';
    const sName = localStorage.getItem('partner_secondary_name') || 'Orang Tua / Teman';
    this.state.deviceName = role === 'primary' ? pName : sName;
    this.state.partnerName = role === 'primary' ? sName : pName;

    const cacheKey = role === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';
    try {
      const cached = localStorage.getItem(cacheKey);
      this.state.currentLocation = cached ? JSON.parse(cached) : null;
    } catch {
      this.state.currentLocation = null;
    }

    this.notify();

    if (wasBroadcasting) {
      this.startTracking();
    }
  }

  // Update Profile Names
  public setNames(primaryName: string, secondaryName: string) {
    localStorage.setItem('partner_primary_name', primaryName);
    localStorage.setItem('partner_secondary_name', secondaryName);
    this.state.deviceName = this.state.role === 'primary' ? primaryName : secondaryName;
    this.state.partnerName = this.state.role === 'primary' ? secondaryName : primaryName;
    this.notify();
    if (this.state.isBroadcasting && this.state.currentLocation) {
      this.pushToFirestore(this.state.currentLocation);
    }
  }
}

export const gpsTrackerService = new GpsTrackerService();
