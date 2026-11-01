
import React, { useState } from 'react';
import { Task, Book, ViewState } from '../types';
import { 
  Clock, Battery, Zap, BrainCircuit, Coffee, BookOpen, CheckSquare, 
  Smile, Frown, Meh, AlertCircle, X, ArrowRight, Wind, Pencil, 
  Dumbbell, ListChecks, Music, MonitorOff, Shuffle, Microscope, 
  Lightbulb, Layers, Timer, Palette, Eye, Briefcase, Wallet, 
  Moon, Utensils, Flag, UserPlus, Quote, Compass, Trash2, Sparkles
} from 'lucide-react';

interface ActivitySuggesterProps {
  tasks: Task[];
  books: Book[];
  setView: (view: ViewState) => void;
  onClose: () => void;
}

type TimeOption = '5' | '15' | '30' | '60';
type MoodOption = 'ENERGETIC' | 'TIRED' | 'ANXIOUS' | 'BORED';

interface Activity {
  id: string;
  title: string;
  desc: string;
  moods: MoodOption[];
  minTime: number; // minutes required
  maxTime?: number; // max minutes suitable
  targetView: ViewState;
  science: string;
  icon: React.ReactNode;
}

// --- DATABASE 55+ KEGIATAN & BRAIN HACKS ---
const ACTIVITY_DB: Activity[] = [
  // ==========================================
  // 5 MENIT (Micro-Habits & Reset)
  // ==========================================
  {
    id: 'box-breathing',
    title: 'Box Breathing (4-4-4-4)',
    desc: 'Tarik napas 4s, tahan 4s, hembus 4s, tahan 4s.',
    moods: ['ANXIOUS', 'TIRED'],
    minTime: 5,
    targetView: 'brain-gym',
    science: 'Mereset sistem saraf otonom dan menurunkan kortisol secara instan (Vagus Nerve Stimulation).',
    icon: <Wind className="text-blue-400" />
  },
  {
    id: 'schulte',
    title: 'Schulte Table',
    desc: 'Latih fokus visual dan kecepatan mata.',
    moods: ['BORED', 'TIRED'],
    minTime: 5,
    targetView: 'brain-gym',
    science: 'Meningkatkan aliran darah ke lobus frontal dan "membangunkan" otak untuk membaca cepat.',
    icon: <Eye className="text-blue-400" />
  },
  {
    id: 'stroop',
    title: 'Stroop Test',
    desc: 'Game asah otak untuk kontrol impuls.',
    moods: ['BORED', 'ENERGETIC'],
    minTime: 5,
    targetView: 'brain-gym',
    science: 'Melatih Anterior Cingulate Cortex untuk seleksi perhatian dan inhibisi.',
    icon: <Zap className="text-yellow-400" />
  },
  {
    id: 'brain-dump',
    title: 'Quick Brain Dump',
    desc: 'Tulis semua kecemasan atau ide di catatan baru.',
    moods: ['ANXIOUS', 'BORED'],
    minTime: 5,
    targetView: 'notes',
    science: 'Mengurangi beban kognitif (Working Memory) dengan eksternalisasi pikiran.',
    icon: <Pencil className="text-slate-400" />
  },
  {
    id: 'hydrate',
    title: 'Hidrasi Kognitif',
    desc: 'Minum 1 gelas air besar dan regangkan leher.',
    moods: ['TIRED', 'BORED', 'ANXIOUS'],
    minTime: 5,
    targetView: 'dashboard',
    science: 'Dehidrasi 2% saja menurunkan performa kognitif, memori, dan atensi secara signifikan.',
    icon: <Coffee className="text-blue-300" />
  },
  {
    id: 'tidy-env',
    title: 'Mikro-Organisir',
    desc: 'Rapikan meja belajarmu atau atur file di laptop.',
    moods: ['ANXIOUS', 'BORED'],
    minTime: 5,
    targetView: 'tasks',
    science: 'Visual Clutter (kekacauan visual) meningkatkan kortisol dan menguras kapasitas atensi.',
    icon: <ListChecks className="text-green-400" />
  },
  {
    id: 'check-deadlines',
    title: 'Review Deadline',
    desc: 'Cek tugas prioritas tinggi dan deadline terdekat.',
    moods: ['ANXIOUS', 'ENERGETIC'],
    minTime: 5,
    targetView: 'tasks',
    science: 'Kejelasan jadwal mengurangi kecemasan akan ketidakpastian (Fear of Unknown).',
    icon: <CheckSquare className="text-red-400" />
  },
  {
    id: 'palming',
    title: 'Eye Palming',
    desc: 'Gosok tangan hingga hangat, tutup mata 2 menit.',
    moods: ['TIRED'],
    minTime: 5,
    targetView: 'dashboard',
    science: 'Mengistirahatkan saraf optik dan mengurangi ketegangan leher akibat layar.',
    icon: <Eye className="text-orange-400" />
  },
  {
    id: 'gratitude',
    title: 'Jurnal Syukur Kilat',
    desc: 'Tulis 3 hal kecil yang disyukuri hari ini.',
    moods: ['ANXIOUS', 'TIRED'],
    minTime: 5,
    targetView: 'journal',
    science: 'Meningkatkan serotonin dan dopamin, menggeser fokus otak dari negatif ke positif.',
    icon: <Smile className="text-pink-400" />
  },
  {
    id: 'expense-log',
    title: 'Catat Pengeluaran',
    desc: 'Input jajan hari ini biar dompet aman.',
    moods: ['ANXIOUS', 'BORED'],
    minTime: 5,
    targetView: 'budget',
    science: 'Self-monitoring meningkatkan kesadaran finansial dan kontrol impuls belanja.',
    icon: <Wallet className="text-green-500" />
  },
  {
    id: 'read-quote',
    title: 'Booster Motivasi',
    desc: 'Baca kata bijak untuk inspirasi instan.',
    moods: ['BORED', 'TIRED'],
    minTime: 5,
    targetView: 'motivation',
    science: 'Priming positif dapat meningkatkan mood dan kesiapan mental sebelum bekerja.',
    icon: <Quote className="text-yellow-500" />
  },
  {
    id: 'track-habit',
    title: 'Ceklis Habit',
    desc: 'Tandai kebiasaan yang sudah dilakukan.',
    moods: ['ENERGETIC', 'BORED'],
    minTime: 5,
    targetView: 'habits',
    science: 'Efek visual "Streak" memicu motivasi intrinsik untuk tidak memutus rantai.',
    icon: <Zap className="text-purple-400" />
  },
  {
    id: 'posture-check',
    title: 'Posture Reset',
    desc: 'Berdiri, regangkan punggung, busungkan dada.',
    moods: ['TIRED', 'BORED'],
    minTime: 5,
    targetView: 'dashboard',
    science: 'Postur tegak meningkatkan hormon testosteron (percaya diri) dan menurunkan kortisol.',
    icon: <Dumbbell className="text-slate-300" />
  },

  // ==========================================
  // 15 MENIT (Short Bursts)
  // ==========================================
  {
    id: 'blurting',
    title: 'Metode Blurting',
    desc: 'Baca topik 5 menit, tutup buku, tulis semua yg diingat.',
    moods: ['ENERGETIC', 'BORED'],
    minTime: 15,
    targetView: 'notes',
    science: 'Bentuk Active Recall yang sangat efektif menguji pemahaman dan retensi memori.',
    icon: <BrainCircuit className="text-pink-400" />
  },
  {
    id: 'feynman-lite',
    title: 'Teknik Feynman (Lite)',
    desc: 'Coba jelaskan satu konsep sulit dgn bahasa sederhana.',
    moods: ['ENERGETIC'],
    minTime: 15,
    targetView: 'notes',
    science: 'Menjelaskan konsep memaksa otak melakukan rekonstruksi informasi dan menemukan celah pemahaman.',
    icon: <Lightbulb className="text-yellow-400" />
  },
  {
    id: 'flashcard-sprint',
    title: 'Flashcard Sprint',
    desc: 'Review 10-20 kartu flashcard secepat mungkin.',
    moods: ['ENERGETIC', 'BORED'],
    minTime: 15,
    targetView: 'flashcards',
    science: 'Spaced Repetition memperkuat jalur sinaptik memori jangka panjang.',
    icon: <Layers className="text-indigo-400" />
  },
  {
    id: 'nsdr',
    title: 'NSDR / Yoga Nidra',
    desc: 'Istirahat total tanpa tidur (Non-Sleep Deep Rest).',
    moods: ['TIRED', 'ANXIOUS'],
    minTime: 15,
    targetView: 'focus',
    science: 'Memulihkan dopamin dan mempercepat neuroplastisitas (belajar) pasca-sesi.',
    icon: <MonitorOff className="text-purple-400" />
  },
  {
    id: 'walk',
    title: 'Jalan Kaki Optic Flow',
    desc: 'Jalan kaki singkat melihat pemandangan luas.',
    moods: ['ANXIOUS', 'TIRED', 'BORED'],
    minTime: 15,
    targetView: 'dashboard', 
    science: 'Gerakan mata lateral saat berjalan (Optic Flow) menenangkan Amigdala (pusat takut).',
    icon: <Dumbbell className="text-green-400" />
  },
  {
    id: 'lofi-setup',
    title: 'Setup Fokus Audio',
    desc: 'Siapkan playlist Lo-Fi atau White Noise.',
    moods: ['ANXIOUS', 'BORED'],
    minTime: 15,
    targetView: 'focus',
    science: 'Musik instrumental membantu mempertahankan atensi berkelanjutan (Sustained Attention).',
    icon: <Music className="text-orange-400" />
  },
  {
    id: 'eat-frog',
    title: 'Eat The Frog (Start)',
    desc: 'Kerjakan langkah pertama tugas tersulit.',
    moods: ['ENERGETIC'],
    minTime: 15,
    targetView: 'tasks',
    science: 'Memulai adalah bagian tersulit (Friction). Langkah kecil menembus inersia otak.',
    icon: <CheckSquare className="text-red-500" />
  },
  {
    id: 'doodle',
    title: 'Doodling / Sketsa',
    desc: 'Gambar konsep abstrak dari materi kuliahmu.',
    moods: ['BORED', 'TIRED'],
    minTime: 15,
    targetView: 'notes',
    science: 'Mengaktifkan Default Mode Network (DMN) untuk kreativitas dan pemecahan masalah.',
    icon: <Palette className="text-pink-400" />
  },
  {
    id: 'power-nap',
    title: 'Power Nap',
    desc: 'Tidur 15-20 menit (jangan lebih).',
    moods: ['TIRED'],
    minTime: 15,
    targetView: 'sleep',
    science: 'Membersihkan adenosin (zat lelah) tanpa masuk ke deep sleep (menghindari pening).',
    icon: <Moon className="text-indigo-500" />
  },
  {
    id: 'cv-review',
    title: 'Ceklis CV Cepat',
    desc: 'Review 1 bagian CV kamu.',
    moods: ['ENERGETIC', 'ANXIOUS'],
    minTime: 15,
    targetView: 'career',
    science: 'Persiapan karir dicicil mengurangi kecemasan pasca-kampus.',
    icon: <Briefcase className="text-slate-400" />
  },
  {
    id: 'citation-fix',
    title: 'Rapikan Daftar Pustaka',
    desc: 'Generate sitasi untuk tugas makalah.',
    moods: ['BORED'],
    minTime: 15,
    targetView: 'citation',
    science: 'Tugas repetitif rendah kognitif cocok dikerjakan saat energi mental rendah.',
    icon: <Quote className="text-yellow-600" />
  },
  {
    id: 'meal-prep-plan',
    title: 'Rencana Makan Hemat',
    desc: 'Pilih menu makan besok biar hemat.',
    moods: ['ANXIOUS', 'TIRED'],
    minTime: 15,
    targetView: 'meals',
    science: 'Mengurangi Decision Fatigue (kelelahan mengambil keputusan) di hari esok.',
    icon: <Utensils className="text-orange-500" />
  },
  {
    id: 'digital-declutter',
    title: 'Hapus File Sampah',
    desc: 'Hapus screenshot atau download-an lama.',
    moods: ['BORED'],
    minTime: 15,
    targetView: 'dashboard',
    science: 'Membersihkan lingkungan digital memberikan rasa kontrol dan pencapaian instan.',
    icon: <Trash2 className="text-red-400" />
  },

  // ==========================================
  // 30 MENIT (Medium Focus)
  // ==========================================
  {
    id: 'pomodoro',
    title: 'Pomodoro Klasik',
    desc: '25 menit kerja fokus + 5 menit istirahat.',
    moods: ['ENERGETIC', 'BORED'],
    minTime: 30,
    targetView: 'focus',
    science: 'Mencegah kelelahan kognitif dengan memecah waktu kerja (Timeboxing).',
    icon: <Timer className="text-red-400" />
  },
  {
    id: 'leisure-read',
    title: 'Leisure Reading',
    desc: 'Baca buku fiksi atau non-akademik.',
    moods: ['TIRED', 'ANXIOUS'],
    minTime: 30,
    targetView: 'library',
    science: 'Membaca 6 menit saja dapat menurunkan tingkat stres hingga 68%.',
    icon: <BookOpen className="text-blue-400" />
  },
  {
    id: 'mind-map',
    title: 'Mind Mapping',
    desc: 'Buat peta konsep dari satu bab mata kuliah.',
    moods: ['ENERGETIC'],
    minTime: 30,
    targetView: 'notes',
    science: 'Visualisasi struktur materi membantu pemahaman holistik dan asosiasi memori.',
    icon: <BrainCircuit className="text-green-400" />
  },
  {
    id: 'create-flashcards',
    title: 'Buat Flashcards',
    desc: 'Konversi catatan kuliah menjadi pertanyaan.',
    moods: ['ENERGETIC', 'BORED'],
    minTime: 30,
    targetView: 'flashcards',
    science: 'Proses pembuatan kartu sendiri adalah bentuk encoding memori yang kuat.',
    icon: <Layers className="text-yellow-400" />
  },
  {
    id: 'interleaved',
    title: 'Interleaved Practice',
    desc: 'Kerjakan soal dari 2 topik berbeda secara bergantian.',
    moods: ['ENERGETIC'],
    minTime: 30,
    targetView: 'tasks',
    science: 'Variasi topik meningkatkan kemampuan problem solving adaptif (Transfer of Learning).',
    icon: <Shuffle className="text-purple-400" />
  },
  {
    id: 'gpa-audit',
    title: 'Audit Nilai & Target',
    desc: 'Cek nilai saat ini dan hitung strategi IPK.',
    moods: ['ANXIOUS'],
    minTime: 30,
    targetView: 'grades',
    science: 'Metakognisi: Evaluasi posisi saat ini untuk menyusun strategi masa depan.',
    icon: <Microscope className="text-blue-400" />
  },
  {
    id: 'interview-prep',
    title: 'Simulasi Interview',
    desc: 'Jawab 3 pertanyaan umum HRD.',
    moods: ['ENERGETIC', 'ANXIOUS'],
    minTime: 30,
    targetView: 'career',
    science: 'Desensitisasi sistematis mengurangi kecemasan sosial.',
    icon: <Briefcase className="text-slate-400" />
  }
];

export const ActivitySuggester: React.FC<ActivitySuggesterProps> = ({ tasks, books, setView, onClose }) => {
  const [time, setTime] = useState<TimeOption | null>(null);
  const [mood, setMood] = useState<MoodOption | null>(null);

  // Logic to filter activities
  const filteredActivities = ACTIVITY_DB.filter(act => {
    if (time && act.minTime > parseInt(time)) return false;
    if (mood && !act.moods.includes(mood)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
       <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10">
             <X size={24} />
          </button>
          
          <div className="p-8 overflow-y-auto custom-scrollbar">
             <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-400" /> AI Neuro-Suggester
             </h2>
             <p className="text-zinc-400 mb-8">Saya akan pilihkan aktivitas terbaik berdasarkan kondisi otakmu saat ini.</p>

             {/* Step 1: Time */}
             <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Clock size={16} /> Berapa waktu luangmu?
                </h3>
                <div className="grid grid-cols-4 gap-3">
                   {['5', '15', '30', '60'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t as TimeOption)}
                        className={`py-3 rounded-xl font-bold transition-all border ${time === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                      >
                         {t}m
                      </button>
                   ))}
                </div>
             </div>

             {/* Step 2: Mood */}
             <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Battery size={16} /> Bagaimana energimu?
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { id: 'ENERGETIC', label: 'Enerjik', icon: <Zap size={18}/>, color: 'text-yellow-400' },
                     { id: 'TIRED', label: 'Lelah', icon: <Battery size={18}/>, color: 'text-red-400' },
                     { id: 'ANXIOUS', label: 'Cemas', icon: <AlertCircle size={18}/>, color: 'text-blue-400' },
                     { id: 'BORED', label: 'Bosan', icon: <Meh size={18}/>, color: 'text-purple-400' },
                   ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMood(m.id as MoodOption)}
                        className={`py-3 px-4 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${mood === m.id ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
                      >
                         <span className={mood === m.id ? 'text-black' : m.color}>{m.icon}</span>
                         {m.label}
                      </button>
                   ))}
                </div>
             </div>

             {/* Results */}
             {time && mood && (
                <div className="animate-slide-up">
                   <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">Rekomendasi (Based on Science):</h3>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredActivities.map(act => (
                         <div 
                           key={act.id} 
                           onClick={() => { setView(act.targetView); onClose(); }}
                           className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 transition-all cursor-pointer group"
                         >
                            <div className="p-3 rounded-xl bg-black/20 group-hover:scale-110 transition-transform">
                               {act.icon}
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white mb-1 group-hover:text-primary transition-colors">{act.title}</h4>
                                  <span className="text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-500 border border-zinc-800">{act.minTime}m</span>
                               </div>
                               <p className="text-sm text-zinc-400 mb-2">{act.desc}</p>
                               <div className="flex items-center gap-2">
                                  <BrainCircuit size={12} className="text-primary"/>
                                  <p className="text-[10px] text-zinc-500 italic">"{act.science}"</p>
                               </div>
                            </div>
                            <div className="self-center">
                               <ArrowRight size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                         </div>
                      ))}
                      {filteredActivities.length === 0 && (
                         <p className="text-center text-zinc-500 italic py-4">Tidak ada aktivitas yang cocok. Coba kombinasi lain.</p>
                      )}

                   </div>
                   <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">Coba AI Micro-Learning!</h4>
                        <p className="text-[11px] text-indigo-300">Pahami konsep sulit apa saja dalam 2 menit.</p>
                      </div>
                      <button 
                        onClick={() => { onClose(); setView('micro-learning'); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                      >
                        Buka <ArrowRight size={14} />
                      </button>
                   </div>
                </div>

             )}
          </div>
       </div>
    </div>
  );
};
