import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, Map, Compass, ChevronRight, CheckCircle2, 
  ChevronDown, List, Clock, User, Target, Download, Bookmark, 
  Trash2, Check, ArrowRight, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIService } from '../services/ai';
import { StorageService } from '../services/storage';

interface Module {
  title: string;
  description: string;
  duration: string;
  topics: string[];
  actionItems: string[];
}

interface LearningPath {
  id?: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  modules: Module[];
  createdAt?: number;
}

const POPULAR_SUGGESTIONS = [
  { topic: 'Fullstack Web Development (React, Node.js & PostgreSQL)', background: 'Paham dasar HTML/CSS, ingin siap kerja' },
  { topic: 'Data Science & Machine Learning dengan Python', background: 'Mahasiswa semester awal, baru tahu dasar Python' },
  { topic: 'UI/UX Design & Desain Sistem Figma', background: 'Pemula total di bidang desain' },
  { topic: 'Metodologi Penelitian & Penulisan Skripsi Ilmiah', background: 'Mahasiswa tingkat akhir sedang menyusun proposal' },
];

export const AILearningPath: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [background, setBackground] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [savedPaths, setSavedPaths] = useState<LearningPath[]>([]);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = StorageService.getItem<LearningPath[]>('saved_learning_paths', []);
    if (saved && saved.length > 0) {
      setSavedPaths(saved);
      // Load most recent path
      setLearningPath(saved[0]);
    }

    const actions = StorageService.getItem<Record<string, boolean>>('learning_path_actions', {});
    if (actions) {
      setCompletedActions(actions);
    }
  }, []);

  const savePathsToStorage = (paths: LearningPath[]) => {
    setSavedPaths(paths);
    StorageService.setItem('saved_learning_paths', paths);
  };

  const toggleActionItem = (actionText: string) => {
    const updated = {
      ...completedActions,
      [actionText]: !completedActions[actionText]
    };
    setCompletedActions(updated);
    StorageService.setItem('learning_path_actions', updated);
  };

  const downloadRoadmap = () => {
    if (!learningPath) return;
    
    let md = `# ${learningPath.title}\n\n`;
    md += `**Estimasi Waktu:** ${learningPath.estimatedWeeks} Minggu\n\n`;
    md += `${learningPath.description}\n\n`;
    md += `## Kurikulum Langkah-demi-Langkah\n\n`;
    
    learningPath.modules.forEach((mod, index) => {
      md += `### Modul ${index + 1}: ${mod.title} (${mod.duration})\n\n`;
      md += `${mod.description}\n\n`;
      md += `**Konsep Inti:**\n`;
      mod.topics.forEach(t => {
        md += `- ${t}\n`;
      });
      md += `\n**Misi Praktik:**\n`;
      mod.actionItems.forEach(a => {
        const isDone = completedActions[a];
        md += `- [${isDone ? 'x' : ' '}] ${a}\n`;
      });
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${learningPath.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-roadmap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setExpandedModule(0);

    try {
      const data = await AIService.generateLearningPath(topic, background);
      if (data) {
        const pathWithMeta: LearningPath = {
          ...data,
          id: `lp-${Date.now()}`,
          createdAt: Date.now()
        };
        setLearningPath(pathWithMeta);

        // Prepend to saved paths
        const updated = [pathWithMeta, ...savedPaths.filter(p => p.title !== pathWithMeta.title)];
        savePathsToStorage(updated);
      }
    } catch (error) {
      alert("Gagal memuat Learning Path. Silakan periksa koneksi atau coba topik lain.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePath = (id?: string) => {
    if (!id) return;
    const updated = savedPaths.filter(p => p.id !== id);
    savePathsToStorage(updated);
    if (learningPath?.id === id) {
      setLearningPath(updated[0] || null);
    }
  };

  // Calculate completion progress
  const allActionItems = learningPath?.modules.flatMap(m => m.actionItems) || [];
  const completedCount = allActionItems.filter(a => completedActions[a]).length;
  const progressPercent = allActionItems.length > 0 
    ? Math.round((completedCount / allActionItems.length) * 100) 
    : 0;

  return (
    <div className="min-h-full w-full max-w-5xl mx-auto p-4 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30 shadow-sm">
            <Map size={26} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              AI Learning Path
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                Kurikulum Mandiri
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Peta jalan terstruktur langkah demi langkah dari nol hingga mahir dengan silabus & misi praktik.
            </p>
          </div>
        </div>

        {learningPath && (
          <button 
            onClick={downloadRoadmap}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95 border border-white/5 self-start sm:self-auto"
            title="Download kurikulum sebagai file Markdown"
          >
            <Download size={15} /> Unduh Silabus (.md)
          </button>
        )}
      </div>

      {/* Saved Learning Paths Drawer/Bar */}
      {savedPaths.length > 0 && (
        <div className="mb-6 bg-zinc-900/60 border border-white/5 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <History size={13} /> Peta Jalan Tersimpan ({savedPaths.length})
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {savedPaths.map((p) => {
              const isSelected = learningPath?.id === p.id || learningPath?.title === p.title;
              return (
                <div
                  key={p.id || p.title}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      setLearningPath(p);
                      setExpandedModule(0);
                    }}
                    className="truncate max-w-[200px]"
                  >
                    {p.title}
                  </button>
                  <button
                    onClick={() => handleDeletePath(p.id)}
                    className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors"
                    title="Hapus peta jalan ini"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 mb-8 shadow-lg bg-zinc-900/60">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Target size={14} className="text-indigo-400" />
              Keahlian / Topik yang Ingin Dikuasai
            </label>
            <input 
              type="text"
              placeholder="Contoh: Flutter Mobile App, Analisis Data Python, atau UI/UX..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User size={14} className="text-purple-400" />
              Latar Belakang / Pengetahuan Saat Ini (Opsional)
            </label>
            <input 
              type="text"
              placeholder="Contoh: Pemula total, atau sudah paham dasar pemrograman..."
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Popular Suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <span className="text-xs text-zinc-500 font-semibold mr-1">Rekomendasi:</span>
          {POPULAR_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTopic(s.topic);
                setBackground(s.background);
              }}
              className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-lg transition-colors border border-white/5 truncate max-w-xs"
            >
              {s.topic.split('(')[0]}
            </button>
          ))}
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.99] text-sm"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Merancang Kurikulum & Silabus Belajar...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate AI Learning Path</span>
            </>
          )}
        </button>
      </div>

      {/* Roadmap Output */}
      <AnimatePresence mode="wait">
        {learningPath && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Overview Card */}
            <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-indigo-950/20 via-zinc-900/50 to-purple-950/20 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Rencana Belajar Mandiri
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{learningPath.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-2 rounded-2xl">
                    <Clock size={16} className="text-purple-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimasi</span>
                      <span className="text-sm font-black text-white font-mono">{learningPath.estimatedWeeks} Minggu</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-2 rounded-2xl">
                    <List size={16} className="text-indigo-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Kurikulum</span>
                      <span className="text-sm font-black text-white font-mono">{learningPath.modules.length} Modul</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {learningPath.description}
              </p>

              {/* Progress Bar of Practice Missions */}
              {allActionItems.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-zinc-400 font-semibold">Progres Misi Praktik:</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {completedCount} dari {allActionItems.length} Misi Selesai ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modules Timeline */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass size={18} className="text-indigo-400" /> Tahapan & Modul Belajar
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-transparent before:hidden md:before:block">
                {learningPath.modules.map((mod, index) => {
                  const isExpanded = expandedModule === index;

                  return (
                    <div key={index} className="relative md:pl-14">
                      {/* Timeline Dot (Desktop) */}
                      <div className="hidden md:flex absolute left-4 top-5 -translate-x-1/2 w-4 h-4 rounded-full bg-zinc-900 border-2 border-indigo-500 items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      
                      {/* Module Card */}
                      <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/50 hover:border-purple-500/30 transition-colors">
                        {/* Card Header (Clickable) */}
                        <button 
                          onClick={() => setExpandedModule(isExpanded ? null : index)}
                          className="w-full flex items-center justify-between p-5 text-left bg-black/20 hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1 block">
                              Modul {index + 1} • {mod.duration}
                            </span>
                            <h4 className="text-base sm:text-lg font-bold text-white">{mod.title}</h4>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          />
                        </button>

                        {/* Card Body */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 border-t border-white/5 mt-4 space-y-6">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                  {mod.description}
                                </p>
                                
                                <div className="grid md:grid-cols-2 gap-5">
                                  {/* Topics to Learn */}
                                  <div className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5">
                                    <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                      <Brain size={14} /> Konsep Inti
                                    </h5>
                                    <ul className="space-y-2">
                                      {mod.topics.map((t, i) => (
                                        <li key={i} className="flex gap-2 text-xs sm:text-sm text-slate-300">
                                          <ChevronRight size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                                          <span className="leading-relaxed">{t}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Action Items with Interactive Checkboxes */}
                                  <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
                                    <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                      <CheckCircle2 size={14} /> Misi Praktik (Klik untuk centang)
                                    </h5>
                                    <ul className="space-y-2">
                                      {mod.actionItems.map((a, i) => {
                                        const isChecked = !!completedActions[a];
                                        return (
                                          <li 
                                            key={i} 
                                            onClick={() => toggleActionItem(a)}
                                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 cursor-pointer group select-none"
                                          >
                                            <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                                              isChecked 
                                                ? 'bg-purple-500 border-purple-500 text-white' 
                                                : 'border-white/20 group-hover:border-purple-400 bg-black/30'
                                            }`}>
                                              {isChecked && <Check size={11} strokeWidth={3} />}
                                            </div>
                                            <span className={`leading-relaxed transition-all ${
                                              isChecked ? 'line-through text-slate-500' : 'text-slate-200'
                                            }`}>
                                              {a}
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
