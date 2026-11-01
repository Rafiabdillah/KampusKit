import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';

interface LovePingOverlayProps {
  senderName: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export const LovePingOverlay: React.FC<LovePingOverlayProps> = ({
  senderName,
  isVisible,
  onDismiss,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-[10000] flex flex-col items-center justify-center overflow-hidden">
          {/* Floating Hearts Particles */}
          {[...Array(14)].map((_, i) => {
            const randomX = (i % 2 === 0 ? 1 : -1) * (30 + (i * 25));
            const randomDelay = (i * 0.12);
            const randomScale = 0.8 + (i % 4) * 0.35;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 150, x: randomX, scale: 0.2 }}
                animate={{
                  opacity: [0, 0.9, 1, 0],
                  y: -300 - (i * 20),
                  x: randomX + (Math.sin(i) * 60),
                  scale: [0.2, randomScale, randomScale * 1.1, 0.5],
                  rotate: [0, (i % 2 === 0 ? 25 : -25)]
                }}
                transition={{
                  duration: 2.8,
                  delay: randomDelay,
                  ease: 'easeOut'
                }}
                className="absolute text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]"
              >
                <Heart size={32} fill="currentColor" />
              </motion.div>
            );
          })}

          {/* Central Sweet Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="pointer-events-auto cursor-pointer px-6 py-4 rounded-3xl bg-zinc-950/90 border-2 border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.4)] backdrop-blur-xl flex items-center gap-3.5 max-w-sm text-center"
            onClick={onDismiss}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/40 animate-pulse shrink-0">
              <Heart size={26} fill="currentColor" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold uppercase tracking-wider">
                <Sparkles size={13} className="animate-spin text-amber-300" />
                Sinyal Ping Perhatian!
              </div>
              <p className="text-sm font-extrabold text-white mt-0.5">
                {senderName} menyapa dan memantau keadaanmu ✨
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
