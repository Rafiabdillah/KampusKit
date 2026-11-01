
import React, { useState, useEffect } from 'react';
import { Compass, BookOpen, Clock, Brain, Target, ChevronDown, ChevronUp, Lightbulb, Zap, Layers, FileText, Play, ArrowRight, Save, CheckCircle2, RotateCcw, X, Grid, PenTool } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Note } from '../types';

interface GuideStep {
  instruction: string;
  placeholder: string;
  duration?: number; // seconds
  inputType: 'TEXTAREA' | 'CHECKLIST' | 'TIMER_ONLY' | 'QUADRANT';
}

interface Method {
  id: string;
  title: string;
  category: 'PEMAHAMAN' | 'HAFALAN' | 'FOKUS' | 'PRODUKTIVITAS' | 'MENCATAT';
  desc: string;
  steps: string[]; // Static display steps
  science: string;
  icon: React.ReactNode;
  interactiveSteps?: GuideStep[]; // For the guided session
}

const METHODS_DB: Method[] = [
  // --- KATEGORI: PEMAHAMAN ---
  {
    id: 'feynman',
    title: 'Teknik Feynman',
    category: 'PEMAHAMAN',
    desc: 'Cara tercepat memahami konsep sulit dengan menyederhanakannya.',
    steps: [
      'Pilih satu konsep.',
      'Jelaskan seolah mengajar anak 5 tahun.',
      'Identifikasi bagian yang macet.',
      'Pelajari ulang & sederhanakan.'
    ],
    science: 'Menjelaskan materi memaksa otak melakukan rekonstruksi informasi (Active Processing) dan menemukan celah pengetahuan.',
    icon: <Lightbulb className="text-yellow-400" />,
    interactiveSteps: [
      {
        instruction: "Langkah 1: Tuliskan JUDUL KONSEP yang ingin kamu pelajari saat ini.",
        placeholder: "Contoh: Hukum Permintaan & Penawaran...",
        inputType: 'TEXTAREA',
        duration: 60
      },
      {
        instruction: "Langkah 2: Jelaskan konsep tersebut di sini dengan bahasa YANG SANGAT SEDERHANA. Bayangkan kamu sedang mengajar adikmu yang masih SD. Jangan gunakan jargon rumit.",
        placeholder: "Mulai mengetik penjelasanmu...",
        inputType: 'TEXTAREA',
        duration: 300 // 5 mins
      },
      {
        instruction: "Langkah 3: Baca kembali penjelasanmu. Di bagian mana kamu merasa ragu atau macet? Buka bukumu, pelajari bagian itu, lalu tuliskan pemahaman barumu di sini.",
        placeholder: "Bagian yang saya perbaiki adalah...",
        inputType: 'TEXTAREA',
        duration: 180
      },
      {
        instruction: "Langkah 4: Sederhanakan lagi! Gunakan ANALOGI (perumpamaan) agar lebih mudah diingat.",
        placeholder: "Konsep ini mirip seperti...",
        inputType: 'TEXTAREA',
        duration: 120
      }
    ]
  },
  {
    id: 'mindmapping',
    title: 'Mind Mapping',
    category: 'PEMAHAMAN',
    desc: 'Memvisualisasikan hubungan antar ide/konsep secara non-linear.',
    steps: ['Tulis topik utama di tengah kertas kosong.', 'Tarik cabang untuk sub-topik besar.', 'Dari sub-topik, tarik cabang lebih kecil untuk detail.', 'Gunakan warna, gambar, atau simbol.'],
    science: 'Memanfaatkan pemrosesan spasial dan visual otak (Visual-Spatial Sketchpad). Mengubah data linear (teks) menjadi struktur hirarkis yang bermakna (meaningful learning).',
    icon: <Brain className="text-cyan-400" />
  },
  {
    id: 'sq3r',
    title: 'Metode SQ3R',
    category: 'PEMAHAMAN',
    desc: 'Cara membaca buku teks akademik agar paham mendalam.',
    steps: ['Survey', 'Question', 'Read', 'Recite', 'Review'],
    science: 'Membuat otak menjadi "pemburu informasi" yang aktif, bukan wadah pasif, meningkatkan retensi bacaan.',
    icon: <BookOpen className="text-green-400" />,
    interactiveSteps: [
      {
        instruction: "S - SURVEY: Baca judul, subjudul, dan kesimpulan bab secara cepat. Dapatkan gambaran besarnya.",
        placeholder: "Gambaran besar bab ini adalah...",
        inputType: 'TEXTAREA',
        duration: 120
      },
      {
        instruction: "Q - QUESTION: Ubah subjudul menjadi pertanyaan. (Misal: 'Hukum Newton' -> 'Apa itu Hukum Newton & kapan dipakainya?')",
        placeholder: "Pertanyaan saya: 1...",
        inputType: 'TEXTAREA',
        duration: 180
      },
      {
        instruction: "R - READ: Baca isi buku untuk MENJAWAB pertanyaan yang kamu buat tadi. Tulis jawabannya di sini.",
        placeholder: "Jawabannya adalah...",
        inputType: 'TEXTAREA',
        duration: 600
      },
      {
        instruction: "R - RECITE & REVIEW: Tutup buku, dan simpulkan dengan bahasamu sendiri.",
        placeholder: "Kesimpulannya...",
        inputType: 'TEXTAREA',
        duration: 300
      }
    ]
  },

  // --- KATEGORI: HAFALAN ---
  {
    id: 'blurting',
    title: 'Metode Blurting (Active Recall)',
    category: 'HAFALAN',
    desc: 'Ujian simulasi instan untuk melihat apa yang benar-benar kamu tahu.',
    steps: [
      'Baca topik sepintas.',
      'Tuliskan SEMUA yang diingat tanpa melihat.',
      'Cek catatan & tandai yang salah.',
    ],
    science: 'Bentuk ekstrem dari Active Recall yang secara visual menunjukkan "Bolong" dalam pengetahuanmu.',
    icon: <Brain className="text-pink-400" />,
    interactiveSteps: [
      {
        instruction: "Fase 1: PRE-STUDY. Baca materi/catatanmu selama 5 menit. Fokus pada poin-poin utama.",
        placeholder: "Fokus membaca... (Input dikunci)",
        inputType: 'TIMER_ONLY',
        duration: 300
      },
      {
        instruction: "Fase 2: BLURTING! Tuliskan SEMUA hal yang kamu ingat dari bacaan tadi. Jangan berhenti mengetik, jangan khawatir soal kerapian.",
        placeholder: "Muntahkan semua ingatanmu di sini...",
        inputType: 'TEXTAREA',
        duration: 300
      },
      {
        instruction: "Fase 3: REVIEW. Buka kembali catatan aslimu. Apa yang terlewat? Tuliskan poin-poin yang tadi kamu lupa di bawah ini.",
        placeholder: "Yang saya lupa adalah...",
        inputType: 'TEXTAREA',
        duration: 180
      }
    ]
  },
  {
    id: 'leitner',
    title: 'Sistem Leitner (Flashcards)',
    category: 'HAFALAN',
    desc: 'Algoritma manual untuk memprioritaskan kartu yang sulit.',
    steps: ['Siapkan 3 kotak.', 'Kotak 1: Tiap hari.', 'Kotak 2: Tiap 3 hari.', 'Kotak 3: Tiap minggu.', 'Salah? Kembali ke Kotak 1.'],
    science: 'Spaced Repetition System (SRS) mengoptimalkan interval review berdasarkan kurva lupa Ebbinghaus.',
    icon: <Layers className="text-indigo-400" />,
    // Leitner is handled by the Flashcard component, so no interactive steps here, purely informational/guided logic
  },

  // --- KATEGORI: MENCATAT ---
  {
    id: 'cornell',
    title: 'Cornell Note-Taking',
    category: 'MENCATAT',
    desc: 'Sistem mencatat legendaris untuk mereview materi kuliah dengan cepat.',
    steps: ['Bagi kertas jadi 3 area.', 'Kanan: Catatan Utama.', 'Kiri: Kata Kunci/Pertanyaan.', 'Bawah: Ringkasan.'],
    science: 'Memisahkan proses mencatat dan proses sintesis (meringkas), memudahkan review saat ujian.',
    icon: <FileText className="text-blue-400" />,
    interactiveSteps: [
      {
        instruction: "Area UTAMA (Kanan): Tuliskan poin-poin penting materi kuliah/buku saat ini. Jangan tulis kalimat lengkap, gunakan poin.",
        placeholder: "- Poin 1\n- Poin 2...",
        inputType: 'TEXTAREA',
        duration: 600
      },
      {
        instruction: "Area CUES (Kiri): Baca kembali catatanmu. Tuliskan kata kunci atau pertanyaan yang jawabannya ada di catatan tadi. Ini untuk tes diri nanti.",
        placeholder: "Apa definisi X? Mengapa Y terjadi?",
        inputType: 'TEXTAREA',
        duration: 180
      },
      {
        instruction: "Area SUMMARY (Bawah): Tuliskan ringkasan inti dari seluruh materi ini dalam 2-3 kalimat saja.",
        placeholder: "Kesimpulannya adalah...",
        inputType: 'TEXTAREA',
        duration: 120
      }
    ]
  },
  {
    id: 'zettelkasten',
    title: 'Zettelkasten (Slip-Box)',
    category: 'MENCATAT',
    desc: 'Metode mencatat untuk menghubungkan ide-ide seperti struktur jaringan otak.',
    steps: ['Buat Literature Notes (catatan sumber).', 'Buat Permanent Notes (ide/pemikiranmu sendiri).', 'Hubungkan catatan tersebut menggunakan tag/link.', 'Kumpulkan dan sintesis ide saat menyusun tugas/skripsi.'],
    science: 'Meniru cara kerja otak yang menyandikan memori melalui asosiasi dan koneksi jaringan, bukan penyimpanan terisolasi.',
    icon: <Grid className="text-teal-400" />
  },

  // --- KATEGORI: FOKUS ---
  {
    id: 'pomodoro',
    title: 'Teknik Pomodoro',
    category: 'FOKUS',
    desc: 'Manajemen waktu dengan membagi kerja menjadi interval fokus & istirahat pendek.',
    steps: ['Pilih 1 tugas fiks.', 'Set timer 25 menit (Fokus penuh tanpa HP).', 'Istirahat 5 menit setelah timer bunyi.', 'Setelah 4 siklus, istirahat panjang 15-30 menit.'],
    science: 'Mencegah kelelahan kognitif (cognitive burnout) yang diakibatkan fokus terlalu lama tanpa jeda membiarkan otak konsolidasi memori.',
    icon: <Clock className="text-red-400" />
  },

  // --- KATEGORI: PRODUKTIVITAS ---
  {
    id: 'eisenhower',
    title: 'Eisenhower Matrix',
    category: 'PRODUKTIVITAS',
    desc: 'Memisahkan tugas Penting vs Mendesak untuk prioritas.',
    steps: ['K1: Penting & Mendesak (Lakukan)', 'K2: Penting Tak Mendesak (Jadwalkan)', 'K3: Tak Penting Mendesak (Delegasi)', 'K4: Hapus'],
    science: 'Mencegah "Urgency Effect" di mana kita cenderung mengerjakan hal remeh yang mendesak daripada hal besar yang penting.',
    icon: <Grid className="text-purple-400" />,
    interactiveSteps: [
      {
        instruction: "Kuadran 1: PENTING & MENDESAK. Apa yang harus selesai hari ini juga atau ada konsekuensi fatal?",
        placeholder: "Contoh: Deadline tugas besok, Ujian lusa...",
        inputType: 'TEXTAREA',
        duration: 60
      },
      {
        instruction: "Kuadran 2: PENTING TAPI TIDAK MENDESAK. Apa yang membangun masa depanmu tapi tidak ada deadline dekat? (Fokus di sini!)",
        placeholder: "Contoh: Belajar TOEFL, Olahraga, Networking...",
        inputType: 'TEXTAREA',
        duration: 60
      },
      {
        instruction: "Kuadran 3: MENDESAK TAPI TIDAK PENTING. Apa gangguan yang bisa didelegasikan atau dikurangi?",
        placeholder: "Contoh: Balas chat grup, Rapat tidak jelas...",
        inputType: 'TEXTAREA',
        duration: 60
      }
    ]
  },
  {
    id: 'interleaving',
    title: 'Interleaving (Belajar Berselang)',
    category: 'PRODUKTIVITAS',
    desc: 'Mencampur beberapa topik berbeda dalam satu sesi belajar.',
    steps: ['Pilih 2-3 topik/mata kuliah.', 'Belajar Topik A (30 mnt), lalu Topik B (30 mnt), lalu Topik C (30 mnt).', 'Review perpindahan antar topik.', 'Jangan habiskan 3 jam hanya untuk 1 topik (Block Practice).'],
    science: 'Memaksa otak terus-menerus mengambil (retrieve) informasi berbeda, memperkuat transfer pembelajaran dan kemampuan bedakan jenis masalah.',
    icon: <Layers className="text-blue-400" />
  },
  {
    id: 'eat-frog',
    title: 'Eat The Frog',
    category: 'PRODUKTIVITAS',
    desc: 'Kerjakan yang tersulit duluan.',
    steps: ['Identifikasi tugas sulit', 'Kerjakan segera', 'Jangan tunda'],
    science: 'Willpower tertinggi ada di pagi hari. Menyelesaikan hal sulit di awal memberikan dopamin seharian.',
    icon: <Target className="text-green-600" />,
    interactiveSteps: [
      {
        instruction: "Identifikasi 'Katak' kamu. Apa satu tugas yang paling kamu hindari tapi paling penting hari ini?",
        placeholder: "Tugas yang paling malas kuberjalan adalah...",
        inputType: 'TEXTAREA',
        duration: 60
      },
      {
        instruction: "Micro-Step: Tuliskan satu langkah PERTAMA yang sangat kecil untuk memulai tugas itu (misal: 'Buka Laptop').",
        placeholder: "Langkah pertamaku...",
        inputType: 'TEXTAREA',
        duration: 60
      },
      {
        instruction: "ACTION: Lakukan langkah kecil itu sekarang juga selama 2 menit!",
        placeholder: "Sedang melakukan...",
        inputType: 'TIMER_ONLY',
        duration: 120
      }
    ]
  },
  {
    id: 'pareto',
    title: 'Prinsip Pareto (80/20)',
    category: 'PRODUKTIVITAS',
    desc: '80% hasil datang dari 20% usaha. Temukan 20% itu.',
    steps: ['List semua materi', 'Identifikasi 20% yang sering keluar ujian', 'Fokus belajar di sana'],
    science: 'Efisiensi. Tidak semua materi kuliah bobotnya sama. Fokus pada "Vital Few".',
    icon: <Zap className="text-orange-400" />
  }
];

export const StudyGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PEMAHAMAN' | 'HAFALAN' | 'FOKUS' | 'PRODUKTIVITAS' | 'MENCATAT'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Interactive Session State
  const [activeSession, setActiveSession] = useState<Method | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const filteredMethods = activeTab === 'ALL' 
    ? METHODS_DB 
    : METHODS_DB.filter(m => m.category === activeTab);

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  // --- SESSION LOGIC ---

  const startSession = (method: Method) => {
    if (!method.interactiveSteps) return;
    setActiveSession(method);
    setCurrentStepIndex(0);
    setInputs(new Array(method.interactiveSteps.length).fill(''));
    setTimer(method.interactiveSteps[0].duration || 0);
    setIsTimerRunning(true);
    setSessionComplete(false);
  };

  const handleInputChange = (val: string) => {
    const newInputs = [...inputs];
    newInputs[currentStepIndex] = val;
    setInputs(newInputs);
  };

  const nextStep = () => {
    if (!activeSession?.interactiveSteps) return;

    if (currentStepIndex < activeSession.interactiveSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setTimer(activeSession.interactiveSteps[nextIdx].duration || 0);
      setIsTimerRunning(true);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setIsTimerRunning(false);
    setSessionComplete(true);
  };

  const saveSessionToNotes = () => {
    if (!activeSession) return;
    
    // Format the content
    let content = `SESI BELAJAR: ${activeSession.title}\n`;
    content += `Tanggal: ${new Date().toLocaleDateString()}\n\n`;
    
    activeSession.interactiveSteps?.forEach((step, idx) => {
      if (step.inputType !== 'TIMER_ONLY') {
        const stepLabel = activeSession.id === 'cornell' && idx === 0 ? 'NOTES' : 
                          activeSession.id === 'cornell' && idx === 1 ? 'CUES' : 
                          activeSession.id === 'cornell' && idx === 2 ? 'SUMMARY' :
                          `Langkah ${idx + 1}`;
        content += `[${stepLabel}]\n${inputs[idx]}\n\n`;
      }
    });

    // Save using storage service
    const existingNotes = StorageService.getItem<Note[]>('notes', []);
    const newNote: Note = {
      id: StorageService.generateId(),
      title: `Hasil Belajar: ${activeSession.title}`,
      content: content,
      date: new Date().toLocaleString(),
      tags: ['StudySession', activeSession.category],
      folder: 'Hasil Belajar'
    };
    
    StorageService.setItem('notes', [newNote, ...existingNotes]);
    alert("Sesi berhasil disimpan ke menu Catatan!");
    setActiveSession(null);
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => setIsTimerRunning(false), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER INTERACTIVE SESSION OVERLAY ---
  if (activeSession && activeSession.interactiveSteps) {
    const currentStep = activeSession.interactiveSteps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / activeSession.interactiveSteps.length) * 100;

    return (
      <div className="fixed inset-0 bg-dark z-50 flex flex-col p-6 animate-fade-in overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800 rounded-lg text-primary">
               {activeSession.icon}
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">{activeSession.title}</h2>
               <p className="text-slate-400 text-sm">Langkah {currentStepIndex + 1} dari {activeSession.interactiveSteps.length}</p>
             </div>
          </div>
          <button onClick={() => setActiveSession(null)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full mb-8">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        {!sessionComplete ? (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
             {/* Timer */}
             <div className="flex justify-center mb-6">
                <div className={`text-4xl font-mono font-bold px-6 py-3 rounded-xl border-2 ${timer > 0 ? 'text-white border-slate-700 bg-slate-800' : 'text-red-400 border-red-500 bg-red-900/20 animate-pulse'}`}>
                   {formatTime(timer)}
                </div>
             </div>

             {/* Instruction */}
             <div className="bg-card border border-slate-700 p-6 rounded-2xl mb-6 shadow-xl">
                <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                   <Target size={20} /> Instruksi:
                </h3>
                <p className="text-white text-lg leading-relaxed">
                   {currentStep.instruction}
                </p>
             </div>

             {/* Input Area */}
             {currentStep.inputType === 'TEXTAREA' && (
               <textarea 
                 className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-white focus:border-primary focus:outline-none resize-none text-lg leading-relaxed mb-6"
                 placeholder={currentStep.placeholder}
                 value={inputs[currentStepIndex]}
                 onChange={(e) => handleInputChange(e.target.value)}
                 autoFocus
               />
             )}
             
             {currentStep.inputType === 'TIMER_ONLY' && (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-500 italic mb-6">
                   <Clock size={64} className="mb-4 opacity-20" />
                   <p>Fokus pada aktivitas fisik/membaca. Input dikunci.</p>
                </div>
             )}

             {/* Controls */}
             <div className="flex gap-4 mt-auto">
                <button 
                   onClick={() => setIsTimerRunning(!isTimerRunning)}
                   className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                >
                   {isTimerRunning ? 'Pause Timer' : 'Resume'}
                </button>
                <button 
                   onClick={nextStep}
                   className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                   Lanjut <ArrowRight size={20} />
                </button>
             </div>
          </div>
        ) : (
          // COMPLETION SCREEN
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
             <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
                <CheckCircle2 size={64} />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Sesi Selesai!</h2>
             <p className="text-slate-400 mb-8">
               Hebat! Kamu telah menyelesaikan sesi belajar menggunakan metode {activeSession.title}.
               Apa yang ingin kamu lakukan dengan hasil ketikanmu?
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => setActiveSession(null)}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> Buang & Keluar
                </button>
                <button 
                  onClick={saveSessionToNotes}
                  className="px-6 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  <Save size={20} /> Simpan ke Catatan
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Compass className="text-primary" size={32} /> 
          Panduan & Metode Belajar
        </h2>
        <p className="text-slate-400 max-w-2xl mt-2">
          Pilih metode dan aplikasi akan membimbingmu langkah demi langkah (Guided Session).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {['ALL', 'PEMAHAMAN', 'HAFALAN', 'MENCATAT', 'PRODUKTIVITAS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab 
              ? 'bg-primary text-white shadow-lg shadow-primary/25' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'Semua Metode' : tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMethods.map((method) => (
          <div 
            key={method.id}
            onClick={() => toggleExpand(method.id)}
            className={`bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${expandedId === method.id ? 'border-primary ring-1 ring-primary' : 'border-slate-700 hover:border-slate-500'}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{method.title}</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {method.category}
                    </span>
                  </div>
                </div>
                <div className="text-slate-500">
                  {expandedId === method.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </div>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {method.desc}
              </p>

              {method.interactiveSteps && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); startSession(method); }}
                   className="w-full py-3 bg-slate-800 hover:bg-primary hover:text-white text-primary border border-primary/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mb-2"
                 >
                   <Play size={16} /> Mulai Sesi Bimbingan
                 </button>
              )}

              {expandedId === method.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 animate-slide-in">
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <Target size={16} className="text-primary"/> Langkah Manual:
                  </h4>
                  <ul className="space-y-3 mb-6">
                    {method.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-300">
                        <span className="flex-shrink-0 w-5 h-5 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center text-xs font-bold border border-slate-700">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                    <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Brain size={12} /> The Science (Why it works)
                    </h5>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{method.science}"
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {!expandedId && (
              <div className="px-6 pb-4">
                 <p className="text-xs text-slate-500 font-medium hover:text-white text-center">Klik untuk detail & teori</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
