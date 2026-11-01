
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Task, Course, Note, TaskStatus, FlashcardDeck, Flashcard, Priority, UserProfile, Transaction } from '../types';
import { StorageService } from '../services/storage';
import { getAiHeaders } from '../services/apiClient';
import { audioService } from '../services/audio';
import { QUOTES_DB } from './Motivation';
import { 
  Bot, Send, BookOpen, Trash2, Zap, HelpCircle, GraduationCap, Gamepad2, 
  DollarSign, Calendar, CheckCircle2, Clock, MapPin, AlertCircle, Moon, 
  Utensils, Brain, Coffee, Dumbbell, Wallet, Calculator, Timer, MessageSquareText, 
  Sparkles, Award, FileText, CheckCheck, RotateCcw, AlertTriangle
} from 'lucide-react';
import { OfflineBrainService } from '../services/offlineBrain';
import { ChatPomodoroWidget } from './ChatPomodoroWidget';
import { ChatTemplateWidget } from './ChatTemplateWidget';
import { ChatQuizWidget } from './ChatQuizWidget';

// State internal untuk menangani percakapan multi-turn
type ChatMode = 'IDLE' | 'QUIZ_ACTIVE' | 'QUIZ_ANSWER_REVEAL';

// --- DATABASE PERCAKAPAN (THE STUDENT BRAIN) ---
const CONVERSATION_BRAIN = [
  // --- ACTIVITY INTENTS (NEW) ---
  {
    keywords: ['mau tidur', 'ingin tidur', 'ngantuk berat', 'tidur dulu'],
    responses: [
      "Oke, selamat tidur! 😴 Tips: Jangan main HP di kasur (blue light merusak melatonin). Pasang alarm sesuai siklus 90 menit (misal 6 jam atau 7.5 jam) biar bangun segar.",
      "Tidur adalah investasi otak. Matikan lampu, tarik napas panjang, dan lupakan deadline sejenak. Mimpi indah!",
      "Good night! 🌙 Ingat, begadang cuma bikin otak lemot besok. Tidur sekarang keputusan tepat."
    ]
  },
  {
    keywords: ['mau makan', 'ingin makan', 'cari makan', 'laper banget'],
    responses: [
      "Selamat makan! 🍽️ Kalau mau lanjut belajar, hindari karbohidrat berlebih (nasi gunung) biar nggak 'food coma' (ngantuk). Perbanyak protein.",
      "Makan yang enak ya! Jangan lupa minum air putih yang banyak. Otak butuh hidrasi.",
      "Bingung makan apa? Kalau akhir bulan, telur dadar + kecap adalah koentji. 🍳"
    ]
  },
  {
    keywords: ['mau belajar', 'ingin belajar', 'fokus belajar', 'nugas dulu'],
    responses: [
      "Gaspol! 🚀 Mode produktif ON. Coba teknik Pomodoro (25 menit fokus, 5 menit istirahat). Jauhkan HP dari jangkauan tangan.",
      "Siapkan air minum dan camilan sehat. Tulis 1 target spesifik yang mau diselesaikan sesi ini biar nggak bingung.",
      "Belajar cerdas, bukan keras. Pahami konsepnya, jangan cuma hafal mati. Gunakan Feynman Technique (coba jelaskan dengan bahasa sederhana). 🧠"
    ]
  },
  {
    keywords: ['mau main', 'ingin main', 'refreshing', 'nonton', 'game'],
    responses: [
      "Have fun! 🎮 Otak butuh istirahat (Diffuse Mode) untuk memproses informasi. Tapi pasang timer ya, jangan sampai lupa waktu.",
      "Nonton/Main boleh banget. Anggap itu reward setelah seharian berjuang. Nikmati waktumu!",
      "Gas mabar! Tapi kalau kalah jangan banting HP ya. Sayang uangnya. 😂"
    ]
  },
  {
    keywords: ['mau ngopi', 'minum kopi', 'ngantuk butuh kopi'],
    responses: [
      "Ngopi boleh, tapi ingat batas kafein harian (400mg). Jangan minum kopi di atas jam 2 siang kalau mau tidur nyenyak nanti malam. ☕",
      "Kopi + Power Nap (20 menit) = Coffee Nap. Efektif banget buat balikin energi!",
      "Nikmati kopinya! Semoga inspirasi mengalir deras."
    ]
  },

  // --- SAPAAN & PERSONALITAS ---
  {
    keywords: ['halo', 'hi', 'hai', 'pagi', 'siang', 'sore', 'malam', 'woi', 'ping'],
    responses: [
      "Halo! RafiBot siap menemani perjuangan akademikmu. 🫡",
      "Hai! Semangat kuliahnya hari ini. Jangan lupa senyum! 😊",
      "Hadir! Siap membantu. Mau cek jadwal, tambah tugas, atau butuh motivasi?",
      "Yo! Mode produktif: ON. Apa yang bisa saya bantu?"
    ]
  },
  {
    keywords: ['kamu siapa', 'bot apa', 'kenalan'],
    responses: [
      "Saya RafiBot, asisten pribadi AI Anda. Hemat kuota, kaya fitur, dan anti-ghosting. 😎",
      "Saya adalah manifestasi digital dari ambisimu untuk lulus tepat waktu.",
      "Teman virtual yang tidak akan menagih uang kas."
    ]
  },
  {
    keywords: ['makasih', 'thank', 'tengkyu', 'arigato', 'suwun'],
    responses: [
      "Sama-sama! Senang bisa jadi bagian dari kesuksesanmu. 🙏",
      "Anytime! Traktir saya dengan nilai A ya.",
      "Sama-sama. Jangan lupa istirahat juga kawan."
    ]
  },

  // --- AKADEMIK: SKRIPSI & TUGAS ---
  {
    keywords: ['skripsi', 'tesis', 'judul', 'sidang', 'revisi', 'dospem', 'dosen pembimbing'],
    responses: [
      "Skripsi yang baik adalah skripsi yang selesai. Tulis 1 kalimat sekarang, itu lebih baik daripada 0. 🎓",
      "Revisi itu tanda dosen peduli (katanya). Jangan baper, perbaiki saja sesuai catatan. Dosen pembimbing bukan musuhmu.",
      "Buntu judul? Coba amati masalah di sekitarmu, atau gabungkan dua variabel yang aneh. Review kembali jurnal-jurnal terbaru.",
      "Ingat: Sering-sering bimbingan walau progressnya sedikit, biar dosen ingat usahamu.",
      "Nangis karena skripsi boleh, nyerah jangan. Bayangkan wajah orang tua saat kamu pakai toga nanti."
    ]
  },
  {
    keywords: ['tugas', 'pr', 'deadline', 'kelompok', 'presentasi'],
    responses: [
      "Kerjakan tugas tersulit dulu (Eat The Frog) saat energimu masih penuh.",
      "Teman sekelompok menghilang? Catat namanya, laporkan kinerjanya di form penilaian sesama atau ngomong ke dosen. Jangan jadi tumbal. 📝",
      "Deadline adalah motivator terbaik. Tapi kalau bisa hindari The Power of Kepepet ya, detak jantungmu kasihan.",
      "Tugas presentasi? Ingat 3 aturan: font besar, sedikit text, dan latihan ngomong depan kaca (atau direkam) sebelum tampil."
    ]
  },
  {
    keywords: ['ujian', 'uts', 'uas', 'kuis', 'nilai', 'ipk', 'remedial'],
    responses: [
      "Jangan SKS (Sistem Kebut Semalam)! Itu cuma masuk short-term memory. Gunakan Flashcards dengan Spaced Repetition.",
      "Nilai C bukan kiamat, tapi sinyal untuk evaluasi strategi belajar. Mungkin metode belajarmu kurang cocok.",
      "IPK tinggi mengundang wawancara, tapi Skill & Attitude yang memberimu pekerjaan.",
      "Tenang saat ujian. Tarik napas 4 detik, tahan 7 detik, embuskan 8 detik. Panik menutup akses memori otak."
    ]
  },
  {
    keywords: ['magang', 'internship', 'cv', 'resume', 'organisasi'],
    responses: [
      "Organisasi itu penting, tapi magang / pengalaman kerja nyata lebih dilirik HRD. Jangan cuma jadi panitia konsumsi terus.",
      "Bikin CV? Gunakan format ATS. Hindari desain warna-warni berlebihan kalau ngelamar di perusahaan korporat. Fokus di angka/impact capaianmu.",
      "Magang adalah jalan ninja menuju networking. Kenalan sama mentor dan buktikan kinerjamu untuk direkomendasikan."
    ]
  },

  // --- KEHIDUPAN MAHASISWA: KEUANGAN & KOST ---
  {
    keywords: ['uang', 'duit', 'bokek', 'miskin', 'mahal', 'hemat', 'gajian', 'akhir bulan'],
    responses: [
      "Saatnya mode survival: Masak nasi sendiri, lauknya beli yang murah. 🍳",
      "Sudah catat pengeluaran hari ini? Cek fitur 'Keuangan' biar sadar diri kemana aja uangmu kabur.",
      "Mahasiswa kaya bukan yang banyak uang saku, tapi yang pintar atur cashflow. Coba rule 50/30/20.",
      "Tahan godaan kopi kekinian. Kopi sachet 2000-an rasanya juga enak kalau diminum pas lagi nugas."
    ]
  },
  {
    keywords: ['lapar', 'makan', 'laper', 'haus', 'minum'],
    responses: [
      "Otak butuh glukosa untuk mikir. Jangan pelit sama perut sendiri, nanti sakit malah lebih mahal biaya rs-nya.",
      "Bingung makan apa racik telur dadar plus sedikit sayur. Bergizi dan hemat.",
      "Minum air putih dulu. Kadang rasa lapar itu cuma tanda dehidrasi palsu."
    ]
  },

  // --- MENTAL HEALTH: STRESS & INSECURE ---
  {
    keywords: ['capek', 'lelah', 'pusing', 'burnout', 'muak', 'nyerah', 'overwhelmed'],
    responses: [
      "Istirahatlah. Dunia gak akan runtuh kalau kamu melepaskan kendali. Tidur 20 menit sekarang. 😴",
      "Wajar merasa lelah, ini tanda otakmu sedang berkembang. Lakukan brain dump: tulis semua beban pikiranmu di kertas sampai lega.",
      "Coba teknik pernapasan Box Breathing di menu Brain Gym. Sangat efektif untuk mereset nervous system-mu.",
      "Bagi tugasmu jadi bongkahan yang sangat kecil (micro-steps). Jangan mikir 'aku harus selesai skripsi', tapi pikir 'aku cuma perlu nulis 1 paragraf hari ini'."
    ]
  },
  {
    keywords: ['gagal', 'bodoh', 'bego', 'gak bisa', 'susah', 'tolol'],
    responses: [
      "Hey, stop negative self-talk! Otakmu mempercayai apa yang kamu ucapkan berulang-ulang.",
      "Bukan 'gak bisa', tapi 'belum bisa'. Otakmu punya neuroplastisitas (kemampuan berkembang) yang luar biasa.",
      "Setiap master dulunya adalah pemula yang bodoh tapi menolak untuk menyerah.",
      "Nilai ujian jelek itu cuma ngukur pemahamanmu minggu ini, bukan ngukur nilai masa depan hidupmu."
    ]
  },
  {
    keywords: ['insecure', 'iri', 'banding', 'kalah', 'fomo'],
    responses: [
      "Rumput orang lain lebih hijau karena di Instagram filternya lebih bagus. Jangan bandingkan chapter 1 mu dengan chapter 20 mereka.",
      "Setiap orang punya timeline (zona waktu) masing-masing. Obama pensiun di usia 55, Trump mulai jadi presiden di usia 70.",
      "FOMO (Fear Of Missing Out) itu wajar, tapi JOMO (Joy Of Missing Out) itu pilihan. Nikmati proses sendirimu.",
      "Coba puasa sosmed 24 jam. Kadang ngelihat story teman cuma bikin kita merasa tertinggal."
    ]
  },

  // --- SOSIAL & CINTA ---
  {
    keywords: ['pacar', 'jomblo', 'cinta', 'galau', 'putus', 'gebetan', 'sahabat', 'teman', 'toxic'],
    responses: [
      "Fokus up-value diri sendiri (skills, mental, spiritual) dulu, otomatis orang yang satu frekuensi akan mendekat. 😎",
      "Galau sekadarnya, nugas tetap berjalan. Menangis tidak akan meringankan deadline dari dosen.",
      "Berdamai dengan fakta bahwa beberapa pertemanan memang ada kadaluarsanya (outgrowing each other).",
      "Punya teman toxic yang parasit pas kerja kelompok? Belajar bilang TIDAK. Ketegasan adalah batas kedewasaan."
    ]
  },

  // --- RANDOM & FUN ---
  {
    keywords: ['bosan', 'gabut', 'hibur', 'lucu', 'joke'],
    responses: [
      "Kenapa anak IT kalau putus cinta sakit banget? Karena cintanya di-hardcode, nggak bisa di-undo. 🤣",
      "Tahu nggak, mahasiswa itu makhluk unik: kuat begadang nonton Netflix 5 jam, tapi ngantuk baca jurnal 5 menit.",
      "Dosen: 'Ada pertanyaan?' (Kelas hening bak kuburan). Dosen: 'Oke kita kuis.' (Panik Massal mode ON) 😱",
      "Gabut yang produktif: Buka 'Brain Gym' dan main Math Rush atau Schulte Table. Dijamin otak panas lagi."
    ]
  },
  {
    keywords: ['mager', 'malas', 'nanti', 'nunda', 'prokrastinasi'],
    responses: [
      "Coba Aturan 2 Menit: Lakukan hal terkecil dulu selama 2 menit (misal buka laptop dan baca 2 kalimat). Biasanya bakal keterusan.",
      "Prokrastinasi itu masalah emosi, bukan manajamen waktu. Kamu menunda karena takut merasa tidak nyaman/pusing. Hadapi!",
      "Nanti = Tidak akan pernah terjadi. Singkirkan HP mu ke ruangan lain sekarang juga."
    ]
  }
];

export const OfflineAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('IDLE');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  
  // State untuk Kuis
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Profile
    const profile = StorageService.getItem<UserProfile | null>('user_profile', null);
    setUserProfile(profile);

    const savedHistoryRaw = StorageService.getItem<any[]>('ai_chat_history', []);
    
    // Rehydrate dates
    const hydratedHistory: ChatMessage[] = savedHistoryRaw.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));

    if (hydratedHistory.length === 0) {
      const greeting = getTimeBasedGreeting();
      const name = profile?.name.split(' ')[0] || 'Mahasiswa';
      setMessages([{
        id: 'init-1',
        sender: 'BOT',
        text: `${greeting} ${name}! 👋\n\nSaya **RafiBot (KampusKit Offline AI Pro)**. Saya dibekali ensiklopedia multi-disiplin, kalkulator ilmiah, dan asisten mahasiswa yang beroperasi 100% tanpa internet.\n\nCoba perintah & alat cerdas berikut:\n\n💬 **Template & Etika Dosen / Karir:**\n👉 *"Chat dospem bimbingan"* | *"Izin sakit"* | *"Klarifikasi nilai"* | *"Template LinkedIn"* | *"Metode STAR interview"*\n\n📐 **Kalkulator Ilmiah & Multidisiplin:**\n👉 *"Hitung BMI TB 170 BB 65"* | *"Rumus slovin populasi 1500"* | *"Bunga majemuk modal 1jt bunga 10% 3 tahun"* | *"Konversi 30 C ke F"* | *"Diskon 25% dari 120rb"* | *"Konversi nilai 85"*\n\n📚 **Ensiklopedia Akademik & Riset:**\n👉 *"Struktur bab skripsi"* | *"Uji validitas & reliabilitas"* | *"Hierarki peraturan hukum"* | *"Kata baku skripsi"* | *"Penulisan gelar"* | *"Teknik Feynman"* | *"Hukum Newton"* | *"4 Pilar OOP"*\n\n⏱️ **Alat Produktif & Kuis:**\n👉 *"Pomodoro 25 menit"* | *"Kuis offline"* | *"Ingatkan tugas besok"* | *"Catat pengeluaran 25rb"*`,
        timestamp: new Date()
      }]);
    } else {
      setMessages(hydratedHistory);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const persistable = messages.filter(m => !m.isError && m.type !== 'ERROR');
      StorageService.setItem('ai_chat_history', persistable);
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const incrementTime = (time: string, minutesToAdd: number) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutesToAdd);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // --- LOGIC ENGINE ---

  const addMessage = (
    text: string, 
    sender: 'USER' | 'BOT', 
    type?: ChatMessage['type'], 
    data?: any, 
    isError?: boolean, 
    source?: 'gemini_cloud' | 'offline',
    retryQuery?: string
  ) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      sender,
      text,
      timestamp: new Date(),
      type,
      data,
      isError,
      source,
      retryQuery
    };
    setMessages(prev => [...prev, newMsg]);
    if (sender === 'BOT' && !isError) {
      audioService.playAmbientSuccess();
    }
  };

  const processQuery = async (query: string) => {
    setIsTyping(true);
    const lowerQuery = query.toLowerCase();
    
    // Simulate thinking delay
    const delay = Math.floor(Math.random() * 800) + 400;
    await new Promise(resolve => setTimeout(resolve, delay));

    // --- MODE: QUIZ FLASHCARD ---
    if (chatMode === 'QUIZ_ACTIVE' || chatMode === 'QUIZ_ANSWER_REVEAL') {
      handleQuizLogic(lowerQuery);
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.1: KALKULATOR CEPAT (OFFLINE MATH SOLVER) ---
    const mathRes = OfflineBrainService.evaluateMathExpression(query);
    if (mathRes) {
      addMessage(mathRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.2: RUMUS SLOVIN (UKURAN SAMPEL RISET) ---
    const slovinRes = OfflineBrainService.parseAndCalculateSlovin(query);
    if (slovinRes) {
      addMessage(slovinRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.2B: KALKULATOR BMI / IMT KESEHATAN ---
    const bmiRes = OfflineBrainService.calculateBMI(query);
    if (bmiRes) {
      addMessage(bmiRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.2C: BUNGA MAJEMUK & INVESTASI MAHASISWA ---
    const compoundRes = OfflineBrainService.calculateCompoundInterest(query);
    if (compoundRes) {
      addMessage(compoundRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.2D: KONVERSI SATUAN ILMIAH (SUHU, JARAK, BERAT, DATA) ---
    const unitRes = OfflineBrainService.convertUnits(query);
    if (unitRes) {
      addMessage(unitRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.2E: PERSENTASE & DISKON CEPAT ---
    const percentRes = OfflineBrainService.calculatePercentage(query);
    if (percentRes) {
      addMessage(percentRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.3: KONVERSI NILAI & PREDIKSI IPK ---
    const gradeRes = OfflineBrainService.evaluateGrade(query);
    if (gradeRes) {
      addMessage(gradeRes.response, 'BOT');
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.4: POMODORO FOCUS TIMER WIDGET ---
    if (lowerQuery.includes('pomodoro') || lowerQuery.includes('fokus belajar') || lowerQuery.includes('timer fokus') || lowerQuery.includes('mulai timer')) {
      let minutes = 25;
      const minMatch = query.match(/(\d+)\s*(?:menit|mnt|m)/i);
      if (minMatch) minutes = parseInt(minMatch[1], 10);
      addMessage(`⏱️ Sesi Pomodoro **${minutes} Menit** telah disiapkan. Klik tombol di bawah untuk mulai fokus!`, 'BOT', 'WIDGET_POMODORO', { minutes });
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.5: KUIS PINTAR OFFLINE (BUILT-IN QUIZ) ---
    if (lowerQuery.includes('kuis offline') || lowerQuery.includes('kuis tpa') || lowerQuery.includes('kuis akademik') || lowerQuery.includes('uji ilmu')) {
      const q = OfflineBrainService.getRandomQuiz();
      addMessage(`🧠 **Kuis Pengetahuan Offline:**`, 'BOT', 'WIDGET_QUIZ', q);
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.6: ENSIKLOPEDIA AKADEMIK & TEMPLATE DOSEN OFFLINE ---
    const knowledgeRes = OfflineBrainService.searchKnowledge(query);
    if (knowledgeRes) {
      if (knowledgeRes.type === 'TEMPLATE' && knowledgeRes.copyableText) {
        addMessage(knowledgeRes.response, 'BOT', 'WIDGET_TEMPLATE', {
          title: knowledgeRes.title,
          templateText: knowledgeRes.copyableText
        });
      } else {
        addMessage(knowledgeRes.response, 'BOT');
      }
      setIsTyping(false);
      return;
    }

    // --- FITUR 0.7: PENYELESAIAN TUGAS (TASK COMPLETION) ---
    if (lowerQuery.startsWith('selesaikan tugas') || lowerQuery.startsWith('tugas selesai') || lowerQuery.startsWith('coret tugas')) {
      const target = query.replace(/selesaikan tugas|tugas selesai|coret tugas/gi, '').trim().toLowerCase();
      if (target) {
        const tasks = StorageService.getItem<Task[]>('tasks', []);
        let foundTask: Task | null = null;
        const updatedTasks = tasks.map(t => {
          if (!foundTask && t.title.toLowerCase().includes(target) && t.status !== TaskStatus.DONE) {
            foundTask = t;
            return { ...t, status: TaskStatus.DONE };
          }
          return t;
        });
        if (foundTask) {
          StorageService.setItem('tasks', updatedTasks);
          addMessage(`🎉 Mantap! Tugas **"${(foundTask as Task).title}"** berhasil ditandai SELESAI. Istirahat sejenak kawan!`, 'BOT');
        } else {
          addMessage(`Tidak menemukan tugas pending dengan kata kunci "${target}". Coba sebutkan nama tugas lebih spesifik.`, 'BOT');
        }
        setIsTyping(false);
        return;
      }
    }

    // --- FITUR 1: MAGIC DECISION MAKER (PENGAMBIL KEPUTUSAN) ---
    // Format: "Pilihkan A atau B" atau "Makan bakso atau mie"
    if (lowerQuery.startsWith('pilih') || lowerQuery.includes(' atau ')) {
       const choices = query.replace('pilihkan', '').replace('pilih', '').split(/\s+atau\s+|\s+vs\s+/i).map(s => s.trim()).filter(s => s);
       if (choices.length > 1) {
          const decision = choices[Math.floor(Math.random() * choices.length)];
          const responses = [
             `Hmm, insting AI saya memilih: **${decision}**! 🤖`,
             `Setelah kalkulasi rumit... jawabannya adalah **${decision}**.`,
             `Gas pilih **${decision}** aja!`,
             `Kayaknya **${decision}** pilihan terbaik untukmu sekarang.`
          ];
          addMessage(responses[Math.floor(Math.random() * responses.length)], 'BOT');
          setIsTyping(false);
          return;
       }
    }

    // --- FITUR 2: NAVIGATION COMMANDS (JALAN PINTAS) ---
    if (lowerQuery.includes('buka') || lowerQuery.includes('pergi ke') || lowerQuery.includes('lihat')) {
       if (lowerQuery.includes('tugas')) {
          addMessage("Siap! Membuka halaman Tugas...", 'BOT', 'TEXT');
          addMessage("Klik menu 'Tugas' di sidebar ya! Saya siapkan datanya.", 'BOT', 'WIDGET_TASK', StorageService.getItem('tasks', []).slice(0,3)); 
          setIsTyping(false); return;
       }
       if (lowerQuery.includes('jadwal')) {
          addMessage("Membuka jadwal kuliah...", 'BOT', 'WIDGET_SCHEDULE', StorageService.getItem('courses', []).slice(0,3));
          setIsTyping(false); return;
       }
       if (lowerQuery.includes('flashcard') || lowerQuery.includes('kartu')) {
          addMessage("Silakan akses menu Flashcards untuk belajar.", 'BOT');
          setIsTyping(false); return;
       }
    }

    // --- FITUR 3: TASK MANAGEMENT (SMART PARSER) ---
    // Format: "Tambah tugas [Judul] [Waktu]"
    if (lowerQuery.startsWith('tambah tugas') || lowerQuery.startsWith('tugas baru') || lowerQuery.startsWith('ingatkan')) {
      // 1. Bersihkan command awal
      let content = query.replace(/tambah tugas|tugas baru|ingatkan/i, '').trim();
      
      // 2. Deteksi Waktu Relatif
      let deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 1); // Default besok jika tidak ada info

      if (content.toLowerCase().includes('hari ini')) {
         deadlineDate = new Date();
         content = content.replace(/hari ini/i, '').trim();
      } else if (content.toLowerCase().includes('besok')) {
         deadlineDate.setDate(new Date().getDate() + 1);
         content = content.replace(/besok/i, '').trim();
      } else if (content.toLowerCase().includes('lusa')) {
         deadlineDate.setDate(new Date().getDate() + 2);
         content = content.replace(/lusa/i, '').trim();
      }

      // 3. Simpan jika ada judul
      if (content) {
        const tasks = StorageService.getItem<Task[]>('tasks', []);
        const newTask: Task = {
          id: StorageService.generateId(),
          title: content, // Judul adalah sisa string setelah dihapus command & waktu
          subject: 'Umum',
          deadline: deadlineDate.toISOString().split('T')[0],
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          createdAt: Date.now()
        };
        StorageService.setItem('tasks', [...tasks, newTask]);
        addMessage(`✅ Siap! Tugas **"${content}"** dicatat.\n📅 Deadline: ${deadlineDate.toLocaleDateString('id-ID', {weekday: 'long', day:'numeric', month:'long'})}`, 'BOT', 'WIDGET_TASK', [newTask]);
      } else {
        addMessage("Tugas apa namanya? Coba: 'Ingatkan Makalah Ekonomi besok'", 'BOT');
      }
      setIsTyping(false); 
      return;
    }

    // --- FITUR 4: SCHEDULE MANAGEMENT (SMART PARSER) ---
    // Format: "Tambah jadwal [Nama] hari [Hari] jam [Jam] di [Ruang]"
    if (lowerQuery.startsWith('tambah jadwal') || lowerQuery.startsWith('jadwal baru') || lowerQuery.startsWith('kelas baru')) {
       // Regex untuk menangkap komponen jadwal
       const scheduleRegex = /jadwal\s+(.+?)\s+hari\s+(\w+)\s+jam\s+(\d{2}[:.]\d{2})(?:\s+di\s+(.+))?/i;
       const match = query.match(scheduleRegex);

       if (match) {
          const name = match[1].trim();
          const day = match[2].trim();
          const timeRaw = match[3].replace('.', ':');
          const room = match[4] ? match[4].trim() : 'Online'; 

          // Normalisasi Hari
          const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
          const normalizedDay = validDays.find(d => d.toLowerCase() === day.toLowerCase()) || 'Senin';

          const newCourse: Course = {
             id: StorageService.generateId(),
             name,
             day: normalizedDay,
             startTime: timeRaw,
             endTime: incrementTime(timeRaw, 120), // Default 2 jam
             room,
             lecturer: 'Dosen',
             credits: 3
          };

          const courses = StorageService.getItem<Course[]>('courses', []);
          StorageService.setItem('courses', [...courses, newCourse]);
          
          addMessage(`✅ Jadwal tersimpan!\n\n📚 **${name}**\n🗓 ${normalizedDay}, ${timeRaw}\n📍 ${room}`, 'BOT', 'WIDGET_SCHEDULE', [newCourse]);
       } else {
          addMessage("Format: `Tambah jadwal [Matkul] hari [Hari] jam [HH:MM] di [Ruang]`\n\nContoh: *Tambah jadwal Kalkulus hari Senin jam 08:00 di Lab 1*", 'BOT');
       }
       setIsTyping(false);
       return;
    }

    // --- FITUR 4.5: SMART BUDGET TRACKER (DENGAN PARSER NOMINAL CERDAS) ---
    if (lowerQuery.startsWith('pengeluaran') || lowerQuery.startsWith('beli') || lowerQuery.startsWith('bayar') || lowerQuery.startsWith('habis') || lowerQuery.includes('jajan')) {
        const parsed = OfflineBrainService.parseIndonesianMoney(query);
        if (parsed && parsed.amount > 0) {
            let title = parsed.cleanText.replace(/pengeluaran|beli|bayar|habis|jajan|buat|untuk|seharga|harga|sebesar|rp/gi, '').trim() || 'Pengeluaran';
            title = title.charAt(0).toUpperCase() + title.slice(1);

            const transactions = StorageService.getItem<Transaction[]>('transactions', []);
            const newTransaction: Transaction = {
                id: StorageService.generateId(),
                title: title,
                amount: parsed.amount,
                type: 'EXPENSE',
                date: new Date().toISOString().split('T')[0],
                category: 'Kebutuhan'
            };
            StorageService.setItem('transactions', [...transactions, newTransaction]);
            addMessage(`💸 Tercatat! Pengeluaran Rp ${parsed.amount.toLocaleString('id-ID')} untuk **${title}**.\nTetap kendalikan pengeluaran ya!`, 'BOT');
            setIsTyping(false); return;
        }
    }

    if (lowerQuery.includes('sisa saldo') || lowerQuery.includes('saldo') || lowerQuery.includes('uangku sisa') || lowerQuery.includes('uangku tinggal')) {
        const transactions = StorageService.getItem<Transaction[]>('transactions', []);
        const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
        const balance = income - expense;
        addMessage(`💰 **Sisa Saldomu saat ini:** Rp ${balance.toLocaleString('id-ID')}\n\nPemasukan: Rp ${income.toLocaleString('id-ID')}\nPengeluaran: Rp ${expense.toLocaleString('id-ID')}\n\n${balance < 50000 ? 'Waspada, saldo menipis! Hemat-hemat ya anak kost.' : 'Aman terkendali! Jangan lupa menabung.'}`, 'BOT');
        setIsTyping(false); return;
    }

    // --- FITUR 4.6: SPORTS / WORKOUT ---
    if (lowerQuery.includes('jadwal olahraga') || lowerQuery.includes('olahraga hari ini') || lowerQuery.includes('jadwal gym') || lowerQuery.includes('workout hari ini')) {
        const sessions = StorageService.getItem<any[]>('sport_sessions', []);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];
        const todaySession = sessions.find(s => s.day === today);
        
        if (todaySession) {
            const completed = todaySession.exercises.filter((e: any) => e.isCompleted).length;
            const total = todaySession.exercises.length;
            addMessage(`🏋️ **Jadwal Olahraga Hari Ini (${today}):**\n\n**${todaySession.title}** (${todaySession.durationMins} Menit)\nProgress: ${completed}/${total} gerakan selesai.\n\nSemangat nge-gym nya! 💪`, 'BOT');
        } else {
            addMessage(`Hari ini (**${today}**) sepertinya jadwal olahragamu kosong. \nBagus untuk rest day, atau mau lari sore sebentar? 🏃‍♂️`, 'BOT');
        }
        setIsTyping(false); return;
    }

    // --- FITUR 5: START QUIZ (SMART FLASHCARD / BUILT-IN OFFLINE QUIZ) ---
    if (lowerQuery.includes('kuis') || lowerQuery.includes('test') || lowerQuery.includes('uji')) {
      const decks = StorageService.getItem<FlashcardDeck[]>('flashcards', []);
      if (decks.length === 0) {
        const randomQ = OfflineBrainService.getRandomQuiz();
        addMessage(`Kamu belum membuat Flashcard di menu Flashcards. Jangan khawatir, kita mulai **Kuis Pengetahuan Offline Bawaan** yuk! 🚀\n\nKategori: **${randomQ.category}**`, 'BOT', 'WIDGET_QUIZ', randomQ);
      } else {
        // Auto-select deck if name matches, or pick random
        const targetDeck = decks.find(d => lowerQuery.includes(d.title.toLowerCase())) || decks[0];
        startQuiz(targetDeck);
      }
      setIsTyping(false); return;
    }

    // --- FITUR 6: DATA LOOKUP ---
    if (lowerQuery.includes('tugas pending') || lowerQuery.includes('tugas belum selesai')) {
      const tasks = StorageService.getItem<Task[]>('tasks', []);
      const pendingTasks = tasks.filter(t => t.status !== TaskStatus.DONE).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      
      if (pendingTasks.length > 0) {
        addMessage(`Kamu punya ${pendingTasks.length} tugas yang belum selesai. Jangan ditunda ya!`, 'BOT', 'WIDGET_TASK', pendingTasks.slice(0, 5));
      } else {
        addMessage(`Mantap! 🎉 Semua tugas sudah selesai. Waktunya istirahat atau main game.`, 'BOT');
      }
      setIsTyping(false); return;
    }

    if (lowerQuery.includes('jadwal') || lowerQuery.includes('kuliah')) {
      const courses = StorageService.getItem<Course[]>('courses', []);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      let targetDay = days[new Date().getDay()];
      let dayLabel = `Hari Ini (${targetDay})`;

      if (lowerQuery.includes('besok')) {
        const nextDayIdx = (new Date().getDay() + 1) % 7;
        targetDay = days[nextDayIdx];
        dayLabel = `Besok (${targetDay})`;
      } else if (lowerQuery.includes('lusa')) {
        const lusaIdx = (new Date().getDay() + 2) % 7;
        targetDay = days[lusaIdx];
        dayLabel = `Lusa (${targetDay})`;
      } else {
        for (const d of days) {
          if (lowerQuery.includes(d.toLowerCase())) {
            targetDay = d;
            dayLabel = `Hari ${targetDay}`;
            break;
          }
        }
      }

      const dayCourses = courses.filter(c => c.day.toLowerCase() === targetDay.toLowerCase()).sort((a,b) => a.startTime.localeCompare(b.startTime));
      
      if (dayCourses.length > 0) {
        addMessage(`Jadwal kuliah **${dayLabel}**:`, 'BOT', 'WIDGET_SCHEDULE', dayCourses);
      } else {
        addMessage(`Jadwal kuliah **${dayLabel}** kosong! Bebas tugas dan kuliah. 🎉`, 'BOT');
      }
      setIsTyping(false); return;
    }

    if (lowerQuery.includes('catatan') || lowerQuery.includes('cari')) {
       const notes = StorageService.getItem<Note[]>('notes', []);
       const keyword = lowerQuery.replace(/catatan|cari/g, '').trim();
       if(keyword) {
          const found = notes.filter(n => n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword));
          if(found.length > 0) addMessage(`Ketemu ${found.length} catatan:`, 'BOT', 'WIDGET_NOTE', found);
          else addMessage(`Gak nemu catatan tentang "${keyword}".`, 'BOT');
       } else {
          addMessage("Mau cari apa? Ketik 'Cari [Kata Kunci]'", 'BOT');
       }
       setIsTyping(false); return;
    }

    if (lowerQuery.includes('motivasi') || lowerQuery.includes('sedih') || lowerQuery.includes('semangat')) {
       const quote = QUOTES_DB[Math.floor(Math.random() * QUOTES_DB.length)];
       addMessage(`_"${quote.text}"_\n\n💡 **Insight:** ${quote.context}`, 'BOT');
       setIsTyping(false); return;
    }

    // --- FITUR 8: ACTIVITY SUGGESTER (INTERACTIVE) ---
    if (lowerQuery.includes('bingung') || lowerQuery.includes('saran kegiatan') || lowerQuery.includes('mau ngapain')) {
       addMessage("Kamu lagi mood ngapain nih? Pilih satu ya:", 'BOT', 'WIDGET_ACTIVITY_PICKER');
       setIsTyping(false); return;
    }

    // --- FITUR 7: CONVERSATIONAL BRAIN (FALLBACK TO GEMINI) ---
    let responseFound = false;
    for (const topic of CONVERSATION_BRAIN) {
      if (topic.keywords.some(k => lowerQuery.includes(k))) {
        const reply = topic.responses[Math.floor(Math.random() * topic.responses.length)];
        addMessage(reply, 'BOT');
        responseFound = true;
        break;
      }
    }

    if (!responseFound) {
       if (lowerQuery.includes('hapus') || lowerQuery.includes('reset')) {
          setMessages([]);
          addMessage("Memory wiped! ✨", 'BOT');
       } else {
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: getAiHeaders(),
              body: JSON.stringify({ 
                message: query, 
                history: messages.filter(m => !m.isError && m.type !== 'ERROR').slice(-5), 
                isDeepThinking 
              }),
            });
            
            if (res.ok) {
              const data = await res.json();
              addMessage(data.text, 'BOT', 'TEXT', undefined, false, data.source || 'gemini_cloud');
            } else {
              const errorData = await res.json().catch(() => ({}));
              const friendlyMsg = errorData.error || "Gagal menghubungi layanan AI";
              const is429 = res.status === 429 || errorData.code === 'QUOTA_EXCEEDED';
              addMessage(
                is429
                  ? `${friendlyMsg}\n\n*Kuota API sedang penuh. Klik tombol Coba Lagi di bawah setelah beberapa saat.*`
                  : `${friendlyMsg}. Fitur jadwal kuliah, tugas, dan kalkulator offline tetap berfungsi normal.`,
                'BOT',
                'ERROR',
                undefined,
                true,
                undefined,
                query
              );
            }
          } catch (e: any) {
            const friendlyMsg = e.message || "Koneksi ke server terputus";
            addMessage(
              `${friendlyMsg}. Periksa koneksi internet atau coba kembali.`,
              'BOT',
              'ERROR',
              undefined,
              true,
              undefined,
              query
            );
          }
       }
    }

    setIsTyping(false);
  };

  // --- QUIZ FUNCTIONS ---
  const startQuiz = (deck: FlashcardDeck) => {
    if (deck.cards.length === 0) {
        addMessage(`Deck **${deck.title}** kosong. Isi kartu dulu.`, 'BOT');
        return;
    }
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setActiveDeck(deck);
    setCurrentCardIndex(0);
    setChatMode('QUIZ_ACTIVE');
    addMessage(`🚀 **Mulai Kuis: ${deck.title}**\n${shuffled.length} Kartu. Siap?`, 'BOT');
    setTimeout(() => addMessage(`❓ **Q1:** ${shuffled[0].front}`, 'BOT'), 500);
  };

  const handleQuizLogic = (input: string) => {
    if (input.match(/stop|berhenti|keluar|bosan/)) {
        setChatMode('IDLE');
        setActiveDeck(null);
        addMessage("Kuis berhenti. Good job! 👍", 'BOT');
        return;
    }
    
    if (shuffledCards.length === 0) {
        setChatMode('IDLE');
        addMessage("Terjadi kesalahan: Kartu tidak ditemukan. Silakan mulai ulang kuis.", 'BOT');
        return;
    }

    const currentCard = shuffledCards[currentCardIndex];

    if (chatMode === 'QUIZ_ACTIVE') {
        addMessage(`🔓 **Jawaban:** ${currentCard.back}`, 'BOT');
        addMessage("Ingat gak? (Ketik 'Lanjut' atau pilih tombol)", 'BOT');
        setChatMode('QUIZ_ANSWER_REVEAL');
    } else {
        const nextIdx = currentCardIndex + 1;
        if (nextIdx < shuffledCards.length) {
            setCurrentCardIndex(nextIdx);
            setChatMode('QUIZ_ACTIVE');
            addMessage(`❓ **Q${nextIdx + 1}:** ${shuffledCards[nextIdx].front}`, 'BOT');
        } else {
            setChatMode('IDLE');
            setActiveDeck(null);
            addMessage("🎉 **Kuis Selesai!** Semua kartu sudah direview.", 'BOT');
        }
    }
  };

  // --- UI HANDLERS ---
  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    addMessage(text, 'USER');
    setInputText('');
    audioService.playAmbientClick();
    processQuery(text);
  };

  const handleSuggestion = (text: string) => {
      addMessage(text, 'USER');
      audioService.playAmbientClick();
      processQuery(text);
  };

  return (
    <div className="min-h-full w-full flex flex-col max-w-4xl mx-auto animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              RafiBot
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                typeof navigator !== 'undefined' && navigator.onLine
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${typeof navigator !== 'undefined' && navigator.onLine ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                {typeof navigator !== 'undefined' && navigator.onLine ? 'Gemini Cloud' : 'Mode Offline'}
              </span>
            </h2>
            <p className="text-zinc-400 text-xs">Asisten akademik multi-disiplin.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDeepThinking(!isDeepThinking)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isDeepThinking ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-zinc-800/50 border-white/10 text-zinc-400 hover:bg-zinc-700'}`}
            title="Gunakan AI Reasoning tinggi (Deep Think)"
          >
            <Brain size={14} /> Think
          </button>
          <button onClick={() => { 
            StorageService.setItem('ai_chat_history', []);
            const greeting = getTimeBasedGreeting();
            const name = userProfile?.name.split(' ')[0] || 'Mahasiswa';
            setMessages([{
              id: 'init-' + Date.now(),
              sender: 'BOT',
              text: `${greeting} ${name}! 👋\n\nRiwayat chat telah dibersihkan.\n\nSaya RafiBot (KampusKit AI). Perintah cepat yang bisa kamu coba:\n\n👉 "Ingatkan tugas Makalah Bisnis besok"\n👉 "Tambah jadwal Kalkulus hari Senin jam 08:00 di Lab"\n👉 "Pilihkan bakso atau mie ayam"\n👉 "Mulai Kuis"`,
              timestamp: new Date()
            }]);
            setChatMode('IDLE'); 
          }} className="text-zinc-500 hover:text-red-400 p-2" title="Reset Chat">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 pb-4 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start gap-3'}`}>
            {msg.sender === 'BOT' && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border ${
                msg.isError
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-gradient-to-br from-primary to-purple-600 border-white/10 text-white shadow-primary/20'
              }`}>
                {msg.isError ? <AlertTriangle size={16} /> : <Bot size={16} />}
              </div>
            )}
            
            {msg.isError ? (
              <div className="max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-tl-none space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Kendala Respons AI
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">{msg.text}</p>
                {msg.retryQuery && (
                  <button
                    onClick={() => {
                      if (msg.retryQuery) {
                        processQuery(msg.retryQuery);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-all active:scale-95"
                  >
                    <RotateCcw size={12} />
                    <span>Coba Lagi</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md ${
                msg.sender === 'USER' 
                ? 'bg-primary/90 text-white rounded-tr-none shadow-primary/20' 
                : 'bg-zinc-800/80 border border-white/10 text-zinc-100 rounded-tl-none'
              }`}>
                {msg.sender === 'BOT' && msg.source === 'gemini_cloud' && (
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                    <Sparkles size={10} />
                    <span>Gemini Cloud</span>
                  </div>
                )}
              <div className="leading-relaxed text-sm markdown-body">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className={msg.sender === 'USER' ? 'font-bold' : 'text-yellow-400 font-bold'} {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-2" {...props} />,
                    a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    code: ({node, inline, ...props}: any) => inline ? <code className="bg-black/30 px-1 py-0.5 rounded text-xs" {...props} /> : <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto text-xs my-2"><code {...props} /></pre>,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>

              {/* Widget Rendering */}
              {msg.type === 'WIDGET_SCHEDULE' && msg.data && (
                <div className="mt-3 space-y-2 animate-slide-up">
                  {msg.data.map((c: Course) => (
                    <div key={c.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                       <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg text-xs font-bold w-14 text-center">
                          {c.startTime}
                       </div>
                       <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="text-[10px] text-zinc-400 flex items-center gap-1"><MapPin size={10}/> {c.day} • {c.room}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              {msg.type === 'WIDGET_TASK' && msg.data && (
                <div className="mt-3 space-y-2 animate-slide-up">
                  {msg.data.map((t: Task) => (
                    <div key={t.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-white text-sm">{t.title}</p>
                          <p className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock size={10}/> Deadline: {t.deadline}</p>
                       </div>
                       <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded">Pending</span>
                    </div>
                  ))}
                </div>
              )}
              {msg.type === 'WIDGET_NOTE' && msg.data && (
                <div className="mt-3 space-y-2 animate-slide-up">
                  {msg.data.map((n: Note) => (
                    <div key={n.id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                       <p className="font-bold text-white text-sm flex items-center gap-2"><BookOpen size={12}/> {n.title}</p>
                       <p className="text-[10px] text-zinc-400 mt-1 italic">"{n.content.substring(0, 50)}..."</p>
                    </div>
                  ))}
                </div>
              )}
              {msg.type === 'WIDGET_ACTIVITY_PICKER' && (
                <div className="mt-3 grid grid-cols-2 gap-2 animate-slide-up">
                   <button onClick={() => handleSuggestion('Saya mau tidur, ada saran?')} className="bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 p-3 rounded-xl flex flex-col items-center gap-2 transition-all">
                      <Moon size={20} className="text-indigo-400"/>
                      <span className="text-xs font-bold text-indigo-200">Tidur</span>
                   </button>
                   <button onClick={() => handleSuggestion('Saya mau makan, kasih tips')} className="bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 p-3 rounded-xl flex flex-col items-center gap-2 transition-all">
                      <Utensils size={20} className="text-orange-400"/>
                      <span className="text-xs font-bold text-orange-200">Makan</span>
                   </button>
                   <button onClick={() => handleSuggestion('Saya mau belajar serius')} className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 p-3 rounded-xl flex flex-col items-center gap-2 transition-all">
                      <Brain size={20} className="text-blue-400"/>
                      <span className="text-xs font-bold text-blue-200">Belajar</span>
                   </button>
                   <button onClick={() => handleSuggestion('Saya mau main sebentar')} className="bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center gap-2 transition-all">
                      <Gamepad2 size={20} className="text-emerald-400"/>
                      <span className="text-xs font-bold text-emerald-200">Main</span>
                   </button>
                </div>
              )}
              {msg.type === 'WIDGET_TEMPLATE' && msg.data && (
                <ChatTemplateWidget
                  title={msg.data.title}
                  templateText={msg.data.templateText}
                />
              )}
              {msg.type === 'WIDGET_POMODORO' && msg.data && (
                <ChatPomodoroWidget
                  initialMinutes={msg.data.minutes || 25}
                />
              )}
              {msg.type === 'WIDGET_QUIZ' && msg.data && (
                <ChatQuizWidget
                  question={msg.data}
                  onNextQuestion={() => {
                    const nextQ = OfflineBrainService.getRandomQuiz();
                    addMessage(`🧠 **Kuis Pengetahuan Offline:**`, 'BOT', 'WIDGET_QUIZ', nextQ);
                  }}
                />
              )}

              <p className="text-[9px] opacity-50 mt-2 text-right">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-primary/20 border border-white/10">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-zinc-800/80 rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center w-fit border border-white/10">
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions / Suggestions */}
      <div className="flex gap-2 overflow-x-auto mt-3 pb-2 no-scrollbar px-1 min-h-[40px]">
         {chatMode === 'IDLE' ? (
           <>
             {/* Highlighted Offline Skills */}
             <SuggestionBtn icon={<MessageSquareText size={12} className="text-emerald-400"/>} text="Chat Dospem" onClick={() => handleSuggestion('Chat dospem bimbingan skripsi')} />
             <SuggestionBtn icon={<Calculator size={12} className="text-blue-400"/>} text="Hitung BMI" onClick={() => handleSuggestion('Hitung BMI TB 170 BB 65')} />
             <SuggestionBtn icon={<Calculator size={12} className="text-cyan-400"/>} text="Rumus Slovin" onClick={() => handleSuggestion('Hitung rumus slovin populasi 1200')} />
             <SuggestionBtn icon={<Sparkles size={12} className="text-amber-400"/>} text="Bunga Majemuk" onClick={() => handleSuggestion('Bunga majemuk modal 1jt bunga 10% 3 tahun')} />
             <SuggestionBtn icon={<Timer size={12} className="text-purple-400"/>} text="Fokus Pomodoro" onClick={() => handleSuggestion('Pomodoro 25 menit')} />
             <SuggestionBtn icon={<HelpCircle size={12} className="text-amber-400"/>} text="Kuis Offline" onClick={() => handleSuggestion('Kuis offline')} />
             <SuggestionBtn icon={<GraduationCap size={12} className="text-indigo-400"/>} text="Struktur Skripsi" onClick={() => handleSuggestion('Struktur bab skripsi kuantitatif')} />
             <SuggestionBtn icon={<Award size={12} className="text-emerald-400"/>} text="Hitung Nilai 85" onClick={() => handleSuggestion('Konversi nilai 85')} />
             <SuggestionBtn icon={<Brain size={12} className="text-pink-400"/>} text="Metode STAR" onClick={() => handleSuggestion('Metode STAR wawancara')} />
             <SuggestionBtn icon={<FileText size={12} className="text-yellow-400"/>} text="Kata Baku" onClick={() => handleSuggestion('Kata baku skripsi')} />
             <SuggestionBtn icon={<Brain size={12} className="text-pink-400"/>} text="Teknik Feynman" onClick={() => handleSuggestion('Teknik belajar feynman')} />
             <SuggestionBtn icon={<FileText size={12} className="text-cyan-400"/>} text="Format APA 7th" onClick={() => handleSuggestion('Format referensi APA 7th')} />
             <SuggestionBtn icon={<Calculator size={12} className="text-teal-400"/>} text="Konversi 30°C ke °F" onClick={() => handleSuggestion('30 c ke f')} />

             <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0"></div>

             {/* Activity Suggestions */}
             <SuggestionBtn icon={<Calendar size={12}/>} text="Jadwal Besok" onClick={() => handleSuggestion('Jadwal besok')} />
             <SuggestionBtn icon={<Zap size={12}/>} text="Tugas Pending" onClick={() => handleSuggestion('Tugas Pending')} />
             <SuggestionBtn icon={<Wallet size={12}/>} text="Cek Saldo" onClick={() => handleSuggestion('Sisa saldo')} />
             <SuggestionBtn icon={<DollarSign size={12}/>} text="Catat Beli 25k" onClick={() => handleSuggestion('Pengeluaran beli makan 25rb')} />
             <SuggestionBtn icon={<Dumbbell size={12}/>} text="Olahraga Hari Ini" onClick={() => handleSuggestion('Jadwal olahraga hari ini')} />
             <SuggestionBtn icon={<Moon size={12}/>} text="Mau Tidur" onClick={() => handleSuggestion('Saya mau tidur, ada saran?')} />
           </>
         ) : chatMode === 'QUIZ_ACTIVE' ? (
           <SuggestionBtn icon={<BookOpen size={12}/>} text="Lihat Jawaban" onClick={() => handleSuggestion('Lihat Jawaban')} primary />
         ) : (
           <>
             <SuggestionBtn text="😊 Mudah" onClick={() => handleSuggestion('Mudah')} />
             <SuggestionBtn text="😐 Sedang" onClick={() => handleSuggestion('Sedang')} />
             <SuggestionBtn text="😓 Sulit" onClick={() => handleSuggestion('Sulit')} />
             <SuggestionBtn text="🛑 Stop" onClick={() => handleSuggestion('Stop')} />
           </>
         )}
      </div>

      {/* Input Area */}
      <div className="mt-2 flex gap-2">
        <input 
          className="flex-1 bg-zinc-800/80 border border-white/10 text-white px-5 py-4 rounded-2xl focus:border-primary focus:outline-none transition-all shadow-xl placeholder:text-zinc-500"
          placeholder={chatMode === 'IDLE' ? "Tanya jadwal, atau 'Ingatkan tugas besok'..." : "Jawab kuis..."}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-primary hover:bg-primary/90 text-white p-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
};

const SuggestionBtn = ({ text, onClick, icon, primary }: { text: string, onClick: () => void, icon?: React.ReactNode, primary?: boolean }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all border ${
      primary 
      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' 
      : 'bg-zinc-800/50 border-white/10 text-zinc-300 hover:bg-zinc-700 hover:text-white'
    }`}
  >
    {icon} {text}
  </button>
);
