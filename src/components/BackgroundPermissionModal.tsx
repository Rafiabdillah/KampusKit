import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BatteryCharging,
  Smartphone,
  Bell,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Volume2,
  Lock,
  Sparkles,
  Download,
  Power
} from 'lucide-react';
import { backgroundService, BackgroundServiceState } from '../services/backgroundService';
import { audioService } from '../services/audio';

interface BackgroundPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeviceBrand = 'xiaomi' | 'samsung' | 'oppo' | 'vivo' | 'pixel' | 'ios';

export const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [bgState, setBgState] = useState<BackgroundServiceState>(() =>
    backgroundService.getState()
  );
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('xiaomi');
  const [activeTab, setActiveTab] = useState<'permissions' | 'battery'>('permissions');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return backgroundService.subscribe((newState) => {
      setBgState(newState);
    });
  }, []);

  if (!isOpen) return null;

  const handleToggleKeepAlive = async () => {
    audioService.playAmbientClick();
    if (bgState.isKeepAliveActive) {
      backgroundService.stopKeepAlive();
    } else {
      await backgroundService.startKeepAlive();
      audioService.playAmbientSuccess();
    }
  };

  const handleRequestStorage = async () => {
    audioService.playAmbientClick();
    await backgroundService.requestPersistentStorage();
    audioService.playAmbientSuccess();
  };

  const handleRequestNotification = async () => {
    audioService.playAmbientClick();
    await backgroundService.requestNotificationPermission();
    audioService.playAmbientSuccess();
  };

  const handleInstallPwa = async () => {
    audioService.playAmbientClick();
    await backgroundService.promptPwaInstall();
  };

  const handleEnableAll = async () => {
    setIsProcessing(true);
    audioService.playAmbientClick();
    try {
      await backgroundService.enableAllPermissions();
      audioService.playAmbientSuccess();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="relative p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Izin Berjalan di Latar Belakang
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Background Runner
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pastikan pelacakan GPS, pengingat jadwal, dan sinkronisasi tetap berjalan saat HP terkunci.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audioService.playAmbientClick();
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-zinc-950/40 px-6 pt-2">
          <button
            onClick={() => {
              audioService.playAmbientClick();
              setActiveTab('permissions');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Power size={14} />
            Status & Sakelar Izin
          </button>
          <button
            onClick={() => {
              audioService.playAmbientClick();
              setActiveTab('battery');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'battery'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BatteryCharging size={14} />
            Panduan Baterai HP (Anti-Kill)
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'permissions' ? (
            <>
              {/* Quick 1-Click Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-indigo-500/20 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Aktifkan Semua Izin Sekaligus
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Mengaktifkan mesin anti-tidur audio, meminta penyimpanan persisten, dan izin notifikasi dalam satu ketukan.
                  </p>
                </div>
                <button
                  disabled={isProcessing}
                  onClick={handleEnableAll}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>{isProcessing ? 'Memproses...' : 'Izinkan Semua'}</span>
                </button>
              </div>

              {/* Status Checklist List */}
              <div className="space-y-3">
                {/* 1. Keep-Alive Engine */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        bgState.isKeepAliveActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <Volume2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          Mesin Anti-Tidur (Audio Keep-Alive & WakeLock)
                        </span>
                        {bgState.isKeepAliveActive ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Memutar sinyal frekuensi hening yang menjaga thread CPU HP tetap aktif saat layar dimatikan.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleKeepAlive}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      bgState.isKeepAliveActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {bgState.isKeepAliveActive ? 'Matikan' : 'Nyalakan'}
                  </button>
                </div>

                {/* 2. Persistent Storage */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        bgState.hasPersistentStorage
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <HardDrive size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          Penyimpanan Persisten (Persistent Storage)
                        </span>
                        {bgState.hasPersistentStorage ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle2 size={10} /> Diizinkan
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-mono">
                            Belum Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Mencegah browser menghapus cache data GPS, riwayat rute, dan jadwal saat memori HP hampir penuh.
                      </p>
                    </div>
                  </div>
                  {!bgState.hasPersistentStorage ? (
                    <button
                      onClick={handleRequestStorage}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                    >
                      Minta Izin
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold px-2">Aman</span>
                  )}
                </div>

                {/* 3. Notifications */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        bgState.hasNotificationPermission
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <Bell size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          Notifikasi Sistem & Pengingat
                        </span>
                        {bgState.hasNotificationPermission ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle2 size={10} /> Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-mono">
                            Belum Diizinkan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Memberikan peringatan kelas, tugas kuliah, dan sinyal GPS di status bar perangkat.
                      </p>
                    </div>
                  </div>
                  {!bgState.hasNotificationPermission ? (
                    <button
                      onClick={handleRequestNotification}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                    >
                      Izinkan
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold px-2">Siap</span>
                  )}
                </div>

                {/* 4. PWA Installation */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        bgState.isPwaInstalled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <Download size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          Pasang ke Layar Utama (PWA App)
                        </span>
                        {bgState.isPwaInstalled ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle2 size={10} /> Mode Mandiri
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                            Rekomendasi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        PWA terpasang memiliki prioritas memori lebih tinggi daripada tab browser biasa, mengurangi risiko ditutup oleh OS.
                      </p>
                    </div>
                  </div>
                  {bgState.canInstallPwa && !bgState.isPwaInstalled ? (
                    <button
                      onClick={handleInstallPwa}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
                    >
                      Pasang
                    </button>
                  ) : bgState.isPwaInstalled ? (
                    <span className="text-xs text-emerald-400 font-semibold px-2">Terpasang</span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">Gunakan menu browser</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Battery Optimization Guide */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Penting untuk Android:</strong> Sistem operasi seperti Xiaomi, Samsung, dan Oppo sering menutup paksa aplikasi yang berjalan di latar belakang untuk menghemat baterai. Ikuti panduan di bawah ini agar pelacakan tidak terputus.
                </p>
              </div>

              {/* Brand Selector Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'xiaomi', label: 'Xiaomi / Redmi / POCO' },
                  { id: 'samsung', label: 'Samsung Galaxy' },
                  { id: 'oppo', label: 'Oppo / Realme' },
                  { id: 'vivo', label: 'Vivo / iQOO' },
                  { id: 'pixel', label: 'Pixel / Android Lain' },
                  { id: 'ios', label: 'iPhone (iOS)' },
                ].map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      audioService.playAmbientClick();
                      setSelectedBrand(brand.id as DeviceBrand);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedBrand === brand.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-white/[0.04] text-zinc-400 border-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    {brand.label}
                  </button>
                ))}
              </div>

              {/* Step-by-step brand guides */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 text-xs text-zinc-300">
                {selectedBrand === 'xiaomi' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk Xiaomi (MIUI / HyperOS):
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Buka <strong>Setelan (Settings)</strong> &gt; <strong>Aplikasi</strong> &gt; <strong>Kelola Aplikasi</strong> &gt; cari <strong>Chrome</strong> atau <strong>Kampus Kit</strong>.
                      </li>
                      <li>
                        Ketuk menu <strong>Penghemat Baterai</strong> &gt; pilih opsi <strong>"Tidak ada pembatasan" (No restrictions)</strong>.
                      </li>
                      <li>
                        Aktifkan sakelar <strong>"Mulai Otomatis" (Autostart)</strong> agar aplikasi dapat terus beroperasi.
                      </li>
                      <li>
                        Buka tampilan <em>Recent Apps</em> (aplikasi terbaru), <strong>tekan lama kartu Kampus Kit</strong> lalu ketuk ikon <strong>Gembok (Lock)</strong> agar tidak terhapus saat Anda membersihkan RAM.
                      </li>
                    </ol>
                  </div>
                )}

                {selectedBrand === 'samsung' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk Samsung Galaxy (One UI):
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Tekan lama ikon <strong>Kampus Kit</strong> atau <strong>Chrome</strong> di layar utama &gt; ketuk ikon <strong>(i) Info Aplikasi</strong>.
                      </li>
                      <li>
                        Buka menu <strong>Baterai</strong> &gt; ubah pilihan dari <em>Dioptimalkan</em> menjadi <strong>"Tidak Dibatasi" (Unrestricted)</strong>.
                      </li>
                      <li>
                        Buka <strong>Pengaturan</strong> &gt; <strong>Perawatan Perangkat & Baterai</strong> &gt; <strong>Baterai</strong> &gt; <strong>Batas penggunaan latar belakang</strong>.
                      </li>
                      <li>
                        Pastikan Kampus Kit <strong>TIDAK</strong> ada di daftar <em>"Aplikasi yang selalu tidur" (Deep sleeping apps)</em>.
                      </li>
                    </ol>
                  </div>
                )}

                {selectedBrand === 'oppo' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk Oppo & Realme (ColorOS / Realme UI):
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Tekan lama ikon aplikasi di layar utama &gt; pilih <strong>Info Aplikasi</strong>.
                      </li>
                      <li>
                        Buka menu <strong>Penggunaan Baterai</strong> &gt; aktifkan sakelar <strong>"Izinkan aktivitas latar belakang"</strong> dan <strong>"Izinkan mulai otomatis"</strong>.
                      </li>
                      <li>
                        Buka layar <em>Recent Apps</em>, ketuk titik tiga di atas kartu Kampus Kit lalu pilih <strong>Kunci (Lock)</strong>.
                      </li>
                    </ol>
                  </div>
                )}

                {selectedBrand === 'vivo' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk Vivo & iQOO (Funtouch OS):
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Buka <strong>Pengaturan</strong> &gt; <strong>Baterai</strong> &gt; <strong>Konsumsi daya latar belakang</strong>.
                      </li>
                      <li>
                        Cari <strong>Chrome</strong> atau <strong>Kampus Kit</strong> &gt; pilih <strong>"Izinkan penggunaan daya latar belakang tinggi"</strong>.
                      </li>
                      <li>
                        Buka Pengaturan &gt; Manajemen Aplikasi &gt; <strong>Mulai Otomatis</strong> &gt; aktifkan untuk Kampus Kit.
                      </li>
                    </ol>
                  </div>
                )}

                {selectedBrand === 'pixel' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk Google Pixel & Android Standar:
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Tekan lama ikon aplikasi &gt; ketuk <strong>Info Aplikasi (App Info)</strong>.
                      </li>
                      <li>
                        Buka <strong>Penggunaan baterai aplikasi</strong> &gt; pilih <strong>"Tidak Dibatasi" (Unrestricted)</strong>.
                      </li>
                      <li>
                        Buka menu <strong>Izin (Permissions)</strong> &gt; <strong>Lokasi</strong> &gt; ubah menjadi <strong>"Selalu Izinkan" (Allow all the time)</strong> jika tersedia.
                      </li>
                    </ol>
                  </div>
                )}

                {selectedBrand === 'ios' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-400" />
                      Petunjuk iPhone / iPad (Safari iOS):
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-zinc-300">
                      <li>
                        Di Safari, ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas di bawah layar).
                      </li>
                      <li>
                        Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                      </li>
                      <li>
                        Buka aplikasi langsung dari ikon layar utama iPhone Anda.
                      </li>
                      <li>
                        Buka <strong>Pengaturan iPhone</strong> &gt; <strong>Privasi & Keamanan</strong> &gt; <strong>Layanan Lokasi</strong> &gt; pastikan Safari / Kampus Kit diatur ke <strong>"Saat Menggunakan App"</strong> dan <strong>Lokasi Tepat (Precise)</strong> aktif.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Lock size={14} className="text-emerald-400" />
            <span>Privasi terenkripsi & data lokasi hanya dibagikan ke partner Anda.</span>
          </div>
          <button
            onClick={() => {
              audioService.playAmbientClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
