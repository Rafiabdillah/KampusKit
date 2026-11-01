import React, { useState } from 'react';
import { 
  X, Smartphone, Monitor, Apple, Download, CheckCircle2, 
  ExternalLink, Share2, PlusSquare, Sparkles, Shield, Battery, 
  Keyboard, Laptop, ArrowRight, Zap, Check
} from 'lucide-react';
import { useDevicePlatform, PlatformType } from '../hooks/useDevicePlatform';
import { audioService } from '../services/audio';

interface CrossPlatformInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrossPlatformInstallModal: React.FC<CrossPlatformInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { platform, isStandalone, isInstallable, triggerInstall } = useDevicePlatform();

  // Initialize active tab based on detected platform
  const [activeTab, setActiveTab] = useState<'android' | 'apple' | 'windows'>(() => {
    if (platform === 'android') return 'android';
    if (platform === 'ios' || platform === 'mac') return 'apple';
    return 'windows';
  });

  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    audioService.playAmbientClick();
    const success = await triggerInstall();
    if (success) {
      setInstallSuccess(true);
      audioService.playAmbientSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 z-10 text-zinc-100 animate-slide-up max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/25">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Pasang Kampus Kit
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Universal OS
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Aplikasi multi-platform berkinerja tinggi untuk Android, Apple & Windows
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.playAmbientClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 my-4 bg-zinc-950/70 border border-white/5 rounded-2xl flex-shrink-0">
          <button
            onClick={() => {
              audioService.playAmbientClick();
              setActiveTab('android');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone size={16} />
            <span>Android</span>
            {platform === 'android' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping hidden sm:inline-block" />
            )}
          </button>

          <button
            onClick={() => {
              audioService.playAmbientClick();
              setActiveTab('apple');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'apple'
                ? 'bg-zinc-100 text-zinc-900 shadow-lg shadow-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Apple size={16} />
            <span>Apple iOS/Mac</span>
            {(platform === 'ios' || platform === 'mac') && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping hidden sm:inline-block" />
            )}
          </button>

          <button
            onClick={() => {
              audioService.playAmbientClick();
              setActiveTab('windows');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'windows'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor size={16} />
            <span>Windows</span>
            {platform === 'windows' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping hidden sm:inline-block" />
            )}
          </button>
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          
          {/* ANDROID TAB */}
          {activeTab === 'android' && (
            <div className="space-y-4 animate-fade-in">
              {/* Native Prompt Banner if Installable */}
              {isInstallable && !isStandalone && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={16} /> Perangkat Terdeteksi Siap Pasang
                    </h3>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Pasang langsung ke ponsel Android Anda dengan 1 sentuhan.
                    </p>
                  </div>
                  <button
                    onClick={handleNativeInstall}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Pasang Sekarang</span>
                  </button>
                </div>
              )}

              {isStandalone && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 size={24} className="flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Aplikasi Telah Terpasang di Android</div>
                    <div className="text-xs text-zinc-400">Kampus Kit sudah berjalan mandiri sebagai aplikasi native (WebAPK).</div>
                  </div>
                </div>
              )}

              {/* Step by Step Manual Guide */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={14} className="text-emerald-400" />
                  Panduan Pemasangan Manual di Android (Chrome / Samsung Browser)
                </h4>
                
                <ol className="space-y-2.5 text-xs text-zinc-300 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Buka situs Kampus Kit di peramban <strong>Google Chrome</strong> atau <strong>Samsung Internet</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Ketuk tombol titik tiga <strong>(⋮)</strong> di sudut kanan atas layar peramban.
                  </li>
                  <li className="leading-relaxed">
                    Pilih opsi <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Ketuk <strong>"Install"</strong>. Ikon Kampus Kit akan muncul di daftar aplikasi ponsel Anda layaknya aplikasi Play Store.
                  </li>
                </ol>
              </div>

              {/* Battery & Background Optimization Tips for Android */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Battery size={14} className="text-amber-400" />
                  Tips Agar GPS & Notifikasi Selalu Hidup di Latar Belakang (Android)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ponsel Android (khususnya Samsung OneUI, Xiaomi MIUI/HyperOS, Oppo ColorOS, dan Vivo) memiliki fitur pembersihan otomatis agresif. Agar GPS dan pengingat kuliah tidak terhenti saat layar mati:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="font-bold text-emerald-400 block mb-0.5">1. Kunci Aplikasi di Recent Apps</span>
                    Buka tampilan recent apps, tekan dan tahan kartu Kampus Kit, lalu ketuk ikon <strong>Gembok (Lock)</strong>.
                  </div>
                  <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="font-bold text-amber-400 block mb-0.5">2. Penghemat Baterai: Tidak Dibatasi</span>
                    Masuk ke Pengaturan HP → Aplikasi → Kampus Kit → Baterai → Pilih <strong>"Tidak Dibatasi" (Unrestricted)</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPLE (iOS / iPadOS / macOS) TAB */}
          {activeTab === 'apple' && (
            <div className="space-y-4 animate-fade-in">
              {isStandalone && (
                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-white/20 flex items-center gap-3 text-white">
                  <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Berjalan dalam Mode Mandiri (Apple PWA)</div>
                    <div className="text-xs text-zinc-300">Kampus Kit aktif tanpa bilah Safari, mendukung gestur penuh iPhone & iPad.</div>
                  </div>
                </div>
              )}

              {/* iPhone & iPad Step-by-Step */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
                    <Apple size={16} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Cara Pasang di iPhone & iPad (Safari)
                  </h4>
                </div>

                <div className="space-y-3 text-xs text-zinc-300">
                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        Ketuk tombol Bagikan (Share)
                        <Share2 size={13} className="text-blue-400" />
                      </p>
                      <p className="text-zinc-400 mt-0.5">
                        Di bilah bawah Safari iPhone (atau bilah atas iPad), ketuk ikon persegi dengan tanda panah ke atas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        Pilih "Tambahkan ke Layar Utama" (Add to Home Screen)
                        <PlusSquare size={13} className="text-emerald-400" />
                      </p>
                      <p className="text-zinc-400 mt-0.5">
                        Gulir menu ke bawah dan sentuh opsi bertuliskan <strong>"Add to Home Screen"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-white">Ketuk "Tambah" (Add) di Kanan Atas</p>
                      <p className="text-zinc-400 mt-0.5">
                        Ikon aplikasi Kampus Kit akan langsung tersimpan di Home Screen iOS Anda dengan pengalaman layar penuh tanpa gangguan URL.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mac (macOS) Guide */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Laptop size={14} className="text-blue-400" />
                  Pemasangan di Mac (macOS Sonoma / Ventura)
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pada Mac dengan <strong>Safari</strong>: Buka menu <em>File → Add to Dock (Tambahkan ke Dock)</em>. Pada <strong>Google Chrome</strong>: Ketuk ikon install di sebelah kanan kolom alamat web.
                </p>
              </div>
            </div>
          )}

          {/* WINDOWS TAB */}
          {activeTab === 'windows' && (
            <div className="space-y-4 animate-fade-in">
              {/* Native Prompt Banner for Windows Edge / Chrome */}
              {isInstallable && !isStandalone && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                      <Sparkles size={16} /> Pasang Aplikasi Desktop Windows
                    </h3>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Sematkan ke Taskbar dan Start Menu Windows untuk akses instan tanpa peramban.
                    </p>
                  </div>
                  <button
                    onClick={handleNativeInstall}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Pasang di Windows</span>
                  </button>
                </div>
              )}

              {isStandalone && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-blue-400">
                  <CheckCircle2 size={24} className="flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Terpasang sebagai Windows Desktop App</div>
                    <div className="text-xs text-zinc-300">Kampus Kit aktif dengan akselerasi hardware dan integrasi taskbar.</div>
                  </div>
                </div>
              )}

              {/* Edge & Chrome Desktop Installation Instructions */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Monitor size={14} className="text-blue-400" />
                  Langkah Memasang di Microsoft Edge / Chrome (Windows 10/11)
                </h4>
                <ol className="space-y-2 text-xs text-zinc-300 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Perhatikan ikon <strong>Monitor / Aplikasi</strong> di sebelah kanan kolom URL (Address Bar).
                  </li>
                  <li className="leading-relaxed">
                    Klik tombol tersebut bertuliskan <strong>"App available. Install Kampus Kit"</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Klik <strong>Install</strong>. Centang opsi <em>"Pin to taskbar"</em> dan <em>"Pin to Start"</em>.
                  </li>
                  <li className="leading-relaxed">
                    Aplikasi akan memiliki jendela mandiri, minim penggunaan RAM, dan mendukung mode offline sepenuhnya.
                  </li>
                </ol>
              </div>

              {/* Windows Keyboard Shortcuts Cheatsheet */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Keyboard size={14} className="text-purple-400" />
                  Pintasan Keyboard Windows (Power User Shortcuts)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Command Palette</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Buka/Tutup Sidebar</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + B
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Ke Dashboard</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + Shift + D
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Ke Tugas & Proyek</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + Shift + T
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Ke Catatan Cerdas</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + Shift + N
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Ke Jadwal Kuliah</span>
                    <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-zinc-200">
                      Ctrl + Shift + S
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Shield size={14} className="text-emerald-400" />
            <span>PWA Bersertifikat Standar Web W3C</span>
          </div>
          <button
            onClick={() => {
              audioService.playAmbientClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
