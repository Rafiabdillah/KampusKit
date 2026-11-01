import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Course } from '../types';
import { 
  CheckCircle, AlertTriangle, Plus, BookOpen, Trash2, 
  RotateCcw, Download, Copy, Check, Info, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type SessionStatus = 'ATTEND' | 'PERMIT' | 'ABSENT' | 'UPCOMING';

export interface AttendanceRecord {
  courseId: string;
  courseName: string;
  totalMeetings: number;
  attended: number;
  permit: number; // Izin / Sakit (dengan surat)
  absent: number; // Alfa / Tanpa Keterangan (mengurangi kuota)
  sessions?: SessionStatus[]; // Riwayat pertemuan 1..totalMeetings
  notes?: string;
}

export const AttendanceTracker: React.FC<{ courses?: Course[] }> = ({ courses = [] }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newTotalMeetings, setNewTotalMeetings] = useState(16);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WARNING' | 'SAFE'>('ALL');

  useEffect(() => {
    const saved = StorageService.getItem<AttendanceRecord[]>('attendance_v2', []);
    
    // If we have saved records, use them
    if (saved && saved.length > 0) {
      // Sync any new courses from schedule that aren't yet in saved
      const existingNames = new Set(saved.map(s => s.courseName.trim().toLowerCase()));
      const newFromSchedule: AttendanceRecord[] = [];
      
      courses.forEach(c => {
        const norm = c.name.trim().toLowerCase();
        if (!existingNames.has(norm)) {
          existingNames.add(norm);
          newFromSchedule.push({
            courseId: `course-${c.id || Math.random().toString(36).substr(2, 6)}`,
            courseName: c.name.trim(),
            totalMeetings: 16,
            attended: 0,
            permit: 0,
            absent: 0,
            sessions: Array(16).fill('UPCOMING')
          });
        }
      });
      
      if (newFromSchedule.length > 0) {
        const merged = [...saved, ...newFromSchedule];
        setRecords(merged);
        StorageService.setItem('attendance_v2', merged);
      } else {
        setRecords(prev => (prev.length === saved.length ? prev : saved));
      }
      return;
    }

    // Otherwise, check legacy 'attendance' storage
    const legacySaved = StorageService.getItem<any[]>('attendance', []) || [];
    if (legacySaved.length > 0) {
      const migrated: AttendanceRecord[] = legacySaved.map(item => {
        const total = item.totalMeetings || 16;
        const attended = item.attended || 0;
        const absent = item.absent || 0;
        const sessions: SessionStatus[] = Array(total).fill('UPCOMING');
        for (let i = 0; i < attended && i < total; i++) sessions[i] = 'ATTEND';
        for (let i = attended; i < attended + absent && i < total; i++) sessions[i] = 'ABSENT';
        
        return {
          courseId: item.courseId || item.courseName,
          courseName: item.courseName,
          totalMeetings: total,
          attended,
          permit: 0,
          absent,
          sessions
        };
      });
      setRecords(migrated);
      StorageService.setItem('attendance_v2', migrated);
      return;
    }

    // Default from courses if any
    if (courses.length > 0) {
      const uniqueNames = Array.from(new Set(courses.map(c => c.name.trim())));
      const initial: AttendanceRecord[] = uniqueNames.map(name => ({
        courseId: `course-${Math.random().toString(36).substr(2, 6)}`,
        courseName: name,
        totalMeetings: 16,
        attended: 0,
        permit: 0,
        absent: 0,
        sessions: Array(16).fill('UPCOMING')
      }));
      setRecords(initial);
      StorageService.setItem('attendance_v2', initial);
    }
  }, [courses]);

  const saveRecords = (newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    StorageService.setItem('attendance_v2', newRecords);
  };

  const handleAddManualCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const total = Number(newTotalMeetings) || 16;
    const newRecord: AttendanceRecord = {
      courseId: `manual-${Date.now()}`,
      courseName: newCourseName.trim(),
      totalMeetings: total,
      attended: 0,
      permit: 0,
      absent: 0,
      sessions: Array(total).fill('UPCOMING')
    };

    const updated = [newRecord, ...records];
    saveRecords(updated);
    setNewCourseName('');
    setNewTotalMeetings(16);
    setShowAddModal(false);
  };

  const handleToggleSession = (recordIndex: number, sessionIndex: number) => {
    const updated = [...records];
    const rec = { ...updated[recordIndex] };
    const sessions = [...(rec.sessions || Array(rec.totalMeetings).fill('UPCOMING'))];

    // Cycle: UPCOMING -> ATTEND -> PERMIT -> ABSENT -> UPCOMING
    const current = sessions[sessionIndex] || 'UPCOMING';
    let next: SessionStatus;
    if (current === 'ATTEND') next = 'PERMIT';
    else if (current === 'PERMIT') next = 'ABSENT';
    else if (current === 'ABSENT') next = 'UPCOMING';
    else next = 'ATTEND';

    sessions[sessionIndex] = next;

    // Recalculate counts
    rec.sessions = sessions;
    rec.attended = sessions.filter(s => s === 'ATTEND').length;
    rec.permit = sessions.filter(s => s === 'PERMIT').length;
    rec.absent = sessions.filter(s => s === 'ABSENT').length;

    updated[recordIndex] = rec;
    saveRecords(updated);
  };

  const handleQuickAdd = (recordIndex: number, type: 'ATTEND' | 'PERMIT' | 'ABSENT') => {
    const updated = [...records];
    const rec = { ...updated[recordIndex] };
    const sessions = [...(rec.sessions || Array(rec.totalMeetings).fill('UPCOMING'))];
    
    // Find first UPCOMING session
    const firstUpcoming = sessions.findIndex(s => s === 'UPCOMING');
    if (firstUpcoming !== -1) {
      sessions[firstUpcoming] = type;
    } else {
      // If full, expand total meetings or just increment counter
      sessions.push(type);
      rec.totalMeetings += 1;
    }

    rec.sessions = sessions;
    rec.attended = sessions.filter(s => s === 'ATTEND').length;
    rec.permit = sessions.filter(s => s === 'PERMIT').length;
    rec.absent = sessions.filter(s => s === 'ABSENT').length;

    updated[recordIndex] = rec;
    saveRecords(updated);
  };

  const handleReset = (courseId: string) => {
    if (!confirm('Yakin ingin mereset seluruh presensi untuk mata kuliah ini?')) return;
    const updated = records.map(r => {
      if (r.courseId === courseId) {
        return {
          ...r,
          attended: 0,
          permit: 0,
          absent: 0,
          sessions: Array(r.totalMeetings).fill('UPCOMING')
        };
      }
      return r;
    });
    saveRecords(updated);
  };

  const handleDelete = (courseId: string) => {
    if (!confirm('Hapus mata kuliah ini dari tracker presensi?')) return;
    const updated = records.filter(r => r.courseId !== courseId);
    saveRecords(updated);
  };

  const copySummaryReport = () => {
    if (records.length === 0) return;
    let text = `📋 REKAP PRESENSI KULIAH KAMPUSKIT\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    records.forEach((r, idx) => {
      const maxAbsent = Math.floor(r.totalMeetings * 0.25);
      const remainingQuota = Math.max(0, maxAbsent - r.absent);
      const rate = Math.round(((r.attended + r.permit) / (r.attended + r.permit + r.absent || 1)) * 100);
      text += `${idx + 1}. ${r.courseName}\n`;
      text += `   - Hadir: ${r.attended} | Izin: ${r.permit} | Alfa: ${r.absent}\n`;
      text += `   - Persentase Kehadiran: ${r.attended + r.permit + r.absent > 0 ? `${rate}%` : 'Belum Mulai'}\n`;
      text += `   - Sisa Kuota Bolos: ${remainingQuota} dari max ${maxAbsent} kali\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const filteredRecords = records.filter(r => {
    const maxAbsent = Math.floor(r.totalMeetings * 0.25);
    const isWarning = r.absent >= maxAbsent - 1;
    if (activeFilter === 'WARNING') return isWarning;
    if (activeFilter === 'SAFE') return !isWarning;
    return true;
  });

  // Overall Statistics
  const totalCourses = records.length;
  const criticalCount = records.filter(r => r.absent >= Math.floor(r.totalMeetings * 0.25)).length;
  const warningCount = records.filter(r => {
    const maxAbsent = Math.floor(r.totalMeetings * 0.25);
    return r.absent === maxAbsent - 1;
  }).length;

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase border border-primary/20">
              Sistem Akademik
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CheckCircle className="text-primary" size={30} /> Presensi Kuliah & Jatah Bolos
          </h2>
          <p className="text-zinc-400 mt-1 text-xs sm:text-sm max-w-2xl">
            Lacak kehadiran tiap pertemuan. Standar akademik mensyaratkan minimal <strong>75% - 80%</strong> kehadiran agar berhak mengikuti UAS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copySummaryReport}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            title="Salin rekap presensi"
          >
            {copiedToast ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span>{copiedToast ? 'Tersalin!' : 'Salin Rekap'}</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Tambah Matkul / Lab
          </button>
        </div>
      </div>

      {/* Stats Overview Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[11px] text-zinc-400 font-medium">Total Matkul</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalCourses}</p>
        </div>

        <div className="bg-zinc-900/60 border border-white/5 p-3.5 rounded-2xl">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} /> Kehadiran Aman
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
            {totalCourses - criticalCount - warningCount}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/20 p-3.5 rounded-2xl">
          <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
            <AlertTriangle size={14} /> Waspada (Sisa 1)
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{warningCount}</p>
        </div>

        <div className="bg-zinc-900/60 border border-red-500/20 p-3.5 rounded-2xl">
          <span className="text-[11px] text-red-400 font-medium flex items-center gap-1.5">
            <ShieldAlert size={14} /> Kritis / Terlampaui
          </span>
          <p className="text-xl sm:text-2xl font-black text-red-400 mt-0.5">{criticalCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'ALL'
              ? 'bg-white text-black shadow'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
          }`}
        >
          Semua ({records.length})
        </button>
        <button
          onClick={() => setActiveFilter('WARNING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'WARNING'
              ? 'bg-amber-500 text-black shadow'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-amber-300 border border-white/5'
          }`}
        >
          Perlu Perhatian ({warningCount + criticalCount})
        </button>
        <button
          onClick={() => setActiveFilter('SAFE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'SAFE'
              ? 'bg-emerald-500 text-black shadow'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-emerald-300 border border-white/5'
          }`}
        >
          Aman Saja ({totalCourses - criticalCount - warningCount})
        </button>
      </div>

      {/* Main Grid */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-white/5 p-8">
          <BookOpen size={48} className="mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-bold text-white mb-1">Belum Ada Catatan Presensi</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
            Tambahkan mata kuliah dari jadwal kuliah atau buat entri manual untuk melacak kehadiran praktikum dan kelas.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 inline-flex items-center gap-2"
          >
            <Plus size={16} /> Tambah Mata Kuliah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRecords.map((r) => {
            const actualIndex = records.findIndex(item => item.courseId === r.courseId);
            const total = r.totalMeetings || 16;
            const maxAbsentAllowed = Math.floor(total * 0.25); // 25% max bolos (e.g. 4x dari 16x)
            const remainingQuota = Math.max(0, maxAbsentAllowed - r.absent);
            const totalRecorded = r.attended + r.permit + r.absent;
            const attendanceRate = totalRecorded > 0 
              ? Math.round(((r.attended + r.permit) / totalRecorded) * 100) 
              : 100;
            
            const isExceeded = r.absent >= maxAbsentAllowed;
            const isWarning = r.absent === maxAbsentAllowed - 1;

            return (
              <div 
                key={r.courseId} 
                className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isExceeded 
                    ? 'border-red-500/40 bg-red-950/10' 
                    : isWarning 
                      ? 'border-amber-500/40 bg-amber-950/10' 
                      : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-white text-base sm:text-lg truncate" title={r.courseName}>
                      {r.courseName}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleReset(r.courseId)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors"
                        title="Reset presensi matkul ini"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(r.courseId)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Hapus dari tracker"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className={`text-xs px-3 py-2 rounded-xl border mb-4 flex items-center justify-between ${
                    isExceeded 
                      ? 'text-red-400 bg-red-500/10 border-red-500/30 font-bold' 
                      : isWarning 
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-medium' 
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      {isExceeded 
                        ? 'Batas bolos terlampaui! Hubungi dosen/akademik.' 
                        : isWarning 
                          ? 'Waspada: Jatah bolos tersisa 1 kali lagi!' 
                          : 'Kehadiran aman. Pertahankan!'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/30">
                      Sisa: {remainingQuota}x
                    </span>
                  </div>

                  {/* Three Counters */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 border border-white/5 p-3 rounded-xl mb-4 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-400">Hadir</p>
                      <p className="text-xl font-black text-white mt-0.5">{r.attended}</p>
                      <button 
                        onClick={() => handleQuickAdd(actualIndex, 'ATTEND')}
                        className="mt-1 w-full py-1 text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors"
                      >
                        + Hadir
                      </button>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-400">Izin / Sakit</p>
                      <p className="text-xl font-black text-white mt-0.5">{r.permit || 0}</p>
                      <button 
                        onClick={() => handleQuickAdd(actualIndex, 'PERMIT')}
                        className="mt-1 w-full py-1 text-[11px] font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                      >
                        + Izin
                      </button>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-red-400">Alfa / Bolos</p>
                      <p className="text-xl font-black text-red-400 mt-0.5">{r.absent}</p>
                      <button 
                        onClick={() => handleQuickAdd(actualIndex, 'ABSENT')}
                        className="mt-1 w-full py-1 text-[11px] font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      >
                        + Alfa
                      </button>
                    </div>
                  </div>

                  {/* Visual Session Timeline (1..totalMeetings) */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Riwayat Pertemuan (Ketuk untuk ganti status)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {totalRecorded} / {total} Pertemuan
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: total }).map((_, sIdx) => {
                        const sStatus = r.sessions?.[sIdx] || 'UPCOMING';
                        return (
                          <button
                            key={sIdx}
                            onClick={() => handleToggleSession(actualIndex, sIdx)}
                            title={`Pertemuan ${sIdx + 1}: ${
                              sStatus === 'ATTEND' ? 'Hadir' :
                              sStatus === 'PERMIT' ? 'Izin/Sakit' :
                              sStatus === 'ABSENT' ? 'Alfa' : 'Belum'
                            }`}
                            className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all active:scale-95 ${
                              sStatus === 'ATTEND'
                                ? 'bg-emerald-500 text-black shadow-sm'
                                : sStatus === 'PERMIT'
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : sStatus === 'ABSENT'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                            }`}
                          >
                            {sIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Progress */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Persentase Kehadiran:</span>
                    <span className={`font-black font-mono text-sm ${
                      attendanceRate >= 80 
                        ? 'text-emerald-400' 
                        : attendanceRate >= 75 
                          ? 'text-amber-400' 
                          : 'text-red-400'
                    }`}>
                      {totalRecorded > 0 ? `${attendanceRate}%` : 'Belum Ada Sesi'}
                    </span>
                  </div>

                  <span className="text-[11px] text-zinc-500">
                    Batas Maks Bolos: <strong className="text-zinc-300">{maxAbsentAllowed}x</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Manual Course Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-900 border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl z-10"
            >
              <h3 className="text-xl font-bold text-white mb-2">Tambah Mata Kuliah / Lab</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Tambahkan mata kuliah teori, praktikum laboratorium, atau kelas seminar yang ingin dipantau presensinya.
              </p>

              <form onSubmit={handleAddManualCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nama Mata Kuliah / Praktikum
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Praktikum Basis Data Lanjut"
                    value={newCourseName}
                    onChange={e => setNewCourseName(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Total Pertemuan Satu Semester
                  </label>
                  <select
                    value={newTotalMeetings}
                    onChange={e => setNewTotalMeetings(Number(e.target.value))}
                    className="w-full bg-zinc-800/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                  >
                    <option value={16}>16 Pertemuan (Standar SKS Penuh)</option>
                    <option value={14}>14 Pertemuan (Tanpa Minggu UTS/UAS)</option>
                    <option value={12}>12 Pertemuan (Modul Pendek / Workshop)</option>
                    <option value={8}>8 Pertemuan (Setengah Semester / Blok)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    Simpan Matkul
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
