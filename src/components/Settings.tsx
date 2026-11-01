import { useStore } from '../store/useStore';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ThemeColors, UIStyle } from '../types';
import { StorageService, SyncStatusState } from '../services/storage';
import { THEMES } from '../constants';
import { audioService } from '../services/audio';
import { Save, User, Trash2, AlertTriangle, Building, Book, GraduationCap, Download, Upload, FileJson, Camera, X, BellRing, Palette, Check, Sliders, Crown, Type, BoxSelect, ToggleLeft, ToggleRight, Play, Volume2, Cloud, Rocket, Zap, Brain, Award, Sparkles, Command, Coffee, Music, Info, Lightbulb, ChevronDown, ChevronUp, BookOpen, HelpCircle, Target, ShieldCheck, BatteryCharging, Smartphone, Monitor, Apple, Globe, Share2 } from 'lucide-react';
import { NOTIFICATION_SOUNDS, playNotificationSound } from '../utils/sound';
import { auth, signInWithPopup, googleProvider, signOut } from '../services/firebase';
import { NotificationService } from '../services/notifications';
import { GeminiSettingsCard } from './GeminiSettingsCard';
import { BackgroundPermissionModal } from './BackgroundPermissionModal';
import { CrossPlatformInstallModal } from './CrossPlatformInstallModal';
import { useDevicePlatform } from '../hooks/useDevicePlatform';
import { backgroundService, BackgroundServiceState } from '../services/backgroundService';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';
import { CURRENCY_MAP, GRADING_SYSTEMS } from '../utils/intl';
import { SupportedCurrency, AcademicGradingScale } from '../types';

// Helper: Hex to Space Separated RGB
const hexToRgb = (hex: string) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(' ');
  }
  return '0 0 0';
};

// Helper: RGB to Hex (for input value)
const rgbToHex = (rgb: string) => {
  if (!rgb) return '#000000';
  const [r, g, b] = rgb.split(' ').map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const Settings: React.FC = () => {
  const userProfile = useStore(state => state.userProfile);
  const setUserProfile = useStore(state => state.setUserProfile);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language] || TRANSLATIONS.id;

  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { platform, isStandalone, isInstallable, triggerInstall } = useDevicePlatform();
  const [bgState, setBgState] = useState<BackgroundServiceState>(() => backgroundService.getState());
  const [syncState, setSyncState] = useState<SyncStatusState>(() => StorageService.getSyncStatus());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return backgroundService.subscribe((s) => setBgState(s));
  }, []);

  useEffect(() => {
    const handleSyncStatus = (e: Event) => {
      const detail = (e as CustomEvent<SyncStatusState>).detail;
      if (detail) setSyncState(detail);
    };
    window.addEventListener('kampuskit_sync_status', handleSyncStatus);
    return () => window.removeEventListener('kampuskit_sync_status', handleSyncStatus);
  }, []);

  // Sync formData if userProfile changes from outside (e.g. Firebase sync)
  useEffect(() => {
    setFormData(prev => {
      if (JSON.stringify(prev) === JSON.stringify(userProfile)) return prev;
      return userProfile;
    });
    if (userProfile.customColors) {
      setCustomColors(prev => {
        if (JSON.stringify(prev) === JSON.stringify(userProfile.customColors)) return prev;
        return userProfile.customColors!;
      });
    }
  }, [userProfile]);

  const handleForceSync = async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
      const success = await StorageService.syncFromFirebase(auth.currentUser.uid);
      if (success) {
        alert('Data berhasil diunduh dari awan (sinkronisasi berhasil). Halaman akan dimuat ulang.');
        window.location.reload();
      } else {
        alert('Sinkronisasi selesai (tidak ada perubahan baru di awan).');
      }
    } catch (e: any) {
      alert(`Gagal mensinkronkan data: ${e?.message || 'Koneksi bermasalah'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForcePush = async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
      const success = await StorageService.syncToFirebase(auth.currentUser.uid);
      if (success) {
        alert('Data saat ini berhasil dicadangkan ke awan.');
      } else {
        alert('Tidak dapat mencadangkan data saat ini (periksa koneksi internet Anda).');
      }
    } catch (e: any) {
      alert(`Gagal mencadangkan data: ${e?.message || 'Koneksi bermasalah'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Custom Colors State
  const [customColors, setCustomColors] = useState<ThemeColors>(
    userProfile.customColors || {
      primary: '99 102 241',
      secondary: '168 85 247',
      dark: '9 9 11',
      card: '24 24 27'
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'targetGpa' ? Number(value) : value
    }));
    setIsSaved(false);
  };

  const handleThemeChange = (themeId: string) => {
    setFormData(prev => ({ ...prev, theme: themeId }));
    setIsSaved(false);
  };

  const handleUIStyleChange = (type: 'radiusMode' | 'fontMode', value: string) => {
    setFormData(prev => ({
      ...prev,
      uiStyle: {
        ...(prev.uiStyle || { radiusMode: 'MODERN', fontMode: 'SANS' }),
        [type]: value
      }
    }));
    setIsSaved(false);
  };

  const [isSoundEffectsMuted, setIsSoundEffectsMuted] = useState(audioService.getMuted());

  const handleToggleSoundEffects = () => {
    const isMuted = audioService.toggleMute();
    setIsSoundEffectsMuted(isMuted);
  };

  const handleCustomColorChange = (key: keyof ThemeColors, hexValue: string) => {
    const rgbValue = hexToRgb(hexValue);
    setCustomColors(prev => {
      const updated = { ...prev, [key]: rgbValue };
      return updated;
    });
    
    setFormData(prev => ({
      ...prev,
      theme: 'CUSTOM',
      customColors: { ...userProfile.customColors, [key]: rgbValue }
    }));
    setIsSaved(false);
  };

  const toggleNotifications = async () => {
    const newValue = !formData.notificationsEnabled;
    
    if (newValue) {
      if (!("Notification" in window)) {
        alert("Browser ini tidak mendukung notifikasi desktop.");
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setFormData(prev => ({ ...prev, notificationsEnabled: true }));
        new Notification("KampusKit", { body: "Notifikasi diaktifkan! Kami akan mengingatkan 15 menit sebelum kelas dimulai.", icon: "/icon-192.png" });
        setIsSaved(false);
      } else {
        alert("Izin notifikasi ditolak. Mohon izinkan di pengaturan browser.");
      }
    } else {
      setFormData(prev => ({ ...prev, notificationsEnabled: false }));
      setIsSaved(false);
    }
  };

  const handleRingtoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        alert("Ukuran file audio maksimal 200KB untuk menjaga performa sinkronisasi.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const id = `custom_${Date.now()}`;
        const newRingtone = { id, name: file.name.substring(0, 25), data: reader.result as string };
        setFormData(prev => ({
          ...prev,
          customRingtones: [...(prev.customRingtones || []), newRingtone]
        }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderRingtoneSelector = (label: string, field: 'notificationSound' | 'classRingtone' | 'taskRingtone') => {
    const currentValue = formData[field] || 'bell';
    const allSounds = [
      ...NOTIFICATION_SOUNDS,
      ...(formData.customRingtones || []).map(r => ({ id: r.id, name: `🎵 ${r.name}` }))
    ];

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-950/30 rounded-lg border border-zinc-800">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
          <select 
            value={currentValue}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, [field]: e.target.value }));
              setIsSaved(false);
              playNotificationSound(e.target.value, formData.customRingtones);
            }}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary w-40 sm:w-48 truncate"
          >
            {allSounds.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button 
            onClick={() => playNotificationSound(currentValue, formData.customRingtones)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors shrink-0"
            title="Mainkan Nada"
          >
            <Play size={14} className="text-primary" fill="currentColor"/>
          </button>
          {currentValue.startsWith('custom_') && (
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  customRingtones: (prev.customRingtones || []).filter(r => r.id !== currentValue),
                  [field]: 'bell'
                }));
                setIsSaved(false);
              }}
              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors shrink-0"
              title="Hapus Nada Upload"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleSave = () => {
    setUserProfile(formData);
    StorageService.setItem('user_profile', formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, photo: base64 }));
        setIsSaved(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: undefined, usePhotoAsLogo: false }));
    setIsSaved(false);
  };

  const handleClearData = async () => {
    const hasCloud = !!auth.currentUser;
    
    if (!hasCloud) {
      if (confirm('PERINGATAN: Ini akan menghapus SEMUA data lokal (Tugas, Jadwal, Catatan, Flashcard, dll) dari perangkat ini secara permanen. Lanjutkan?')) {
        StorageService.clearUserData(false);
        window.location.reload();
      }
      return;
    }

    const choice = prompt(
      "PILIHAN PENGHAPUSAN DATA KAMPUSKIT:\n\n" +
      "Ketik [1] : Hapus data di perangkat ini saja (Data awan akun Anda tetap aman)\n" +
      "Ketik [2] : Hapus data di perangkat DAN hapus seluruh data awan Firebase Anda secara permanen\n\n" +
      "Masukkan angka 1 atau 2 lalu tekan OK (atau Batal untuk membatalkan):"
    );

    if (choice === '1') {
      StorageService.clearUserData(true);
      alert('Data lokal berhasil dibersihkan. Aplikasi akan dimuat ulang.');
      window.location.reload();
    } else if (choice === '2') {
      const doubleConfirm = confirm(
        "PERINGATAN FINAL: Anda memilih menghapus SELURUH data di perangkat DAN di cloud Firebase!\n\n" +
        "Seluruh tugas, jadwal, catatan, flashcard, dan keuangan akun Anda akan terhapus selamanya dari cloud. Apakah Anda yakin?"
      );
      if (doubleConfirm && auth.currentUser) {
        setIsSyncing(true);
        await StorageService.clearCloudData(auth.currentUser.uid);
        StorageService.clearUserData(false);
        alert('Seluruh data di perangkat dan cloud telah dihapus secara permanen.');
        window.location.reload();
      }
    }
  };

  const handleExportData = () => {
    const jsonString = StorageService.exportBackupJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `kampuskit_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = StorageService.importBackupJson(content);

        if (!res.valid || !res.data) {
          alert(res.error || 'File cadangan tidak valid untuk KampusKit.');
          return;
        }

        const summaryLines = Object.entries(res.summary)
          .slice(0, 10)
          .map(([k, count]) => `• ${k}: ${count} item`)
          .join('\n');

        const confirmed = confirm(
          `VERIFIKASI CADANGAN KAMPUSKIT:\n\n` +
          `File cadangan valid ditemukan dengan isi:\n${summaryLines}\n\n` +
          `Import data akan menimpa data yang ada saat ini.\n(Salinan data lokal Anda saat ini akan otomatis dicadangkan sebagai pengaman sebelum ditimpa).\n\nLanjutkan?`
        );

        if (confirmed) {
          StorageService.applyBackupData(res.data);
          alert('Data berhasil diimpor! Aplikasi akan dimuat ulang.');
          window.location.reload();
        }
      } catch {
        alert('Gagal memproses file cadangan.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Pengaturan & Profil</h2>
        <p className="text-zinc-400">Sesuaikan identitas mahasiswa dan preferensi aplikasi Anda.</p>
      </div>

      {/* Account Sync Section */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Akun & Sinkronisasi</h3>
            <p className="text-xs text-zinc-400">Login untuk menyimpan data Anda di awan dan mengaksesnya dari perangkat lain.</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
          <div>
            {auth.currentUser ? (
              <>
                <p className="font-bold text-white mb-1">Terhubung sebagai {auth.currentUser.displayName}</p>
                <p className="text-xs text-zinc-400">{auth.currentUser.email}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-white mb-1">Belum Terhubung</p>
                <p className="text-xs text-zinc-400">Data saat ini hanya tersimpan di browser ini.</p>
              </>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-medium">Status Sinkron:</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                syncState.status === 'synced'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : syncState.status === 'syncing'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : syncState.status === 'offline'
                  ? 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30'
                  : syncState.status === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  syncState.status === 'synced' ? 'bg-emerald-400' :
                  syncState.status === 'syncing' ? 'bg-amber-400' :
                  syncState.status === 'error' ? 'bg-rose-400' : 'bg-zinc-400'
                }`} />
                {syncState.status === 'synced' && 'Tersinkron'}
                {syncState.status === 'syncing' && 'Menyinkronkan...'}
                {syncState.status === 'offline' && 'Offline (Lokal)'}
                {syncState.status === 'error' && 'Gagal Sinkronisasi'}
                {syncState.status === 'unauthenticated' && 'Belum Login'}
              </span>
              {syncState.lastSyncedAt && (
                <span className="text-[10px] text-zinc-500">
                  ({new Date(syncState.lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {auth.currentUser && (
              <>
                <button 
                  onClick={handleForcePush}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Cadangkan
                </button>
                <button 
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Download size={16} />
                  Unduh
                </button>
              </>
            )}
            <button 
              onClick={async () => {
                if (auth.currentUser) {
                  if (confirm('Keluar dari akun? Pelacakan GPS akan dihentikan dan data akun pada perangkat ini akan dibersihkan demi keamanan (pengaturan bahasa & tema tetap tersimpan).')) {
                    StorageService.clearUserData(true);
                    await signOut(auth);
                    window.location.reload();
                  }
                } else {
                  try {
                    await signInWithPopup(auth, googleProvider);
                    window.location.reload();
                  } catch (e) {
                    console.error(e);
                    alert("Gagal login dengan Google.");
                  }
                }
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${auth.currentUser ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-200'}`}
            >
              {auth.currentUser ? 'Keluar' : 'Login dengan Google'}
            </button>
          </div>
        </div>
      </div>

      {/* Google Gemini AI Integration Section */}
      <GeminiSettingsCard />

      {/* Profile Section (Moved to Top) */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Profil Mahasiswa</h3>
            <p className="text-xs text-zinc-400">Data ini akan ditampilkan di Dashboard Anda.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo Uploader */}
          <div className="flex flex-col items-center gap-3">
             <div className="relative w-32 h-32 group">
                {formData.photo ? (
                  <img 
                    src={formData.photo} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover border-4 border-zinc-800 shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-zinc-500">
                    <User size={48} />
                  </div>
                )}
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-2.5 rounded-full shadow-lg border-4 border-zinc-900 transition-all hover:scale-110"
                  title="Ganti Foto"
                >
                  <Camera size={16} />
                </button>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*"
                   onChange={handlePhotoUpload}
                />
             </div>
             
             {formData.photo && (
               <div className="flex flex-col gap-2 items-center w-full">
                 <button onClick={removePhoto} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                   <X size={12} /> Hapus Foto
                 </button>
                 
                 <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 bg-zinc-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 transition-colors">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={formData.usePhotoAsLogo || false}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, usePhotoAsLogo: e.target.checked }));
                            setIsSaved(false);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                    <span>Jadikan Logo App</span>
                 </label>
               </div>
             )}
          </div>

          {/* Text Fields */}
          <div className="flex-1 space-y-4 w-full">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                  <input 
                    name="name"
                    className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white pl-10 pr-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                    placeholder="Nama Anda"
                    value={formData.name || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Universitas / Kampus</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                  <input 
                    name="university"
                    className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white pl-10 pr-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                    placeholder="Nama Universitas"
                    value={formData.university || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Program Studi</label>
              <div className="relative">
                <Book size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                <input 
                  name="major"
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white pl-10 pr-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                  placeholder="Contoh: Teknik Informatika"
                  value={formData.major || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Tanggal Lahir</label>
                <input 
                  name="birthDate"
                  type="date"
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white px-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                  value={formData.birthDate || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Jenis Kelamin</label>
                <select
                  name="gender"
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white px-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                  value={formData.gender || ''}
                  onChange={handleChange}
                >
                  <option value="">Pilih...</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Semester</label>
                <input 
                  name="semester"
                  type="number"
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white px-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                  value={formData.semester}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Target IPK</label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                  <input 
                    name="targetGpa"
                    type="number"
                    step="0.01"
                    max="4.00"
                    className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white pl-10 pr-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                    value={formData.targetGpa}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
               <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                     <BellRing size={16} className="text-primary" /> Notifikasi Jadwal (Push)
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Dapatkan pengingat 15 menit sebelum kelas (diperlukan izin browser).</p>
               </div>
               <button 
                  onClick={async () => {
                     if (!formData.notificationsEnabled) {
                        const granted = await NotificationService.requestPermission();
                        if (granted) {
                           setFormData(prev => ({ ...prev, notificationsEnabled: true }));
                           setIsSaved(false);
                        }
                     } else {
                        setFormData(prev => ({ ...prev, notificationsEnabled: false }));
                        setIsSaved(false);
                     }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notificationsEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
               >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
            </div>

            {/* Background Permission & Battery Optimization Card */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" /> Izin Berjalan di Latar Belakang & Baterai
                  {bgState.isKeepAliveActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                      Keep-Alive Aktif
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Mencegah Android mematikan GPS, tugas kuliah, dan audio saat HP terkunci, serta panduan baterai Xiaomi, Samsung, Oppo, dll.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioService.playAmbientClick();
                  setIsBackgroundModalOpen(true);
                }}
                className="shrink-0 px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <BatteryCharging size={14} />
                <span>Pengaturan Latar Belakang</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">Julukan / Title</label>
              <div className="relative">
                <Crown size={16} className="absolute left-3 top-3.5 text-yellow-500" />
                <input 
                  name="customTitle"
                  className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 text-white pl-10 pr-3 py-3 rounded-xl focus:border-primary focus:outline-none transition-colors focus:glass-card"
                  placeholder="Contoh: Sultan Kampus..."
                  value={formData.customTitle || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* International & Regional Preferences Card */}
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{t.intlSettingsTitle}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {t.internationalReadyBadge}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">{t.intlSettingsDesc}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Language Selector */}
          <div>
            <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">
              {t.languagePreference}
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  audioService.playAmbientClick();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'bg-primary/15 border-primary text-white font-bold shadow-md shadow-primary/20'
                    : 'bg-zinc-900/50 border-zinc-700/70 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-white">English (International)</p>
                  <p className="text-[10px] text-zinc-400">Global academic & campus terms</p>
                </div>
                {language === 'en' && <Check size={16} className="text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('id');
                  audioService.playAmbientClick();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  language === 'id'
                    ? 'bg-primary/15 border-primary text-white font-bold shadow-md shadow-primary/20'
                    : 'bg-zinc-900/50 border-zinc-700/70 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Bahasa Indonesia</p>
                  <p className="text-[10px] text-zinc-400">Standar perguruan tinggi Indonesia</p>
                </div>
                {language === 'id' && <Check size={16} className="text-primary" />}
              </button>
            </div>
          </div>

          {/* Academic Grading Scale */}
          <div className="border-t border-zinc-800 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">
              {t.gradingScaleLabel}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'US_4_0', name: 'US Standard 4.0 Scale', desc: 'Letter grades A, A-, B+, B, C, D, F • Cum Laude' },
                { id: 'ID_4_0', name: 'Indonesian 4.0 Scale', desc: 'Nilai A (4.0), B+ (3.5), B (3.0), C+ (2.5), D, E' },
                { id: 'UK_HONOURS', name: 'UK Honours Classification', desc: 'First-Class (1st), Upper Second (2:1), 2:2, 3rd' },
                { id: 'ECTS', name: 'European ECTS Standard', desc: 'Grade A (Excellent) down to E (Sufficient) & F' },
              ].map((scaleOpt) => {
                const isSelected = (formData.gradingScale || 'US_4_0') === scaleOpt.id;
                return (
                  <button
                    key={scaleOpt.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, gradingScale: scaleOpt.id as AcademicGradingScale }));
                      StorageService.setItem('academic_grading_scale', scaleOpt.id);
                      setIsSaved(false);
                      audioService.playAmbientClick();
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-white shadow-sm'
                        : 'bg-zinc-900/50 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{scaleOpt.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{scaleOpt.desc}</p>
                    </div>
                    {isSelected && <Check size={16} className="text-primary shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Currency */}
          <div className="border-t border-zinc-800 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold uppercase tracking-wider">
              {t.currencyLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(CURRENCY_MAP) as SupportedCurrency[]).map((currKey) => {
                const cfg = CURRENCY_MAP[currKey];
                const isSelected = (formData.preferredCurrency || 'IDR') === currKey;
                return (
                  <button
                    key={currKey}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, preferredCurrency: currKey }));
                      StorageService.setItem('preferred_currency', currKey);
                      setIsSaved(false);
                      audioService.playAmbientClick();
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-zinc-900/40 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-300 font-bold">{cfg.symbol}</span>
                      <span className="text-xs">{cfg.code}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Calendar Standards */}
          <div className="border-t border-zinc-800 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-bold uppercase tracking-wider">
                {t.timeFormatPreference}
              </label>
              <select
                value={formData.timeFormat || '24h'}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }));
                  setIsSaved(false);
                }}
                className="w-full bg-zinc-900/50 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-xl focus:border-primary focus:outline-none"
              >
                <option value="24h">{t.timeFormat24}</option>
                <option value="12h">{t.timeFormat12}</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-bold uppercase tracking-wider">
                {t.weekStart}
              </label>
              <select
                value={formData.firstDayOfWeek || 'monday'}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, firstDayOfWeek: e.target.value as 'monday' | 'sunday' }));
                  setIsSaved(false);
                }}
                className="w-full bg-zinc-900/50 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-xl focus:border-primary focus:outline-none"
              >
                <option value="monday">{t.monday}</option>
                <option value="sunday">{t.sunday}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* App Icon Section */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
            <Crown size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">App Icon (Sidebar)</h3>
            <p className="text-xs text-zinc-400">Pilih icon dan warna yang sesuai dengan kepribadian Anda.</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Bentuk Icon</h4>
            <div className="flex flex-wrap gap-3">
              {['K', 'Crown', 'Rocket', 'Zap', 'Brain', 'Award', 'Sparkles', 'Book', 'Command', 'Coffee'].map(icon => {
                let isSelected = formData.appIcon === icon;
                if (!formData.appIcon && icon === 'K') isSelected = true;
                if (formData.usePhotoAsLogo) isSelected = false;

                return (
                  <button
                    key={icon}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, appIcon: icon, usePhotoAsLogo: false }));
                      setIsSaved(false);
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                      isSelected
                      ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 border-2 border-white/20'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700/50'
                    }`}
                  >
                    {icon === 'K' ? 'K' : 
                     icon === 'Crown' ? <Crown size={24} /> :
                     icon === 'Rocket' ? <Rocket size={24} /> :
                     icon === 'Zap' ? <Zap size={24} /> :
                     icon === 'Brain' ? <Brain size={24} /> :
                     icon === 'Award' ? <Award size={24} /> :
                     icon === 'Sparkles' ? <Sparkles size={24} /> :
                     icon === 'Book' ? <Book size={24} /> :
                     icon === 'Command' ? <Command size={24} /> :
                     icon === 'Coffee' ? <Coffee size={24} /> : icon}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Warna Icon</h4>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'primary', label: 'Default (Ungu)', class: 'bg-gradient-to-br from-primary to-purple-600' },
                { id: 'blue', label: 'Biru', class: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
                { id: 'green', label: 'Hijau', class: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
                { id: 'orange', label: 'Oranye', class: 'bg-gradient-to-br from-orange-400 to-red-500' },
                { id: 'pink', label: 'Pink', class: 'bg-gradient-to-br from-pink-500 to-rose-500' },
                { id: 'dark', label: 'Dark', class: 'bg-gradient-to-br from-zinc-700 to-black' },
                { id: 'gold', label: 'Gold', class: 'bg-gradient-to-br from-yellow-400 to-amber-600' }
              ].map(color => {
                let isSelected = formData.appIconColor === color.class;
                if (!formData.appIconColor && color.id === 'primary') isSelected = true;

                return (
                  <button
                    key={color.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, appIconColor: color.class }));
                      setIsSaved(false);
                    }}
                    className={`w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center ${color.class} ${
                      isSelected
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    title={color.label}
                  >
                    {isSelected && <Check size={16} className="text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- UI MODEL CUSTOMIZATION --- */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
            <Palette size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tampilan & Model UI</h3>
            <p className="text-xs text-zinc-400">Ubah gaya aplikasi agar sesuai dengan kepribadianmu.</p>
          </div>
        </div>

        {/* 1. Theme Selection */}
        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Palet Warna</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {THEMES.map((theme) => {
             const isSelected = (formData.theme === theme.id) || (!formData.theme && theme.id === 'COSMIC');
             return (
               <button
                 key={theme.id}
                 onClick={() => handleThemeChange(theme.id)}
                 className={`relative p-3 rounded-xl border transition-all hover:scale-105 flex flex-col gap-2 items-center group ${isSelected ? 'border-primary bg-zinc-800' : 'border-transparent glass-card hover:border-zinc-600'}`}
               >
                 <div className="flex gap-1 mb-1">
                    <div className="w-4 h-8 rounded-l-full shadow-lg" style={{ backgroundColor: `rgb(${theme.colors.primary})` }}></div>
                    <div className="w-4 h-8 rounded-r-full shadow-lg" style={{ backgroundColor: `rgb(${theme.colors.secondary})` }}></div>
                 </div>
                 <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{theme.name}</span>
                 {isSelected && (
                   <div className="absolute top-2 right-2 bg-primary text-white p-0.5 rounded-full">
                     <Check size={10} />
                   </div>
                 )}
               </button>
             );
          })}
        </div>

        {/* 2. Shape Language (Radius) */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
           <div>
              <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                 <BoxSelect size={16} /> Bentuk UI (Radius)
              </h4>
              <div className="space-y-2">
                 {[
                   { id: 'ROUND', label: 'Playful (Bulat)', desc: 'Sudut melengkung, ramah.' },
                   { id: 'MODERN', label: 'Modern (Standar)', desc: 'Seimbang dan rapi.' },
                   { id: 'SHARP', label: 'Professional (Tajam)', desc: 'Sudut kotak, serius.' }
                 ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleUIStyleChange('radiusMode', opt.id)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                        (formData.uiStyle?.radiusMode || 'MODERN') === opt.id
                        ? 'bg-primary/10 border-primary text-white'
                        : 'glass-card border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                       <div className="text-left">
                          <p className="font-bold text-sm">{opt.label}</p>
                          <p className="text-[10px] opacity-70">{opt.desc}</p>
                       </div>
                       {(formData.uiStyle?.radiusMode || 'MODERN') === opt.id && <Check size={16} />}
                    </button>
                 ))}
              </div>
           </div>

           {/* 3. Typography */}
           <div>
              <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                 <Type size={16} /> Jenis Huruf (Font)
              </h4>
              <div className="space-y-2">
                 {[
                   { id: 'SANS', label: 'Inter (Default)', desc: 'Bersih, mudah dibaca.', fontClass: 'font-sans' },
                   { id: 'SERIF', label: 'Merriweather (Klasik)', desc: 'Elegan, fokus bacaan.', fontClass: 'font-serif' },
                   { id: 'MONO', label: 'JetBrains (Coding)', desc: 'Teknis, gaya hacker.', fontClass: 'font-mono' }
                 ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleUIStyleChange('fontMode', opt.id)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                        (formData.uiStyle?.fontMode || 'SANS') === opt.id
                        ? 'bg-primary/10 border-primary text-white'
                        : 'glass-card border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                       <div className="text-left">
                          <p className={`font-bold text-sm ${opt.fontClass}`}>{opt.label}</p>
                          <p className="text-[10px] opacity-70">{opt.desc}</p>
                       </div>
                       {(formData.uiStyle?.fontMode || 'SANS') === opt.id && <Check size={16} />}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Custom Theme Builder (Advanced) */}
        <div className="border-t border-zinc-700/50 pt-6">
           <div 
             className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl transition-all border ${formData.theme === 'CUSTOM' ? 'border-primary bg-primary/5' : 'border-zinc-700 glass-card/30'}`}
           >
              <div className="p-3 bg-zinc-800 rounded-lg text-white border border-zinc-700 cursor-pointer" onClick={() => handleThemeChange('CUSTOM')}>
                 <Sliders size={24} />
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => handleThemeChange('CUSTOM')}>
                 <h4 className="font-bold text-white">Custom Theme (Advanced)</h4>
                 <p className="text-xs text-zinc-400">Atur kombinasi warna sendiri.</p>
              </div>
              
              {/* Color Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                 <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Primary</label>
                    <input type="color" 
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" 
                      value={rgbToHex(customColors.primary)}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Secondary</label>
                    <input type="color" 
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" 
                      value={rgbToHex(customColors.secondary)}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Bg Dark</label>
                    <input type="color" 
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" 
                      value={rgbToHex(customColors.dark)}
                      onChange={(e) => handleCustomColorChange('dark', e.target.value)}
                    />
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Bg Card</label>
                    <input type="color" 
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" 
                      value={rgbToHex(customColors.card)}
                      onChange={(e) => handleCustomColorChange('card', e.target.value)}
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Notifications & Sound Settings */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
            <BellRing size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notifikasi & Efek Suara</h3>
            <p className="text-xs text-zinc-400">Atur pengingat dan suara UI aplikasi.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
             <div className="flex items-center justify-between">
                <div>
                   <h4 className="font-bold text-white mb-1">Pengingat Jadwal Kuliah & Tugas</h4>
                   <p className="text-xs text-zinc-400">Aktifkan untuk menerima notifikasi pengingat otomatis.</p>
                </div>
                <button 
                  onClick={toggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notificationsEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
             
             {formData.notificationsEnabled && (
                <div className="pt-3 border-t border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                   <div className="text-[10px] text-zinc-400">
                      <span className="block mb-1 font-bold text-zinc-300">
                        Mode Pengiriman: {import.meta.env.VITE_FIREBASE_VAPID_KEY ? '🚀 FCM Web Push (Cloud)' : '📱 Notifikasi Lokal PWA (Perangkat)'}
                      </span>
                      {'showTrigger' in Notification.prototype 
                        ? <span className="text-emerald-400 flex items-center gap-1"><Check size={10}/> Penjadwalan Latar Belakang Didukung</span>
                        : <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle size={10}/> Notifikasi berjalan saat tab aktif di latar belakang</span>
                      }
                   </div>
                   <button 
                      onClick={() => {
                         const notifOptions = { body: 'Ini adalah uji coba notifikasi. Sistem berjalan sempurna!', icon: '/icon-192.png' };
                         if ('serviceWorker' in navigator) {
                           navigator.serviceWorker.ready.then(reg => reg.showNotification('Uji Coba Berhasil', notifOptions));
                         } else {
                           new Notification('Uji Coba Berhasil', notifOptions);
                         }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg transition-colors border border-zinc-600 whitespace-nowrap"
                   >
                      Uji Notifikasi
                   </button>
                </div>
             )}
          </div>

          {/* Neuro-Spiritual Motivation Automatic Scheduling */}
          <div className="flex flex-col gap-4 p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
             <div className="flex items-center justify-between">
                <div>
                   <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                     <Lightbulb size={16} className="text-yellow-400" /> Pengingat Motivasi Latar Belakang
                   </h4>
                   <p className="text-xs text-zinc-400">Kirim dorongan mental harian (Neurosains, Hikmah Ahlulbayt, Bisnis, Stoikisme) ke notification bar perangkat.</p>
                </div>
                <button 
                  onClick={() => {
                    const currentVal = formData.motivationNotifEnabled !== false;
                    setFormData(prev => ({ ...prev, motivationNotifEnabled: !currentVal }));
                    setIsSaved(false);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.motivationNotifEnabled !== false ? 'bg-primary' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.motivationNotifEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>

             {formData.motivationNotifEnabled !== false && (
                <div className="pt-3 border-t border-zinc-800/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">Frekuensi Pengiriman:</label>
                      <select
                        value={formData.motivationFrequency || 'DAILY_4X'}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, motivationFrequency: e.target.value as any }));
                          setIsSaved(false);
                        }}
                        className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                      >
                        <option value="DAILY_4X">4x Sehari (Pagi 06:30, Siang 12:30, Sore 17:00, Malam 21:00)</option>
                        <option value="DAILY_2X">2x Sehari (Pagi 07:00 & Malam 20:30)</option>
                        <option value="EVERY_2_HOURS">Setiap 2 Jam (Jam Produktif 08:00 - 22:00)</option>
                        <option value="EVERY_4_HOURS">Setiap 4 Jam</option>
                        <option value="MORNING_ONLY">Hanya Pagi Hari (06:30 Priming)</option>
                      </select>
                   </div>

                   <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">Popup Cerdas saat Buka App:</label>
                      <div className="flex items-center justify-between p-2 bg-zinc-800/60 rounded-lg border border-zinc-700">
                         <span className="text-xs text-zinc-300">Muncul di jam tertentu</span>
                         <input 
                           type="checkbox"
                           checked={formData.smartDailyModalEnabled !== false}
                           onChange={(e) => {
                             setFormData(prev => ({ ...prev, smartDailyModalEnabled: e.target.checked }));
                             setIsSaved(false);
                           }}
                           className="w-4 h-4 rounded text-primary focus:ring-primary bg-zinc-900 border-zinc-700"
                         />
                      </div>
                   </div>
                </div>
             )}
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
             <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                  <Music size={16} /> Ambient UI Sounds
                </h4>
                <p className="text-xs text-zinc-400">Suara klik dan notifikasi interaksi di dalam aplikasi.</p>
             </div>
             <button 
               onClick={handleToggleSoundEffects}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!isSoundEffectsMuted ? 'bg-primary' : 'bg-zinc-700'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isSoundEffectsMuted ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>

          {/* Sound Selection */}
          <div className="p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h4 className="font-bold text-white flex items-center gap-2"><Volume2 size={16}/> Pengaturan Nada Dering</h4>
                <div className="flex gap-2 shrink-0">
                   <input type="file" accept="audio/*" id="ringtone-upload" className="hidden" onChange={handleRingtoneUpload} />
                   <label htmlFor="ringtone-upload" className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors border border-zinc-700">
                      <Upload size={14} /> Upload Nada
                   </label>
                </div>
             </div>

             <div className="flex flex-col gap-3">
               {renderRingtoneSelector('Nada Notifikasi Umum', 'notificationSound')}
               {renderRingtoneSelector('Nada Pengingat Kelas', 'classRingtone')}
               {renderRingtoneSelector('Nada Pengingat Tugas', 'taskRingtone')}
             </div>
          </div>
        </div>
      </div>

      {/* Fitur Aplikasi */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
            <Sliders size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Fitur Aplikasi</h3>
            <p className="text-xs text-zinc-400">Aktifkan atau nonaktifkan fitur yang tidak Anda butuhkan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'calendar', label: 'Kalender', category: 'Utama' },
            { id: 'schedule', label: 'Jadwal Kuliah', category: 'Utama' },
            { id: 'attendance', label: 'Presensi', category: 'Utama' },
            { id: 'statistics', label: 'Statistik', category: 'Utama' },
            { id: 'tasks', label: 'Tugas', category: 'Utama' },
            { id: 'notes', label: 'Catatan', category: 'Utama' },
            { id: 'ai-chat', label: 'AI Bot', category: 'Utama' },
            { id: 'focus', label: 'Focus Timer', category: 'Akademik' },
            { id: 'flashcards', label: 'Flashcards', category: 'Akademik' },
            { id: 'library', label: 'Perpustakaan', category: 'Akademik' },
            { id: 'grades', label: 'Kalkulator IPK', category: 'Akademik' },
            { id: 'study-guide', label: 'Metode Belajar', category: 'Akademik' },
            { id: 'citation', label: 'Sitasi & Ref', category: 'Akademik' },
            { id: 'budget', label: 'Keuangan', category: 'Kehidupan' },
            { id: 'campus-life', label: 'Organisasi', category: 'Kehidupan' },
            { id: 'habits', label: 'Habit Tracker', category: 'Kehidupan' },
            { id: 'goals', label: 'Target', category: 'Kehidupan' },
            { id: 'journal', label: 'Jurnal', category: 'Kehidupan' },
            { id: 'meals', label: 'Makan', category: 'Kehidupan' },
            { id: 'sleep', label: 'Tidur', category: 'Kehidupan' },
            { id: 'sports', label: 'Olahraga', category: 'Kehidupan' },
            { id: 'skills', label: 'Skill Roadmap', category: 'Growth' },
            { id: 'brain-gym', label: 'Brain Gym', category: 'Growth' },
            { id: 'motivation', label: 'Motivasi', category: 'Growth' },
            { id: 'compass', label: 'Kompas', category: 'Growth' },
            { id: 'career', label: 'Karir', category: 'Growth' },
            { id: 'gym', label: 'Gym & Fitness', category: 'Kehidupan' },
            { id: 'projects', label: 'Proyek & Freelance', category: 'Karir' },
            { id: 'invoice', label: 'Invoice Generator', category: 'Karir' }
          ].map((feature) => {
             const isDisabled = (formData.disabledFeatures || []).includes(feature.id);
             return (
               <div key={feature.id} className="flex items-center justify-between p-3 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-700/50">
                  <div>
                     <h4 className="font-bold text-white text-sm">{feature.label}</h4>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{feature.category}</p>
                  </div>
                  <button 
                    onClick={() => {
                       let newDisabled = [...(formData.disabledFeatures || [])];
                       if (isDisabled) {
                          newDisabled = newDisabled.filter(id => id !== feature.id);
                       } else {
                          newDisabled.push(feature.id);
                       }
                       setFormData(prev => ({ ...prev, disabledFeatures: newDisabled }));
                       setIsSaved(false);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!isDisabled ? 'bg-primary' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isDisabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>
             );
          })}
        </div>
      </div>

      {/* Multi-Platform & Universal OS Hub (Android • Apple • Windows) */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-zinc-700/50 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Aplikasi & Kompatibilitas Perangkat
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Universal OS
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Optimasi ekosistem multi-platform untuk Android, Apple (iOS/Mac), dan Windows PC.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-zinc-300 capitalize flex items-center gap-1.5">
              {platform === 'ios' || platform === 'mac' ? (
                <Apple size={14} className="text-zinc-200" />
              ) : platform === 'android' ? (
                <Smartphone size={14} className="text-emerald-400" />
              ) : (
                <Monitor size={14} className="text-blue-400" />
              )}
              <span>{platform}</span>
            </span>
            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
              isStandalone 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isStandalone ? 'Mode Aplikasi Terpasang' : 'Mode Peramban Web'}
            </span>
          </div>
        </div>

        {/* 3 Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Android Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            platform === 'android' 
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
              : 'bg-zinc-900/50 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Smartphone size={16} className="text-emerald-400" />
                <span>Android OS</span>
              </div>
              {platform === 'android' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Perangkat Anda
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Didukung WebAPK native, pemutaran audio hening di latar belakang, GPS real-time satelit adaptif, dan notifikasi foreground.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1 mb-3">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400 flex-shrink-0" />
                <span>Pemasangan 1-Sentuhan (Chrome/Samsung)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400 flex-shrink-0" />
                <span>Bebas Pembekuan Layar Mati</span>
              </li>
            </ul>
          </div>

          {/* Apple Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            platform === 'ios' || platform === 'mac'
              ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10' 
              : 'bg-zinc-900/50 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Apple size={16} className="text-purple-400" />
                <span>Apple iOS & Mac</span>
              </div>
              {(platform === 'ios' || platform === 'mac') && (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                  Perangkat Anda
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Mendukung Safari Standalone PWA, iPhone Dynamic Island / Notch safe area, audio WebKit lancar, serta gestur swipe native.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1 mb-3">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-purple-400 flex-shrink-0" />
                <span>Add to Home Screen (Layar Penuh)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-purple-400 flex-shrink-0" />
                <span>Audio Latensi Rendah & Ikon Retina PNG</span>
              </li>
            </ul>
          </div>

          {/* Windows Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            platform === 'windows' 
              ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/10' 
              : 'bg-zinc-900/50 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Monitor size={16} className="text-blue-400" />
                <span>Windows 10/11</span>
              </div>
              {platform === 'windows' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                  Perangkat Anda
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Aplikasi desktop ringan Microsoft Edge / Chrome, akselerasi GPU, pinning Taskbar & Start Menu, serta pintasan keyboard lengkap.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1 mb-3">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-blue-400 flex-shrink-0" />
                <span>Pintasan Cepat (Ctrl+K, Ctrl+B, dll)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-blue-400 flex-shrink-0" />
                <span>Penyimpanan Lokal Offline 100% Bebas Lag</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Web Share Target Compatibility Note */}
        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 mb-6">
          <div className="flex items-center gap-2 mb-2 font-bold text-white text-xs">
            <Share2 size={16} className="text-primary" />
            <span>Integrasi Web Share Target PWA</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-3">
            KampusKit mendukung penerimaan tautan, artikel, dan teks kuliah langsung dari menu "Bagikan" (Share Sheet) sistem operasi perangkat Anda.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                <Check size={14} />
                <span>Chrome Android & Edge Desktop</span>
              </div>
              <p className="text-zinc-400 leading-normal">
                Didukung penuh secara native. Saat membagikan teks atau URL dari aplikasi lain, pilih <strong className="text-zinc-200">KampusKit</strong> untuk langsung menyimpannya sebagai Catatan atau Tugas perkuliahan.
              </p>
            </div>
            <div className="p-2.5 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
                <Info size={14} />
                <span>Apple iOS / iPadOS Safari</span>
              </div>
              <p className="text-zinc-400 leading-normal">
                Web Share Target API saat ini dibatasi oleh Apple di WebKit Safari. Pengguna iPhone dapat menyalin teks/URL langsung ke aplikasi atau memanfaatkan Apple Shortcuts (Pintasan).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              audioService.playAmbientClick();
              setIsInstallModalOpen(true);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
          >
            <Download size={16} />
            <span>Buka Panduan & Pasang Aplikasi ({platform.toUpperCase()})</span>
          </button>

          <button
            onClick={() => {
              audioService.playAmbientClick();
              setIsBackgroundModalOpen(true);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
          >
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Pengaturan Izin Latar Belakang & Baterai HP</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
            <FileJson size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Data & Backup</h3>
            <p className="text-xs text-zinc-400">Simpan data Anda agar aman.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={handleExportData}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 rounded-xl hover:glass-card hover:border-primary transition-all group"
          >
            <Download size={32} className="mb-2 text-zinc-500 group-hover:text-primary transition-colors" />
            <span className="font-bold text-white">Export Data</span>
            <span className="text-xs text-zinc-500 mt-1 group-hover:text-zinc-400">Unduh file .json</span>
          </button>

          <label className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700 rounded-xl hover:glass-card hover:border-secondary transition-all group cursor-pointer">
            <Upload size={32} className="mb-2 text-zinc-500 group-hover:text-secondary transition-colors" />
            <span className="font-bold text-white">Import Data</span>
            <span className="text-xs text-zinc-500 mt-1 group-hover:text-zinc-400">Upload file .json</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* User Guide / Panduan Pengguna */}
      <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <BookOpen size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Panduan Pengguna Kampus Kit</h3>
              <p className="text-xs text-zinc-400">Pelajari fitur, manfaat, dan cara menggunakan aplikasi ini.</p>
            </div>
          </div>
          {isGuideOpen ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
        </button>

        {isGuideOpen && (
          <div className="px-6 md:px-8 pb-8 pt-4 border-t border-white/5 animate-fade-in text-sm text-zinc-300 space-y-8">
            {/* 1. Pengenalan */}
            <div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Apa itu Kampus Kit?
              </h4>
              <p className="leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                Kampus Kit adalah <strong>super-app produktivitas komprehensif</strong> yang dirancang secara khusus untuk mahasiswa. Aplikasi ini menyingkirkan kebutuhanmu untuk mengunduh belasan aplikasi berbeda. Dari manajemen tugas, pencatatan cerdas, sistem belajar AI, perencana jadwal, hingga manajemen keuangan dan kebugaran—semuanya terintegrasi dalam satu platform eksklusif dengan sistem <em>Offline-First</em> (bisa digunakan tanpa kuota) dan tersinkronisasi awan.
              </p>
            </div>

            {/* 2. Akademik & AI */}
            <div>
              <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Brain size={18} className="text-purple-400" /> Fitur Kecerdasan Buatan (AI) & Pembelajaran
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-purple-300 block mb-1">🧠 AI Learning Path (Peta Jalan AI)</strong>
                  <p className="text-xs text-zinc-400">Mintalah AI membuatkan kurikulum belajar langkah-demi-langkah dari nol untuk topik apapun. Dilengkapi estimasi waktu dan dapat diunduh sebagai Roadmap (PDF/Markdown).</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-purple-300 block mb-1">⚡ Micro Learning (Belajar Kilat)</strong>
                  <p className="text-xs text-zinc-400">Tidak punya waktu? Masukkan topik dan AI akan membuatkan ringkasan 2 menit, analogi sederhana, poin kunci, beserta kuis latihan interaktif.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-indigo-300 block mb-1">📓 Smart Notes (Catatan Pintar)</strong>
                  <p className="text-xs text-zinc-400">Editor catatan bergaya blok (seperti Notion) dengan fitur format teks yang kaya. Ketik "/" untuk perintah cepat.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-indigo-300 block mb-1">🗂️ Flashcards (Kartu Hafalan)</strong>
                  <p className="text-xs text-zinc-400">Gunakan metode <em>Spaced Repetition</em> (Pengulangan Berkala) untuk menghafal materi ujian secara efektif ke memori jangka panjang.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-blue-300 block mb-1">🎓 Kalkulator IPK & Grade</strong>
                  <p className="text-xs text-zinc-400">Pantau pergerakan Indeks Prestasi Kumulatif (IPK)-mu dari semester ke semester dan simulasikan nilai untuk mencapai target <em>Cumlaude</em>.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-blue-300 block mb-1">📚 Citation Generator</strong>
                  <p className="text-xs text-zinc-400">Buat daftar pustaka otomatis (APA, MLA, Chicago, dll) untuk skripsi atau makalah hanya dengan memasukkan data buku/jurnal.</p>
                </div>
              </div>
            </div>

            {/* 3. Manajemen Tugas & Waktu */}
            <div>
              <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Target size={18} className="text-emerald-400" /> Manajemen Tugas & Waktu
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-emerald-300 block mb-1">✅ Task Manager (Tugas Utama)</strong>
                  <p className="text-xs text-zinc-400">Kelola tugas kuliahmu dengan papan Kanban atau tampilan daftar. Atur prioritas, tenggat waktu (deadline), dan sub-tugas.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-emerald-300 block mb-1">⏱️ Focus Timer (Pomodoro)</strong>
                  <p className="text-xs text-zinc-400">Gunakan teknik Pomodoro (25 menit fokus, 5 menit istirahat) yang dilengkapi dengan suara ambien lofi/hujan untuk menjaga konsentrasi.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-teal-300 block mb-1">📅 Jadwal & Kalender</strong>
                  <p className="text-xs text-zinc-400">Pusat kontrol jadwal mata kuliah harianmu. Jangan sampai salah jadwal ruang kelas atau absen dosen!</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-teal-300 block mb-1">🔄 Habit Tracker (Kebiasaan)</strong>
                  <p className="text-xs text-zinc-400">Bangun kebiasaan baik layaknya bermain game. Lacak seberapa konsisten kamu membaca buku, bangun pagi, atau coding tiap hari.</p>
                </div>
              </div>
            </div>

            {/* 4. Karir, Keuangan & Kehidupan */}
            <div>
              <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Building size={18} className="text-orange-400" /> Keuangan, Karir & Kesehatan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-orange-300 block mb-1">💰 Budget Manager (Keuangan)</strong>
                  <p className="text-xs text-zinc-400">Buku kas digital anak kos. Catat uang masuk (bulanan dari ortu/freelance) dan uang keluar agar tidak bokek di akhir bulan.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-amber-300 block mb-1">🚀 Career Prep & Portfolio</strong>
                  <p className="text-xs text-zinc-400">Bangun CV/Resume, persiapkan jawaban interview, dan buat portofolio karya akademismu sebelum lulus.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-rose-400 block mb-1">💪 Gym Tracker & Olahraga</strong>
                  <p className="text-xs text-zinc-400">Catat rutinitas latihan fisikmu (Workout/Gym), repitisi, dan set untuk menjaga tubuh tetap bugar di tengah padatnya kuliah.</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-rose-400 block mb-1">🥪 Meal Planner (Perencana Makan)</strong>
                  <p className="text-xs text-zinc-400">Rencanakan menu makan mingguan dan daftar belanja agar asupan gizi seimbang dan lebih hemat.</p>
                </div>
              </div>
            </div>

            {/* 5. Mental Health */}
            <div>
              <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <Zap size={18} className="text-yellow-400" /> Motivasi & Kesehatan Mental
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-yellow-300 block mb-1">💡 Smart Motivation</strong>
                  <p className="text-xs text-zinc-400">Pesan motivasi *pop-up* otomatis berdasarkan pola perilaku dan jam sibukmu (pilih gaya bahasa: Stoikisme, Islami/Ahlulbayt, Bisnis, atau Neurosains).</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <strong className="text-pink-400 block mb-1">🧭 Life Compass & Brain Gym</strong>
                  <p className="text-xs text-zinc-400">Asah kognitif otakmu saat jenuh, dan petakan target hidup jangka panjang (visi 1-5 tahun ke depan).</p>
                </div>
              </div>
            </div>

            {/* 6. Tips Penggunaan */}
            <div className="bg-blue-500/10 p-5 rounded-xl border border-blue-500/20">
              <h4 className="text-base font-bold text-blue-300 mb-3 flex items-center gap-2">
                <HelpCircle size={16} /> Tips Pro & Penggunaan Lanjutan
              </h4>
              <ul className="list-disc pl-5 space-y-3 text-zinc-300">
                <li><strong className="text-white">Navigasi Kilat (Shortcut):</strong> Tekan tombol <kbd className="bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 rounded text-xs mx-1 text-white shadow">Ctrl</kbd> + <kbd className="bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 rounded text-xs mx-1 text-white shadow">K</kbd> (Windows) atau <kbd className="bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 rounded text-xs mx-1 text-white shadow">Cmd</kbd> + <kbd className="bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 rounded text-xs mx-1 text-white shadow">K</kbd> (Mac) dari halaman manapun untuk membuka <em>Command Palette</em>. Kamu bisa mencari fitur atau berpindah menu secepat kilat tanpa mouse!</li>
                <li><strong className="text-white">Sinkronisasi Cloud & Keamanan Data:</strong> Pastikan kamu sudah Login menggunakan Akun Google (di atas halaman Pengaturan ini). Data akan selalu tersimpan lokal di perambanmu agar memuat lebih cepat (meski *offline*), namun sistem juga akan melakukan "Cadangan Awan" ke *Firebase* secara berkala agar tidak hilang saat kamu berpindah HP/Laptop.</li>
                <li><strong className="text-white">Kustomisasi Penampilan:</strong> Personalisasi aplikasimu sepenuhnya! Gulir ke atas halaman ini untuk mengganti Tema Warna Aplikasi, Bentuk UI (Radius Melengkung atau Kotak), Suara Notifikasi, hingga Gaya Animasi.</li>
                <li><strong className="text-white">Desktop App (PWA):</strong> Buka aplikasi ini di browser Chrome/Edge, lalu cari tombol <em>"Install App"</em> di ujung kanan kolom URL web (address bar). Kampus Kit akan berubah menjadi aplikasi *Desktop/Mobile native* tanpa bingkai browser.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Save Actions */}
      <div className="sticky bottom-4 z-40 flex justify-end">
        <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-xl border border-white/10 ${isSaved ? 'bg-green-600 text-white' : 'bg-primary/90 hover:bg-primary text-white shadow-primary/25'}`}
          >
            {isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}
            {!isSaved && <Save size={18} />}
        </button>
      </div>

      {/* System Version & Information */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-700/50 pb-4">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Informasi Sistem</h3>
            <p className="text-xs text-zinc-400">Status dan versi platform Kampus Kit Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Versi Aplikasi</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-black text-white">Kampus Kit V3.3</span>
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold border border-primary/30">Stable</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">Student OS Ecosystem</span>
          </div>

          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Penyimpanan & Sync</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-black text-emerald-400">Offline-First</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/30">Aktif</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">Local Storage + Cloud Backup</span>
          </div>

          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Mesin AI</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-black text-purple-400">Hybrid AI</span>
              <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold border border-purple-500/30">Online + Offline</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1">Gemini Pro + Local Heuristics</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-400">Zona Bahaya</h3>
            <p className="text-xs text-red-400/70">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-400">
            Menghapus semua data lokal akan mereset aplikasi ke pengaturan awal.
          </p>
          <button 
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <Trash2 size={16} /> Reset Aplikasi
          </button>
        </div>
      </div>

      {/* Background & Battery Permission Modal */}
      <BackgroundPermissionModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
      />

      {/* Cross-Platform App Installation Modal */}
      <CrossPlatformInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
