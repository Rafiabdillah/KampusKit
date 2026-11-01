import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, CheckSquare, Sparkles, Plus, Trash2, CheckCircle2, 
  Circle, Play, ChevronLeft, ChevronRight, BookOpen, Layers, AlertCircle,
  RotateCcw, Sliders, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StudyBlock, 
  PlannerSettings, 
  Course, 
  Task, 
  CalendarEvent, 
  Exam, 
  ViewState, 
  FlashcardDeck 
} from '../types';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { generatePlan } from '../services/planner';
import { 
  formatLocalDate, 
  addDays, 
  parseTimeToMinutes, 
  DAYS_ID 
} from '../utils/dateUtils';
import { NotificationService } from '../services/notifications';

interface DailyPlannerProps {
  onNavigateToView?: (view: ViewState) => void;
  onLaunchFocus?: (params: { courseId?: string; taskId?: string }) => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ 
  onNavigateToView,
  onLaunchFocus 
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  
  const [settings, setSettings] = useState<PlannerSettings>(() => {
    return StorageService.getItem<PlannerSettings>(STORAGE_KEYS.PLANNER_SETTINGS, {
      dailyStudyTargetMinutes: 120,
      preferredStudyHours: { start: '18:00', end: '22:00' },
      breakIntervalMinutes: 10,
      updatedAt: Date.now()
    });
  });

  const [activeDateIndex, setActiveDateIndex] = useState(0); // 0 = today, 1 = tomorrow, up to 6
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Manual block form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCourseId, setManualCourseId] = useState('');
  const [manualStartTime, setManualStartTime] = useState('19:00');
  const [manualEndTime, setManualEndTime] = useState('20:00');
  const [manualType, setManualType] = useState<StudyBlock['type']>('TASK');

  const today = useMemo(() => new Date(), []);
  const activeDate = useMemo(() => addDays(today, activeDateIndex), [today, activeDateIndex]);
  const activeDateStr = useMemo(() => formatLocalDate(activeDate), [activeDate]);

  // Load data from storage
  const loadData = () => {
    setCourses(StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []));
    setTasks(StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []));
    setCalendarEvents(StorageService.getItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, []));
    setExams(StorageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, []));
    setBlocks(StorageService.getItem<StudyBlock[]>(STORAGE_KEYS.STUDY_PLAN_BLOCKS, []));
    setFlashcardDecks(StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kampuskit_sync_complete', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kampuskit_sync_complete', handleStorage);
    };
  }, []);

  const saveBlocks = (newBlocks: StudyBlock[]) => {
    setBlocks(newBlocks);
    StorageService.setItem(STORAGE_KEYS.STUDY_PLAN_BLOCKS, newBlocks);
    window.dispatchEvent(new Event('storage'));
  };

  const saveSettings = (newSettings: PlannerSettings) => {
    setSettings(newSettings);
    StorageService.setItem(STORAGE_KEYS.PLANNER_SETTINGS, newSettings);
    window.dispatchEvent(new Event('storage'));
  };

  // Due flashcards count
  const dueFlashcardsCount = useMemo(() => {
    const now = Date.now();
    return flashcardDecks.reduce((sum, d) => {
      const dueInDeck = (d.cards || []).filter(c => c.nextReview <= now).length;
      return sum + dueInDeck;
    }, 0);
  }, [flashcardDecks]);

  // Filter blocks for active day
  const activeDayBlocks = useMemo(() => {
    return blocks.filter(b => b.date === activeDateStr);
  }, [blocks, activeDateStr]);

  // Today study time progress
  const plannedMinutes = useMemo(() => {
    return activeDayBlocks.reduce((sum, b) => {
      const start = parseTimeToMinutes(b.startTime);
      const end = parseTimeToMinutes(b.endTime);
      return sum + Math.max(0, end - start);
    }, 0);
  }, [activeDayBlocks]);

  const completedMinutes = useMemo(() => {
    return activeDayBlocks
      .filter(b => b.completed)
      .reduce((sum, b) => {
        const start = parseTimeToMinutes(b.startTime);
        const end = parseTimeToMinutes(b.endTime);
        return sum + Math.max(0, end - start);
      }, 0);
  }, [activeDayBlocks]);

  // Generate / Regenerate Plan
  const handleRegeneratePlan = () => {
    const newPlan = generatePlan({
      now: today,
      courses,
      tasks,
      calendarEvents,
      exams,
      existingBlocks: blocks,
      settings,
      dueFlashcardsCount,
      daysToPlan: 7
    });

    saveBlocks(newPlan);

    // Schedule 10-minute prior notifications for today's blocks
    try {
      const todayBlocks = newPlan.filter(b => b.date === formatLocalDate(today));
      for (const b of todayBlocks) {
        const [h, m] = b.startTime.split(':').map(Number);
        const blockStart = new Date();
        blockStart.setHours(h, m, 0, 0);

        const notifyTime = new Date(blockStart.getTime() - 10 * 60 * 1000);
        if (notifyTime.getTime() > Date.now()) {
          NotificationService.scheduleLocalNotification({
            id: `plan-notif-${b.id}`,
            title: `Siap-siap: ${b.title}`,
            body: `Sesi ${b.type} dimulai 10 menit lagi (${b.startTime}).`,
            scheduledTime: notifyTime
          });
        }
      }
    } catch (e) {
      console.warn('Notification scheduling error:', e);
    }
  };

  const handleToggleComplete = (blockId: string) => {
    const updated = blocks.map(b => 
      b.id === blockId ? { ...b, completed: !b.completed, updatedAt: Date.now() } : b
    );
    saveBlocks(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = blocks.filter(b => b.id !== blockId);
    saveBlocks(updated);
  };

  const handleAddManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newBlock: StudyBlock = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: manualTitle.trim(),
      courseId: manualCourseId || undefined,
      date: activeDateStr,
      startTime: manualStartTime,
      endTime: manualEndTime,
      type: manualType,
      completed: false,
      isAutoGenerated: false,
      updatedAt: Date.now()
    };

    const updated = [...blocks, newBlock].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    saveBlocks(updated);
    setShowAddModal(false);
    setManualTitle('');
    setManualCourseId('');
  };

  const handleStartFocus = (block: StudyBlock) => {
    if (block.taskId) {
      localStorage.setItem('focus_task_id', block.taskId);
    }
    if (onLaunchFocus) {
      onLaunchFocus({ courseId: block.courseId, taskId: block.taskId });
    } else if (onNavigateToView) {
      onNavigateToView('focus');
    }
  };

  const getTypeBadge = (type: StudyBlock['type']) => {
    switch (type) {
      case 'TASK':
        return { label: 'Tugas', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'EXAM_PREP':
        return { label: 'Ujian', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'REVIEW_FLASHCARDS':
        return { label: 'Review', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'Mandiri', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  const targetMinutes = settings.dailyStudyTargetMinutes || 120;
  const progressPercent = Math.min(100, Math.round((plannedMinutes / targetMinutes) * 100));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            Planner Belajar Harian
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Rencana blok belajar adaptif yang sinkron dengan jadwal kuliah, deadline tugas, dan hafalan active recall.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1.5"
            title="Pengaturan Target & Jam Belajar"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Target & Jam</span>
          </button>

          <button
            onClick={handleRegeneratePlan}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Susun Ulang Rencana Otomatis"
          >
            <Sparkles size={14} />
            <span>Susun Ulang Otomatis</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={14} />
            <span>Tambah Blok Manual</span>
          </button>
        </div>
      </div>

      {/* 7-Day Date Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {Array.from({ length: 7 }).map((_, idx) => {
          const d = addDays(today, idx);
          const isSelected = activeDateIndex === idx;
          const dayName = idx === 0 ? 'Hari Ini' : idx === 1 ? 'Besok' : DAYS_ID[d.getDay()];
          const dateNum = d.getDate();
          const monthName = d.toLocaleDateString('id-ID', { month: 'short' });

          const dStr = formatLocalDate(d);
          const dayBlocks = blocks.filter(b => b.date === dStr);
          const hasUncompleted = dayBlocks.some(b => !b.completed);

          return (
            <button
              key={idx}
              onClick={() => setActiveDateIndex(idx)}
              className={`flex flex-col items-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all text-center relative ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{dayName}</span>
              <span className="text-lg font-black my-0.5">{dateNum}</span>
              <span className="text-[10px] font-mono opacity-75">{monthName}</span>

              {dayBlocks.length > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${hasUncompleted ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Target & Progress Dashboard Bar */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <span>Rencana Tanggal:</span>
            <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
              {activeDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Terjadwal: <strong className="text-white font-mono">{plannedMinutes} menit</strong> ({completedMinutes} menit selesai) dari target harian <strong className="text-primary font-mono">{targetMinutes} menit</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 min-w-[240px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-400">
              <span>Alokasi Jam Belajar</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Study Blocks List */}
      <div className="space-y-3">
        {activeDayBlocks.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border-white/5 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
              <Calendar size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Belum Ada Blok Belajar di Hari Ini</h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Tekan tombol "Susun Ulang Otomatis" untuk menghasilkan jadwal belajar cerdas yang menyesuaikan dengan kuliah dan tugas Anda, atau tambah blok manual sendiri.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRegeneratePlan}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Susun Rencana Otomatis</span>
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {activeDayBlocks.map((block) => {
              const typeBadge = getTypeBadge(block.type);
              const course = courses.find(c => c.id === block.courseId);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={block.id}
                  className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    block.completed 
                      ? 'bg-zinc-950/40 border-white/5 opacity-60' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(block.id)}
                      className={`mt-1 p-1 rounded-lg transition-colors ${
                        block.completed ? 'text-emerald-400 hover:text-zinc-400' : 'text-zinc-500 hover:text-emerald-400'
                      }`}
                      title={block.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {block.completed ? <CheckCircle2 size={20} className="fill-emerald-400/20" /> : <Circle size={20} />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge.bg}`}>
                          {typeBadge.label}
                        </span>

                        {block.isAutoGenerated ? (
                          <span className="text-[9px] bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
                            Otomatis AI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Manual
                          </span>
                        )}

                        {course && (
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono truncate max-w-[150px]">
                            {course.name}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold truncate ${block.completed ? 'line-through text-zinc-400' : 'text-white'}`}>
                        {block.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                        <span className="flex items-center gap-1 text-primary">
                          <Clock size={12} />
                          <span>{block.startTime} - {block.endTime}</span>
                        </span>
                        <span>·</span>
                        <span>{parseTimeToMinutes(block.endTime) - parseTimeToMinutes(block.startTime)} mnt</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleStartFocus(block)}
                      className="px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold border border-primary/30 transition-all flex items-center gap-1.5 active:scale-95"
                      title="Buka sesi fokus Pomodoro untuk materi ini"
                    >
                      <Play size={13} className="fill-primary" />
                      <span>Mulai Fokus</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Hapus blok ini"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Modal: Tambah Blok Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border-white/15 bg-zinc-900 shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              <span>Tambah Blok Belajar Manual</span>
            </h3>

            <form onSubmit={handleAddManualBlock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Judul Kegiatan / Target</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Membaca Bab 3 Teori Graf"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Tipe Kegiatan</label>
                <select
                  value={manualType}
                  onChange={e => setManualType(e.target.value as any)}
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="TASK">Tugas Kuliah</option>
                  <option value="EXAM_PREP">Persiapan Ujian</option>
                  <option value="REVIEW_FLASHCARDS">Review Hafalan (Flashcard)</option>
                  <option value="FREE">Belajar Mandiri / Riset</option>
                </select>
              </div>

              {courses.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Mata Kuliah (Opsional)</label>
                  <select
                    value={manualCourseId}
                    onChange={e => setManualCourseId(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Tanpa Mata Kuliah Spesifik</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={e => setManualStartTime(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={manualEndTime}
                    onChange={e => setManualEndTime(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 active:scale-95"
                >
                  Simpan Blok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pengaturan Planner */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border-white/15 bg-zinc-900 shadow-2xl space-y-4 animate-scale-up">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-primary" />
              <span>Pengaturan Belajar Harian</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Target Jam Belajar Mandiri (Menit/Hari)
                </label>
                <input
                  type="number"
                  min="30"
                  max="480"
                  step="15"
                  value={settings.dailyStudyTargetMinutes}
                  onChange={e => setSettings({ ...settings, dailyStudyTargetMinutes: Number(e.target.value) || 120 })}
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Jam Mulai Favorit</label>
                  <input
                    type="time"
                    value={settings.preferredStudyHours?.start || '18:00'}
                    onChange={e => setSettings({ 
                      ...settings, 
                      preferredStudyHours: { 
                        start: e.target.value, 
                        end: settings.preferredStudyHours?.end || '22:00' 
                      } 
                    })}
                    className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Jam Selesai Favorit</label>
                  <input
                    type="time"
                    value={settings.preferredStudyHours?.end || '22:00'}
                    onChange={e => setSettings({ 
                      ...settings, 
                      preferredStudyHours: { 
                        start: settings.preferredStudyHours?.start || '18:00', 
                        end: e.target.value 
                      } 
                    })}
                    className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Jeda Antar Sesi Belajar (Menit)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={settings.breakIntervalMinutes || 10}
                  onChange={e => setSettings({ ...settings, breakIntervalMinutes: Number(e.target.value) || 10 })}
                  className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveSettings({ ...settings, updatedAt: Date.now() });
                    setShowSettingsModal(false);
                    handleRegeneratePlan();
                  }}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 active:scale-95"
                >
                  Simpan & Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
