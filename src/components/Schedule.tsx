import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import { StorageService } from '../services/storage';
import { SharingService } from '../services/sharing';
import { unlinkCourseFromAllItems } from '../services/courseLinking';
import { Plus, Trash2, Edit2, MapPin, User, Clock, LayoutList, Grid3X3, BookOpen, Calendar, Share2, Camera, Loader2, BookType, CheckSquare } from 'lucide-react';
import { AIService } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleProps {
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  tasks?: any[];
}

export const Schedule: React.FC<ScheduleProps> = ({ courses, setCourses, tasks = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [isSharing, setIsSharing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    day: 'Senin',
    startTime: '08:00',
    endTime: '10:00',
    credits: 2
  });

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const START_HOUR = 6;
  const END_HOUR = 22;
  const HOURS_COUNT = END_HOUR - START_HOUR + 1;
  const timeSlots = Array.from({ length: HOURS_COUNT }, (_, i) => i + START_HOUR); 
  const PIXELS_PER_MINUTE = 1.4; // 1 hour = 84px

  const handleScanSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const results = await AIService.analyzeScheduleImage(base64Data, file.type);
          if (results && results.length > 0) {
            const newCourses = results.map(result => ({
              id: StorageService.generateId(),
              name: result.name || 'Mata Kuliah',
              room: result.room || '-',
              day: result.day || 'Senin',
              startTime: result.startTime || '08:00',
              endTime: result.endTime || '10:00',
              lecturer: result.lecturer || '-',
              credits: Number(result.credits) || 2
            }));
            
            const updated = [...courses, ...newCourses];
            setCourses(updated);
            StorageService.setItem('courses', updated);
            
            alert(`Berhasil membaca dan menambahkan ${newCourses.length} jadwal kuliah!`);
          } else {
            alert('Tidak ada jadwal yang ditemukan dalam dokumen tersebut.');
          }
        } catch (error: any) {
          alert(`Gagal membaca dokumen jadwal: ${error?.message || 'Pastikan dokumen jelas dan koneksi internet aktif.'}`);
        } finally {
          setIsScanning(false);
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
      alert('Terjadi kesalahan saat memproses dokumen.');
      e.target.value = '';
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.room) return;
    
    let updated: Course[];
    if (newCourse.id) {
      updated = courses.map(c => c.id === newCourse.id ? (newCourse as Course) : c);
    } else {
      const course: Course = {
        id: StorageService.generateId(),
        name: newCourse.name!,
        room: newCourse.room!,
        day: newCourse.day || 'Senin',
        startTime: newCourse.startTime || '08:00',
        endTime: newCourse.endTime || '10:00',
        lecturer: newCourse.lecturer || '-',
        credits: Number(newCourse.credits) || 2
      };
      updated = [...courses, course];
    }
    
    setCourses(updated);
    StorageService.setItem('courses', updated);
    setShowForm(false);
    setNewCourse({ day: 'Senin', startTime: '08:00', endTime: '10:00', credits: 2 });
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const url = await SharingService.createShareLink('schedule', courses);
      await navigator.clipboard.writeText(url);
      alert('Link Jadwal berhasil disalin ke clipboard! Bagikan ke temanmu.');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat link. Pastikan kamu sudah login.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setNewCourse(course);
    setShowForm(true);
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      unlinkCourseFromAllItems(id);
      const updated = courses.filter(c => c.id !== id);
      setCourses(updated);
      StorageService.setItem('courses', updated);
  };

  const getAbsoluteStyle = (course: Course) => {
    const startHour = parseInt(course.startTime.split(':')[0]);
    const startMin = parseInt(course.startTime.split(':')[1]);
    const endHour = parseInt(course.endTime.split(':')[0]);
    const endMin = parseInt(course.endTime.split(':')[1]);

    const startMinutesFromBase = ((startHour - START_HOUR) * 60) + startMin;
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    return {
      top: `${startMinutesFromBase * PIXELS_PER_MINUTE}px`,
      height: `${Math.max(durationMinutes * PIXELS_PER_MINUTE, 40)}px`, // Min height for very short classes
    };
  };

  const generateColor = (name: string) => {
    const themes = [
      { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', hover: 'hover:border-blue-500/60 hover:bg-blue-500/20' },
      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:border-emerald-500/60 hover:bg-emerald-500/20' },
      { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:border-purple-500/60 hover:bg-purple-500/20' },
      { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:border-amber-500/60 hover:bg-amber-500/20' },
      { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', hover: 'hover:border-rose-500/60 hover:bg-rose-500/20' },
      { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', hover: 'hover:border-cyan-500/60 hover:bg-cyan-500/20' }
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
  };

  // Check if any classes exist to show empty states
  const hasClasses = courses.length > 0;

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-7xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-primary/20 rounded-xl">
               <Calendar className="text-primary" size={28} />
             </div>
             Jadwal Kuliah
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg">Kelola waktu kuliahmu dengan presisi. Tampilan dirancang khusus agar mudah dibaca dan membantu mencegah bentrok jadwal.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           {/* View Toggles */}
           <div className="bg-zinc-900/80 p-1 rounded-xl flex border border-white/10 shadow-inner">
              <button 
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${viewMode === 'LIST' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
              >
                <LayoutList size={16} /> Timeline
              </button>
              <button 
                onClick={() => setViewMode('GRID')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${viewMode === 'GRID' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
              >
                <Grid3X3 size={16} /> Grid
              </button>
           </div>
           
           <button 
             onClick={handleShare}
             disabled={isSharing || !hasClasses}
             className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-zinc-700 font-medium text-sm"
           >
             <Share2 size={16} />
             <span className="hidden sm:inline">{isSharing ? 'Loading...' : 'Bagikan'}</span>
           </button>

           <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer font-medium border border-zinc-700 text-sm">
             {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
             <span className="hidden sm:inline">{isScanning ? 'Membaca...' : 'Scan Auto'}</span>
             <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleScanSchedule} disabled={isScanning} />
           </label>
           
           <button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setNewCourse({ day: 'Senin', startTime: '08:00', endTime: '10:00', credits: 2 });
              } else {
                setShowForm(true);
              }
            }}
            className={`px-5 py-2 rounded-xl flex items-center gap-2 transition-all font-medium text-sm ${showForm ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'}`}
          >
            {showForm ? <Trash2 size={16} /> : <Plus size={16} />}
            {showForm ? 'Batal' : (newCourse.id ? 'Edit Kelas' : 'Tambah Kelas')}
          </button>
        </div>
      </div>

      {/* Input Form */}
      <AnimatePresence>
      {showForm && (
        <motion.form 
          onSubmit={(e) => { e.preventDefault(); handleAddCourse(); }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-panel p-6 md:p-8 rounded-[2rem] mb-8 overflow-hidden shrink-0"
        >
          <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
             <BookOpen size={20} className="text-primary"/> {newCourse.id ? 'Edit Informasi Mata Kuliah' : 'Input Mata Kuliah Baru'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="label">Nama Mata Kuliah</label>
              <input className="input-field" placeholder="Misal: Pemrograman Web" value={newCourse.name || ''} onChange={e => setNewCourse({...newCourse, name: e.target.value})} autoFocus/>
            </div>
            <div>
              <label className="label">Ruangan</label>
              <input className="input-field" placeholder="Misal: Lab Komputer 1" value={newCourse.room || ''} onChange={e => setNewCourse({...newCourse, room: e.target.value})} />
            </div>
            <div>
              <label className="label">Nama Dosen</label>
              <input className="input-field" placeholder="Misal: Dr. Budi Santoso" value={newCourse.lecturer || ''} onChange={e => setNewCourse({...newCourse, lecturer: e.target.value})} />
            </div>
            <div>
              <label className="label">Hari</label>
              <select className="input-field" value={newCourse.day} onChange={e => setNewCourse({...newCourse, day: e.target.value})}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
             <div><label className="label">Jam Mulai</label><input type="time" className="input-field" value={newCourse.startTime} onChange={e => setNewCourse({...newCourse, startTime: e.target.value})} /></div>
             <div><label className="label">Jam Selesai</label><input type="time" className="input-field" value={newCourse.endTime} onChange={e => setNewCourse({...newCourse, endTime: e.target.value})} /></div>
             <div><label className="label">Jumlah SKS</label><input type="number" min="1" max="8" className="input-field" value={newCourse.credits || 2} onChange={e => setNewCourse({...newCourse, credits: Number(e.target.value)})} /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2">
              <Plus size={18} /> {newCourse.id ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}
            </button>
          </div>
        </motion.form>
      )}
      </AnimatePresence>

      {/* Main Content Area */}
      {!hasClasses && !showForm ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed min-h-[400px]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-zinc-600">
            <Calendar size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Jadwal Kuliah Kosong</h3>
          <p className="text-zinc-400 max-w-sm mx-auto mb-6">Kamu belum menambahkan mata kuliah apapun. Mulai dengan menambah kelas manual atau scan gambar jadwalmu.</p>
          <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Plus size={18} /> Tambah Kelas Pertamamu
          </button>
        </div>
      ) : (
        <div className="flex-1 relative">
          
          {/* =========================================
              VIEW MODE: GRID (CALENDAR STYLE)
             ========================================= */}
          {viewMode === 'GRID' && (
            <div className="w-full overflow-x-auto custom-scrollbar pb-6">
              <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-6 min-w-[1000px] border border-white/10 shadow-xl">
                
                {/* Grid Header */}
                <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 mb-4">
                  <div className="text-center font-bold text-zinc-500 py-3 text-xs tracking-widest uppercase">Waktu</div>
                  {days.map(d => (
                    <div key={d} className="text-center font-bold text-zinc-300 bg-white/5 py-3 rounded-xl border border-white/5 text-sm uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 relative">
                   
                   {/* Time Column */}
                   <div className="flex flex-col relative" style={{ height: `${HOURS_COUNT * 60 * PIXELS_PER_MINUTE}px` }}>
                      {timeSlots.map(h => (
                        <div key={h} className="absolute w-full text-right pr-4" style={{ top: `${(h - START_HOUR) * 60 * PIXELS_PER_MINUTE}px`, transform: 'translateY(-50%)' }}>
                           <span className="text-[11px] font-mono text-zinc-500 font-medium bg-zinc-900/80 px-1">{h.toString().padStart(2, '0')}:00</span>
                        </div>
                      ))}
                   </div>

                   {/* Day Columns */}
                   {days.map(day => (
                     <div key={day} className="relative bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden" style={{ height: `${HOURS_COUNT * 60 * PIXELS_PER_MINUTE}px` }}>
                        
                        {/* Horizontal Grid Lines */}
                        {timeSlots.map(h => (
                          <div key={h} className="absolute w-full border-t border-white/5 border-dashed" style={{ top: `${(h - START_HOUR) * 60 * PIXELS_PER_MINUTE}px` }}></div>
                        ))}
                        
                        {/* Render Courses for this day */}
                        {courses.filter(c => c.day === day).map(course => {
                          const theme = generateColor(course.name);
                          return (
                            <div 
                              key={course.id}
                              style={getAbsoluteStyle(course)}
                              className={`absolute w-[94%] left-[3%] rounded-xl p-3 shadow-lg transition-all cursor-pointer group z-10 border flex flex-col justify-between overflow-hidden ${theme.bg} ${theme.border} ${theme.hover}`}
                            >
                               {/* Background Pattern/Glow */}
                               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                               
                               <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-1.5">
                                   <div className="flex flex-col">
                                     <h4 className={`text-sm font-bold leading-tight drop-shadow-md text-white mb-0.5`} title={course.name}>{course.name}</h4>
                                     <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} opacity-80`}>{course.credits} SKS</span>
                                   </div>
                                   
                                   {/* Actions */}
                                   <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10 shrink-0">
                                     <button onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }} className="text-zinc-300 hover:text-white p-0.5"><Edit2 size={12} /></button>
                                     <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} className="text-rose-400 hover:text-rose-300 p-0.5"><Trash2 size={12} /></button>
                                   </div>
                                 </div>
                               </div>

                               <div className="relative z-10 mt-2 space-y-1">
                                 <div className={`text-[11px] font-medium flex items-center gap-1.5 text-zinc-300 bg-black/30 w-fit px-2 py-0.5 rounded-md border border-white/5`}>
                                   <Clock size={12} className={theme.text}/> {course.startTime} - {course.endTime}
                                 </div>
                                 <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 truncate" title={course.room}>
                                   <MapPin size={12} className={theme.text}/> {course.room}
                                 </p>
                                 {course.lecturer && course.lecturer !== '-' && (
                                   <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 truncate" title={course.lecturer}>
                                     <User size={12} className={theme.text}/> {course.lecturer}
                                   </p>
                                 )}
                                 {tasks && tasks.filter(t => t.subject === course.name && t.status !== 'DONE').length > 0 && (
                                   <div className="mt-2 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 w-fit px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                     <CheckSquare size={10} /> {tasks.filter(t => t.subject === course.name && t.status !== 'DONE').length} Tugas
                                   </div>
                                 )}
                               </div>
                            </div>
                          );
                        })}
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              VIEW MODE: LIST (TIMELINE STYLE)
             ========================================= */}
          {viewMode === 'LIST' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-8">
              {days.map(day => {
                const dayCourses = courses.filter(c => c.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                // Only render days that have classes, OR render all but clearly indicate it's free.
                if (dayCourses.length === 0) return null; // Hide empty days to keep it clean

                return (
                  <div key={day} className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl h-fit">
                    <h3 className="font-bold text-xl text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                         <Calendar size={20} />
                       </div>
                       {day}
                    </h3>
                    
                    <div className="relative">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10 rounded-full"></div>
                      
                      <div className="space-y-6">
                        {dayCourses.map((c, idx) => {
                          const theme = generateColor(c.name);
                          return (
                            <div key={c.id} className="relative pl-10 group">
                              {/* Timeline Dot */}
                              <div className={`absolute left-[9px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-zinc-900 ${theme.bg.replace('/10', '/100')} border ${theme.border}`}></div>
                              
                              <div className={`bg-zinc-800/50 p-4 rounded-2xl border border-white/5 transition-all hover:bg-zinc-800 relative overflow-hidden group-hover:border-white/10`}>
                                {/* Left accent line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bg.replace('/10', '/100')} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                                
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-white text-base leading-tight pr-8">{c.name}</h4>
                                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 p-1 rounded-lg border border-white/10">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditCourse(c); }} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10"><Edit2 size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-zinc-400 hover:text-rose-400 p-1 rounded hover:bg-rose-400/20"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 mt-3">
                                  <div className="flex items-center gap-3 text-sm text-zinc-300 font-mono bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                    <Clock size={14} className={theme.text}/> {c.startTime} <span className="text-zinc-600">-</span> {c.endTime}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                      <MapPin size={14} className="text-zinc-500"/>
                                      <span className="truncate">{c.room}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                      <BookType size={14} className="text-zinc-500"/>
                                      <span>{c.credits} SKS</span>
                                    </div>
                                    {c.lecturer && c.lecturer !== '-' && (
                                      <div className="flex items-center gap-2 text-sm text-zinc-400 sm:col-span-2">
                                        <User size={14} className="text-zinc-500"/>
                                        <span className="truncate">{c.lecturer}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Pending Tasks Integration */}
                                  {tasks && tasks.filter(t => t.subject === c.name && t.status !== 'DONE').length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                                        <CheckSquare size={12} /> Tugas Tertunda
                                      </div>
                                      <div className="space-y-1.5">
                                        {tasks.filter(t => t.subject === c.name && t.status !== 'DONE').map(task => (
                                          <div key={task.id} className="flex items-center gap-2 text-xs text-zinc-300 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'HIGH' ? 'bg-red-400' : task.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                                            <span className="truncate flex-1">{task.title}</span>
                                            {task.deadline && <span className="text-[10px] text-zinc-500 font-mono shrink-0">{new Date(task.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Optional: Show empty state if NO days have courses but hasClasses is true */}
              {hasClasses && days.every(d => courses.filter(c => c.day === d).length === 0) && (
                <div className="col-span-full text-center py-12 text-zinc-500">
                  Tidak ada jadwal yang aktif.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .input-field { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.875rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; backdrop-filter: blur(10px); }
        .input-field:focus { border-color: rgb(var(--color-primary)); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 4px rgba(var(--color-primary), 0.1); }
        .label { display: block; font-size: 0.75rem; color: #a1a1aa; margin-bottom: 0.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        option { background: #18181b; color: white; padding: 10px; }
      `}</style>
    </div>
  );
};
