import React, { useState, useEffect } from 'react';
import { Course, ViewState } from '../types';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { useCourseData } from '../hooks/useCourseData';
import { ExamManager } from './ExamManager';
import { GradePlanEditor } from './GradePlanEditor';
import { runCourseLinkingMigration } from '../services/courseLinking';
import { 
  GraduationCap, BookOpen, CheckSquare, Layers, Clock, Calendar, 
  UserCheck, Award, ArrowLeft, ArrowRight, AlertTriangle, ShieldCheck, 
  Plus, Search, Sparkles, ChevronRight, BarChart3, Filter, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourseHubProps {
  courses?: Course[];
  setView: (view: ViewState) => void;
  onSelectCourseForView?: (courseId: string, targetView: ViewState) => void;
}

type TabType = 'overview' | 'tasks' | 'notes' | 'flashcards' | 'attendance' | 'grades' | 'exams' | 'focus';

export const CourseHub: React.FC<CourseHubProps> = ({ 
  courses: propCourses = [], 
  setView,
  onSelectCourseForView
}) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    if (propCourses && propCourses.length > 0) return propCourses;
    return StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []);
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  // Auto-run idempotent course linking migration on initial load if not done yet
  useEffect(() => {
    const res = runCourseLinkingMigration(false);
    if (res.migrated && (res.linkedTasks > 0 || res.linkedNotes > 0 || res.linkedFlashcards > 0)) {
      setMigrationNotice(`Berhasil menghubungkan otomatis ${res.linkedTasks} tugas, ${res.linkedNotes} catatan, dan ${res.linkedFlashcards} flashcards ke mata kuliah.`);
    }
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorage = () => {
      setCourses(StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kampuskit_sync_complete', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kampuskit_sync_complete', handleStorage);
    };
  }, []);

  const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  const filteredCourses = courses.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.lecturer && c.lecturer.toLowerCase().includes(q)) ||
      (c.day && c.day.toLowerCase().includes(q)) ||
      (c.room && c.room.toLowerCase().includes(q))
    );
  });

  const handleNavigateToModule = (view: ViewState, courseId?: string) => {
    if (courseId && onSelectCourseForView) {
      onSelectCourseForView(courseId, view);
    } else {
      setView(view);
    }
  };

  return (
    <div className="w-full animate-fade-in flex flex-col pb-28 sm:pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Migration Notice Toast */}
      <AnimatePresence>
        {migrationNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="mb-4 p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs text-primary font-medium"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="shrink-0" /> {migrationNotice}
            </span>
            <button 
              onClick={() => setMigrationNotice(null)} 
              className="text-primary hover:text-white px-2 py-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      {!selectedCourseId ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                  <GraduationCap size={22} />
                </div>
                <span>Hub Mata Kuliah</span>
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                Pusat poros perkuliahan menghubungkan jadwal, tugas, catatan, flashcards, presensi, ujian, dan nilai.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setView('schedule')}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Calendar size={14} /> Kelola Jadwal
              </button>
              <button
                onClick={() => setView('tasks')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5"
              >
                <CheckSquare size={14} /> Tugas Kuliah
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Mata Kuliah</span>
                <span className="text-xl sm:text-2xl font-black text-white">{courses.length}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen size={18} />
              </div>
            </div>

            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Beban SKS</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-400">{totalCredits} <span className="text-xs font-medium text-zinc-400">SKS</span></span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Award size={18} />
              </div>
            </div>

            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Presensi Minimum</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">75%</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="glass-card p-3.5 sm:p-4 rounded-2xl border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Mode Terhubung</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">Aktif</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="mb-5 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari mata kuliah, dosen, ruangan, atau hari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Course Cards Grid */}
          {filteredCourses.length === 0 ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/30">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-600 flex items-center justify-center mb-3">
                <GraduationCap size={24} />
              </div>
              <h4 className="font-bold text-zinc-300 mb-1">Belum Ada Mata Kuliah</h4>
              <p className="text-zinc-500 text-xs max-w-sm mb-4">
                Tambahkan mata kuliah melalui modul Jadwal Kuliah atau import jadwal untuk memulai asisten terhubung.
              </p>
              <button
                onClick={() => setView('schedule')}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                + Buka Jadwal Kuliah
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <CourseSummaryCard
                  key={course.id}
                  course={course}
                  onSelect={() => {
                    setSelectedCourseId(course.id);
                    setActiveTab('overview');
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Course Detail View */
        <CourseDetailView
          courseId={selectedCourseId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={() => setSelectedCourseId(null)}
          onNavigate={handleNavigateToModule}
        />
      )}
    </div>
  );
};

// Course Summary Card Component
const CourseSummaryCard: React.FC<{
  course: Course;
  onSelect: () => void;
}> = ({ course, onSelect }) => {
  const data = useCourseData(course.id);
  const attStats = data.attendanceStats;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onSelect}
      className="glass-card p-5 rounded-2xl border-white/10 hover:border-primary/40 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-wider inline-block mb-1.5">
            {course.credits} SKS
          </span>
          <h3 className="font-black text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {course.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {course.lecturer || 'Dosen Pengampu'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-primary group-hover:text-white text-zinc-400 flex items-center justify-center transition-all shrink-0">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Schedule Info */}
      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-4 bg-zinc-950/40 p-2 rounded-xl border border-white/5">
        <Clock size={12} className="text-zinc-500 shrink-0" />
        <span className="truncate">{course.day}, {course.startTime} - {course.endTime}</span>
        {course.room && (
          <span className="ml-auto text-zinc-500 font-mono shrink-0">R. {course.room}</span>
        )}
      </div>

      {/* Interconnected Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-[11px]">
        {/* Tasks */}
        <div className="bg-black/20 p-2 rounded-lg text-center">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Tugas Aktif</span>
          <span className={`font-black ${data.activeTasksCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {data.activeTasksCount}
          </span>
        </div>

        {/* Attendance */}
        <div className="bg-black/20 p-2 rounded-lg text-center">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Kehadiran</span>
          <span className={`font-black ${attStats?.isCritical ? 'text-rose-400' : attStats?.isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
            {attStats ? `${attStats.ratePercent}%` : '100%'}
          </span>
        </div>

        {/* Notes / Flashcards */}
        <div className="bg-black/20 p-2 rounded-lg text-center">
          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Catatan</span>
          <span className="font-black text-indigo-400">
            {data.notes.length}
          </span>
        </div>
      </div>

      {/* Sisa Jatah Absen Alert if Critical or Warning */}
      {attStats && (attStats.isCritical || attStats.isWarning) && (
        <div className={`mt-2.5 p-1.5 rounded-lg text-[10px] flex items-center gap-1 font-semibold ${
          attStats.isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
        }`}>
          <AlertTriangle size={11} className="shrink-0" />
          <span>Sisa jatah alfa: {attStats.remainingAbsentQuota} kali (Min 75%)</span>
        </div>
      )}
    </motion.div>
  );
};

// Course Detail View Component
const CourseDetailView: React.FC<{
  courseId: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onBack: () => void;
  onNavigate: (view: ViewState, courseId?: string) => void;
}> = ({ courseId, activeTab, setActiveTab, onBack, onNavigate }) => {
  const data = useCourseData(courseId);
  const course = data.course;

  if (!course) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p>Mata kuliah tidak ditemukan.</p>
        <button onClick={onBack} className="mt-3 text-primary text-xs font-bold underline">
          Kembali ke daftar
        </button>
      </div>
    );
  }

  const attStats = data.attendanceStats;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'tasks', label: 'Tugas', count: data.tasks.length },
    { id: 'notes', label: 'Catatan', count: data.notes.length },
    { id: 'flashcards', label: 'Kartu', count: data.flashcardDecks.length },
    { id: 'attendance', label: 'Presensi' },
    { id: 'grades', label: 'Nilai' },
    { id: 'exams', label: 'Ujian', count: data.exams.length },
    { id: 'focus', label: 'Fokus' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/80 px-3 py-1.5 rounded-xl transition-colors border border-white/5"
        >
          <ArrowLeft size={14} /> Kembali ke Hub
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('schedule')}
            className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1.5"
          >
            Buka Jadwal
          </button>
          <button
            onClick={() => onNavigate('focus', course.id)}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Clock size={13} /> Sesi Fokus ({course.name.substring(0, 15)}...)
          </button>
        </div>
      </div>

      {/* Course Hero Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10 relative overflow-hidden bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                {course.credits} SKS
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                {course.day}, {course.startTime} - {course.endTime}
              </span>
              {course.room && (
                <span className="text-zinc-400 text-xs bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  Ruang {course.room}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {course.name}
            </h1>
            <p className="text-zinc-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
              <span>Dosen: {course.lecturer || 'Tidak tercatat'}</span>
            </p>
          </div>

          {/* Attendance 75% Badge */}
          {attStats && (
            <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 shrink-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                attStats.isCritical ? 'bg-rose-500/20 text-rose-400' : attStats.isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {attStats.ratePercent}%
              </div>
              <div className="text-left text-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Status Presensi</span>
                <span className="text-zinc-200 font-semibold">
                  Sisa jatah alfa: {attStats.remainingAbsentQuota} dari {attStats.maxAbsent}x
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-6 mt-6 border-t border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overview: Tasks */}
            <div className="glass-card p-5 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckSquare size={16} className="text-primary" /> Tugas Kuliah ({data.tasks.length})
                  </h4>
                  <button 
                    onClick={() => onNavigate('tasks', course.id)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    Buka di Tugas <ArrowRight size={12} />
                  </button>
                </div>
                {data.tasks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 italic">Belum ada tugas untuk mata kuliah ini.</p>
                ) : (
                  <div className="space-y-2">
                    {data.tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="p-2.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className={`truncate mr-2 ${task.status === 'DONE' ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          {task.deadline}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overview: Notes */}
            <div className="glass-card p-5 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-400" /> Catatan Materi ({data.notes.length})
                  </h4>
                  <button 
                    onClick={() => onNavigate('notes', course.id)}
                    className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Buka di Catatan <ArrowRight size={12} />
                  </button>
                </div>
                {data.notes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 italic">Belum ada catatan tertaut ke mata kuliah ini.</p>
                ) : (
                  <div className="space-y-2">
                    {data.notes.slice(0, 3).map(n => (
                      <div key={n.id} className="p-2.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-zinc-200 font-medium truncate mr-2">{n.title || 'Catatan Tanpa Judul'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">{n.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overview: Flashcards */}
            <div className="glass-card p-5 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" /> Flashcards & Hafalan ({data.flashcardDecks.length})
                  </h4>
                  <button 
                    onClick={() => onNavigate('flashcards', course.id)}
                    className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Buka di Flashcards <ArrowRight size={12} />
                  </button>
                </div>
                {data.flashcardDecks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 italic">Belum ada deck flashcard untuk mata kuliah ini.</p>
                ) : (
                  <div className="space-y-2">
                    {data.flashcardDecks.slice(0, 3).map(deck => (
                      <div key={deck.id} className="p-2.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-zinc-200 font-medium truncate mr-2">{deck.title}</span>
                        <span className="text-[10px] text-amber-400 font-mono shrink-0">{deck.cards?.length || 0} kartu</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overview: Focus & Time */}
            <div className="glass-card p-5 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-emerald-400" /> Jam Belajar 7 Hari Terakhir
                  </h4>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {data.focusMinutes7Days} Menit
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Total waktu deep work teralokasi khusus untuk {course.name} selama 7 hari terakhir.
                </p>
                <button
                  onClick={() => onNavigate('focus', course.id)}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold transition-colors"
                >
                  Mulai Sesi Fokus Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Tasks */}
        {activeTab === 'tasks' && (
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Daftar Tugas {course.name}</h3>
              <button
                onClick={() => onNavigate('tasks', course.id)}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Buka di Task Manager
              </button>
            </div>
            {data.tasks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada tugas untuk mata kuliah ini.</p>
            ) : (
              <div className="space-y-2">
                {data.tasks.map(t => (
                  <div key={t.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className={`text-xs font-bold ${t.status === 'DONE' ? 'line-through text-zinc-500' : 'text-white'}`}>{t.title}</h4>
                      <span className="text-[10px] text-zinc-400">Deadline: {t.deadline} • Prioritas: {t.priority}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      t.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Notes */}
        {activeTab === 'notes' && (
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Catatan Terkait {course.name}</h3>
              <button
                onClick={() => onNavigate('notes', course.id)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Buka di Modul Catatan
              </button>
            </div>
            {data.notes.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada catatan terkait mata kuliah ini.</p>
            ) : (
              <div className="space-y-2">
                {data.notes.map(n => (
                  <div key={n.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{n.title || 'Catatan Kuliah'}</h4>
                      <span className="text-[10px] text-zinc-400">{n.date} {n.folder ? `• Folder: ${n.folder}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Flashcards */}
        {activeTab === 'flashcards' && (
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Deck Flashcards ({data.flashcardDecks.length})</h3>
              <button
                onClick={() => onNavigate('flashcards', course.id)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Buka di Flashcards
              </button>
            </div>
            {data.flashcardDecks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada deck flashcard untuk mata kuliah ini.</p>
            ) : (
              <div className="space-y-2">
                {data.flashcardDecks.map(d => (
                  <div key={d.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{d.title}</h4>
                      <span className="text-[10px] text-zinc-400">{d.cards?.length || 0} kartu</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Attendance */}
        {activeTab === 'attendance' && (
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Rekap Presensi {course.name}</h3>
              <button
                onClick={() => onNavigate('attendance', course.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Buka di Presensi Tracker
              </button>
            </div>
            {attStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Hadir</span>
                    <span className="text-lg font-black text-emerald-400">{attStats.attended}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Izin / Sakit</span>
                    <span className="text-lg font-black text-amber-400">{attStats.permit}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Alfa / Bolos</span>
                    <span className="text-lg font-black text-rose-400">{attStats.absent}</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Sisa Kuota Bolos</span>
                    <span className="text-lg font-black text-indigo-400">{attStats.remainingAbsentQuota}x</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5 text-xs space-y-1">
                  <p className="font-bold text-zinc-300">Ketentuan Kehadiran Universitas (Ambang 75%):</p>
                  <p className="text-zinc-400">
                    Dari total {attStats.totalMeetings} pertemuan, batas maksimal ketidakhadiran tanpa izin adalah {attStats.maxAbsent} kali.
                    {attStats.isCritical && (
                      <span className="block text-rose-400 font-bold mt-1">⚠️ Perhatian: Kehadiran Anda berada di bawah batas minimum 75% atau jatah absen telah habis.</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada riwayat presensi yang dicatat.</p>
            )}
          </div>
        )}

        {/* Tab: Grades */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
          <GradePlanEditor
            key={data.gradePlan?.id || 'new-plan'}
            courseId={course.id}
            courseName={course.name}
            credits={Number(course.credits) || undefined}
            gradePlan={data.gradePlan}
          />
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Transkrip ({course.name})</h3>
              <button
                onClick={() => onNavigate('grades', course.id)}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Buka di Kalkulator IPK
              </button>
            </div>
            {data.grades.length > 0 ? (
              <div className="space-y-2">
                {data.grades.map(g => (
                  <div key={g.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{g.course}</h4>
                      <span className="text-[10px] text-zinc-400">Semester {g.semester} • {g.credits} SKS</span>
                    </div>
                    <span className="text-sm font-black text-primary font-mono">{g.letterGrade} ({g.grade.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada catatan nilai di transkrip untuk mata kuliah ini.</p>
            )}
          </div>
          </div>
        )}

        {/* Tab: Exams */}
        {activeTab === 'exams' && (
          <ExamManager
            courseId={course.id}
            courseName={course.name}
            exams={data.exams}
            notes={data.notes}
            tasks={data.tasks}
            flashcardDecks={data.flashcardDecks}
            focusSessions={data.focusSessions}
          />
        )}

        {/* Tab: Focus */}
        {activeTab === 'focus' && (
          <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Riwayat Sesi Fokus ({data.focusSessions.length} sesi)</h3>
              <button
                onClick={() => onNavigate('focus', course.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
              >
                Mulai Fokus
              </button>
            </div>
            {data.focusSessions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center italic">Belum ada sesi fokus tercatat untuk mata kuliah ini.</p>
            ) : (
              <div className="space-y-2">
                {data.focusSessions.slice(0, 10).map(s => (
                  <div key={s.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-zinc-200 font-medium">{new Date(s.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">{s.minutes} Menit</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
