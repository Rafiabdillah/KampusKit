import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GraduationCap, Brain, Sparkles, BookOpen, Clock, CheckCircle2, 
  ChevronRight, ArrowLeft, Play, Pause, RotateCcw, Award, Target, 
  Plus, Search, Filter, Trash2, Share2, CheckSquare, FileText, 
  HelpCircle, Compass, Zap, Flame, Lightbulb, BookMarked, Layers,
  ChevronDown, ExternalLink, RefreshCw, X, AlertCircle, Volume2,
  VolumeX, Waves, CloudRain, Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Curriculum, CurriculumChapter, CurriculumDomain, CurriculumDifficulty } from '../types/curriculum';
import { DEFAULT_CURRICULUMS } from '../data/defaultCurriculums';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';
import { useStore } from '../store/useStore';
import { playNotificationSound } from '../utils/sound';
import { playAmbientSoundscape, stopAmbientSoundscape, SoundscapeType } from '../utils/ambientAudio';
import { TRANSLATIONS } from '../utils/translations';
import { Task, TaskStatus, Priority, Note } from '../types';

interface CurriculumHubProps {
  onNavigateToView?: (view: any) => void;
  onAddTask?: (task: Partial<Task>) => void;
  onAddNote?: (note: Partial<Note>) => void;
}

export const CurriculumHub: React.FC<CurriculumHubProps> = ({ 
  onNavigateToView,
  onAddTask,
  onAddNote 
}) => {
  const gainXp = useStore(state => state.gainXp);
  const userProfile = useStore(state => state.userProfile);
  const language = useStore(state => state.language);
  const t = TRANSLATIONS[language];

  // Procedural Web Audio Ambient Soundscape
  const [ambientSound, setAmbientSound] = useState<SoundscapeType>('NONE');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.18);

  useEffect(() => {
    return () => {
      stopAmbientSoundscape();
    };
  }, []);

  const handleSelectSoundscape = (type: SoundscapeType) => {
    setAmbientSound(type);
    if (type === 'NONE') {
      stopAmbientSoundscape();
    } else {
      playAmbientSoundscape(type, ambientVolume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    if (ambientSound !== 'NONE') {
      playAmbientSoundscape(ambientSound, newVol);
    }
  };

  // Curriculums State
  const [curriculums, setCurriculums] = useState<Curriculum[]>(() => {
    const saved = StorageService.getItem<Curriculum[]>('custom_curriculums', []);
    if (!saved || saved.length === 0) {
      StorageService.setItem('custom_curriculums', DEFAULT_CURRICULUMS);
      return DEFAULT_CURRICULUMS;
    }
    // Merge any missing default curriculums
    const savedIds = new Set(saved.map(c => c.id));
    const merged = [...saved];
    for (const def of DEFAULT_CURRICULUMS) {
      if (!savedIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged;
  });

  // Active View Mode: 'LIST' or 'STUDY'
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<CurriculumDomain | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genDomain, setGenDomain] = useState<CurriculumDomain>('AKADEMIK');
  const [genDifficulty, setGenDifficulty] = useState<CurriculumDifficulty>('MENENGAH');
  const [genDurationWeeks, setGenDurationWeeks] = useState(3);
  const [genFocusGoal, setGenFocusGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Interactive Study Mode State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'POMODORO' | 'LONG_FOCUS' | 'SHORT_BREAK'>('POMODORO');
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save changes to storage
  const saveCurriculums = (updated: Curriculum[]) => {
    setCurriculums(updated);
    StorageService.setItem('custom_curriculums', updated);
  };

  // Find active curriculum
  const activeCurriculum = useMemo(() => {
    return curriculums.find(c => c.id === activeCurriculumId) || null;
  }, [curriculums, activeCurriculumId]);

  const activeChapter = useMemo(() => {
    if (!activeCurriculum || !activeCurriculum.chapters[activeChapterIndex]) return null;
    return activeCurriculum.chapters[activeChapterIndex];
  }, [activeCurriculum, activeChapterIndex]);

  // Pomodoro Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => {
              setIsTimerRunning(false);
              playNotificationSound('success');
              showToast('Waktu sesi fokus selesai! Luangkan 5 menit untuk istirahat sejenak.');
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const setTimerPreset = (minutes: number, mode: 'POMODORO' | 'LONG_FOCUS' | 'SHORT_BREAK') => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(minutes * 60);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculations for Academic vs Personal Balance
  const balanceStats = useMemo(() => {
    let academicCount = 0;
    let personalCount = 0;
    let completedChaptersCount = 0;
    let totalChaptersCount = 0;

    curriculums.forEach(c => {
      if (c.domain === 'AKADEMIK') academicCount++;
      if (c.domain === 'PRIBADI') personalCount++;
      if (c.domain === 'HYBRID') { academicCount += 0.5; personalCount += 0.5; }

      c.chapters.forEach(ch => {
        totalChaptersCount++;
        if (ch.isCompleted) completedChaptersCount++;
      });
    });

    const totalDomains = academicCount + personalCount || 1;
    const academicPct = Math.round((academicCount / totalDomains) * 100);
    const personalPct = Math.round((personalCount / totalDomains) * 100);

    return {
      academicPct,
      personalPct,
      completedChaptersCount,
      totalChaptersCount,
      totalCurriculums: curriculums.length,
      completionRate: totalChaptersCount ? Math.round((completedChaptersCount / totalChaptersCount) * 100) : 0
    };
  }, [curriculums]);

  // Filtered Curriculums
  const filteredCurriculums = useMemo(() => {
    return curriculums.filter(c => {
      if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
      if (statusFilter === 'IN_PROGRESS' && (c.progress === 0 || c.progress === 100)) return false;
      if (statusFilter === 'COMPLETED' && !c.isCompleted) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchCat = c.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [curriculums, selectedDomain, statusFilter, searchQuery]);

  // Handle Generate Curriculum
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const generated = await AIService.generateCurriculum({
        topic: genTopic.trim(),
        domain: genDomain,
        difficulty: genDifficulty,
        targetWeeks: genDurationWeeks,
        focusGoal: genFocusGoal.trim()
      });

      if (!generated || !generated.chapters || generated.chapters.length === 0) {
        throw new Error('Format kurikulum tidak valid. Silakan coba kembali.');
      }

      const updatedList = [generated, ...curriculums];
      saveCurriculums(updatedList);
      setIsGeneratorOpen(false);
      setGenTopic('');
      setGenFocusGoal('');
      showToast(`Kurikulum baru "${generated.title}" siap dipelajari!`);
      gainXp(30);

      // Open new curriculum immediately in study mode
      setActiveCurriculumId(generated.id);
      setActiveChapterIndex(0);
    } catch (err: any) {
      console.error('Error generating curriculum:', err);
      setGenError(err?.message || 'Gagal merancang kurikulum. Periksa koneksi internet atau gunakan topik lain.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Chapter Note Save
  const handleSaveChapterNote = (noteText: string) => {
    if (!activeCurriculumId || activeChapterIndex === null) return;

    const updated = curriculums.map(c => {
      if (c.id === activeCurriculumId) {
        const newChapters = [...c.chapters];
        newChapters[activeChapterIndex] = {
          ...newChapters[activeChapterIndex],
          userNote: noteText
        };
        return { ...c, chapters: newChapters, updatedAt: Date.now() };
      }
      return c;
    });

    saveCurriculums(updated);
  };

  // Handle Action Task Toggle
  const handleToggleActionTask = () => {
    if (!activeCurriculumId || !activeChapter) return;

    const updated = curriculums.map(c => {
      if (c.id === activeCurriculumId) {
        const newChapters = [...c.chapters];
        const currentTask = newChapters[activeChapterIndex].actionTask;
        newChapters[activeChapterIndex] = {
          ...newChapters[activeChapterIndex],
          actionTask: {
            ...currentTask,
            completed: !currentTask.completed
          }
        };
        return { ...c, chapters: newChapters, updatedAt: Date.now() };
      }
      return c;
    });

    saveCurriculums(updated);
    if (!activeChapter.actionTask.completed) {
      gainXp(15);
      playNotificationSound('success');
      showToast('Tantangan aksi nyata diselesaikan! (+15 XP)');
    }
  };

  // Handle Mark Chapter Completed
  const handleCompleteChapter = () => {
    if (!activeCurriculumId || !activeChapter) return;

    const updated = curriculums.map(c => {
      if (c.id === activeCurriculumId) {
        const newChapters = [...c.chapters];
        const isAlreadyDone = newChapters[activeChapterIndex].isCompleted;
        
        newChapters[activeChapterIndex] = {
          ...newChapters[activeChapterIndex],
          isCompleted: true,
          completedAt: Date.now()
        };

        const completedCount = newChapters.filter(ch => ch.isCompleted).length;
        const newProgress = Math.round((completedCount / newChapters.length) * 100);
        const isAllDone = completedCount === newChapters.length;

        if (!isAlreadyDone) {
          gainXp(50);
          playNotificationSound('success');
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
          showToast(`Bab "${activeChapter.title}" dikuasai! (+50 XP)`);
        }

        return {
          ...c,
          chapters: newChapters,
          progress: newProgress,
          isCompleted: isAllDone,
          updatedAt: Date.now()
        };
      }
      return c;
    });

    saveCurriculums(updated);
  };

  // Handle Quiz Selection
  const handleSelectQuizAnswer = (quizId: string, optionIndex: number) => {
    setSelectedQuizAnswers(prev => ({
      ...prev,
      [quizId]: optionIndex
    }));
  };

  // Send Chapter to Tasks
  const handleSendToTasks = () => {
    if (!activeChapter || !activeCurriculum) return;

    const newTask: Partial<Task> = {
      title: `[Belajar] ${activeChapter.title}`,
      subject: activeCurriculum.category || 'Kurikulum Mandiri',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      tags: [activeCurriculum.domain, 'Kurikulum', 'Belajar'],
      subtasks: [
        { id: `st-1`, title: 'Selesaikan bacaan & pahami mental model', completed: false },
        { id: `st-2`, title: `Praktikkan: ${activeChapter.actionTask.text}`, completed: false },
        { id: `st-3`, title: 'Kerjakan kuis active recall bab', completed: false }
      ]
    };

    if (onAddTask) {
      onAddTask(newTask);
      showToast('Bab berhasil ditambahkan ke modul Tugas & Proyek!');
    } else {
      // Fallback save to storage tasks directly
      const currentTasks = StorageService.getItem<Task[]>('tasks', []);
      const fullTask: Task = {
        id: `task-${Date.now()}`,
        createdAt: Date.now(),
        ...(newTask as any)
      };
      StorageService.setItem('tasks', [fullTask, ...currentTasks]);
      showToast('Bab berhasil disimpan ke modul Tugas!');
    }
  };

  // Export Chapter to Notes
  const handleExportToNotes = () => {
    if (!activeChapter || !activeCurriculum) return;

    const noteContent = `# ${activeCurriculum.title} - ${activeChapter.title}
Domain: ${activeCurriculum.domain} | Kategori: ${activeCurriculum.category}

## 🧠 Mental Model Inti
${activeChapter.mentalModel}

## 📚 Ringkasan Materi & Wawasan
${activeChapter.studyContent}

## ⚡ Tantangan Aksi Nyata
- [${activeChapter.actionTask.completed ? 'x' : ' '}] ${activeChapter.actionTask.text}

## 📝 Catatan Pemahaman Mandiri
${activeChapter.userNote || '(Belum ada catatan tambahan)'}

## 💡 Refleksi
${activeChapter.reflectionPrompt}
`;

    if (onAddNote) {
      onAddNote({
        title: `Rangkuman: ${activeChapter.title}`,
        content: noteContent,
        category: 'STUDY',
        tags: [activeCurriculum.domain, 'Kurikulum']
      });
      showToast('Rangkuman berhasil diekspor ke modul Catatan!');
    } else {
      const currentNotes = StorageService.getItem<Note[]>('notes', []);
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: `Rangkuman: ${activeChapter.title}`,
        content: noteContent,
        category: 'STUDY',
        tags: [activeCurriculum.domain, 'Kurikulum'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false
      };
      StorageService.setItem('notes', [newNote, ...currentNotes]);
      showToast('Rangkuman materi tersimpan di modul Catatan!');
    }
  };

  // Delete Curriculum
  const handleDeleteCurriculum = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus kurikulum ini? Anda dapat membuatnya kembali kapan saja.')) return;
    const updated = curriculums.filter(c => c.id !== id);
    saveCurriculums(updated);
    if (activeCurriculumId === id) {
      setActiveCurriculumId(null);
    }
    showToast('Kurikulum berhasil dihapus.');
  };

  // Format timer seconds (MM:SS)
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER: FULL STUDY MODE
  // ==========================================
  if (activeCurriculum && activeChapter) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 animate-in fade-in duration-200">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-zinc-900/95 border border-primary/40 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-semibold"
            >
              <Sparkles size={18} className="text-primary animate-pulse" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration Banner */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-none"
            >
              <div className="bg-zinc-900 border border-emerald-500/40 p-8 rounded-3xl text-center max-w-sm shadow-2xl space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                  <Award size={36} />
                </div>
                <h3 className="text-2xl font-bold text-white">Bab Berhasil Dikuasai!</h3>
                <p className="text-sm text-zinc-400">Kerja luar biasa! Anda mendapatkan <span className="text-emerald-400 font-bold">+50 XP</span> untuk level mahasiswa Anda.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Study Mode Top Nav */}
        <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setActiveCurriculumId(null)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all border border-zinc-800"
              title="Kembali ke Daftar Kurikulum"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                <span className={activeCurriculum.domain === 'AKADEMIK' ? 'text-blue-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {activeCurriculum.domain}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 truncate max-w-[200px] md:max-w-md">{activeCurriculum.title}</span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-white truncate">
                {language === 'en' ? 'Chapter' : 'Bab'} {activeChapter.chapterNumber}: {activeChapter.title}
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendToTasks}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-all hover:text-white"
              title="Kirim bab ini ke Tugas"
            >
              <CheckSquare size={14} className="text-primary" />
              <span>Jadikan Tugas</span>
            </button>
            <button
              onClick={handleExportToNotes}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-all hover:text-white"
              title="Ekspor materi bab ini ke Catatan"
            >
              <FileText size={14} className="text-amber-400" />
              <span>Ekspor Catatan</span>
            </button>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="w-full bg-zinc-800/40 h-1">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
            style={{ width: `${activeCurriculum.progress}%` }}
          />
        </div>

        {/* Study Canvas Layout */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Reading & Learning Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chapter Header Card */}
            <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
              
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Clock size={14} className="text-zinc-500" />
                  <span>{language === 'en' ? 'Est.' : 'Estimasi:'} {activeChapter.estimatedMinutes} {language === 'en' ? 'min' : 'Menit'}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-primary font-semibold">{activeChapter.studyMethod}</span>
                </div>

                {activeChapter.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={15} />
                    <span>{t.alreadyMastered}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteChapter}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>{t.markMastered}</span>
                  </button>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-snug">
                {activeChapter.title}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {activeChapter.summary}
              </p>
            </div>

            {/* Mental Model Callout */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 text-amber-100 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Brain size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-400">Kerangka Berpikir & Mental Model</h4>
                <p className="text-sm font-medium leading-relaxed text-zinc-200">
                  {activeChapter.mentalModel}
                </p>
              </div>
            </div>

            {/* Comprehensive Study Content */}
            <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                <BookOpen size={16} className="text-primary" />
                <span>Materi Inti Pembelajaran</span>
              </div>

              <div className="prose prose-invert max-w-none text-zinc-300 text-sm md:text-base leading-relaxed space-y-4">
                {activeChapter.studyContent.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg md:text-xl font-bold text-white pt-2">{paragraph.replace('### ', '')}</h3>;
                  }
                  if (paragraph.startsWith('#### ')) {
                    return <h4 key={idx} className="text-base font-bold text-zinc-100 pt-1">{paragraph.replace('#### ', '')}</h4>;
                  }
                  if (paragraph.startsWith('- ')) {
                    const items = paragraph.split('\n');
                    return (
                      <ul key={idx} className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
                        {items.map((it, i) => (
                          <li key={i} className="leading-relaxed">{it.replace(/^- /, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (paragraph.match(/^\d+\. /)) {
                    const items = paragraph.split('\n');
                    return (
                      <ol key={idx} className="list-decimal list-inside space-y-1 pl-2 text-zinc-300">
                        {items.map((it, i) => (
                          <li key={i} className="leading-relaxed">{it.replace(/^\d+\. /, '')}</li>
                        ))}
                      </ol>
                    );
                  }
                  return <p key={idx} className="text-zinc-300 leading-relaxed whitespace-pre-line">{paragraph}</p>;
                })}
              </div>
            </div>

            {/* Action Task Challenge Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-4">
              <button
                onClick={handleToggleActionTask}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  activeChapter.actionTask.completed 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                <CheckCircle2 size={20} />
              </button>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">Tantangan Tindakan Nyata (Action Task)</h4>
                  <span className="text-[10px] text-zinc-500">Klik centang jika sudah dilakukan</span>
                </div>
                <p className={`text-sm ${activeChapter.actionTask.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                  {activeChapter.actionTask.text}
                </p>
              </div>
            </div>

            {/* Interactive Active Recall Quiz */}
            {activeChapter.quiz && activeChapter.quiz.length > 0 && (
              <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <HelpCircle size={18} />
                    <span>Active Recall: Uji Pemahaman Mandiri</span>
                  </div>
                  <span className="text-xs text-zinc-400">{activeChapter.quiz.length} Soal Pemantik</span>
                </div>

                <div className="space-y-6">
                  {activeChapter.quiz.map((q, qIndex) => {
                    const selectedIdx = selectedQuizAnswers[q.id];
                    const isAnswered = selectedIdx !== undefined;
                    const isCorrect = selectedIdx === q.correctAnswerIndex;

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {qIndex + 1}
                          </span>
                          <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIndex) => {
                            let btnStyle = "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800";
                            
                            if (isAnswered) {
                              if (optIndex === q.correctAnswerIndex) {
                                btnStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold";
                              } else if (selectedIdx === optIndex) {
                                btnStyle = "bg-rose-500/20 text-rose-300 border-rose-500/50";
                              } else {
                                btnStyle = "bg-zinc-900/40 text-zinc-500 border-zinc-800/40";
                              }
                            }

                            return (
                              <button
                                key={optIndex}
                                disabled={isAnswered}
                                onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                                className={`text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2 ${btnStyle}`}
                              >
                                <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {isAnswered && (
                          <div className={`p-3 rounded-xl text-xs space-y-1 ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border border-rose-500/20 text-rose-200'}`}>
                            <div className="font-bold flex items-center gap-1.5">
                              {isCorrect ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
                              <span>{isCorrect ? 'Tepat Sekali!' : 'Belum Tepat'}</span>
                            </div>
                            <p className="text-zinc-300">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reflection & Student Note Sheet */}
            <div className="p-6 md:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Lightbulb size={16} />
                  <span>Jurnal Refleksi & Catatan Pemahaman Bab</span>
                </div>
                <span className="text-[11px] text-zinc-500">Auto-saved</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 italic">
                "{activeChapter.reflectionPrompt}"
              </div>

              <textarea
                value={activeChapter.userNote || ''}
                onChange={(e) => handleSaveChapterNote(e.target.value)}
                placeholder="Tuliskan intisari dengan kata-kata Anda sendiri (Teknik Feynman), poin kritis, atau pertanyaan yang ingin Anda diskusikan..."
                className="w-full h-32 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary/60 transition-all resize-y"
              />
            </div>

            {/* Navigation Between Chapters */}
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={activeChapterIndex === 0}
                onClick={() => setActiveChapterIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-300 text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2"
              >
                <span>← Bab Sebelumnya</span>
              </button>

              <button
                onClick={handleCompleteChapter}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                  activeChapter.isCompleted 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{activeChapter.isCompleted ? 'Dikuasai (Perbarui)' : 'Tandai Dikuasai (+50 XP)'}</span>
              </button>

              <button
                disabled={activeChapterIndex === activeCurriculum.chapters.length - 1}
                onClick={() => setActiveChapterIndex(prev => Math.min(activeCurriculum.chapters.length - 1, prev + 1))}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-300 text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2"
              >
                <span>Bab Berikutnya →</span>
              </button>
            </div>

          </div>

          {/* Right Sidebar: Chapter Navigator & Pomodoro (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Integrated Study Pomodoro Timer */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Flame size={16} className="text-orange-500" />
                  <span>Timer Belajar Fokus</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  {timerMode}
                </span>
              </div>

              {/* Timer Digits Display */}
              <div className="text-center py-4 bg-zinc-950/70 rounded-2xl border border-zinc-800/80">
                <div className="text-4xl md:text-5xl font-mono font-black text-white tracking-widest">
                  {formatTimer(timerSeconds)}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {isTimerRunning ? 'Sesi fokus aktif... Tetap konsentrasi' : 'Siap memulai sesi belajar'}
                </p>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                    isTimerRunning 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20' 
                      : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                  }`}
                >
                  {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isTimerRunning ? 'Jeda' : 'Mulai Fokus'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(timerMode === 'POMODORO' ? 25 * 60 : timerMode === 'LONG_FOCUS' ? 50 * 60 : 5 * 60);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-zinc-700"
                  title="Reset Timer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setTimerPreset(25, 'POMODORO')}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    timerMode === 'POMODORO' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  25 Menit
                </button>
                <button
                  onClick={() => setTimerPreset(50, 'LONG_FOCUS')}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    timerMode === 'LONG_FOCUS' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  50 Menit
                </button>
                <button
                  onClick={() => setTimerPreset(5, 'SHORT_BREAK')}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    timerMode === 'SHORT_BREAK' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Rehat 5m
                </button>
              </div>
            </div>

            {/* Ambient Procedural Focus Soundscape */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Waves size={16} />
                  <span>{t.soundscape}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  Offline Audio
                </span>
              </div>

              {/* Sound Selector Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSoundscape('NONE')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                    ambientSound === 'NONE'
                      ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <VolumeX size={14} className="text-zinc-500" />
                  <span>{t.ambientOff}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSoundscape('ALPHA_WAVES')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                    ambientSound === 'ALPHA_WAVES'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm font-bold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="432Hz Carrier + 10Hz Binaural Beats for Deep Flow State"
                >
                  <Waves size={14} className="text-cyan-400" />
                  <span>{t.ambientWaves}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSoundscape('RAIN')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                    ambientSound === 'RAIN'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm font-bold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Filtered Pink Noise Rain Generator"
                >
                  <CloudRain size={14} className="text-blue-400" />
                  <span>{t.ambientRain}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSoundscape('WHITE_NOISE')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                    ambientSound === 'WHITE_NOISE'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm font-bold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Smooth Gaussian Noise Masking"
                >
                  <Disc size={14} className="text-purple-400" />
                  <span>{t.ambientWhite}</span>
                </button>
              </div>

              {/* Volume Slider if audio is playing */}
              {ambientSound !== 'NONE' && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-3">
                  <Volume2 size={14} className="text-cyan-400 shrink-0" />
                  <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.02"
                    value={ambientVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 w-8 text-right tabular-nums">
                    {Math.round(ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Chapter Navigator Box */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Daftar Modul Bab</h4>
                <span className="text-xs font-bold text-primary">{activeCurriculum.progress}% Selesai</span>
              </div>

              <div className="space-y-2">
                {activeCurriculum.chapters.map((ch, idx) => {
                  const isCurrent = idx === activeChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-primary/10 border-primary/50 text-white shadow-md' 
                          : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          ch.isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : isCurrent ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {ch.isCompleted ? <CheckCircle2 size={14} /> : ch.chapterNumber}
                        </span>
                        <span className={`text-xs font-medium truncate ${isCurrent ? 'text-white font-bold' : ''}`}>
                          {ch.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {ch.estimatedMinutes}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learning Outcomes Checklist */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Target size={14} className="text-primary" />
                <span>Target Penguasaan Kurikulum</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {activeCurriculum.learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN CURRICULUM HUB (LIST & EXPLORE)
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-zinc-900/95 border border-primary/40 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-semibold"
          >
            <Sparkles size={18} className="text-primary animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-primary">
              <GraduationCap size={16} />
              <span>{language === 'en' ? 'Curriculum Engine & Deep Study Space' : 'Sistem Kurikulum & Mode Belajar Mandiri'}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {language === 'en' ? 'Master Anything You Choose,' : 'Belajar Apapun yang Anda Mau,'} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {language === 'en' ? 'Academic Mastery & Character Resilience.' : 'Kuasai Akademik & Karakter Pribadi.'}
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              Rancang kurikulum silabus berjenjang untuk mata kuliah sains/riset maupun pengembangan kepribadian, stoikisme, manajemen fokus, dan kepemimpinan. Belajar tanpa distraksi dengan mode interaktif dan reward XP.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              <span>Rancang Kurikulum Baru</span>
            </button>
          </div>
        </div>

        {/* Dual Pillar Balance Gauge */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-400 flex items-center gap-1.5">
                <GraduationCap size={14} />
                <span>Akademik ({balanceStats.academicPct}%)</span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span>Pribadi ({balanceStats.personalPct}%)</span>
                <Brain size={14} />
              </span>
            </div>
            {/* Split Bar */}
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-500 transition-all duration-700" 
                style={{ width: `${balanceStats.academicPct}%` }}
                title="Porsi Kurikulum Akademik"
              />
              <div 
                className="bg-emerald-500 transition-all duration-700" 
                style={{ width: `${balanceStats.personalPct}%` }}
                title="Porsi Kurikulum Pengembangan Pribadi"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Keseimbangan ideal mahasiswa: mengasah daya intelektual sekaligus ketangguhan emosi.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookMarked size={24} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {balanceStats.completedChaptersCount} / {balanceStats.totalChaptersCount}
              </div>
              <div className="text-xs text-zinc-400">Modul Bab Telah Dikuasai</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {balanceStats.completionRate}%
              </div>
              <div className="text-xs text-zinc-400">Rata-rata Tingkat Penguasaan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDomain('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedDomain === 'ALL'
                ? 'bg-zinc-100 text-zinc-900 shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Semua ({curriculums.length})
          </button>
          <button
            onClick={() => setSelectedDomain('AKADEMIK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedDomain === 'AKADEMIK'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800'
            }`}
          >
            <GraduationCap size={14} />
            <span>Akademik Kuliah</span>
          </button>
          <button
            onClick={() => setSelectedDomain('PRIBADI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedDomain === 'PRIBADI'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800'
            }`}
          >
            <Brain size={14} />
            <span>Pengembangan Pribadi</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kurikulum atau topik materi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>
      </div>

      {/* Curriculum Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCurriculums.map((curr) => {
          const isAcademic = curr.domain === 'AKADEMIK';
          const isPersonal = curr.domain === 'PRIBADI';

          return (
            <motion.div
              key={curr.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setActiveCurriculumId(curr.id);
                setActiveChapterIndex(curr.lastStudiedChapterIndex || 0);
              }}
              className="cursor-pointer group p-6 rounded-3xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header Tag - Zero-pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase">
                    <span className={isAcademic ? 'text-blue-400 font-semibold' : isPersonal ? 'text-emerald-400 font-semibold' : 'text-purple-400 font-semibold'}>
                      {curr.domain}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{curr.category}</span>
                  </div>

                  {curr.source === 'CUSTOM_AI' && (
                    <button
                      onClick={(e) => handleDeleteCurriculum(curr.id, e)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Hapus kurikulum kustom ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {curr.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-3 mt-1.5 leading-relaxed">
                    {curr.description}
                  </p>
                </div>

                {/* Metadata - Zero-pill with subtle separators */}
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="text-zinc-300 font-medium">{curr.difficulty}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{curr.targetDuration}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="tabular-nums">{curr.chapters.length} {language === 'en' ? 'Chapters' : 'Bab'}</span>
                </div>
              </div>

              {/* Progress & Start Button */}
              <div className="pt-6 mt-6 border-t border-zinc-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Progres Penguasaan</span>
                  <span className={curr.progress === 100 ? 'text-emerald-400 font-bold' : 'text-white'}>
                    {curr.progress}%
                  </span>
                </div>

                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      curr.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${curr.progress}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>{curr.progress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar Sekarang'}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCurriculums.length === 0 && (
        <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Compass size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">Tidak ada kurikulum yang cocok</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Gunakan tombol generator di atas untuk merancang kurikulum baru untuk topik apa pun yang ingin Anda pelajari.
          </p>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-lg"
          >
            Rancang Kurikulum Baru
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: UNIVERSAL CURRICULUM GENERATOR      */}
      {/* ========================================== */}
      <AnimatePresence>
        {isGeneratorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6"
            >
              <button
                onClick={() => !isGenerating && setIsGeneratorOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Sparkles size={14} />
                  <span>AI Curriculum Architect</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Rancang Kurikulum Mandiri</h3>
                <p className="text-xs text-zinc-400">
                  Ketikkan apapun yang ingin Anda pelajari. AI akan merancang silabus multi-bab dengan materi terstruktur, kuis, dan aksi nyata.
                </p>
              </div>

              {genError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Topic Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Apa yang Ingin Anda Pelajari? <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="Cth: Kalkulus Peubah Banyak, Stoikisme & Overthinking, Public Speaking, Machine Learning..."
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/60"
                  />
                </div>

                {/* Domain Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Fokus Pilar Kurikulum</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenDomain('AKADEMIK')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                        genDomain === 'AKADEMIK' 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md' 
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <GraduationCap size={18} className="mb-2 text-blue-400" />
                      <span>🎓 Akademik</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Materi Kuliah & Sains</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenDomain('PRIBADI')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                        genDomain === 'PRIBADI' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md' 
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <Brain size={18} className="mb-2 text-emerald-400" />
                      <span>🧠 Pribadi</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Karakter & Mental</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenDomain('HYBRID')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                        genDomain === 'HYBRID' 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md' 
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <Zap size={18} className="mb-2 text-purple-400" />
                      <span>⚡ Terpadu</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Kombinasi Keduanya</span>
                    </button>
                  </div>
                </div>

                {/* Difficulty & Duration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Tingkat Kesulitan</label>
                    <select
                      value={genDifficulty}
                      onChange={(e) => setGenDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary/60"
                    >
                      <option value="PEMULA">Pemula (Fondasi Awal)</option>
                      <option value="MENENGAH">Menengah (Aplikatif)</option>
                      <option value="MAHIR">Mahir (Studi Kasus Lanjut)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Target Durasi Belajar</label>
                    <select
                      value={genDurationWeeks}
                      onChange={(e) => setGenDurationWeeks(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary/60"
                    >
                      <option value={2}>2 Minggu (Intensif)</option>
                      <option value={3}>3 Minggu (Standar)</option>
                      <option value={4}>4 Minggu (Komprehensif)</option>
                      <option value={6}>6 Minggu (Mendalam)</option>
                    </select>
                  </div>
                </div>

                {/* Specific Focus Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Tujuan Khusus / Konteks Tambahan <span className="text-zinc-500 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={genFocusGoal}
                    onChange={(e) => setGenFocusGoal(e.target.value)}
                    placeholder="Cth: Persiapan ujian tengah semester, persiapan sidang skripsi, atau mengatasi kecemasan..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary/60"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isGenerating || !genTopic.trim()}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Sedang Merancang Silabus & Modul...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Rancang & Buka Kurikulum Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
