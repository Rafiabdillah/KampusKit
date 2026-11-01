import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Sun, Flame, Moon, Coffee, Volume2, VolumeX, 
  CheckCircle2, Share2, Copy, ArrowRight, X, Brain, 
  Anchor, Heart, Briefcase, Zap, Compass, RotateCcw, Play, Check
} from 'lucide-react';
import { MotivationItem, getSmartMotivationByTime } from '../data/motivationData';
import { ViewState } from '../types';

interface SmartMotivationModalProps {
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  preferredCategories?: string[];
  autoSpoken?: boolean;
}

export const SmartMotivationModal: React.FC<SmartMotivationModalProps> = ({
  onClose,
  onNavigate,
  preferredCategories,
}) => {
  const [quote, setQuote] = useState<MotivationItem>(() => getSmartMotivationByTime(preferredCategories));
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [breathCycle, setBreathCycle] = useState(1);

  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour >= 4 && hour < 11) return { title: '☀️ Sapaan Pagi Emas & Priming Otak', sub: 'Mulai hari dengan intensi tinggi, aktivasi dopamin, dan 1 prioritas terpenting.', icon: Sun, color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30' };
    if (hour >= 11 && hour < 16) return { title: '⚡ Midday Focus & Anti-Crash Reset', sub: 'Pertahankan daya tahan kognitif, hindari multitasking, dan selesaikan tugas kunci.', icon: Coffee, color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30' };
    if (hour >= 16 && hour < 20) return { title: '🔥 Evening Grit & Tuntaskan Hari', sub: 'Jangan menyerah di garis akhir. Konsistensi kecil sore ini adalah kemenangan besarmu.', icon: Flame, color: 'from-rose-500/20 to-orange-500/20 text-rose-400 border-rose-500/30' };
    return { title: '🌙 Evening Reflection & Stoic Rest', sub: 'Evaluasi hari ini dengan syukur, lepaskan hal di luar kendalimu, dan siapkan otakmu istirahat nyenyak.', icon: Moon, color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' };
  };

  const greetingInfo = getGreeting();

  // Breathing Box Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showBreathing) {
      timer = setInterval(() => {
        setBreathSeconds(prev => {
          if (prev <= 1) {
            setTimeout(() => {
              setBreathPhase(currPhase => {
                if (currPhase === 'INHALE') return 'HOLD';
                if (currPhase === 'HOLD') return 'EXHALE';
                setBreathCycle(c => c + 1);
                return 'INHALE';
              });
            }, 0);
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showBreathing]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Text-to-Speech.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `${greetingInfo.title}. ${quote.source} pernah berpesan: ${quote.text}. Penerapan praktis: ${quote.actionStep}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleCopy = () => {
    const fullText = `"${quote.text}"\n— ${quote.source}\n\n💡 Prinsip: ${quote.scientificPrinciple}\n🎯 Langkah Aksi: ${quote.actionStep}\n\n(KampusKit Neuro-Spiritual Motivation)`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPillarBadge = (type: string) => {
    switch (type) {
      case 'SCIENCE': return { label: 'Neurosains', icon: Brain, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'AHLULBAYT': return { label: 'Spiritual Ahlulbayt', icon: Moon, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'BUSINESS': return { label: 'Bisnis & Karir', icon: Briefcase, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'STOICISM': return { label: 'Stoikisme', icon: Anchor, bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
      case 'PSYCHOLOGY': return { label: 'Psikologi & Grit', icon: Heart, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'TOUGH_LOVE': return { label: 'Tamparan Realitas', icon: Zap, bg: 'bg-red-500/10 text-red-400 border-red-500/30' };
      default: return { label: 'Inspirasi', icon: Sparkles, bg: 'bg-primary/10 text-primary border-primary/30' };
    }
  };

  const pillar = getPillarBadge(quote.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${greetingInfo.color}`} />
        
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center ${greetingInfo.color.split(' ').pop()}`}>
              <greetingInfo.icon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Pemberhentian Mental</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${pillar.bg}`}>
                  <pillar.icon size={11} /> {pillar.label}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{greetingInfo.title}</h3>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Breathing Protocol Mode */}
        {showBreathing ? (
          <div className="bg-zinc-950/70 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-6 my-2">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span className="font-medium text-indigo-400">🧠 Physiological Reset (Turunkan Kortisol)</span>
              <span>Siklus: #{breathCycle}</span>
            </div>

            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <motion.div 
                animate={{
                  scale: breathPhase === 'INHALE' ? 1.35 : breathPhase === 'HOLD' ? 1.35 : 0.9,
                  opacity: breathPhase === 'INHALE' ? 0.9 : 0.5
                }}
                transition={{ duration: 4, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 blur-md"
              />
              <div className="relative z-10 w-28 h-28 rounded-full bg-zinc-900 border-2 border-indigo-400 flex flex-col items-center justify-center">
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">
                  {breathPhase === 'INHALE' ? 'Tarik Napas' : breathPhase === 'HOLD' ? 'Tahan' : 'Hembuskan'}
                </span>
                <span className="text-3xl font-black text-white">{breathSeconds}s</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              Tarik napas dalam melalui hidung, tahan sejenak, lalu hembuskan perlahan lewat mulut. Ini mengaktifkan saraf vagus dan menenangkan pikiran.
            </p>

            <button 
              onClick={() => setShowBreathing(false)}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Kembali ke Kutipan
            </button>
          </div>
        ) : (
          /* Main Quote Card */
          <div className="space-y-5">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 relative group">
              <p className="text-base sm:text-xl font-serif text-zinc-100 italic leading-relaxed mb-4">
                "{quote.text}"
              </p>
              
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-4 h-px bg-indigo-500" /> {quote.source}
                </span>
                <span className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700">
                  🔬 Prinsip: <strong className="text-zinc-200">{quote.scientificPrinciple}</strong>
                </span>
              </div>
            </div>

            {/* Context & Micro Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  💡 Pemahaman Konseptual:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {quote.context}
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/25 p-4 rounded-xl">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                  🎯 Langkah Aksi 1 Menit:
                </span>
                <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                  {quote.actionStep}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Bottom Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleSpeak}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isPlayingAudio 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
              title="Dengarkan dengan Suara"
            >
              {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isPlayingAudio ? 'Hentikan' : 'Dengarkan'}</span>
            </button>

            <button 
              onClick={handleCopy}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Salin Teks"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            <button 
              onClick={() => setShowBreathing(!showBreathing)}
              className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Latihan Pernapasan Reset Kortisol"
            >
              <RotateCcw size={15} />
              <span>Bio-Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button 
              onClick={() => {
                onClose();
                onNavigate('focus');
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
            >
              Mulai Sesi Fokus
            </button>

            <button 
              onClick={() => {
                onClose();
                onNavigate('tasks');
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5"
            >
              <span>Eksekusi Tugas</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
