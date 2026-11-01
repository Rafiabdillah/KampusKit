import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lightbulb, Brain, Quote, RefreshCw, Zap, Moon, Search, Copy, 
  Check, LayoutGrid, ChevronDown, Sparkles, Briefcase, Heart, 
  Share2, Maximize2, X, Anchor, Bell, Volume2, VolumeX, 
  RotateCcw, ShieldAlert, CheckCircle2, ArrowRight, Sliders, 
  Flame, Sun, Clock
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notifications';
import { MOTIVATION_DATABASE, MotivationItem, getEmergencyMotivation } from '../data/motivationData';
import { useStore } from '../store/useStore';

export { MOTIVATION_DATABASE as QUOTES_DB };

export const Motivation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCIENCE' | 'AHLULBAYT' | 'BUSINESS' | 'PSYCHOLOGY' | 'STOICISM' | 'TOUGH_LOVE'>('ALL');
  const [randomQuote, setRandomQuote] = useState<MotivationItem>(() => MOTIVATION_DATABASE[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [likedQuotes, setLikedQuotes] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [zenModeQuote, setZenModeQuote] = useState<MotivationItem | null>(null);
  
  // Audio & TTS State
  const [isPlayingHeroVoice, setIsPlayingHeroVoice] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SOS Emergency Protocol Modal
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosStep, setSosStep] = useState<1 | 2 | 3>(1);
  const [sosBreathCount, setSosBreathCount] = useState(4);
  const [sosBreathPhase, setSosBreathPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [sosQuote, setSosQuote] = useState<MotivationItem>(() => getEmergencyMotivation());
  const [sosMicroTask, setSosMicroTask] = useState('');
  const [sosDone, setSosDone] = useState(false);

  // Quick Notification Settings Drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const userProfile = useStore(state => state.userProfile);
  const setUserProfile = useStore(state => state.setUserProfile);

  const notifEnabled = userProfile.motivationNotifEnabled !== false;
  const notifFreq = userProfile.motivationFrequency || 'DAILY_4X';
  const smartDailyModalEnabled = userProfile.smartDailyModalEnabled !== false;

  useEffect(() => {
    handleRandomize();
    const savedLikes = StorageService.getItem<string[]>('liked_quotes', []);
    setLikedQuotes(savedLikes);
  }, []);

  useEffect(() => {
    setVisibleCount(12);
  }, [activeTab, searchTerm]);

  // Breathing timer for SOS mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSosModal && sosStep === 1) {
      timer = setInterval(() => {
        setSosBreathCount(prev => {
          if (prev <= 1) {
            setTimeout(() => {
              setSosBreathPhase(currPhase => {
                if (currPhase === 'INHALE') return 'HOLD';
                if (currPhase === 'HOLD') return 'EXHALE';
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
  }, [showSosModal, sosStep]);

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATION_DATABASE.length);
    setRandomQuote(MOTIVATION_DATABASE[randomIndex]);
    if (isPlayingHeroVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingHeroVoice(false);
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newLikes: string[];
    if (likedQuotes.includes(id)) {
      newLikes = likedQuotes.filter(qid => qid !== id);
    } else {
      newLikes = [...likedQuotes, id];
    }
    setLikedQuotes(newLikes);
    StorageService.setItem('liked_quotes', newLikes);
  };

  const handleShare = async (quote: MotivationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `"${quote.text}"\n— ${quote.source}\n\n🔬 Prinsip: ${quote.scientificPrinciple}\n🎯 Langkah Aksi: ${quote.actionStep}\n\nVia KampusKit Neuro-Spiritual Motivation`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mutiara Motivasi KampusKit',
          text: text,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyText = (quote: MotivationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `"${quote.text}"\n— ${quote.source}\n\n💡 Konteks: ${quote.context}\n🎯 Aksi: ${quote.actionStep}`;
    navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung fitur Text-to-Speech.');
      return;
    }

    if (activePlayingId === id || (id === 'hero' && isPlayingHeroVoice)) {
      window.speechSynthesis.cancel();
      setActivePlayingId(null);
      setIsPlayingHeroVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setActivePlayingId(null);
      setIsPlayingHeroVoice(false);
    };
    utterance.onerror = () => {
      setActivePlayingId(null);
      setIsPlayingHeroVoice(false);
    };

    window.speechSynthesis.speak(utterance);
    if (id === 'hero') {
      setIsPlayingHeroVoice(true);
    } else {
      setActivePlayingId(id);
    }
  };

  const handleTestNotification = async () => {
    const success = await NotificationService.sendTestMotivationNotification();
    if (success) {
      alert('✅ Notifikasi motivasi berhasil dikirim! Silakan periksa notification bar di perangkat Anda.');
    } else {
      alert('⚠️ Mohon izinkan notifikasi di browser Anda terlebih dahulu.');
    }
  };

  const handleUpdatePreference = (key: string, value: any) => {
    const updated = {
      ...userProfile,
      [key]: value
    };
    setUserProfile(updated);
    StorageService.setItem('user_profile', updated);
  };

  const filteredQuotes = useMemo(() => {
    return MOTIVATION_DATABASE.filter(q => {
      const matchesTab = activeTab === 'ALL' || q.type === activeTab;
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            q.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            q.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            q.scientificPrinciple.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const displayQuotes = filteredQuotes.slice(0, visibleCount);
  const hasMore = filteredQuotes.length > visibleCount;
  const loadMore = () => setVisibleCount(prev => prev + 12);

  // Styling Helpers
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SCIENCE': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
      case 'AHLULBAYT': return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400';
      case 'BUSINESS': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400';
      case 'PSYCHOLOGY': return 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400';
      case 'STOICISM': return 'from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-300';
      case 'TOUGH_LOVE': return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400';
      default: return 'from-zinc-800 to-zinc-900 border-zinc-700 text-zinc-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SCIENCE': return <Brain size={14}/>;
      case 'AHLULBAYT': return <Moon size={14}/>;
      case 'BUSINESS': return <Briefcase size={14}/>;
      case 'PSYCHOLOGY': return <Heart size={14}/>;
      case 'STOICISM': return <Anchor size={14}/>;
      case 'TOUGH_LOVE': return <Zap size={14}/>;
      default: return <Sparkles size={14}/>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SCIENCE': return 'Neurosains';
      case 'AHLULBAYT': return 'Spiritual Ahlulbayt';
      case 'BUSINESS': return 'Bisnis & Karir';
      case 'PSYCHOLOGY': return 'Psikologi & Grit';
      case 'STOICISM': return 'Stoikisme';
      case 'TOUGH_LOVE': return 'Tamparan Realitas';
      default: return 'Inspirasi';
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
              <Sparkles size={12} /> High-Performance Mental Fuel
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Lightbulb className="text-yellow-400 fill-yellow-400/20" size={32} /> 
            Neuro-Spiritual Motivation Engine
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Sistem pengingat motivasi harian berbasis biologi otak, spiritualitas, strategi bisnis, psikologi kognitif, dan ketahanan mental stoik.
          </p>
        </div>
        
        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button 
            onClick={() => {
              setSosQuote(getEmergencyMotivation());
              setSosStep(1);
              setSosDone(false);
              setShowSosModal(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-600/20 active:scale-95"
            title="Protokol Cepat Mengatasi Malas Berat / Prokrastinasi"
          >
            <ShieldAlert size={16} /> 🚨 SOS Tombol Anti-Malas
          </button>

          <button 
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
            title="Atur Frekuensi & Notifikasi Motivasi"
          >
            <Sliders size={15} className="text-primary" /> Pengaturan Notifikasi
          </button>
        </div>
      </div>

      {/* MOTIVATION NOTIFICATION SETTINGS DRAWER / BANNER */}
      {showSettingsDrawer && (
        <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl p-5 sm:p-6 mb-8 shadow-xl animate-fade-in">
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Bell className="text-primary" size={20} />
              <div>
                <h4 className="text-sm font-bold text-white">Konfigurasi Sistem Motivasi Latar Belakang</h4>
                <p className="text-xs text-zinc-400">Atur jadwal pengiriman notifikasi otomatis ke perangkatmu bahkan saat aplikasi ditutup.</p>
              </div>
            </div>
            <button onClick={() => setShowSettingsDrawer(false)} className="text-zinc-500 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Toggle Notif Latar Belakang */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-1">Notifikasi Latar Belakang</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                  Kirim dorongan inspirasi otomatis melalui Service Worker Web Push & Notification Triggers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifEnabled} 
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      const granted = await NotificationService.requestPermission();
                      if (granted) {
                        handleUpdatePreference('motivationNotifEnabled', true);
                      }
                    } else {
                      handleUpdatePreference('motivationNotifEnabled', false);
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-xs font-medium text-zinc-300">{notifEnabled ? 'Aktif' : 'Nonaktif'}</span>
              </label>
            </div>

            {/* 2. Frekuensi Notif */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-1">Frekuensi Notifikasi</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                  Waktu terbaik sesuai ritme sirkadian tubuh dan waktu produktif harian.
                </p>
              </div>
              <select 
                value={notifFreq}
                onChange={(e) => handleUpdatePreference('motivationFrequency', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-primary w-full"
              >
                <option value="DAILY_4X">4x Sehari (Pagi 06:30, Siang 12:30, Sore 17:00, Malam 21:00)</option>
                <option value="DAILY_2X">2x Sehari (Pagi 07:00 & Malam 20:30)</option>
                <option value="EVERY_2_HOURS">Setiap 2 Jam (Jam Produktif 08:00 - 22:00)</option>
                <option value="EVERY_4_HOURS">Setiap 4 Jam</option>
                <option value="MORNING_ONLY">Hanya Pagi Hari (06:30 Priming)</option>
              </select>
            </div>

            {/* 3. In-App Popup saat buka app & Test Button */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-1">Inspirasi saat Buka App</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                  Tampilkan popup bijak secara otomatis saat kamu pertama kali membuka app di jam tertentu.
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={smartDailyModalEnabled} 
                    onChange={(e) => handleUpdatePreference('smartDailyModalEnabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-2 text-xs text-zinc-300">{smartDailyModalEnabled ? 'Aktif' : 'Off'}</span>
                </label>

                <button 
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg text-xs font-bold transition-colors"
                >
                  Tes Notif Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative w-full mb-8">
        <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
        <input 
          className="w-full bg-zinc-900/60 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-2xl focus:border-primary focus:outline-none transition-all text-sm placeholder:text-zinc-500 shadow-inner"
          placeholder="Cari topik (misal: 'malas', 'dopamin', 'skripsi', 'waktu', 'seneca', 'ali bin abi thalib')..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3.5 text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* HERO QUOTE OF THE MOMENT */}
      {randomQuote && !searchTerm && (
        <div className="relative bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-zinc-950 border border-indigo-500/25 rounded-3xl p-6 sm:p-10 mb-10 shadow-2xl overflow-hidden group min-h-[300px] flex flex-col justify-center transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Quote size={220} className="text-white rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest border flex items-center gap-1.5 bg-indigo-500/20 border-indigo-400/30 text-indigo-300">
                <Sparkles size={12} className="text-yellow-400"/> PILAR: {getTypeLabel(randomQuote.type).toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border flex items-center gap-1.5 bg-zinc-800/80 border-zinc-700 text-zinc-300">
                🔬 {randomQuote.scientificPrinciple}
              </span>
            </div>

            <h3 className="text-xl sm:text-3xl lg:text-4xl font-serif text-white leading-relaxed mb-6 drop-shadow-md italic">
              "{randomQuote.text}"
            </h3>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="font-bold text-indigo-300 text-base sm:text-lg flex items-center gap-2">
                   <span className="w-6 h-px bg-indigo-500"></span> {randomQuote.source}
                </p>
                <div className="bg-zinc-900/80 border border-zinc-700/80 p-4 rounded-2xl">
                   <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-2">
                      <strong className="text-amber-400 mr-1.5">💡 Penerapan Kampus:</strong> 
                      {randomQuote.context}
                   </p>
                   <p className="text-emerald-400 text-xs sm:text-sm font-medium leading-relaxed">
                      <strong className="text-emerald-300 mr-1.5">🎯 Aksi 1 Menit:</strong> 
                      {randomQuote.actionStep}
                   </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                 <button 
                    onClick={() => handleSpeakText(`${randomQuote.source} menyatakan: ${randomQuote.text}. Prinsip: ${randomQuote.scientificPrinciple}. Penerapan: ${randomQuote.actionStep}`, 'hero')}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                      isPlayingHeroVoice 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-white border-zinc-700'
                    }`}
                    title="Dengarkan Suara"
                 >
                    {isPlayingHeroVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    <span>{isPlayingHeroVoice ? 'Stop' : 'Dengarkan'}</span>
                 </button>

                 <button 
                    onClick={() => setZenModeQuote(randomQuote)} 
                    className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 transition-all" 
                    title="Zen Fullscreen Mode"
                 >
                    <Maximize2 size={18} />
                 </button>

                 <button 
                    onClick={handleRandomize} 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                 >
                    <RefreshCw size={16} /> Acak Hikmah Baru
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap items-center gap-2.5 mb-8 sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md py-3 -mx-2 px-2 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar border-b border-zinc-800">
        {[
          { id: 'ALL', label: 'Semua Pilar', icon: LayoutGrid },
          { id: 'SCIENCE', label: 'Neurosains & Otak', icon: Brain },
          { id: 'AHLULBAYT', label: 'Spiritual Ahlulbayt', icon: Moon },
          { id: 'BUSINESS', label: 'Bisnis & Karir', icon: Briefcase },
          { id: 'STOICISM', label: 'Stoikisme', icon: Anchor },
          { id: 'PSYCHOLOGY', label: 'Psikologi & Grit', icon: Heart },
          { id: 'TOUGH_LOVE', label: 'Tamparan Realitas', icon: Zap },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-2 border whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25' 
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* QUOTES MASONRY GRID */}
      {displayQuotes.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800">
          <p className="text-zinc-400 text-sm">Tidak ada kutipan yang cocok dengan pencarian "{searchTerm}".</p>
          <button onClick={() => setSearchTerm('')} className="mt-3 text-primary text-xs font-bold hover:underline">
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {displayQuotes.map((q) => {
            const isLiked = likedQuotes.includes(q.id);
            const themeStyle = getTypeColor(q.type);
            const isSpeakingThis = activePlayingId === q.id;
            const isCopiedThis = copiedId === q.id;
            
            return (
              <div 
                key={q.id} 
                className={`break-inside-avoid group relative bg-gradient-to-br ${themeStyle.split(' ')[0]} bg-zinc-900 border border-zinc-700/60 p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col`}
              >
                {/* Top Card Header */}
                <div className="flex justify-between items-start mb-3 gap-2">
                   <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${themeStyle.split(' ').slice(1).join(' ')} bg-black/30`}>
                      {getTypeIcon(q.type)} {getTypeLabel(q.type)}
                   </div>
                   
                   <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleSpeakText(`${q.source}: ${q.text}`, q.id, e)} 
                        className={`p-1.5 rounded-lg transition-colors ${isSpeakingThis ? 'text-amber-300 bg-amber-500/20' : 'text-zinc-400 hover:text-white'}`}
                        title="Dengarkan Suara"
                      >
                        <Volume2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleCopyText(q, e)} 
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
                        title="Salin Teks"
                      >
                        {isCopiedThis ? <Check size={14} className="text-emerald-400" /> : <Copy size={14}/>}
                      </button>
                      <button 
                        onClick={(e) => handleShare(q, e)} 
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
                        title="Bagikan"
                      >
                        <Share2 size={14}/>
                      </button>
                      <button 
                        onClick={(e) => handleLike(q.id, e)} 
                        className={`p-1.5 rounded-lg transition-colors ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-rose-400'}`}
                        title="Favorit"
                      >
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"}/>
                      </button>
                      <button 
                        onClick={() => setZenModeQuote(q)} 
                        className="p-1.5 text-zinc-400 hover:text-primary rounded-lg transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 size={14}/>
                      </button>
                   </div>
                </div>

                {/* Body Quote */}
                <div className="mb-4 cursor-pointer" onClick={() => setZenModeQuote(q)}>
                   <p className="text-zinc-100 font-serif text-base sm:text-lg leading-relaxed mb-3 group-hover:text-white transition-colors">
                     "{q.text}"
                   </p>
                   <div className="flex items-center gap-2">
                     <div className="h-px w-5 bg-zinc-600"></div>
                     <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{q.source}</p>
                   </div>
                </div>
                
                {/* Scientific Principle & Action Step */}
                <div className="mt-auto space-y-2 pt-3 border-t border-white/5 text-xs">
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">🔬 Prinsip Ilmiah:</span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">{q.scientificPrinciple}</p>
                  </div>
                  
                  <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                    <span className="text-[10px] font-bold uppercase text-primary block mb-0.5">🎯 Langkah Aksi:</span>
                    <p className="text-zinc-200 text-[11px] font-medium leading-relaxed">{q.actionStep}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* LOAD MORE BUTTON */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button 
            onClick={loadMore}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold text-xs transition-all border border-zinc-700 hover:border-zinc-500 shadow-lg"
          >
            Tampilkan Lebih Banyak ({filteredQuotes.length - visibleCount} tersisa) <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* ZEN MODE FULLSCREEN MODAL */}
      {zenModeQuote && (
         <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
            <button 
              onClick={() => setZenModeQuote(null)} 
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-3 bg-zinc-800/60 rounded-full transition-colors"
            >
               <X size={24} />
            </button>

            <div className="max-w-3xl text-center space-y-8 my-auto">
               <div className="flex justify-center">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 bg-zinc-800/80 border-zinc-700 text-zinc-300">
                    {getTypeIcon(zenModeQuote.type)} {getTypeLabel(zenModeQuote.type)} • {zenModeQuote.scientificPrinciple}
                  </span>
               </div>
               
               <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-white leading-relaxed font-medium">
                  "{zenModeQuote.text}"
               </h2>
               
               <p className="text-lg sm:text-xl text-indigo-300 font-bold">— {zenModeQuote.source}</p>

               <div className="max-w-xl mx-auto bg-white/5 border border-white/10 p-6 rounded-2xl text-left space-y-3">
                  <p className="text-sm text-zinc-300">
                     <span className="text-amber-400 font-bold block text-xs uppercase tracking-widest mb-1">Aplikasi Nyata:</span>
                     {zenModeQuote.context}
                  </p>
                  <p className="text-sm text-emerald-300 font-medium pt-2 border-t border-white/10">
                     <span className="text-emerald-400 font-bold block text-xs uppercase tracking-widest mb-1">Langkah Eksekusi:</span>
                     {zenModeQuote.actionStep}
                  </p>
               </div>
            </div>
         </div>
      )}

      {/* SOS EMERGENCY ANTI-MALAS PROTOCOL MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Protokol Darurat Anti-Malas (SOS)</h3>
                  <p className="text-xs text-zinc-400">3 Langkah Teruji Neurosains untuk Me-reset Otak dari Prokrastinasi</p>
                </div>
              </div>
              <button onClick={() => setShowSosModal(false)} className="text-zinc-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* STEP TABS */}
            <div className="flex items-center justify-between gap-2 mb-6">
              {[
                { step: 1, title: '1. Reset Kortisol' },
                { step: 2, title: '2. Mikro-Komitmen 2 Menit' },
                { step: 3, title: '3. Identity Priming' }
              ].map(s => (
                <div 
                  key={s.step} 
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg border transition-all ${
                    sosStep === s.step 
                      ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                      : sosStep > s.step 
                      ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30' 
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {s.title}
                </div>
              ))}
            </div>

            {/* STEP 1: Physiological Reset */}
            {sosStep === 1 && (
              <div className="text-center space-y-6">
                <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Physiological Sigh</span>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                    Kekurangan motivasi seringkali disebabkan oleh kelelahan sistem saraf atau over-stimulasi kortisol. Lakukan 3 tarikan napas dalam:
                  </p>
                </div>

                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex flex-col items-center justify-center shadow-lg animate-pulse">
                  <span className="text-xs uppercase font-bold text-white tracking-widest">
                    {sosBreathPhase === 'INHALE' ? 'Tarik Napas' : sosBreathPhase === 'HOLD' ? 'Tahan' : 'Hembuskan'}
                  </span>
                  <span className="text-3xl font-black text-white">{sosBreathCount}s</span>
                </div>

                <button 
                  onClick={() => setSosStep(2)}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Pikiran Sudah Lebih Tenang, Lanjut ke Langkah 2</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2: Micro-Commitment Rule */}
            {sosStep === 2 && (
              <div className="space-y-5">
                <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">The 2-Minute Rule (Efek Zeigarnik)</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Otak menolak tugas besar karena dianggap mengancam energi. Namun otak tidak bisa menolak tugas 2 menit. Tuliskan 1 langkah terkecil yang bisa diselesaikan dalam 2 menit:
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">Tugas Mikro 2 Menit Saya:</label>
                  <input 
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl text-sm focus:border-primary focus:outline-none placeholder:text-zinc-500"
                    placeholder="Contoh: 'Hanya buka file tugas dan ketik 1 kalimat pertama'..."
                    value={sosMicroTask}
                    onChange={(e) => setSosMicroTask(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSosStep(1)}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    disabled={!sosMicroTask.trim()}
                    onClick={() => setSosStep(3)}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Kunci Komitmen Mikro</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Identity Priming & Reality Slap */}
            {sosStep === 3 && (
              <div className="space-y-5">
                <div className="p-5 bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-2xl border border-zinc-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 block mb-2">
                    ⚡ Reality Slap & Priming
                  </span>
                  <p className="text-base font-serif text-white italic leading-relaxed mb-3">
                    "{sosQuote.text}"
                  </p>
                  <p className="text-xs font-bold text-zinc-400 text-right">— {sosQuote.source}</p>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    🎯 <strong>Tugas Mikro Terpilih:</strong> "{sosMicroTask}". Kerjakan sekarang selama 2 menit tanpa melihat HP!
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowSosModal(false);
                    alert('🔥 Fokus 2 menit dimulai sekarang! Buktikan bahwa kamu mampu.');
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Saya Siap Eksekusi 2 Menit Sekarang!</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
