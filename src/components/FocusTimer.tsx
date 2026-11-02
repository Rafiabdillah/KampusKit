import { useStore } from '../store/useStore';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckSquare, CloudRain, Volume2, Wind, Utensils, Maximize2, BookOpen } from 'lucide-react';
import { Task, TaskStatus, UserProfile, Course, FocusSession } from '../types';
import { playNotificationSound } from '../utils/sound';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';

interface FocusTimerProps {
  tasks?: Task[];
  courses?: Course[];
  initialCourseId?: string;
  initialTaskId?: string;
  onTaskComplete?: (taskId: string) => void;
}

const SOUNDS = [
  { id: 'rain', name: 'Hujan', icon: <CloudRain size={18}/>, url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { id: 'whitenoise', name: 'Static', icon: <Wind size={18}/>, url: 'https://assets.mixkit.co/sfx/preview/mixkit-white-noise-1142.mp3' }, 
  { id: 'cafe', name: 'Cafe', icon: <Utensils size={18}/>, url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-443.mp3' },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({ 
  tasks = [], 
  courses: propCourses,
  initialCourseId,
  initialTaskId,
  onTaskComplete 
}) => {
  const userProfile = useStore(state => state.userProfile);

  const [courses, setCourses] = useState<Course[]>(() => {
    if (propCourses && propCourses.length > 0) return propCourses;
    return StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []);
  });

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || '');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');
  const sessionStartedAt = useRef<number | null>(null);
  
  // Audio
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // SVG Circle Props
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = mode === 'FOCUS' ? 25 * 60 : 5 * 60;
  const progress = (timeLeft / totalSeconds) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    } else {
      const savedTaskId = localStorage.getItem('focus_task_id');
      if (savedTaskId) setSelectedTaskId(savedTaskId);
    }
  }, [initialTaskId]);

  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  const handleTaskSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    setSelectedTaskId(taskId);
    localStorage.setItem('focus_task_id', taskId);
    if (taskId) {
      const t = tasks.find(task => task.id === taskId);
      if (t?.courseId) {
        setSelectedCourseId(t.courseId);
      }
    }
  };

  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourseId(e.target.value);
  };

  const logFocusSession = (minutesSpent: number, completed: boolean, startedAt: number) => {
    if (minutesSpent < 1) return;
    try {
      const existing = StorageService.getItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
      const newSession: FocusSession = {
        id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        courseId: selectedCourseId || undefined,
        taskId: selectedTaskId || undefined,
        startedAt,
        minutes: minutesSpent,
        completed,
        updatedAt: Date.now()
      };
      StorageService.setItem(STORAGE_KEYS.FOCUS_SESSIONS, [newSession, ...existing]);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn("Failed to log focus session:", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // Audio Handler (Same as before but cleaner)
  useEffect(() => {
    if (activeSound) {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUNDS.find(s => s.id === activeSound)?.url);
        audioRef.current.loop = true;
      } else {
        const currentSrc = audioRef.current.src;
        const newSrc = SOUNDS.find(s => s.id === activeSound)?.url;
        if (newSrc && currentSrc !== newSrc) {
           audioRef.current.pause();
           audioRef.current = new Audio(newSrc);
           audioRef.current.loop = true;
        }
      }
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [activeSound]);

  useEffect(() => { if(audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const handleTimerComplete = () => {
     setIsActive(false);
     if (audioRef.current) audioRef.current.pause();
     setActiveSound(null);
     
     playNotificationSound(userProfile?.notificationSound);

     if (mode === 'FOCUS') {
       const startedAt = sessionStartedAt.current || (Date.now() - 25 * 60 * 1000);
       logFocusSession(25, true, startedAt);
       sessionStartedAt.current = null;
     }

     if (mode === 'FOCUS' && selectedTaskId && onTaskComplete) {
       if (confirm(`Waktu fokus habis! Apakah tugas terpilih sudah selesai?`)) {
         onTaskComplete(selectedTaskId);
         setSelectedTaskId('');
         localStorage.removeItem('focus_task_id');
       }
     } else {
       alert("Waktu Habis!");
     }
  };

  const handleReset = () => {
    if (mode === 'FOCUS' && isActive) {
      const elapsedSec = (25 * 60) - timeLeft;
      if (elapsedSec >= 5 * 60) {
        const mins = Math.floor(elapsedSec / 60);
        const startedAt = sessionStartedAt.current || (Date.now() - elapsedSec * 1000);
        logFocusSession(mins, false, startedAt);
      }
    }
    sessionStartedAt.current = null;
    setIsActive(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'FOCUS' | 'BREAK') => {
    if (mode === 'FOCUS' && isActive) {
      const elapsedSec = (25 * 60) - timeLeft;
      if (elapsedSec >= 5 * 60) {
        const mins = Math.floor(elapsedSec / 60);
        const startedAt = sessionStartedAt.current || (Date.now() - elapsedSec * 1000);
        logFocusSession(mins, false, startedAt);
      }
    }
    sessionStartedAt.current = null;
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const toggleActive = () => {
    if (!isActive) {
      if (mode === 'FOCUS' && !sessionStartedAt.current) {
        sessionStartedAt.current = Date.now();
      }
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const activeTask = tasks.find(t => t.id === selectedTaskId);
  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] transition-all duration-1000 -z-10 pointer-events-none ${isActive ? (mode === 'FOCUS' ? 'bg-primary/20' : 'bg-green-500/20') : 'bg-transparent'}`}></div>

      <div className="glass-card p-5 sm:p-8 rounded-[40px] w-full max-w-md shadow-2xl relative flex flex-col items-center">
        
        {/* Toggle Mode Pills */}
        <div className="flex bg-slate-900/50 p-1 rounded-full mb-8 border border-white/5">
          <button 
            onClick={() => switchMode('FOCUS')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'FOCUS' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Brain size={16} /> Fokus
          </button>
          <button 
            onClick={() => switchMode('BREAK')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'BREAK' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Coffee size={16} /> Istirahat
          </button>
        </div>

        {/* Circular Timer Visual */}
        <div className="relative mb-8 group">
           <svg viewBox="0 0 300 300" className="w-full max-w-[300px] h-auto transform -rotate-90">
              {/* Track */}
              <circle 
                cx="150" cy="150" r={radius} 
                className="stroke-slate-800" 
                strokeWidth="12" fill="transparent" 
              />
              {/* Progress */}
              <circle 
                cx="150" cy="150" r={radius} 
                className={`transition-all duration-1000 ease-linear ${mode === 'FOCUS' ? 'stroke-primary' : 'stroke-green-500'}`}
                strokeWidth="12" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
           </svg>
           
           {/* Center Text */}
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                 {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
              <p className={`text-sm font-bold mt-2 uppercase tracking-widest ${isActive ? 'animate-pulse' : 'opacity-50'} ${mode === 'FOCUS' ? 'text-primary' : 'text-green-400'}`}>
                 {isActive ? (mode === 'FOCUS' ? 'Deep Work' : 'Recharging') : 'Paused'}
              </p>
           </div>
        </div>

        {/* Course & Task Context */}
        <div className="w-full mb-8 space-y-3">
           {mode === 'FOCUS' && (
             <>
               {/* Course Selector */}
               {courses.length > 0 && (
                 <div className="relative group">
                    <select 
                      className="w-full bg-slate-800/50 border border-slate-700/80 text-white text-xs pl-9 pr-3 py-2 rounded-xl appearance-none focus:border-primary focus:outline-none transition-all cursor-pointer hover:bg-slate-800"
                      value={selectedCourseId}
                      onChange={handleCourseSelect}
                      disabled={isActive}
                      aria-label="Pilih Mata Kuliah"
                    >
                      <option value="">Pilih Mata Kuliah (Opsional)...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <BookOpen className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
                 </div>
               )}

               <div className={`transition-all duration-500 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-100'}`}>
                  {isActive && activeTask ? (
                     <div className="bg-primary/10 border border-primary/30 p-3 rounded-2xl text-center">
                        <p className="text-[10px] text-primary font-bold uppercase mb-0.5">
                          {activeCourse ? `${activeCourse.name} · Target` : 'Target Utama'}
                        </p>
                        <p className="text-white font-medium truncate text-base">{activeTask.title}</p>
                     </div>
                  ) : (
                     <div className="relative group">
                        <select 
                          className="w-full bg-slate-800/50 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-xl appearance-none focus:border-primary focus:outline-none transition-all cursor-pointer hover:bg-slate-800"
                          value={selectedTaskId}
                          onChange={handleTaskSelect}
                          disabled={isActive}
                          aria-label="Pilih Tugas"
                        >
                          <option value="">Pilih Tugas (Opsional)...</option>
                          {tasks.filter(t => t.status !== TaskStatus.DONE).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        <CheckSquare className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
                     </div>
                  )}
               </div>
             </>
           )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-8">
           <button 
             onClick={handleReset}
             className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all"
             title="Reset"
           >
              <RotateCcw size={22} />
           </button>

           <button 
             onClick={toggleActive}
             className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-2xl ${
               isActive 
               ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-orange-500/30' 
               : 'bg-gradient-to-br from-primary to-secondary shadow-primary/30'
             }`}
           >
              {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
           </button>

           {/* Sound Toggle (Mini) */}
           <div className="w-14 h-14 relative group">
              <button className="w-full h-full rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all">
                 <Volume2 size={22} />
              </button>
              {/* Hover Menu for Sounds */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl">
                 {SOUNDS.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => setActiveSound(activeSound === s.id ? null : s.id)}
                      className={`p-2 rounded-lg transition-all ${activeSound === s.id ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      title={s.name}
                    >
                       {s.icon}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};