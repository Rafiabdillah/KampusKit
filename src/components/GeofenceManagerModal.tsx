import React, { useState } from 'react';
import { GeofenceZone, LiveLocationData } from '../types';
import { X, MapPin, Plus, Trash2, Shield, Check, Compass, Radio, Building2, Home, BookOpen, Coffee } from 'lucide-react';
import { audioService } from '../services/audio';

interface GeofenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: GeofenceZone[];
  onSaveZones: (zones: GeofenceZone[]) => void;
  currentLocation: LiveLocationData | null;
  partnerLocation: LiveLocationData | null;
  primaryName: string;
  secondaryName: string;
}

export const GeofenceManagerModal: React.FC<GeofenceManagerModalProps> = ({
  isOpen,
  onClose,
  zones,
  onSaveZones,
  currentLocation,
  partnerLocation,
  primaryName,
  secondaryName,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'CAMPUS' | 'HOME' | 'LIBRARY' | 'FOOD' | 'OTHER'>('CAMPUS');
  const [radius, setRadius] = useState<number>(200);
  const [latitude, setLatitude] = useState<number>(currentLocation?.latitude || -6.2088);
  const [longitude, setLongitude] = useState<number>(currentLocation?.longitude || 106.8456);
  const [notifyOnEntry, setNotifyOnEntry] = useState(true);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setLatitude(currentLocation.latitude);
      setLongitude(currentLocation.longitude);
      setName(currentLocation.placeName ? currentLocation.placeName.slice(0, 30) : 'Lokasi Saya');
      audioService.playAmbientClick();
    }
  };

  const handleUsePartnerLocation = () => {
    if (partnerLocation) {
      setLatitude(partnerLocation.latitude);
      setLongitude(partnerLocation.longitude);
      setName(partnerLocation.placeName ? `Kosan / Posisi ${partnerLocation.holderName || secondaryName}` : `Lokasi ${secondaryName}`);
      audioService.playAmbientClick();
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newZone: GeofenceZone = {
      id: 'zone-' + Date.now(),
      name: name.trim(),
      latitude,
      longitude,
      radius,
      category,
      notifyOnEntry,
    };

    const updated = [...zones, newZone];
    onSaveZones(updated);
    setName('');
    setIsAdding(false);
    audioService.playAmbientClick();
  };

  const handleDeleteZone = (id: string) => {
    const updated = zones.filter((z) => z.id !== id);
    onSaveZones(updated);
    audioService.playAmbientClick();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'CAMPUS':
        return <Building2 size={16} className="text-sky-400" />;
      case 'HOME':
        return <Home size={16} className="text-emerald-400" />;
      case 'LIBRARY':
        return <BookOpen size={16} className="text-amber-400" />;
      case 'FOOD':
        return <Coffee size={16} className="text-rose-400" />;
      default:
        return <MapPin size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Zona Geofence Aman
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {zones.length} Zona
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Deteksi otomatis saat Anda atau {secondaryName} tiba di kampus, kosan, dll.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Action to create new zone */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus size={16} /> Tambah Zona Baru
            </button>
          ) : (
            <form onSubmit={handleAddZone} className="bg-black/40 border border-indigo-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <MapPin size={14} /> Buat Zona Aman Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Nama Tempat / Zona
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Gedung Kuliah Bersama / Kosan"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Quick Preset Coordinates */}
              <div className="flex flex-wrap gap-1.5">
                {currentLocation && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 flex items-center gap-1"
                  >
                    <Radio size={11} className="text-emerald-400" /> Ambil Titik Saya ({primaryName})
                  </button>
                )}
                {partnerLocation && (
                  <button
                    type="button"
                    onClick={handleUsePartnerLocation}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 flex items-center gap-1"
                  >
                    <Radio size={11} className="text-rose-400" /> Ambil Titik {secondaryName}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="CAMPUS">Kampus / Kelas</option>
                    <option value="HOME">Kosan / Rumah</option>
                    <option value="LIBRARY">Perpustakaan</option>
                    <option value="FOOD">Tempat Makan</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Radius Deteksi</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value={100}>100 meter (Presisi)</option>
                    <option value={200}>200 meter (Standar)</option>
                    <option value={300}>300 meter (Gedung Luas)</option>
                    <option value={500}>500 meter (Area Kampus)</option>
                    <option value={1000}>1 km (Kompleks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-white/5">
                <div>Lat: {latitude.toFixed(5)}</div>
                <div>Lng: {longitude.toFixed(5)}</div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyEntry"
                  checked={notifyOnEntry}
                  onChange={(e) => setNotifyOnEntry(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="notifyEntry" className="text-xs text-zinc-300">
                  Kirim notifikasi otomatis saat pengguna tiba atau keluar dari zona ini
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check size={14} /> Simpan Zona
              </button>
            </form>
          )}

          {/* List of Zones */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Daftar Zona Terdaftar ({zones.length})
            </span>
            {zones.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl">
                Belum ada zona aman. Klik tombol di atas untuk menambahkan.
              </div>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(zone.category)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{zone.name}</h4>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-2">
                        <span>Radius: {zone.radius}m</span>
                        <span>•</span>
                        <span className="font-mono">{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 transition-colors"
                    title="Hapus Zona"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950/60 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
