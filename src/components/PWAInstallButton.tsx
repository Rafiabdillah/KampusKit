import React, { useState } from 'react';
import { Download, Smartphone, Monitor, Apple, CheckCircle2 } from 'lucide-react';
import { useDevicePlatform } from '../hooks/useDevicePlatform';
import { CrossPlatformInstallModal } from './CrossPlatformInstallModal';
import { audioService } from '../services/audio';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'icon-only';
  showInstalledBadge?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
  showInstalledBadge = false,
}) => {
  const { platform, isStandalone, isInstallable, triggerInstall } = useDevicePlatform();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    audioService.playAmbientClick();
    if (isInstallable) {
      const installed = await triggerInstall();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const getPlatformIcon = () => {
    if (platform === 'ios' || platform === 'mac') return <Apple size={14} />;
    if (platform === 'android') return <Smartphone size={14} />;
    return <Monitor size={14} />;
  };

  const getPlatformLabel = () => {
    if (platform === 'ios') return 'iPhone / iPad';
    if (platform === 'android') return 'Android';
    if (platform === 'windows') return 'Windows';
    if (platform === 'mac') return 'Mac';
    return 'Desktop / HP';
  };

  if (isStandalone) {
    if (!showInstalledBadge) return null;
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle2 size={13} />
        <span>Terpasang ({getPlatformLabel()})</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'icon-only' ? (
        <button
          onClick={handleClick}
          className={`w-9 h-9 flex items-center justify-center rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary active:scale-95 transition-all ${className}`}
          title={`Pasang Kampus Kit di ${getPlatformLabel()}`}
          aria-label="Pasang Aplikasi"
        >
          <Download size={16} />
        </button>
      ) : variant === 'full' ? (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 to-purple-600/15 hover:from-primary/25 hover:to-purple-600/25 border border-primary/30 text-white font-bold transition-all active:scale-[0.99] group shadow-lg shadow-primary/10 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Download size={18} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Pasang Kampus Kit
                <span className="text-[10px] px-1.5 py-0.2 bg-primary/30 rounded text-primary font-mono">
                  {getPlatformLabel()}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-normal">
                Buka mandiri tanpa peramban, hemat RAM & baterai
              </div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
            {getPlatformIcon()}
          </div>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm ${className}`}
          title={`Pasang Kampus Kit di ${getPlatformLabel()}`}
        >
          <Download size={14} className="animate-bounce" />
          <span>Pasang App</span>
          <span className="hidden xl:inline text-[10px] px-1.5 py-0.5 bg-black/40 rounded text-zinc-300 font-mono">
            {getPlatformLabel()}
          </span>
        </button>
      )}

      {/* Guide & Install Modal */}
      <CrossPlatformInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
