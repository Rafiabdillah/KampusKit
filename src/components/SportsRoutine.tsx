import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, CalendarClock, Target, Activity, Flame, CheckCircle2, Circle, X, Brain, Moon, HeartPulse, Quote } from 'lucide-react';
import { StorageService } from '../services/storage';
import { audioService } from '../services/audio';

export interface SportExercise {
  id: string;
  name: string;
  description?: string;
  sets: number;
  reps: number;
  isCompleted: boolean;
}

export interface SportSession {
  id: string;
  day: string;
  title: string;
  intensity: 'RENDAH' | 'SEDANG' | 'TINGGI';
  durationMins: number;
  exercises: SportExercise[];
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const SPORTS_QUOTES = [
  "Tubuhmu bisa melakukan hampir apa saja. Pikiranmulah yang harus kamu yakinkan.",
  "Jangan berhenti ketika kamu lelah. Berhentilah ketika kamu selesai.",
  "Satu-satunya olahraga yang buruk adalah olahraga yang tidak terjadi.",
  "Disiplin adalah melakukan apa yang tidak ingin kamu lakukan saat kamu tidak ingin melakukannya.",
  "Olahraga bukan tentang menjadi lebih baik dari orang lain. Ini tentang menjadi lebih baik dari dirimu sebelumnya.",
  "Hari ini lakukan apa yang orang lain tidak mau lakukan, agar besok kamu bisa melakukan apa yang orang lain tidak bisa."
];

const SPORTS_INSIGHTS = [
  { icon: Flame, color: 'text-red-400', title: 'BDNF Booster', desc: 'Olahraga aerobik meningkatkan produksi BDNF yang berfungsi seperti "pupuk" bagi otak, mempercepat neuroplastisitas dan memori.' },
  { icon: Activity, color: 'text-blue-400', title: 'Fokus Optimal', desc: 'Latihan intensitas sedang selama 20 menit sebelum sesi belajar dapat meningkatkan rentang perhatian dan kreativitas hingga 2 jam.' },
  { icon: Brain, color: 'text-purple-400', title: 'Neurogenesis', desc: 'Berlari dan latihan kardio terbukti merangsang pertumbuhan neuron baru di hippocampus, area otak yang terkait pembelajaran.' },
  { icon: Moon, color: 'text-indigo-400', title: 'Kualitas Tidur', desc: 'Olahraga teratur membantu mengatur ritme sirkadian dan meningkatkan panjang fase tidur lelap (Deep Sleep) untuk konsolidasi memori.' },
  { icon: HeartPulse, color: 'text-pink-400', title: 'Manajemen Stres', desc: 'Aktivitas fisik menurunkan kadar kortisol dan memicu pelepasan endorfin, penangkal alami tingkat stres dan kecemasan ekstrim.' },
];

const DAVID_LAID_ROUTINE: SportSession[] = [
  {
    id: 'dl_senin', day: 'Senin', title: 'Upper Body Push', intensity: 'TINGGI', durationMins: 90,
    exercises: [
      { id: 'e1', name: 'Barbell Bench Press', description: 'Compound push. 3-5 menit istirahat.', sets: 5, reps: 5, isCompleted: false },
      { id: 'e2', name: 'Seated Overhead Press', description: 'Fokus bahu depan dan atas.', sets: 4, reps: 8, isCompleted: false },
      { id: 'e3', name: 'Incline Dumbbell Press', description: 'Untuk dada atas.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e4', name: 'Tricep Pushdown', description: 'Isolasi triceps dengan tali (rope).', sets: 4, reps: 12, isCompleted: false },
      { id: 'e5', name: 'Lateral Raises', description: 'Isolasi bahu samping. Repetisi tinggi.', sets: 5, reps: 15, isCompleted: false }
    ]
  },
  {
    id: 'dl_selasa', day: 'Selasa', title: 'Lower Body (Squat)', intensity: 'TINGGI', durationMins: 90,
    exercises: [
      { id: 'e1', name: 'Barbell Squat', description: 'Latihan utama. Jaga form.', sets: 5, reps: 5, isCompleted: false },
      { id: 'e2', name: 'Leg Press', description: 'Fokus quad dan glutes.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e3', name: 'Leg Extension', description: 'Isolasi quad (paha depan).', sets: 4, reps: 12, isCompleted: false },
      { id: 'e4', name: 'Calf Raises', description: 'Mesin standing atau seated.', sets: 5, reps: 15, isCompleted: false }
    ]
  },
  {
    id: 'dl_rabu', day: 'Rabu', title: 'Upper Body Pull', intensity: 'TINGGI', durationMins: 90,
    exercises: [
      { id: 'e1', name: 'Deadlift', description: 'Compound pull paling berat.', sets: 4, reps: 5, isCompleted: false },
      { id: 'e2', name: 'Pull-up / Chin-up', description: 'Beban tubuh atau tambah beban.', sets: 4, reps: 8, isCompleted: false },
      { id: 'e3', name: 'Barbell Row', description: 'Ketebalan punggung.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e4', name: 'Lat Pulldown', description: 'Lebar punggung (Lats).', sets: 4, reps: 12, isCompleted: false },
      { id: 'e5', name: 'Barbell Bicep Curl', description: 'Isolasi bicep.', sets: 4, reps: 12, isCompleted: false }
    ]
  },
  {
    id: 'dl_kamis', day: 'Kamis', title: 'Upper Body Push (Hypertrophy)', intensity: 'SEDANG', durationMins: 80,
    exercises: [
      { id: 'e1', name: 'Overhead Press', description: 'Fokus hipertrofi.', sets: 4, reps: 8, isCompleted: false },
      { id: 'e2', name: 'Incline Barbell Press', description: 'Dada atas.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e3', name: 'Dumbbell Bench Press', description: 'Fokus stretch dada.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e4', name: 'Overhead Tricep Ext', description: 'Long head tricep.', sets: 4, reps: 12, isCompleted: false },
      { id: 'e5', name: 'Lateral Raises', description: 'Volume tinggi untuk bahu.', sets: 5, reps: 15, isCompleted: false }
    ]
  },
  {
    id: 'dl_jumat', day: 'Jumat', title: 'Lower Body (Deadlift/Hypertrophy)', intensity: 'TINGGI', durationMins: 90,
    exercises: [
      { id: 'e1', name: 'Front Squat', description: 'Fokus Quad dan core.', sets: 4, reps: 8, isCompleted: false },
      { id: 'e2', name: 'Romanian Deadlift (RDL)', description: 'Fokus hamstring.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e3', name: 'Leg Curl', description: 'Isolasi hamstring.', sets: 4, reps: 12, isCompleted: false },
      { id: 'e4', name: 'Calf Raises', description: 'Repetisi tinggi.', sets: 5, reps: 15, isCompleted: false }
    ]
  },
  {
    id: 'dl_sabtu', day: 'Sabtu', title: 'Upper Body Pull (Hypertrophy)', intensity: 'SEDANG', durationMins: 80,
    exercises: [
      { id: 'e1', name: 'Pull-up', description: 'Fokus kontrol.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e2', name: 'T-Bar Row / Seated Row', description: 'Ketebalan punggung tengah.', sets: 4, reps: 10, isCompleted: false },
      { id: 'e3', name: 'Face Pull', description: 'Kesehatan bahu belakang.', sets: 4, reps: 15, isCompleted: false },
      { id: 'e4', name: 'Hammer Curl', description: 'Brachialis & bicep.', sets: 4, reps: 12, isCompleted: false },
      { id: 'e5', name: 'Dumbbell Curl', description: 'Isolasi.', sets: 3, reps: 12, isCompleted: false }
    ]
  },
  {
    id: 'dl_minggu', day: 'Minggu', title: 'Rest & Recovery', intensity: 'RENDAH', durationMins: 30,
    exercises: [
      { id: 'e1', name: 'Stretching & Foam Rolling', description: 'Pemulihan aktif.', sets: 1, reps: 15, isCompleted: false },
      { id: 'e2', name: 'Jalan Santai', description: 'Kardio ringan (LISS).', sets: 1, reps: 30, isCompleted: false }
    ]
  }
];

export const SportsRoutine: React.FC = () => {
  const [sessions, setSessions] = useState<SportSession[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newIntensity, setNewIntensity] = useState<'RENDAH' | 'SEDANG' | 'TINGGI'>('SEDANG');
  const [newDuration, setNewDuration] = useState(30);

  useEffect(() => {
    const saved = StorageService.getItem<SportSession[]>('sports_routine', []);
    if (saved.length > 0) {
      setSessions(saved);
    }
    setRandomQuote(SPORTS_QUOTES[Math.floor(Math.random() * SPORTS_QUOTES.length)]);
  }, []);

  const saveSessions = (updated: SportSession[]) => {
    setSessions(updated);
    StorageService.setItem('sports_routine', updated);
  };

  const currentDaySessions = sessions.filter(s => s.day === selectedDay);

  const handleAddSession = () => {
    if (!newTitle.trim()) return;
    
    const newSession: SportSession = {
      id: Date.now().toString(),
      day: selectedDay,
      title: newTitle,
      intensity: newIntensity,
      durationMins: newDuration,
      exercises: []
    };

    saveSessions([...sessions, newSession]);
    setNewTitle('');
    setNewDuration(30);
    setNewIntensity('SEDANG');
    setShowAddSession(false);
    audioService.playAmbientClick();
  };

  const handleDeleteSession = (id: string) => {
    saveSessions(sessions.filter(s => s.id !== id));
    audioService.playAmbientClick();
  };

  const handleAddExercise = (sessionId: string) => {
    const defaultExercise: SportExercise = {
      id: Date.now().toString(),
      name: 'Latihan Baru',
      description: '',
      sets: 3,
      reps: 10,
      isCompleted: false
    };

    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, exercises: [...s.exercises, defaultExercise] };
      }
      return s;
    });
    saveSessions(updated);
    audioService.playAmbientClick();
  };

  const handleUpdateExercise = (sessionId: string, exerciseId: string, updates: Partial<SportExercise>) => {
    let playedSound = false;
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          exercises: s.exercises.map(e => {
            if (e.id === exerciseId) {
               if (updates.isCompleted && !e.isCompleted && !playedSound) {
                  audioService.playAmbientSuccess();
                  playedSound = true;
               }
               return { ...e, ...updates };
            }
            return e;
          })
        };
      }
      return s;
    });
    saveSessions(updated);
  };

  const handleDeleteExercise = (sessionId: string, exerciseId: string) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          exercises: s.exercises.filter(e => e.id !== exerciseId)
        };
      }
      return s;
    });
    saveSessions(updated);
    audioService.playAmbientClick();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in relative pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Dumbbell className="text-primary" size={32} />
            Jadwal Olahraga
          </h1>
          <p className="text-zinc-400 mt-1">Kelola rutinitas workout untuk keseimbangan fisik & mental.</p>
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`min-w-[100px] py-3 px-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all flex-shrink-0 ${
              selectedDay === day 
                ? 'bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'glass-card text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span className="text-xs uppercase tracking-wider">{day.substring(0, 3)}</span>
            <span className="text-sm">{day}</span>
          </button>
        ))}
      </div>

      {/* Active Day Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Sessions List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <CalendarClock className="text-primary" size={20} />
               Rutinitas Hari {selectedDay}
             </h2>
             <button 
                onClick={() => setShowAddSession(true)}
                className="btn-primary py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2"
             >
                <Plus size={14} /> Tambah Sesi
             </button>
          </div>

          {currentDaySessions.length === 0 ? (
             <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-white/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
                   <Activity size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Belum Ada Sesi Olahraga</h3>
                <p className="text-sm text-zinc-400">Jadwalkan kegiatan fisik kamu di hari {selectedDay}.</p>
                <div className="flex gap-3 mt-4 flex-wrap justify-center">
                   <button onClick={() => setShowAddSession(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-colors border border-white/5">
                      + Tambah Sesi
                   </button>
                   <button onClick={() => {
                      if (window.confirm("Gunakan preset jadwal latihan David Laid (DUP) untuk 1 minggu penuh? Ini akan menimpa jadwal kamu saat ini.")) {
                         saveSessions(DAVID_LAID_ROUTINE);
                         audioService.playAmbientSuccess();
                      }
                   }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-white/5">
                      🔥 Gunakan Jadwal David Laid DUP
                   </button>
                </div>
             </div>
          ) : (
             <div className="space-y-4">
                {currentDaySessions.map(session => {
                  const completedCount = session.exercises.filter(e => e.isCompleted).length;
                  const totalCount = session.exercises.length;
                  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

                  return (
                    <div key={session.id} className="glass-card p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                       <div className="flex items-start justify-between mb-4">
                          <div>
                             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                               {session.title}
                               <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${
                                 session.intensity === 'TINGGI' ? 'bg-red-500/20 text-red-400' :
                                 session.intensity === 'SEDANG' ? 'bg-yellow-500/20 text-yellow-400' :
                                 'bg-green-500/20 text-green-400'
                               }`}>
                                 {session.intensity}
                               </span>
                             </h3>
                             <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                               <CalendarClock size={12} /> {session.durationMins} Menit
                             </p>
                          </div>
                          <button onClick={() => handleDeleteSession(session.id)} className="text-zinc-500 hover:text-red-400 p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>

                       {/* Progress Bar */}
                       {totalCount > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1 font-medium">
                               <span className="text-zinc-400">Progress Latihan</span>
                               <span className="text-primary">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                       )}

                       {session.exercises.length === 0 ? (
                          <div className="py-6 text-center flex flex-col items-center justify-center gap-2 bg-black/20 rounded-xl border border-white/5 mb-4">
                             <Dumbbell className="text-zinc-600 mb-1" size={24} />
                             <p className="text-sm text-zinc-500 font-medium">Belum ada gerakan.</p>
                             <p className="text-xs text-zinc-600">Mulai tambahkan rutinitas latihan kamu.</p>
                          </div>
                       ) : (
                          <div className="space-y-3 mb-4">
                             {session.exercises.map(exercise => (
                                <div key={exercise.id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${exercise.isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}>
                                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                      <div className="flex items-start gap-3 flex-1">
                                         <button className="mt-1 transition-transform hover:scale-110 active:scale-95" onClick={() => handleUpdateExercise(session.id, exercise.id, { isCompleted: !exercise.isCompleted })}>
                                            {exercise.isCompleted ? <CheckCircle2 className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" size={22} /> : <Circle className="text-zinc-500 hover:text-zinc-300 transition-colors" size={22} />}
                                         </button>
                                         <div className="flex-1 w-full">
                                            <textarea
                                               value={exercise.name}
                                               placeholder="Nama Gerakan (Cth: Push Up)"
                                               rows={1}
                                               onInput={(e) => {
                                                  const target = e.target as HTMLTextAreaElement;
                                                  target.style.height = 'auto';
                                                  target.style.height = target.scrollHeight + 'px';
                                               }}
                                               onChange={(e) => handleUpdateExercise(session.id, exercise.id, { name: e.target.value })}
                                               className={`bg-transparent border-none text-base outline-none w-full font-bold mb-1 resize-none overflow-hidden transition-colors ${exercise.isCompleted ? 'text-green-200 line-through' : 'text-zinc-100 placeholder:text-zinc-600'}`}
                                               disabled={exercise.isCompleted}
                                               style={{ minHeight: '28px' }}
                                            />
                                            <textarea
                                               value={exercise.description || ''}
                                               placeholder="Catatan / Instruksi (opsional)..."
                                               rows={1}
                                               onInput={(e) => {
                                                  const target = e.target as HTMLTextAreaElement;
                                                  target.style.height = 'auto';
                                                  target.style.height = target.scrollHeight + 'px';
                                               }}
                                               onChange={(e) => handleUpdateExercise(session.id, exercise.id, { description: e.target.value })}
                                               className={`bg-transparent border-none text-xs outline-none w-full resize-none overflow-hidden transition-colors ${exercise.isCompleted ? 'text-green-200/60' : 'text-zinc-400 placeholder:text-zinc-600'}`}
                                               disabled={exercise.isCompleted}
                                               style={{ minHeight: '20px' }}
                                            />
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-2 pl-9 sm:pl-0 self-end sm:self-start mt-2 sm:mt-0">
                                         <div className={`flex items-center rounded-lg px-2.5 py-1.5 border transition-colors ${exercise.isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-black/40 border-white/5'}`}>
                                            <input 
                                               type="number" 
                                               value={exercise.sets} 
                                               onChange={(e) => handleUpdateExercise(session.id, exercise.id, { sets: parseInt(e.target.value) || 0 })}
                                               className={`bg-transparent border-none w-8 text-center text-sm font-bold outline-none transition-colors ${exercise.isCompleted ? 'text-green-300' : 'text-zinc-200'}`} 
                                               disabled={exercise.isCompleted}
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${exercise.isCompleted ? 'text-green-500/70' : 'text-zinc-500'}`}>Sets</span>
                                         </div>
                                         <span className={`text-xs font-black ${exercise.isCompleted ? 'text-green-500/50' : 'text-zinc-700'}`}>X</span>
                                         <div className={`flex items-center rounded-lg px-2.5 py-1.5 border transition-colors ${exercise.isCompleted ? 'bg-green-500/10 border-green-500/20' : 'bg-black/40 border-white/5'}`}>
                                            <input 
                                               type="number" 
                                               value={exercise.reps} 
                                               onChange={(e) => handleUpdateExercise(session.id, exercise.id, { reps: parseInt(e.target.value) || 0 })}
                                               className={`bg-transparent border-none w-8 text-center text-sm font-bold outline-none transition-colors ${exercise.isCompleted ? 'text-green-300' : 'text-zinc-200'}`} 
                                               disabled={exercise.isCompleted}
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${exercise.isCompleted ? 'text-green-500/70' : 'text-zinc-500'}`}>Reps</span>
                                         </div>
                                         <button onClick={() => handleDeleteExercise(session.id, exercise.id)} className="p-2 text-zinc-600 hover:text-red-400 ml-1 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                       
                       <button onClick={() => handleAddExercise(session.id)} className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all">
                          + Tambah Gerakan / Latihan
                       </button>
                    </div>
                  );
                })}
             </div>
          )}
        </div>

        {/* Right Col: Stats & Info */}
        <div className="space-y-4">
           {/* Quote Daily */}
           <div className="glass-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
              <Quote className="text-primary/40 mb-3" size={24} />
              <p className="text-sm text-zinc-300 font-medium italic leading-relaxed relative z-10">
                "{randomQuote}"
              </p>
           </div>

           <div className="glass-card p-5 rounded-2xl border border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Target className="text-orange-400" size={16} />
                Insight Olahraga
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 {SPORTS_INSIGHTS.map((insight, idx) => (
                   <div key={idx} className="bg-black/20 rounded-xl p-3 border border-white/5">
                     <div className="flex items-center gap-2 mb-1">
                        <insight.icon className={insight.color} size={14} />
                        <span className="text-xs font-bold text-zinc-200">{insight.title}</span>
                     </div>
                     <p className="text-xs text-zinc-400 leading-relaxed">{insight.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-card p-5 rounded-2xl border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Rangkuman Mingguan</h3>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 mb-2">
                 <span className="text-xs text-zinc-400 font-medium">Total Sesi</span>
                 <span className="text-lg font-black text-white">{sessions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 mb-4">
                 <span className="text-xs text-zinc-400 font-medium">Total Menit (Est.)</span>
                 <span className="text-lg font-black text-primary">{sessions.reduce((acc, curr) => acc + curr.durationMins, 0)}</span>
              </div>
              <button onClick={() => {
                 if (window.confirm("Ganti seluruh jadwal dengan preset David Laid DUP? Jadwal saat ini akan dihapus.")) {
                    saveSessions(DAVID_LAID_ROUTINE);
                    audioService.playAmbientSuccess();
                 }
              }} className="w-full py-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/5">
                 🔥 Load Jadwal David Laid DUP
              </button>
           </div>
        </div>

      </div>

      {/* Add Session Modal */}
      {showAddSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-6">Tambah Jadwal Olahraga</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nama Workout</label>
                <input
                  type="text"
                  placeholder="Contoh: Jogging, Full Body, Yoga"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Durasi (Menit)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={e => setNewDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Intensitas</label>
                   <select
                      value={newIntensity}
                      onChange={(e) => setNewIntensity(e.target.value as 'RENDAH' | 'SEDANG' | 'TINGGI')}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                   >
                      <option value="RENDAH">Rendah (Yoga, Jalan)</option>
                      <option value="SEDANG">Sedang (Jogging, Angkat Beban)</option>
                      <option value="TINGGI">Tinggi (HIIT, Sprint)</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddSession(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddSession}
                disabled={!newTitle.trim()}
                className="flex-1 px-4 py-3 bg-primary hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
