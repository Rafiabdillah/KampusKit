import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Timer } from 'lucide-react';
import { audioService } from '../services/audio';

interface ChatPomodoroWidgetProps {
  initialMinutes?: number;
}

export const ChatPomodoroWidget: React.FC<ChatPomodoroWidgetProps> = ({ initialMinutes = 25 }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsActive(false);
              setIsCompleted(true);
              audioService.playAmbientSuccess();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => {
    if (isCompleted) {
      setSecondsLeft(initialMinutes * 60);
      setIsCompleted(false);
    }
    setIsActive(!isActive);
    audioService.playAmbientClick();
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setSecondsLeft(initialMinutes * 60);
    audioService.playAmbientClick();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = ((initialMinutes * 60 - secondsLeft) / (initialMinutes * 60)) * 100;

  return (
    <div className="mt-3 bg-zinc-900/90 border border-purple-500/30 rounded-2xl p-4 text-white shadow-xl max-w-sm">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Pomodoro Sesi Fokus</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {initialMinutes} Menit
        </span>
      </div>

      <div className="flex flex-col items-center my-2">
        <div className="text-3xl font-black font-mono tracking-tight text-white mb-1">
          {timeFormatted}
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mb-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2 animate-bounce">
            <CheckCircle2 size={14} /> Sesi selesai! Luar biasa! Waktunya istirahat 5 menit.
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 mb-3 text-center">
            {isActive ? 'Tetap fokus, jauhkan notifikasi HP.' : 'Siap untuk mulai sesi belajar tanpa distraksi?'}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTimer}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
            {isActive ? 'Jeda' : isCompleted ? 'Ulangi' : 'Mulai Fokus'}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
