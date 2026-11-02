import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { useStore } from '../store/useStore';
import { StorageService } from '../services/storage';
import { Dumbbell, Plus, Trash2, Calendar, Target, Activity, Flame, Clock, Save, ChevronRight, ChevronDown, X, History, TrendingUp, Play, Pause, Bell, CheckCircle2, Timer, AlertTriangle, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

export interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  type: 'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER' | 'FULL_BODY' | 'CARDIO';
  durationMinutes: number;
  exercises: Exercise[];
  notes: string;
}

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", 
  "Barbell Row", "Pull-up", "Lat Pulldown", "Incline Dumbbell Press",
  "Lateral Raise", "Bicep Curl", "Tricep Extension", "Leg Press",
  "Bulgarian Split Squat", "Leg Curl", "Calf Raise"
];

const GymTrackerInner: React.FC = () => {
  const onGainXp = useStore(state => state.gainXp);
  
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  
  // Timers
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(90); // Default 90 seconds

  // Custom Exercise
  const [customExercise, setCustomExercise] = useState("");

  // UI States
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // PR / Analytics
  const [selectedExercisePR, setSelectedExercisePR] = useState<string | null>(null);

  const sanitizeSession = (s: any): WorkoutSession | null => {
    if (!s || typeof s !== 'object') return null;
    const validExercises = Array.isArray(s.exercises) ? s.exercises.map((ex: any) => ({
      id: ex?.id || Math.random().toString(),
      name: ex?.name || 'Exercise',
      sets: Array.isArray(ex?.sets) ? ex.sets.map((set: any) => ({
        id: set?.id || Math.random().toString(),
        weight: Number(set?.weight) || 0,
        reps: Number(set?.reps) || 0,
        completed: Boolean(set?.completed)
      })) : []
    })) : [];

    return {
      id: s.id || Math.random().toString(),
      date: s.date || new Date().toISOString().split('T')[0],
      type: s.type || 'FULL_BODY',
      durationMinutes: Number(s.durationMinutes || s.durationMins) || 30,
      exercises: validExercises,
      notes: s.notes || ''
    };
  };

  useEffect(() => {
    try {
      let saved = StorageService.getItem<any[]>('gym_workout_history', []);
      if (!Array.isArray(saved) || saved.length === 0) {
        // Safe fallback from legacy data if available and conforms to gym format
        const legacy = StorageService.getItem<any[]>('sports_routine', []);
        if (Array.isArray(legacy)) {
          const gymCompatible = legacy.filter(s => s && s.type && Array.isArray(s.exercises) && s.exercises.some((e: any) => Array.isArray(e?.sets)));
          if (gymCompatible.length > 0) saved = gymCompatible;
        }
      }
      const clean = Array.isArray(saved) ? saved.map(sanitizeSession).filter(Boolean) as WorkoutSession[] : [];
      setHistory(clean);
    } catch (e) {
      console.error("Failed to load gym history:", e);
      setHistory([]);
    }
  }, []);

  const saveHistory = (data: WorkoutSession[]) => {
    setHistory(data);
    StorageService.setItem('gym_workout_history', data);
  };

  const deleteWorkout = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan latihan ini?")) {
      const newHistory = history.filter(session => session.id !== id);
      saveHistory(newHistory);
    }
  };

  // Workout Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Rest Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsResting(false);
              try {
                const audio = new Audio('/assets/notification.mp3');
                audio.play().catch(() => {});
              } catch (e) { /* ignore */ }
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting]);

  const startNewWorkout = (type: WorkoutSession['type']) => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type,
      durationMinutes: 0,
      exercises: [],
      notes: ''
    };
    setActiveWorkout(newSession);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsResting(false);
  };

  const addExercise = (name: string) => {
    if (!activeWorkout || !name.trim()) return;
    
    // Find last performance for this exercise
    const previousSets = getLastExercisePerformance(name);
    const initialSets: ExerciseSet[] = previousSets.length > 0 
        ? previousSets.map(s => ({ id: Date.now().toString() + Math.random(), weight: s.weight, reps: s.reps, completed: false }))
        : [{ id: Date.now().toString(), weight: 0, reps: 0, completed: false }];

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, {
        id: Date.now().toString(),
        name,
        sets: initialSets
      }]
    });
    
    setCustomExercise(""); // Reset input
  };

  const removeExercise = (exId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter(ex => ex.id !== exId)
    });
  };

  const addSet = (exId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id === exId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, { 
              id: Date.now().toString(), 
              weight: lastSet ? lastSet.weight : 0, 
              reps: lastSet ? lastSet.reps : 0, 
              completed: false 
            }]
          };
        }
        return ex;
      })
    });
  };

  const updateSet = (exId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id === exId) {
          return {
            ...ex,
            sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s)
          };
        }
        return ex;
      })
    });
  };

  const toggleSetComplete = (exId: string, setId: string) => {
    if (!activeWorkout) return;
    
    let justCompleted = false;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(ex => {
        if (ex.id === exId) {
          return {
            ...ex,
            sets: (ex.sets || []).map(s => {
              if (s.id === setId) {
                if (!s.completed) justCompleted = true;
                return { ...s, completed: !s.completed };
              }
              return s;
            })
          };
        }
        return ex;
      })
    });

    if (justCompleted) {
      if (onGainXp) onGainXp(2);
      // Start Rest Timer
      setRestTimer(restDuration);
      setIsResting(true);
    }
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    
    // Only save workouts that have at least one completed set
    const hasCompletedSets = activeWorkout.exercises.some(ex => ex.sets.some(s => s.completed));
    
    if (hasCompletedSets) {
      const finalSession = {
        ...activeWorkout,
        durationMinutes: Math.ceil(timerSeconds / 60)
      };
      
      const newHistory = [finalSession, ...history];
      saveHistory(newHistory);
      
      if (onGainXp) {
        const volume = calculateSessionVolume(finalSession);
        const bonus = Math.floor(volume / 500); // 1 XP per 500kg volume
        onGainXp(50 + bonus);
      }
    }
    
    setIsTimerRunning(false);
    setIsResting(false);
    setShowModal(false);
    setActiveWorkout(null);
  };

  const calculateSessionVolume = (session: WorkoutSession) => {
    if (!session || !Array.isArray(session.exercises)) return 0;
    let vol = 0;
    session.exercises.forEach(ex => {
      if (Array.isArray(ex?.sets)) {
        ex.sets.forEach(s => {
          if (s && s.completed) {
            vol += ((Number(s.weight) || 0) * (Number(s.reps) || 0));
          }
        });
      }
    });
    return vol;
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getLastExercisePerformance = (exerciseName: string) => {
    for (const session of (history || []).filter(Boolean)) {
      if (!session || !Array.isArray(session.exercises)) continue;
      const ex = session.exercises.find(e => e?.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.some(s => s && s.completed)) {
        return ex.sets.filter(s => s && s.completed);
      }
    }
    return [];
  };

  // Analytics Data
  const chartData = useMemo(() => {
    return [...(history || [])].filter(Boolean).reverse().map(session => ({
      name: (session.date || '').substring(5),
      volume: calculateSessionVolume(session)
    }));
  }, [history]);

  const prData = useMemo(() => {
    if (!selectedExercisePR) return [];
    const data: { date: string, maxWeight: number }[] = [];
    
    [...(history || [])].filter(Boolean).reverse().forEach(session => {
      if (!session || !Array.isArray(session.exercises)) return;
      const ex = session.exercises.find(e => e?.name === selectedExercisePR);
      if (ex && Array.isArray(ex.sets)) {
        const completed = ex.sets.filter(s => s && s.completed);
        if (completed.length > 0) {
          const maxWeight = Math.max(0, ...completed.map(s => Number(s.weight) || 0));
          if (maxWeight > 0) {
            data.push({ date: (session.date || '').substring(5), maxWeight });
          }
        }
      }
    });
    return data;
  }, [history, selectedExercisePR]);

  // Aggregate exercise list for PR dropdown (combine common + custom ones used in history)
  const allUsedExercises = useMemo(() => {
    const set = new Set<string>(COMMON_EXERCISES);
    (history || []).forEach(session => {
      if (session && Array.isArray(session.exercises)) {
        session.exercises.forEach(ex => {
          if (ex && ex.name) set.add(ex.name);
        });
      }
    });
    return Array.from(set).sort();
  }, [history]);

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Dumbbell className="text-orange-500" />
            Gym Tracker
          </h2>
          <p className="text-zinc-400 mt-1">Lacak hipertrofi, volume, dan beban progresif.</p>
        </div>
        <div className="premium-glow">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all active:scale-95 border border-orange-500/30"
          >
            <Play size={20} fill="currentColor" />
            Mulai Latihan
          </button>
        </div>
      </div>

      {/* Floating Rest Timer */}
      {isResting && (
        <div className="fixed bottom-24 right-[max(1.5rem,env(safe-area-inset-right,0px))] md:bottom-10 md:right-10 z-[60] bg-zinc-950/90 backdrop-blur-xl border-2 border-orange-500/80 rounded-3xl p-4 shadow-[0_0_40px_rgba(249,115,22,0.4)] animate-slide-up flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center relative">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                <circle cx="24" cy="24" r="22" stroke="#f97316" strokeWidth="4" fill="none" 
                        strokeDasharray="138" 
                        strokeDashoffset={138 - (restTimer / restDuration) * 138} 
                        className="transition-all duration-1000 linear" />
             </svg>
             <Timer size={20} className="text-orange-500" />
           </div>
           <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-0.5">Istirahat</p>
              <p className="text-2xl font-black text-white font-mono">{formatTime(restTimer)}</p>
           </div>
           <button onClick={() => setIsResting(false)} className="ml-2 w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors">
             <X size={16} />
           </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5 flex items-center gap-4 border border-white/5 hover:border-orange-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20">
            <Flame className="text-orange-500" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Total Sesi</p>
            <p className="text-2xl font-black text-white">{(history || []).filter(Boolean).length}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-5 flex items-center gap-4 border border-white/5 hover:border-purple-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
            <Activity className="text-purple-400" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Rata-rata Volume</p>
            <p className="text-2xl font-black text-white">
              {(history || []).filter(Boolean).length > 0 ? Math.round((history || []).reduce((acc, s) => acc + calculateSessionVolume(s), 0) / (history || []).filter(Boolean).length).toLocaleString() : 0} <span className="text-sm text-zinc-500 font-medium">kg</span>
            </p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-5 flex items-center gap-4 border border-white/5 hover:border-blue-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
            <Target className="text-blue-400" size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Latihan Terakhir</p>
            <p className="text-lg font-black text-white truncate">
              {(history || []).filter(Boolean).length > 0 ? `${(history || []).filter(Boolean)[0].type} (${((history || []).filter(Boolean)[0].date || '').substring(5)})` : 'Belum Ada'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
         {/* PR Charts */}
         <div className="lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col border border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <TrendingUp className="text-orange-500" size={20} />
                 Analisis Kekuatan
               </h3>
               <select 
                 value={selectedExercisePR || 'volume'}
                 onChange={(e) => setSelectedExercisePR(e.target.value === 'volume' ? null : e.target.value)}
                 className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-orange-500/50"
               >
                 <option value="volume">Total Volume (Keseluruhan)</option>
                 <optgroup label="Rekor Pribadi (PR)">
                   {allUsedExercises.map(ex => <option key={ex} value={ex}>{ex} (PR)</option>)}
                 </optgroup>
               </select>
            </div>
            
            <div className="flex-1 w-full min-h-[250px] bg-zinc-950/30 rounded-2xl p-4 border border-white/5">
              {selectedExercisePR ? (
                prData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prData}>
                      <defs>
                        <linearGradient id="colorPr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                      <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={40} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="maxWeight" name="Beban Maks (kg)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPr)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 font-medium text-sm">
                    Belum ada rekaman beban untuk {selectedExercisePR}.
                  </div>
                )
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={45} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="volume" name="Volume (kg)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
         </div>

         {/* History */}
         <div className="glass-card rounded-3xl overflow-hidden flex flex-col border border-white/5">
           <div className="p-5 border-b border-white/5 flex items-center gap-2 bg-zinc-900/50">
             <History className="text-zinc-400" size={18} />
             <h3 className="font-bold text-white">Riwayat Terakhir</h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 max-h-[400px]">
              {(history || []).filter(Boolean).slice(0, 10).map((session) => (
                <div key={session?.id || Math.random()} className="bg-zinc-900/40 hover:bg-zinc-800/80 rounded-2xl transition-all border border-white/5 overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => setExpandedLogId(expandedLogId === session.id ? null : session.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-white tracking-wide">{session?.type || 'WORKOUT'}</span>
                        <span className="text-[10px] text-zinc-400 font-bold bg-zinc-800/80 px-2 py-0.5 rounded-full border border-white/10">{session?.date || 'Hari ini'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                         <span className="flex items-center gap-1 text-orange-400/80"><Clock size={12}/> {session?.durationMinutes || 30}m</span>
                         <span className="flex items-center gap-1 text-purple-400/80"><Dumbbell size={12}/> {calculateSessionVolume(session).toLocaleString()}kg</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteWorkout(session.id); }}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedLogId === session.id ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                    </div>
                  </div>
                  
                  {/* Expanded Detail View */}
                  {expandedLogId === session.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/20 animate-fade-in">
                      <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Latihan:</p>
                      <div className="space-y-3">
                        {session.exercises.map(ex => (
                          <div key={ex.id} className="text-sm">
                            <span className="font-semibold text-zinc-300 block mb-1">{ex.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.sets.filter(s => s.completed).map((s, idx) => (
                                <span key={s.id} className="text-[10px] bg-zinc-800/80 border border-white/10 text-zinc-400 px-2 py-0.5 rounded-md font-mono">
                                  {idx+1}: {s.weight}kg x {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(history || []).filter(Boolean).length === 0 && (
                <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                  <Dumbbell size={32} className="text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold">Belum ada riwayat latihan.</p>
                  <p className="text-xs">Mulai berolahraga untuk melihat statistik Anda!</p>
                </div>
              )}
           </div>
         </div>
      </div>

      {/* ACTIVE WORKOUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#09090b] md:border md:border-white/10 md:rounded-[2rem] w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
               <div>
                  {!activeWorkout ? (
                    <h3 className="text-xl font-bold text-white">Pilih Program Latihan</h3>
                  ) : (
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black shadow-lg">
                         {activeWorkout.type.charAt(0)}
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-white">{activeWorkout.type} DAY</h3>
                          <p className="text-sm text-zinc-400 font-mono flex items-center gap-1.5">
                            <Clock size={14} className={isTimerRunning ? 'text-orange-400' : ''} />
                            {formatTime(timerSeconds)}
                          </p>
                       </div>
                    </div>
                  )}
               </div>
               
               <div className="flex gap-2 items-center">
                 {activeWorkout && (
                   <>
                     <div className="hidden md:flex items-center gap-2 mr-4 bg-zinc-900 rounded-xl px-3 py-1.5 border border-white/10">
                       <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Istirahat</span>
                       <select 
                         value={restDuration} 
                         onChange={(e) => setRestDuration(Number(e.target.value))}
                         className="bg-transparent text-white font-mono text-sm focus:outline-none"
                       >
                         <option value={60}>60s</option>
                         <option value={90}>90s</option>
                         <option value={120}>120s</option>
                         <option value={180}>180s</option>
                       </select>
                     </div>
                     <button 
                        onClick={finishWorkout}
                        className="px-5 py-2.5 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 font-bold rounded-xl text-sm transition-all flex items-center gap-2"
                     >
                       <CheckCircle2 size={16} /> Selesai
                     </button>
                   </>
                 )}
                 <button 
                    onClick={() => {
                      if (activeWorkout && activeWorkout.exercises.length > 0) {
                        if (!confirm("Batalkan latihan ini? Data yang belum diselesaikan akan hilang.")) return;
                      }
                      setShowModal(false);
                      setIsTimerRunning(false);
                      setIsResting(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                 >
                   <X size={20} />
                 </button>
               </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-zinc-950">
               {!activeWorkout ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'FULL_BODY', 'CARDIO'].map(type => (
                     <button
                       key={type}
                       onClick={() => startNewWorkout(type as WorkoutSession['type'])}
                       className="p-8 rounded-[2rem] border border-white/5 bg-zinc-900/30 hover:bg-zinc-800/80 hover:border-orange-500/50 transition-all flex flex-col items-center justify-center gap-4 group shadow-lg relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-rose-500/0 group-hover:from-orange-500/10 group-hover:to-rose-500/10 transition-colors pointer-events-none"></div>
                       <Dumbbell className="text-zinc-600 group-hover:text-orange-500 transition-colors relative z-10" size={40} />
                       <span className="font-black text-zinc-400 group-hover:text-white text-lg tracking-wide relative z-10">{type}</span>
                     </button>
                   ))}
                 </div>
               ) : (
                 <div className="space-y-6">
                    {/* Active Exercises List */}
                    {activeWorkout.exercises.map((ex, exIdx) => {
                      const prevPerformances = getLastExercisePerformance(ex.name);
                      
                      return (
                      <div key={ex.id} className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-4 bg-zinc-800/40 flex justify-between items-center border-b border-white/5">
                          <div>
                            <h4 className="font-black text-white text-lg flex items-center gap-2">
                              <span className="text-orange-500">{exIdx + 1}.</span> {ex.name}
                            </h4>
                            {prevPerformances.length > 0 && (
                              <p className="text-xs font-bold text-zinc-500 flex items-center gap-1 mt-1">
                                <History size={12} /> Terakhir: {prevPerformances.map(p => `${p.weight}kg x ${p.reps}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <button 
                             onClick={() => removeExercise(ex.id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="p-4 md:p-6">
                          <div className="grid grid-cols-12 gap-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-3 px-2">
                            <div className="col-span-2 text-left">Set</div>
                            <div className="col-span-4">Beban (kg)</div>
                            <div className="col-span-4">Repetisi</div>
                            <div className="col-span-2"><CheckCircle2 size={16} className="mx-auto" /></div>
                          </div>
                          
                          <div className="space-y-3">
                            {(ex.sets || []).map((set, setIdx) => {
                              const prevSet = prevPerformances[setIdx];
                              return (
                              <div key={set.id} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl transition-all border ${set.completed ? 'bg-green-500/10 border-green-500/20' : 'bg-black/40 border-white/5'}`}>
                                <div className="col-span-2 text-center text-zinc-500 font-black text-lg">{setIdx + 1}</div>
                                <div className="col-span-4 relative">
                                  <input 
                                    type="number" 
                                    value={set.weight || ''}
                                    onChange={(e) => updateSet(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                    className={`w-full bg-zinc-900 border rounded-xl p-3 text-center font-black focus:outline-none transition-colors ${set.completed ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white focus:border-orange-500'}`}
                                    placeholder={prevSet ? String(prevSet.weight) : "-"}
                                    disabled={set.completed}
                                  />
                                </div>
                                <div className="col-span-4 relative">
                                  <input 
                                    type="number" 
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(ex.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                    className={`w-full bg-zinc-900 border rounded-xl p-3 text-center font-black focus:outline-none transition-colors ${set.completed ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white focus:border-orange-500'}`}
                                    placeholder={prevSet ? String(prevSet.reps) : "-"}
                                    disabled={set.completed}
                                  />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <button 
                                     onClick={() => toggleSetComplete(ex.id, set.id)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all transform active:scale-90 shadow-lg ${set.completed ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/5 hover:border-white/20'}`}
                                  >
                                    <CheckCircle2 size={24} />
                                  </button>
                                </div>
                              </div>
                            )})}
                          </div>
                          
                          <button 
                             onClick={() => addSet(ex.id)}
                            className="w-full mt-4 py-3.5 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold text-zinc-500 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Tambah Set
                          </button>
                        </div>
                      </div>
                    )})}
                    
                    {/* Add Exercise Selector */}
                    <div className="pt-6 pb-20 md:pb-6">
                      <p className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2"><Plus size={16} className="text-orange-500"/> Tambahkan Latihan</p>
                      
                      {/* Custom Input */}
                      <div className="flex gap-2 mb-6 bg-black/40 p-2 rounded-2xl border border-white/5">
                        <input 
                          type="text"
                          value={customExercise}
                          onChange={(e) => setCustomExercise(e.target.value)}
                          placeholder="Ketik latihan kustom (misal: Bicep Curl)"
                          className="flex-1 bg-transparent border-none text-white px-4 focus:outline-none placeholder:text-zinc-600 text-sm font-medium"
                          onKeyDown={(e) => e.key === 'Enter' && addExercise(customExercise)}
                        />
                        <button 
                          onClick={() => addExercise(customExercise)}
                          disabled={!customExercise.trim()}
                          className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                          Tambah
                        </button>
                      </div>

                      <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-widest">Saran Latihan Umum</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_EXERCISES.map(exName => (
                          <button
                            key={exName}
                            onClick={() => addExercise(exName)}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                          >
                            {exName}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface GymErrorBoundaryProps {
  children?: ReactNode;
}

interface GymErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

class GymErrorBoundary extends Component<GymErrorBoundaryProps, GymErrorBoundaryState> {
  constructor(props: GymErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): GymErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("GymTracker Runtime Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gym_workout_history');
      localStorage.removeItem('sports_routine');
    } catch (e) {
      console.warn("Failed to reset gym localStorage keys:", e);
    }
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-zinc-900/60 border border-red-500/20 rounded-3xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Terjadi Gangguan pada Gym Tracker</h3>
          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            Data riwayat latihan sebelumnya memiliki format lama atau rusak. Anda dapat memulihkannya dengan mereset data lokal tracker ini.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Coba Muat Ulang
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors"
            >
              <RotateCcw size={15} />
              Reset Data Riwayat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const GymTracker: React.FC = () => {
  return (
    <GymErrorBoundary>
      <GymTrackerInner />
    </GymErrorBoundary>
  );
};
