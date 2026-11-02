import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Task, Course, Note, TaskStatus, Book, ViewState, Habit, FlashcardDeck } from '../types';
import { 
  Zap, Clock, MapPin, Coffee, ArrowRight, 
  BatteryCharging, Quote, Sparkles,
  Wind, Play, Moon, BrainCircuit, Activity, BookOpen, CheckSquare, Calendar, Bot, Trophy, Crown, Wallet, Heart, BookMarked, Compass, ShieldCheck
} from 'lucide-react';
import { ActivitySuggester } from './ActivitySuggester';
import { QUOTES_DB } from './Motivation';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { motion } from 'motion/react';
import { TRANSLATIONS } from '../utils/translations';
import { Curriculum } from '../types/curriculum';

interface DashboardProps {
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  books?: Book[];
  habits?: Habit[];
  setView: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  courses, 
  notes, 
  books = [], 
  habits: initialHabits = [], 
  setView 
}) => {
  const userProfile = useStore(state => state.userProfile);
  const language = useStore(state => state.language);
  const t = TRANSLATIONS[language] || TRANSLATIONS.id;

  const [showSuggester, setShowSuggester] = useState(false);
  const [randomQuote] = useState(() => QUOTES_DB[Math.floor(Math.random() * QUOTES_DB.length)]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (initialHabits && initialHabits.length > 0) return initialHabits;
    return StorageService.getItem<Habit[]>('habits', []) || [];
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load custom curriculums to display progress in Bento grid
  const [curriculums, setCurriculums] = useState<Curriculum[]>(() => {
    return StorageService.getItem<Curriculum[]>('custom_curriculums', []);
  });

  // Ticker for current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Listen for storage updates
  useEffect(() => {
    const handleStorage = () => {
      setCurriculums(StorageService.getItem<Curriculum[]>('custom_curriculums', []));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = language === 'en' ? daysEn[currentTime.getDay()] : daysId[currentTime.getDay()];
  const hour = currentTime.getHours();

  // Circadian Rhythm Logic (Neuro-Academic Focus)
  const getBrainState = () => {
    if (hour >= 5 && hour < 11) {
      return { 
        phase: language === 'en' ? 'Peak Alertness' : 'Fokus Puncak', 
        advice: language === 'en' ? 'Golden Hour: Tackle high-leverage analytical work now.' : 'Golden Hour: Kerjakan tugas analisis tersulit sekarang.', 
        icon: <Zap size={14} className="text-yellow-400" />
      };
    }
    if (hour >= 11 && hour < 14) {
      return { 
        phase: language === 'en' ? 'Energy Dip' : 'Penurunan Ritme', 
        advice: language === 'en' ? 'Natural dip. Ideal for lectures, low-stakes reviews or lunch.' : 'Energi menurun alami. Cocok untuk kuliah atau makan siang.', 
        icon: <Coffee size={14} className="text-orange-400" />
      };
    }
    if (hour >= 14 && hour < 18) {
      return { 
        phase: language === 'en' ? 'Second Wind' : 'Momentum Kedua', 
        advice: language === 'en' ? 'Second cognitive peak. Review material, write or exercise.' : 'Momentum fokus kedua. Tinjau materi, menulis, atau olahraga.', 
        icon: <Activity size={14} className="text-emerald-400" />
      };
    }
    if (hour >= 18 && hour < 22) {
      return { 
        phase: language === 'en' ? 'Melatonin Rise' : 'Fase Refleksi', 
        advice: language === 'en' ? 'Wind down. Avoid harsh blue light, write journal and plan tomorrow.' : 'Meredupkan stimulasi. Isi jurnal refleksi dan siapkan esok.', 
        icon: <Moon size={14} className="text-indigo-400" />
      };
    }
    return { 
      phase: language === 'en' ? 'Restoration Phase' : 'Fase Pemulihan', 
      advice: language === 'en' ? 'Sleep. Glymphatic system actively consolidating memory.' : 'Tidur berkualitas. Sistem otak mengkonsolidasikan memori.', 
      icon: <BatteryCharging size={14} className="text-slate-400" />
    };
  };

  const brainState = getBrainState();

  const greeting = useMemo(() => {
    if (language === 'en') {
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    } else {
      if (hour < 11) return 'Selamat Pagi';
      if (hour < 15) return 'Selamat Siang';
      if (hour < 18) return 'Selamat Sore';
      return 'Selamat Malam';
    }
  }, [hour, language]);

  // Single Focal Point Engine (Priority Engine)
  type FocalPoint =
    | { type: 'CLASS_NOW'; data: Course; timeLeft: string }
    | { type: 'CLASS_SOON'; data: Course }
    | { type: 'TASK_URGENT'; data: Task }
    | { type: 'FREE'; data: null };

  const focalPoint = useMemo<FocalPoint>(() => {
    const hh = currentTime.getHours().toString().padStart(2, '0');
    const mm = currentTime.getMinutes().toString().padStart(2, '0');
    const nowTimeStr = `${hh}:${mm}`;
    const todayStr = currentTime.toISOString().split('T')[0];
    
    // 1. Current Class
    const currentClass = courses.find(c => {
      const matchDay = c.day.toLowerCase() === todayName.toLowerCase();
      const isNow = c.startTime <= nowTimeStr && c.endTime > nowTimeStr;
      return matchDay && isNow;
    });

    if (currentClass) {
      const [endH, endM] = currentClass.endTime.split(':').map(Number);
      const diffMins = (endH * 60 + endM) - (currentTime.getHours() * 60 + currentTime.getMinutes());
      return {
        type: 'CLASS_NOW',
        data: currentClass,
        timeLeft: `${diffMins} ${language === 'en' ? 'mins' : 'menit'}`
      };
    }

    // 2. Upcoming Class within 45 mins
    const upcomingClass = courses.find(c => {
      const matchDay = c.day.toLowerCase() === todayName.toLowerCase();
      if (!matchDay) return false;
      const [startH, startM] = c.startTime.split(':').map(Number);
      const diffMins = (startH * 60 + startM) - (currentTime.getHours() * 60 + currentTime.getMinutes());
      return diffMins > 0 && diffMins <= 45;
    });

    if (upcomingClass) {
      return {
        type: 'CLASS_SOON',
        data: upcomingClass
      };
    }

    // 3. Urgent Task Due Today
    const urgentTask = tasks.find(t => 
      t.status !== TaskStatus.DONE && 
      t.deadline === todayStr
    );

    if (urgentTask) {
      return {
        type: 'TASK_URGENT',
        data: urgentTask
      };
    }

    // 4. Default: Deep Work / Self-Directed Study Window
    return {
      type: 'FREE',
      data: null
    };
  }, [courses, tasks, todayName, currentTime, language]);

  // Today Timeline Sequence
  const todayTimeline = useMemo(() => {
    return courses
      .filter(c => c.day.toLowerCase() === todayName.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [courses, todayName]);

  // Flashcards Review Count (Using Centralized Registry Key)
  const cardsToReview = useMemo(() => {
    const decks = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
    return decks.reduce((acc, deck) => {
      const dueCards = (deck.cards || []).filter((c) => !c.nextReview || c.nextReview <= Date.now());
      return acc + dueCards.length;
    }, 0);
  }, []);

  // Most active curriculum
  const activeCurriculum = useMemo(() => {
    if (!curriculums || curriculums.length === 0) return null;
    return curriculums.find(c => c.progress > 0 && c.progress < 100) || curriculums[0];
  }, [curriculums]);

  // 4-7-8 Breathwork Handler
  const handleBreath = () => {
    setIsBreathing(!isBreathing);
  };

  // Gamification Metrics
  const xp = userProfile?.xp || 0;
  const level = userProfile?.level || 1;
  const xpProgress = Math.min(100, Math.floor(((xp % 1000) / 1000) * 100));

  // Partner GPS Cache (Authentic Safety Feature)
  const partnerRole = (localStorage.getItem('partner_tracker_role') || 'primary') === 'primary' ? 'secondary' : 'primary';
  const partnerCacheKey = partnerRole === 'primary' ? 'loc_primary_cache' : 'loc_secondary_cache';
  const partnerLoc = StorageService.getItem<any>(partnerCacheKey, null);
  const partnerDisplayName = partnerRole === 'primary' 
    ? (localStorage.getItem('partner_primary_name') || 'Rafi')
    : (localStorage.getItem('partner_secondary_name') || 'Ayang ❤️');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Activity Suggester Modal */}
      {showSuggester && (
        <ActivitySuggester 
          tasks={tasks} 
          books={books} 
          setView={setView} 
          onClose={() => setShowSuggester(false)} 
        />
      )}

      {/* ============================================================ */}
      {/* 1. EXECUTIVE HEADER & COGNITIVE PULSE                        */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-white/[0.06]">
        <div className="space-y-2">
          {/* Unboxed Metadata (Zero-Pill Rule) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-medium">
            <span className="font-mono text-zinc-300">
              {todayName}, {currentTime.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              {brainState.icon}
              <span>{brainState.phase}</span>
            </span>
            {partnerLoc && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <button 
                  onClick={() => setView('location')}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                  title="Live GPS Companion"
                >
                  <Heart size={12} className="fill-rose-500/30" />
                  <span>{partnerDisplayName}: {partnerLoc.statusNote || 'Connected'}</span>
                </button>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-300">{userProfile?.customTitle || (userProfile?.name || 'Mahasiswa').split(' ')[0]}</span>.
          </h1>
        </div>

        {/* Scholar Level HUD */}
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center font-bold">
              <Crown size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{language === 'en' ? 'Scholar Level' : 'Tingkat Sarjana'}</span>
                <span className="font-mono text-yellow-400">{level}</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono tabular-nums">
                {xp % 1000} / 1000 XP
              </div>
            </div>
          </div>
          <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard Memory Notification (if cards due) */}
      {cardsToReview > 0 && (
        <div 
          onClick={() => setView('flashcards')}
          className="cursor-pointer p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">Spaced Repetition Active Recall</h4>
              <p className="text-xs text-zinc-300">
                {cardsToReview} {language === 'en' ? 'flashcards require memory retrieval review today.' : 'kartu hafalan memerlukan review active recall hari ini.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 flex items-center gap-1 shrink-0">
            <span>{language === 'en' ? 'Review Now' : 'Buka Flashcards'}</span>
            <ArrowRight size={14} />
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PRIMARY FOCAL ANCHOR (Single Elevation Principle)         */}
      {/* ============================================================ */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.95)] transition-all">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6">
          {/* Focal Status Kicker (Unboxed text) */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${
              focalPoint.type.includes('URGENT') || focalPoint.type.includes('NOW') ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
            }`} />
            <span className="text-zinc-300 uppercase tracking-wider text-[11px] font-mono">
              {focalPoint.type === 'CLASS_NOW' ? (language === 'en' ? 'Lecture Session in Progress' : 'Kuliah Sedang Berlangsung') :
               focalPoint.type === 'CLASS_SOON' ? (language === 'en' ? 'Upcoming Lecture Session' : 'Kuliah Segera Dimulai') :
               focalPoint.type === 'TASK_URGENT' ? (language === 'en' ? 'Critical Academic Priority' : 'Prioritas Tugas Utama') :
               (language === 'en' ? 'Unstructured Cognitive Window' : 'Jendela Waktu Mandiri')}
            </span>
          </div>

          {/* Focal Body */}
          {focalPoint.type === 'CLASS_NOW' && (
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {focalPoint.data.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 font-mono">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-rose-400" /> {focalPoint.data.room}</span>
                <span className="text-zinc-600">·</span>
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-rose-400" /> Selesai dalam {focalPoint.timeLeft}</span>
                <span className="text-zinc-600">·</span>
                <span>{focalPoint.data.lecturer}</span>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setView('notes')}
                  className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs shadow-xl hover:bg-zinc-100 transition-all flex items-center gap-2 active:scale-95"
                >
                  <BookOpen size={16} />
                  <span>Buka Catatan Kuliah</span>
                </button>
              </div>
            </div>
          )}

          {focalPoint.type === 'CLASS_SOON' && (
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {language === 'en' ? 'Preparation' : 'Persiapan'}: {focalPoint.data.name}
              </h2>
              <p className="text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
                {language === 'en' 
                  ? `Class begins promptly at ${focalPoint.data.startTime} in ${focalPoint.data.room}. Verify your reading notes and prep materials.`
                  : `Kuliah dimulai pukul ${focalPoint.data.startTime} di ruang ${focalPoint.data.room}. Pastikan bahan bacaan dan tugas telah siap.`
                }
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setView('schedule')}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  {language === 'en' ? 'View Schedule' : 'Cek Jadwal Kuliah'}
                </button>
              </div>
            </div>
          )}

          {focalPoint.type === 'TASK_URGENT' && (
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {focalPoint.data.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-amber-300 font-mono">
                <Clock size={16} className="animate-pulse text-amber-400" />
                <span>Deadline: {new Date(focalPoint.data.deadline).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setView('focus')}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Zap size={16} />
                  <span>{language === 'en' ? 'Start Deep Work' : 'Kerjakan di Focus Space'}</span>
                </button>
                <button
                  onClick={() => setView('tasks')}
                  className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs border border-white/[0.08] transition-all"
                >
                  {language === 'en' ? 'Task Details' : 'Rincian Tugas'}
                </button>
              </div>
            </div>
          )}

          {focalPoint.type === 'FREE' && (
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {t.focalPointFreeTitle}
              </h2>
              <p className="text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
                {brainState.advice} {t.focalPointFreeDesc}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setView('curriculum')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-xs shadow-xl shadow-primary/25 hover:opacity-95 transition-all flex items-center gap-2 active:scale-95"
                >
                  <BookMarked size={16} />
                  <span>{t.startCurriculum}</span>
                </button>
                <button
                  onClick={() => setShowSuggester(true)}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs border border-white/[0.08] transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} className="text-primary" />
                  <span>{t.aiSuggest}</span>
                </button>
                <button
                  onClick={() => setView('library')}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs border border-white/[0.08] transition-all"
                >
                  {t.readBook}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TODAY'S TRAJECTORY (Class Schedule Timeline)              */}
      {/* ============================================================ */}
      {todayTimeline.length > 0 && (
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="section-label">
              {t.todayFlow}
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {todayTimeline.length} {language === 'en' ? 'Sessions Today' : 'Mata Kuliah Hari Ini'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTimeline.map((course) => {
              const hh = currentTime.getHours().toString().padStart(2, '0');
              const mm = currentTime.getMinutes().toString().padStart(2, '0');
              const now = `${hh}:${mm}`;
              const isPast = course.endTime < now;
              const isNow = course.startTime <= now && course.endTime > now;
              const courseTasks = tasks.filter(t => (t.courseId === course.id || t.subject?.toLowerCase() === course.name.toLowerCase()) && t.status !== TaskStatus.DONE);

              return (
                <div 
                  key={course.id}
                  onClick={() => setView('course-hub')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                    isNow 
                      ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                      : isPast
                        ? 'bg-zinc-900/40 border-white/[0.04] opacity-75'
                        : 'bg-zinc-900/80 border-white/[0.08] hover:border-white/20'
                  }`}
                  title="Klik untuk membuka Hub Mata Kuliah"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className={isNow ? 'text-blue-400 font-bold' : 'text-zinc-400'}>
                      {course.startTime} - {course.endTime}
                    </span>
                    <span className="text-zinc-400 font-semibold">{course.credits} SKS</span>
                  </div>
                  <h4 className={`text-sm font-bold truncate group-hover:text-primary transition-colors ${isNow ? 'text-white' : 'text-zinc-200'}`}>
                    {course.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {course.room}</span>
                    <span className="truncate max-w-[120px]">{course.lecturer}</span>
                  </div>
                  {courseTasks.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-amber-400 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckSquare size={12} />
                        <span>{courseTasks.length} tugas aktif</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Hub &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. EXECUTIVE BENTO GRID (6 Core Pillars)                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Bento 1: Quick Launch Grid */}
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-label">
              {t.quickAccess}
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">Workspace</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { view: 'schedule' as ViewState, icon: Calendar, label: 'Jadwal' },
              { view: 'tasks' as ViewState, icon: CheckSquare, label: 'Tugas' },
              { view: 'notes' as ViewState, icon: BookOpen, label: 'Catatan' },
              { view: 'curriculum' as ViewState, icon: BookMarked, label: 'Kurikulum' },
              { view: 'flashcards' as ViewState, icon: BrainCircuit, label: 'Cards' },
              { view: 'ai-chat' as ViewState, icon: Bot, label: 'AI Bot' },
            ].map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-primary/30 hover:bg-white/[0.05]"
              >
                <Icon size={20} className="text-zinc-500 transition-colors group-hover:text-primary" />
                <span className="text-[11px] font-medium text-zinc-400 transition-colors group-hover:text-white">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bento 2: Universal Curriculum & Study Mode (Flagship Pillar) */}
        <div 
          onClick={() => setView('curriculum')}
          className="cursor-pointer group p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-white/[0.08] hover:border-primary/50 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-primary font-bold">Curriculum Hub</span>
              <span className="font-mono">{activeCurriculum ? `${activeCurriculum.progress}%` : '8 Modul'}</span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug">
              {activeCurriculum ? activeCurriculum.title : 'Metodologi Riset & Penulisan Skripsi'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {activeCurriculum ? activeCurriculum.description : 'Sistem pembelajaran terstruktur berjenjang untuk mendalami materi sains kuliah dan karakter pribadi.'}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                style={{ width: `${activeCurriculum ? activeCurriculum.progress : 25}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              <span>{language === 'en' ? 'Launch Study Mode' : 'Lanjutkan Belajar'}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Bento 3: 4-7-8 Breathwork (Nervous System Reset) */}
        <div 
          onClick={handleBreath}
          className="cursor-pointer p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-teal-500/40 transition-all relative overflow-hidden flex flex-col justify-between"
        >
          {isBreathing ? (
            <div className="absolute inset-0 z-20 bg-zinc-950/90 flex flex-col items-center justify-center text-center p-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-full border-2 border-teal-400 flex items-center justify-center animate-pulse relative">
                <Wind size={28} className="text-teal-400 animate-bounce" />
                <div className="absolute inset-0 rounded-full border border-teal-400/30 animate-ping" />
              </div>
              <p className="text-teal-200 font-bold text-base mt-4 animate-pulse">Tarik 4s · Tahan 7s · Hembuskan 8s</p>
              <p className="text-zinc-400 text-[11px] mt-1">Ketuk untuk selesai</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="text-teal-400 font-bold">Mental Resilience</span>
              <span>4-7-8</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {t.resetNervousSystem}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.resetDesc}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-bold text-teal-400">
            <span className="flex items-center gap-1.5">
              <Play size={12} fill="currentColor" />
              <span>{t.startBreathing}</span>
            </span>
            <Wind size={16} className="text-teal-400/60" />
          </div>
        </div>

        {/* Bento 4: Philosophical & Stoic Daily Wisdom */}
        <div 
          onClick={() => setView('motivation')}
          className="cursor-pointer p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="text-primary font-bold">{t.dailyWisdom}</span>
              <span>{randomQuote.source}</span>
            </div>
            <p className="text-sm text-zinc-200 italic leading-relaxed font-serif">
              "{randomQuote.text}"
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 text-right">
            — {randomQuote.source}
          </div>
        </div>

        {/* Bento 5: Student Budget (Authentic 50/30/20 Anak Kos Identity) */}
        <div 
          onClick={() => setView('budget')}
          className="cursor-pointer p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold">Cashflow Anak Kos</span>
              <span>50 / 30 / 20</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {language === 'en' ? 'Student Financial Guard' : 'Manajemen Keuangan Mahasiswa'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {language === 'en' 
                ? 'Track monthly allowance, essential food needs, savings buffer, and ward off impulsive debts.'
                : 'Kendalikan pos kebutuhan pokok, tabungan dana darurat, dan hindari krisis tanggal tua.'
              }
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400">
            <span>{language === 'en' ? 'Open Budget Ledger' : 'Buka Buku Kas'}</span>
            <Wallet size={16} />
          </div>
        </div>

        {/* Bento 6: GPS Guardian & Companion (Authentic Original Feature) */}
        <div 
          onClick={() => setView('location')}
          className="cursor-pointer p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="text-rose-400 font-bold">GPS Companion</span>
              <span className="text-emerald-400">Live Active</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {language === 'en' ? 'Two-Way Guardian Tracking' : 'Pemantau Lokasi Sahabat & Keluarga'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {partnerLoc 
                ? `${partnerDisplayName}: ${partnerLoc.placeName || partnerLoc.statusNote || 'Tersambung real-time'}` 
                : 'Sinkronisasi 2 HP dalam 1 akun untuk memantau keamanan jarak jauh, zona kampus, dan sinyal darurat.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-rose-400">
            <span>{language === 'en' ? 'Open GPS Map' : 'Buka Radar Peta'}</span>
            <MapPin size={16} />
          </div>
        </div>

      </div>

    </div>
  );
};
