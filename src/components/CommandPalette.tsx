import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, LayoutDashboard, Bot, BarChart2, CheckSquare, BookOpen, Clock, 
  Layers, CalendarDays, Calendar, UserCheck, GraduationCap, Library, Compass, 
  Quote, Repeat, Target, PenTool, Wallet, Moon, Utensils, Dumbbell, Briefcase, 
  Award, Users, BrainCircuit, Lightbulb, Map, Settings, User, Sparkles, Plus, ArrowRight, Zap, Brain, Radio, BookMarked
} from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: ViewState) => void;
}

interface CommandItem {
  id: string;
  viewId: ViewState;
  title: string;
  category: 'Workspace' | 'Akademik' | 'Wellness & Life' | 'Growth' | 'Command Center' | 'Sistem';
  keywords: string[];
  icon: React.ElementType;
  description?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Command Center
  { id: 'dashboard', viewId: 'dashboard', title: 'Dashboard Utama', category: 'Command Center', keywords: ['home', 'beranda', 'ringkasan', 'overview', 'fokus', 'jadwal hari ini'], icon: LayoutDashboard, description: 'Pusat komando dan alur aktivitas harian' },
  { id: 'location', viewId: 'location', title: 'GPS (Live Tracking & Pemantauan Keluarga/Teman)', category: 'Command Center', keywords: ['lokasi', 'tracking', 'lacak', 'gps', 'peta', 'dimana', 'posisi', 'live location', 'share location', 'pantau', 'orang tua', 'keluarga', 'teman', 'sahabat', 'pasangan', 'chat', 'pesan', 'sos', 'darurat', 'zona aman', 'geofence', 'latar belakang', 'background', 'izin background'], icon: Radio, description: 'Pantau posisi real-time, zona aman kampus, dan sinyal darurat dua arah untuk orang tua atau teman' },
  { id: 'ai-chat', viewId: 'ai-chat', title: 'AI Assistant (Offline & Online)', category: 'Command Center', keywords: ['ai', 'bot', 'tanya', 'gemini', 'chat', 'asisten', 'bantuan'], icon: Bot, description: 'Konsultasi tugas, materi kuliah, dan produktivitas' },
  { id: 'statistics', viewId: 'statistics', title: 'Statistik OS Mahasiswa', category: 'Command Center', keywords: ['stats', 'grafik', 'analisis', 'produktivitas', 'laporan', 'progress'], icon: BarChart2, description: 'Analisis jam belajar, tugas selesai, dan performa' },
  
  // Workspace
  { id: 'tasks', viewId: 'tasks', title: 'Tugas & Proyek (Task Manager)', category: 'Workspace', keywords: ['tugas', 'todo', 'deadline', 'pr', 'tugas kuliah', 'micro-learning', 'proyek'], icon: CheckSquare, description: 'Kelola tugas, deadline, dan micro-learning steps' },
  { id: 'planner', viewId: 'planner', title: 'Planner Harian (Daily Study Planner)', category: 'Workspace', keywords: ['planner', 'jadwal belajar', 'rencana harian', 'study block', 'blok belajar'], icon: CalendarDays, description: 'Rencana blok belajar cerdas terintegrasi jadwal & deadline' },
  { id: 'notes', viewId: 'notes', title: 'Catatan & Markdown (Notes)', category: 'Workspace', keywords: ['catatan', 'note', 'kuliah', 'tulisan', 'feynman', 'ringkasan', 'materi'], icon: BookOpen, description: 'Editor catatan pintar dengan tag dan folder' },
  { id: 'focus', viewId: 'focus', title: 'Focus Space & Pomodoro', category: 'Workspace', keywords: ['fokus', 'pomodoro', 'timer', 'belajar', 'deep work', 'konsentrasi', 'suara alam'], icon: Clock, description: 'Timer Pomodoro, ambient sound, dan deep work' },
  { id: 'flashcards', viewId: 'flashcards', title: 'Flashcards & Spaced Repetition', category: 'Workspace', keywords: ['kartu', 'flashcard', 'hafal', 'anki', 'recall', 'ujian', 'review'], icon: Layers, description: 'Metode hafalan aktif berulang (SM-2 Algorithm)' },
  
  // Akademik
  { id: 'course-hub', viewId: 'course-hub', title: 'Hub Mata Kuliah Terpadu', category: 'Akademik', keywords: ['matkul', 'poros', 'mata kuliah', 'course hub', 'ujian', 'uts', 'uas', 'nilai', 'catatan matkul'], icon: BookOpen, description: 'Satu poros untuk jadwal, tugas, catatan, flashcard, presensi & nilai per mata kuliah' },
  { id: 'calendar', viewId: 'calendar', title: 'Kalender Akademik & Agenda', category: 'Akademik', keywords: ['kalender', 'agenda', 'jadwal', 'kegiatan', 'event', 'bulan'], icon: CalendarDays, description: 'Tampilan kalender terintegrasi dengan tugas & event' },
  { id: 'schedule', viewId: 'schedule', title: 'Jadwal Kuliah', category: 'Akademik', keywords: ['jadwal', 'matkul', 'kuliah', 'kelas', 'ruangan', 'dosen', 'sks'], icon: Calendar, description: 'Jadwal mingguan, timeline harian, & scan jadwal' },
  { id: 'attendance', viewId: 'attendance', title: 'Presensi & Kehadiran Kuliah', category: 'Akademik', keywords: ['absen', 'presensi', 'kehadiran', 'bolos', 'jatah absen', 'kuliah'], icon: UserCheck, description: 'Pantau batas minimum kehadiran 75% per mata kuliah' },
  { id: 'curriculum', viewId: 'curriculum', title: 'Kurikulum & Mode Belajar Mandiri', category: 'Akademik', keywords: ['kurikulum', 'curriculum', 'belajar', 'mode belajar', 'study', 'study mode', 'mandiri', 'akademik', 'pribadi', 'stoikisme', 'riset', 'skripsi', 'algoritma', 'fokus', 'feynman', 'active recall'], icon: BookMarked, description: 'Rancang kurikulum silabus berjenjang dan mode belajar fokus untuk akademik dan karakter pribadi' },
  { id: 'micro-learning', viewId: 'micro-learning', title: 'Micro Learning & Kuis Cepat', category: 'Akademik', keywords: ['micro', 'belajar cepat', 'kuis', 'ringkasan materi', 'paham 2 menit', 'soal'], icon: Brain, description: 'Ringkasan konsep 2 menit, analogi sederhana, & kuis interaktif' },
  { id: 'grades', viewId: 'grades', title: 'Target IPK & Kalkulator Nilai', category: 'Akademik', keywords: ['ipk', 'ips', 'nilai', 'transkrip', 'kalkulator ipk', 'target', 'cumlaude'], icon: GraduationCap, description: 'Simulasi target IPK, bobot SKS, dan riwayat semester' },
  { id: 'library', viewId: 'library', title: 'Perpustakaan & Bahan Bacaan', category: 'Akademik', keywords: ['buku', 'perpus', 'library', 'pdf', 'ebook', 'referensi', 'materi'], icon: Library, description: 'Koleksi buku, e-book PDF lokal, dan artikel riset' },
  { id: 'study-guide', viewId: 'study-guide', title: 'Metode Belajar Efektif', category: 'Akademik', keywords: ['metode', 'feynman', 'leitner', 'sq3r', 'tips belajar', 'belajar'], icon: Compass, description: 'Panduan teknik belajar sains kognitif' },
  { id: 'citation', viewId: 'citation', title: 'Generator Sitasi & Referensi', category: 'Akademik', keywords: ['sitasi', 'dapus', 'daftar pustaka', 'apa', 'ieee', 'mla', 'skripsi', 'jurnal'], icon: Quote, description: 'Format APA, IEEE, MLA untuk karya ilmiah' },
  
  // Wellness & Life
  { id: 'habits', viewId: 'habits', title: 'Habits & Disiplin Harian', category: 'Wellness & Life', keywords: ['kebiasaan', 'habit', 'rutinitas', 'streak', 'disiplin', 'atomic habits'], icon: Repeat, description: 'Bangun kebiasaan positif dan lacak streak berturut-turut' },
  { id: 'goals', viewId: 'goals', title: 'Target Hidup & Milestone', category: 'Wellness & Life', keywords: ['target', 'goals', 'impian', 'resolusi', 'tujuan', 'rencana'], icon: Target, description: 'Rencana jangka pendek & panjang dengan micro-goals' },
  { id: 'journal', viewId: 'journal', title: 'Jurnal Refleksi & Mood', category: 'Wellness & Life', keywords: ['jurnal', 'diary', 'mood', 'refleksi', 'curhat', 'perasaan', 'mental health'], icon: PenTool, description: 'Pencatatan emosi, gratitude journal, & refleksi harian' },
  { id: 'budget', viewId: 'budget', title: 'Manajemen Keuangan Mahasiswa', category: 'Wellness & Life', keywords: ['uang', 'keuangan', 'budget', 'pengeluaran', 'pemasukan', 'dompet', 'hemat'], icon: Wallet, description: 'Pencatatan kas harian, kategori budget, & analitik' },
  { id: 'sleep', viewId: 'sleep', title: 'Pola Tidur & Kalkulator REM', category: 'Wellness & Life', keywords: ['tidur', 'sleep', 'rem', 'bangun', 'istirahat', 'alarm', 'sirkadian'], icon: Moon, description: 'Kalkulasi siklus tidur optimal 90 menit' },
  { id: 'meals', viewId: 'meals', title: 'Nutrisi & Menu Makan Hemat', category: 'Wellness & Life', keywords: ['makan', 'menu', 'nutrisi', 'diet', 'resep', 'kuliner', 'hemat'], icon: Utensils, description: 'Inspirasi menu makan bergizi ramah kantong mahasiswa' },
  { id: 'sports', viewId: 'sports', title: 'Olahraga & Rutinitas Fisik', category: 'Wellness & Life', keywords: ['olahraga', 'workout', 'lari', 'kebugaran', 'fitness'], icon: Dumbbell, description: 'Latihan fisik harian dan rutinitas kebugaran' },
  { id: 'gym', viewId: 'gym', title: 'Gym Tracker & Catatan Beban', category: 'Wellness & Life', keywords: ['gym', 'angkat beban', 'fitness', 'reps', 'sets', 'latihan gym'], icon: Dumbbell, description: 'Catat beban, repetisi, dan progres latihan gym' },
  
  // Growth
  { id: 'projects', viewId: 'projects', title: 'Portofolio & Freelance', category: 'Growth', keywords: ['proyek', 'freelance', 'portofolio', 'klien', 'penghasilan', 'karya'], icon: Briefcase, description: 'Kelola portofolio dan proyek sampingan mahasiswa' },
  { id: 'learning-path', viewId: 'learning-path', title: 'AI Learning Path Generator', category: 'Growth', keywords: ['learning path', 'kurikulum', 'belajar mandiri', 'roadmap', 'ai roadmap', 'silabus'], icon: Map, description: 'Peta jalan dan silabus kurikulum belajar kustom terstruktur' },
  { id: 'skills', viewId: 'skills', title: 'Skill Tree Roadmap', category: 'Growth', keywords: ['skill', 'pohon keahlian', 'roadmap', 'belajar coding', 'desain', 'bahasa'], icon: Award, description: 'Peta perkembangan skill teknis dan non-teknis' },
  { id: 'campus-life', viewId: 'campus-life', title: 'Organisasi & Kampus Life', category: 'Growth', keywords: ['organisasi', 'bem', 'hima', 'kepanitiaan', 'teman', 'networking'], icon: Users, description: 'Manajemen rapat, event kepanitiaan, & tim' },
  { id: 'brain-gym', viewId: 'brain-gym', title: 'Brain Gym & Schulte Table', category: 'Growth', keywords: ['game', 'game asah otak', 'schulte', 'fokus', 'kecepatan', 'latihan otak'], icon: BrainCircuit, description: 'Latihan konsentrasi visual dan neuroplastisitas' },
  { id: 'motivation', viewId: 'motivation', title: 'Pemberi Semangat & Quotes', category: 'Growth', keywords: ['motivasi', 'quotes', 'semangat', 'quote hari ini', 'inspirasi'], icon: Lightbulb, description: 'Kutipan inspiratif dan dorongan mental positif' },
  { id: 'compass', viewId: 'compass', title: 'Life Compass & Ikigai', category: 'Growth', keywords: ['ikigai', 'arah hidup', 'kompas', 'karir masa depan', 'passion'], icon: Map, description: 'Menemukan titik temu passion, misi, dan profesi' },
  { id: 'career', viewId: 'career', title: 'Persiapan Karir & Magang', category: 'Growth', keywords: ['karir', 'magang', 'internship', 'cv', 'interview', 'pekerjaan'], icon: Briefcase, description: 'Checklist persiapan resume, magang, dan simulasi interview' },
  { id: 'invoice', viewId: 'invoice', title: 'Generator Invoice Freelance', category: 'Growth', keywords: ['invoice', 'tagihan', 'freelance', 'klien', 'pdf', 'bayaran'], icon: Wallet, description: 'Buat surat tagihan invoice profesional untuk klien' },
  
  // Sistem
  { id: 'profile', viewId: 'profile', title: 'Profil, XP & Pencapaian', category: 'Sistem', keywords: ['profil', 'profile', 'akun', 'level', 'xp', 'pencapaian', 'achievements', 'lencana'], icon: User, description: 'Status mahasiswa, lencana prestasi, & sync cloud' },
  { id: 'settings', viewId: 'settings', title: 'Pengaturan Sistem & Izin Background', category: 'Sistem', keywords: ['pengaturan', 'settings', 'tema', 'warna', 'notifikasi', 'suara', 'backup', 'export', 'latar belakang', 'background', 'baterai', 'izin'], icon: Settings, description: 'Kustomisasi tema, suara notifikasi, izin latar belakang, dan cadangan data' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectView }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const cleanQuery = query.toLowerCase().trim();
    return COMMAND_ITEMS.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(cleanQuery);
      const matchCategory = item.category.toLowerCase().includes(cleanQuery);
      const matchKeywords = item.keywords.some(kw => kw.toLowerCase().includes(cleanQuery));
      const matchDesc = item.description?.toLowerCase().includes(cleanQuery);
      return matchTitle || matchCategory || matchKeywords || matchDesc;
    });
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelectView(filteredItems[selectedIndex].viewId);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const activeEl = document.getElementById(`cmd-item-${selectedIndex}`);
    if (activeEl && listRef.current) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -15 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh] z-10"
      >
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari fitur, tugas, jadwal, IPK, AI, atau modul..."
            className="flex-1 bg-transparent text-white text-base sm:text-lg font-medium placeholder-zinc-500 focus:outline-none min-w-0"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold px-3"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              <Sparkles size={32} className="mx-auto mb-3 opacity-30 text-primary" />
              <p className="text-sm font-semibold text-zinc-400">Tidak ada fitur yang cocok dengan &quot;{query}&quot;</p>
              <p className="text-xs text-zinc-600 mt-1">Coba kata kunci lain seperti &apos;tugas&apos;, &apos;ipk&apos;, &apos;jadwal&apos;, atau &apos;ai&apos;.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  id={`cmd-item-${idx}`}
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.viewId);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-primary/20 border border-primary/40 text-white shadow-lg shadow-primary/10' 
                      : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white/5 text-zinc-400'
                  }`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-white truncate">{item.title}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5 flex-shrink-0">
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description}</p>
                    )}
                  </div>

                  <ArrowRight size={16} className={`flex-shrink-0 transition-transform ${isSelected ? 'text-primary translate-x-0.5' : 'text-zinc-600'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 px-4 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-zinc-300">↑↓</kbd> Navigasi</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-zinc-300">↵</kbd> Buka</span>
            <span className="hidden sm:inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-zinc-300">ESC</kbd> Tutup</span>
          </div>
          <span className="text-zinc-500 font-medium">Kampus Kit V3.3 Command Center</span>
        </div>
      </motion.div>
    </div>
  );
};
