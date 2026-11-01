
import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry, MoodType } from '../types';
import { StorageService } from '../services/storage';
import { Smile, Frown, Meh, Sun, Moon, CloudRain, PenTool, Calendar, Book, ChevronRight, Brain, Heart, Zap, Target, Search, Filter, PieChart as PieChartIcon, X, Trash2, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- TEMPLATES DATABASE ---
const TEMPLATES = [
  {
    id: 'MORNING_PRIMING',
    title: 'Morning Priming',
    icon: <Sun size={20} className="text-yellow-400" />,
    science: 'Mengaktifkan Reticular Activating System (RAS) untuk fokus pada peluang & intensi positif.',
    prompts: [
      "Satu hal yang membuatku bersemangat hari ini adalah...",
      "Apa 'Big Win' (satu pencapaian utama) yang harus kuseesaikan hari ini?",
      "Afirmasi untuk diriku hari ini: 'Aku adalah tipe mahasiswa yang...'"
    ]
  },
  {
    id: 'ANXIETY_RESET',
    title: 'Anxiety Reset (CBT)',
    icon: <CloudRain size={20} className="text-blue-400" />,
    science: 'Cognitive Reframing (CBT): Memisahkan fakta dari asumsi untuk meredakan amigdala yang overaktif.',
    prompts: [
      "Apa yang sebenarnya aku cemaskan saat ini?",
      "Apakah ini FAKTA nyata atau hanya ASUMSI/Interpretasiku?",
      "Apa bukti nyata yang mendukung pikiran negatif ini? Apa bukti yang melawannya?",
      "Apa hal terburuk yang bisa terjadi? Dan bagaimana aku akan menanganinya jika itu terjadi?"
    ]
  },
  {
    id: 'META_LEARNING',
    title: 'Post-Study Reflection',
    icon: <Brain size={20} className="text-purple-400" />,
    science: 'Metakognisi (berpikir tentang berpikir) memperkuat jejak memori jangka panjang.',
    prompts: [
      "Konsep apa yang paling sulit kupahami hari ini dan mengapa?",
      "Strategi belajar apa yang paling efektif tadi?",
      "Jika aku harus mengajarkan materi tadi ke anak kecil, bagaimana aku menjelaskannya?"
    ]
  },
  {
    id: 'DOPAMINE_DETOX',
    title: 'Dopamine Detox',
    icon: <Target size={20} className="text-red-400" />,
    science: 'Regulasi Reseptor Dopamin: Mengembalikan sensitivitas otak terhadap kepuasan jangka panjang (delayed gratification).',
    prompts: [
      "Distraksi apa yang paling sering menyita waktuku hari ini?",
      "Apa perasaanku setelah scroll sosmed/main game terlalu lama tadi?",
      "Tindakan produktif apa yang sengaja kuhindari karena terasa berat?",
      "Bagaimana caraku menciptakan batasan (friction) untuk menekan godaan besok?"
    ]
  },
  {
    id: 'ANGER_MANAGEMENT',
    title: 'Anger / Frustration Log',
    icon: <Zap size={20} className="text-orange-400" />,
    science: 'Labeling Affect: Memberi nama pada emosi menurunkan aktivitas amigdala dan mengaktifkan prefrontal cortex.',
    prompts: [
      "Kejadian apa yang baru saja memicu kemarahanku?",
      "Kebutuhan atau ekspektasiku apa yang tidak terpenuhi oleh kejadian ini?",
      "Apakah respon kemarahanku proporsional dengan masalahnya?",
      "Respons sadar apa yang bisa kuberi sekarang selain marah-marah?"
    ]
  },
  {
    id: 'EVENING_REVIEW',
    title: 'Evening Gratitude',
    icon: <Moon size={20} className="text-indigo-400" />,
    science: 'Syukur meningkatkan level serotonin & dopamin alami, mempersiapkan otak untuk tidur nyenyak yang restoratif.',
    prompts: [
      "3 hal kecil yang aku syukuri secara spesifik hari ini:",
      "Satu tantangan sulit yang berhasil kulewati hari ini:",
      "Apa yang bisa aku perbaiki besok agar 1% lebih baik?"
    ]
  },
  {
    id: 'BRAIN_DUMP',
    title: 'Free Brain Dump',
    icon: <PenTool size={20} className="text-pink-400" />,
    science: 'Eksternalisasi Kognitif: Memindahkan pikiran yang berlarian ke atas kertas (atau layar) mengurangi beban kerja memori (working memory).',
    prompts: [
      "Tuliskan semua yang ada di pikiranmu saat ini tanpa filter, tanpa memikirkan struktur bahasa..."
    ]
  }
];

const MOODS: { type: MoodType; color: string; label: string }[] = [
  { type: 'HAPPY', color: '#4ade80', label: 'Senang' },
  { type: 'FOCUSED', color: '#facc15', label: 'Fokus' },
  { type: 'CALM', color: '#60a5fa', label: 'Tenang' },
  { type: 'TIRED', color: '#818cf8', label: 'Lelah' },
  { type: 'ANXIOUS', color: '#94a3b8', label: 'Cemas' },
  { type: 'SAD', color: '#3b82f6', label: 'Sedih' },
];

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<'LIST' | 'WRITE' | 'DETAIL'>('LIST');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [currentMood, setCurrentMood] = useState<MoodType>('CALM');
  const [content, setContent] = useState('');
  
  // Filtering & Reading
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState<MoodType | 'ALL'>('ALL');
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    setEntries(StorageService.getItem<JournalEntry[]>('journal_entries', []));
  }, []);

  const saveEntry = () => {
    if (!content.trim()) return;

    const newEntry: JournalEntry = {
      id: StorageService.generateId(),
      date: new Date().toISOString(),
      mood: currentMood,
      template: selectedTemplate.title,
      content: content
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    StorageService.setItem('journal_entries', updated);
    setView('LIST');
    setContent('');
  };

  const startWriting = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[4];
    setSelectedTemplate(tmpl);
    const promptText = tmpl.prompts.join('\n\n') + '\n\n';
    setContent(promptText);
    setView('WRITE');
  };

  const deleteEntry = (id: string) => {
    if(confirm('Hapus jurnal ini?')) {
      const updated = entries.filter(en => en.id !== id);
      setEntries(updated);
      StorageService.setItem('journal_entries', updated);
      if (readingEntry?.id === id) {
        setView('LIST');
        setReadingEntry(null);
      }
    }
  };

  const openEntry = (entry: JournalEntry) => {
    setReadingEntry(entry);
    setView('DETAIL');
  };

  const getMoodIcon = (mood: MoodType) => {
    switch(mood) {
      case 'HAPPY': return <Smile className="text-green-400" />;
      case 'CALM': return <Heart className="text-blue-400" />;
      case 'ANXIOUS': return <CloudRain className="text-slate-400" />;
      case 'SAD': return <Frown className="text-blue-600" />;
      case 'TIRED': return <Moon className="text-indigo-400" />;
      case 'FOCUSED': return <Zap className="text-yellow-400" />;
      default: return <Meh className="text-slate-400" />;
    }
  };

  // --- ANALYTICS DATA ---
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return MOODS.map(m => ({
      name: m.label,
      value: counts[m.type] || 0,
      color: m.color
    })).filter(d => d.value > 0);
  }, [entries]);

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.content.toLowerCase().includes(searchTerm.toLowerCase()) || e.template.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = filterMood === 'ALL' || e.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  // --- WRITE VIEW ---
  if (view === 'WRITE') {
    return (
      <div className="min-h-full w-full flex flex-col animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
           <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white font-medium flex items-center gap-2">
             <ArrowLeft size={18}/> Kembali
           </button>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {selectedTemplate.icon} {selectedTemplate.title}
           </h2>
        </div>

        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6 flex gap-3 items-start">
           <Brain size={24} className="text-primary mt-1 flex-shrink-0" />
           <div>
             <h4 className="text-primary font-bold text-sm mb-1">Neurosains & Psikologi:</h4>
             <p className="text-slate-300 text-sm">{selectedTemplate.science}</p>
           </div>
        </div>

        <div className="mb-6">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3">Bagaimana perasaanmu saat ini?</label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {MOODS.map(m => (
              <button
                key={m.type}
                onClick={() => setCurrentMood(m.type)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all min-w-[80px] ${currentMood === m.type ? 'bg-slate-700 border-primary scale-105 shadow-lg shadow-primary/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
              >
                <div className="transform scale-125">{getMoodIcon(m.type)}</div>
                <span className="text-[10px] font-bold text-slate-300">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-card border border-slate-700 rounded-xl p-6 flex flex-col shadow-xl">
          <textarea 
            className="flex-1 bg-transparent text-white resize-none focus:outline-none leading-relaxed text-lg placeholder:text-slate-600"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tulis refleksimu di sini..."
            autoFocus
          />
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-700">
             <span className="text-xs text-slate-500">{content.split(/\s+/).filter(w => w.length > 0).length} Kata</span>
             <button 
               onClick={saveEntry}
               className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
             >
               Simpan Jurnal
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DETAIL / READER VIEW ---
  if (view === 'DETAIL' && readingEntry) {
    return (
      <div className="min-h-full w-full flex flex-col animate-slide-up max-w-3xl mx-auto">
         <div className="flex items-center justify-between mb-6">
           <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white font-medium flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg transition-colors">
             <ArrowLeft size={18}/> Kembali ke Daftar
           </button>
           <button onClick={() => deleteEntry(readingEntry.id)} className="text-slate-500 hover:text-red-400 p-2 transition-colors" title="Hapus">
             <Trash2 size={20}/>
           </button>
         </div>

         <div className="bg-card border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
            {/* Background Texture */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <PenTool size={200} />
            </div>

            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <div className="bg-slate-800 p-3 rounded-2xl shadow-inner">
                     {getMoodIcon(readingEntry.mood)}
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-white mb-1">{readingEntry.template}</h2>
                     <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Calendar size={14} /> 
                        {new Date(readingEntry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                        {new Date(readingEntry.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>
               </div>

               <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-slate-200 text-lg leading-loose font-serif">
                     {readingEntry.content}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- LIST / DASHBOARD VIEW ---
  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <PenTool className="text-primary" size={32} /> NeuroJournal
          </h2>
          <p className="text-slate-400">Refleksi diri untuk regulasi emosi dan performa kognitif.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 min-h-0 flex-1">
        {/* Left Column: Stats & Create */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
           {/* Create New Card */}
           <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/30 p-6 rounded-2xl text-center">
              <h3 className="text-lg font-bold text-white mb-4">Mulai Menulis</h3>
               <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                 {TEMPLATES.filter(t => t.id !== 'BRAIN_DUMP').map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => startWriting(t.id)}
                      className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-primary/50 p-3 rounded-xl flex flex-col items-center gap-2 transition-all group"
                    >
                       <div className="text-slate-400 group-hover:scale-110 transition-transform">{t.icon}</div>
                       <span className="text-[10px] font-bold text-slate-300 text-center">{t.title}</span>
                    </button>
                 ))}
              </div>
              <button onClick={() => startWriting('BRAIN_DUMP')} className="w-full mt-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg transition-all">
                 + Free Write
              </button>
           </div>

           {/* Analytics Card */}
           {entries.length > 0 && (
             <div className="bg-card border border-slate-700 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <PieChartIcon size={16} /> Emosi Bulan Ini
                </h3>
                <div className="h-48 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={moodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {moodData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                         </Pie>
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                         />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-2xl font-bold text-white">{entries.length}</span>
                      <p className="text-[10px] text-slate-500">Entri</p>
                   </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                   {moodData.map(d => (
                      <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                         {d.name}
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Right Column: History List */}
        <div className="md:col-span-2 bg-card border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-xl">
           {/* Toolbar */}
           <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-3 bg-slate-800/30">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                 <input 
                   className="w-full bg-slate-900 border border-slate-600 text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none placeholder:text-slate-600"
                   placeholder="Cari kata kunci dalam jurnal..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                 <button 
                   onClick={() => setFilterMood('ALL')}
                   className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${filterMood === 'ALL' ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400'}`}
                 >
                   Semua
                 </button>
                 {MOODS.map(m => (
                    <button 
                      key={m.type}
                      onClick={() => setFilterMood(m.type)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1 ${filterMood === m.type ? 'bg-slate-700 text-white border-primary shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400'}`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></div>
                      {m.label}
                    </button>
                 ))}
              </div>
           </div>

           {/* List */}
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredEntries.length === 0 ? (
                 <div className="min-h-full w-full flex flex-col items-center justify-center text-slate-500 opacity-70">
                    <Book size={48} className="mb-4 text-slate-700"/>
                    <p>Tidak ada jurnal yang ditemukan.</p>
                 </div>
              ) : (
                 filteredEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      onClick={() => openEntry(entry)}
                      className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-primary/30 p-4 rounded-xl cursor-pointer transition-all group flex gap-4"
                    >
                       <div className="flex flex-col items-center gap-1 min-w-[50px]">
                          <span className="text-xl">{getMoodIcon(entry.mood)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(entry.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-white text-sm truncate pr-2 group-hover:text-primary transition-colors">{entry.template}</h4>
                             <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                             </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                             {entry.content}
                          </p>
                       </div>
                       
                       <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={18} className="text-slate-600"/>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
