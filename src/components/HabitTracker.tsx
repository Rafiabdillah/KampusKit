import { useStore } from '../store/useStore';
import React, { useState, useEffect, useMemo } from 'react';
import { Habit } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Flame, Check, X, TrendingUp, Zap, Calendar, Trash2, Repeat, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { playNotificationSound } from '../utils/sound';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const onGainXp = useStore(state => state.gainXp);
  const [showForm, setShowForm] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  
  // History Modal State
  const [historyHabitId, setHistoryHabitId] = useState<string | null>(null);
  const [historyMonth, setHistoryMonth] = useState(new Date());

  // New/Edit Habit Form State
  const [title, setTitle] = useState('');
  const [trigger, setTrigger] = useState('');
  const [category, setCategory] = useState<Habit['category']>('STUDY');
  const [selectedEmoji, setSelectedEmoji] = useState('⚡');

  useEffect(() => {
    setHabits(StorageService.getItem<Habit[]>('habits', []));
  }, []);

  const saveHabits = (updated: Habit[]) => {
    setHabits(updated);
    StorageService.setItem('habits', updated);
  };

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;
    
    // Sort dates descending (newest first)
    const sorted = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let streak = 0;
    let currentDateCheck = today;

    // Check if streak is alive (completed today or yesterday)
    if (sorted[0] !== today && sorted[0] !== yesterday) {
      return 0;
    }

    // Adjust start check if completed today
    if (sorted[0] === today) {
        streak = 1;
        currentDateCheck = yesterday;
    } else if (sorted[0] === yesterday) {
        streak = 0; // Will be incremented in loop if yesterday exists
        currentDateCheck = yesterday; // Start checking from yesterday
    }

    // Logic for consecutive days
    for (const date of sorted) {
       if (date === today) continue; // Already handled
       
       // Calculate difference in days
       const diff = (new Date(currentDateCheck).getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);
       
       if (diff <= 1) { // 0 or 1 day difference means consecutive
           streak++;
           currentDateCheck = date;
       } else {
           break;
       }
    }
    return streak;
  };

  const startEdit = (habit: Habit) => {
    setTitle(habit.title);
    setTrigger(habit.trigger);
    setCategory(habit.category);
    setSelectedEmoji(habit.icon);
    setEditingHabitId(habit.id);
    setShowForm(true);
  };

  const addHabit = () => {
    if (!title) return;
    
    if (editingHabitId) {
      const updated = habits.map(h => {
        if (h.id === editingHabitId) {
          return { ...h, title, trigger: trigger || 'Setiap hari pada jam...', icon: selectedEmoji, category };
        }
        return h;
      });
      saveHabits(updated);
    } else {
      const newHabit: Habit = {
        id: StorageService.generateId(),
        title,
        trigger: trigger || 'Setiap hari pada jam...',
        completedDates: [],
        streak: 0,
        bestStreak: 0,
        icon: selectedEmoji,
        category,
        color: category === 'STUDY' ? '#3b82f6' : category === 'HEALTH' ? '#10b981' : category === 'SPIRITUAL' ? '#8b5cf6' : '#f59e0b'
      };
      saveHabits([...habits, newHabit]);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTrigger('');
    setEditingHabitId(null);
    setShowForm(false);
  };

  const deleteHabit = (id: string) => {
    if (confirm('Hapus kebiasaan ini? Statistik akan hilang.')) {
      saveHabits(habits.filter(h => h.id !== id));
    }
  };

  const toggleCompletion = (habitId: string, dateStr: string) => {
    let gainedXp = false;
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const isCompleted = (h.completedDates || []).includes(dateStr);
        let newDates: string[];
        
        if (isCompleted) {
          newDates = (h.completedDates || []).filter(d => d !== dateStr);
        } else {
          newDates = [...(h.completedDates || []), dateStr];
          gainedXp = true;
          const userSound = StorageService.getItem<string>('notificationSound', 'success');
          playNotificationSound(userSound);
        }

        const currentStreak = calculateStreak(newDates);
        return {
          ...h,
          completedDates: newDates,
          streak: currentStreak,
          bestStreak: Math.max(h.bestStreak, currentStreak)
        };
      }
      return h;
    });
    saveHabits(updatedHabits);
    if (gainedXp) {
        onGainXp(10);
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Stats
  const totalCompletions = habits.reduce((acc, h) => acc + (h.completedDates || []).length, 0);
  const currentLevel = Math.floor(totalCompletions / 10) + 1;
  const progressToNext = (totalCompletions % 10) * 10;

  // Generate chart data (last 14 days)
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNamesArr = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dayName = dayNamesArr[d.getDay()];
      
      const completedCount = habits.filter(h => (h.completedDates || []).includes(dateStr)).length;
      data.push({
        name: i === 0 ? 'Hr Ini' : dayName,
        fullDate: dateStr,
        Selesai: completedCount
      });
    }
    return data;
  }, [habits]);

  // Calendar Helpers for History Modal
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderHistoryModal = () => {
    if (!historyHabitId) return null;
    const habit = habits.find(h => h.id === historyHabitId);
    if (!habit) return null;

    const year = historyMonth.getFullYear();
    const month = historyMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // Adjust to local date string reliably
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isCompleted = (habit.completedDates || []).includes(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isFuture = date > new Date();

      days.push(
        <button
          key={dateStr}
          disabled={isFuture}
          onClick={() => toggleCompletion(habit.id, dateStr)}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm transition-all
            ${isFuture ? 'opacity-20 cursor-not-allowed text-slate-500' : 'cursor-pointer hover:scale-110'}
            ${isCompleted ? 'text-white shadow-[0_0_10px_currentColor]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
            ${isToday && !isCompleted ? 'border-2 border-primary' : ''}
          `}
          style={isCompleted ? { backgroundColor: habit.color, boxShadow: `0 0 10px ${habit.color}60` } : {}}
        >
          {i}
        </button>
      );
    }

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
          <button 
            onClick={() => setHistoryHabitId(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-4 mb-6 pr-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${habit.color}20` }}>
              {habit.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">{habit.title}</h3>
              <p className="text-sm text-slate-400">Riwayat Habit</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-xl p-2">
            <button 
              onClick={() => setHistoryMonth(new Date(year, month - 1))}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h4 className="font-bold text-white">
              {monthNames[month]} {year}
            </h4>
            <button 
              onClick={() => setHistoryMonth(new Date(year, month + 1))}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-xs font-bold text-slate-500">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2 justify-items-center">
            {days}
          </div>
          
          <div className="mt-6 flex justify-between items-center text-sm border-t border-slate-700 pt-4">
            <div className="text-slate-400">
              Total Selesai: <strong className="text-white">{(habit.completedDates || []).length}</strong>
            </div>
            <div className="text-slate-400">
              Best Streak: <strong className="text-white">{habit.bestStreak}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Repeat className="text-primary" size={32} /> 
            Atomic Habit Tracker
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Bangun sistem, bukan sekadar tujuan. Konsistensi kecil menghasilkan perubahan besar.
          </p>
        </div>
        
        {/* Gamification Card */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 min-w-[240px]">
           <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary relative">
              <Zap size={24} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-slate-800"></div>
           </div>
           <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-white mb-1">
                 <span>Level {currentLevel}</span>
                 <span>{progressToNext}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500" style={{ width: `${progressToNext}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{totalCompletions} repetisi total</p>
           </div>
        </div>
      </div>

      {/* Disiplin Trend Chart */}
      {habits.length > 0 && (
        <div className="bg-card border border-slate-700 p-6 rounded-2xl mb-8 shadow-xl">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <TrendingUp className="text-emerald-400" size={20} /> Tren Disiplin (14 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-400">Total Habit Selesai per Hari</p>
           </div>
           <div className="w-full h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.75rem' }}
                   itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                   labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                   labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                 />
                 <Area type="monotone" dataKey="Selesai" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSelesai)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-6 transition-all"
        >
          <Plus size={20} /> Tambah Kebiasaan Baru
        </button>
      )}

      {showForm && (
        <div className="bg-card border border-slate-700 p-6 rounded-2xl mb-8 animate-slide-in shadow-xl">
           <h3 className="text-xl font-bold text-white mb-4">
             {editingHabitId ? 'Edit Kebiasaan' : 'Tambah Kebiasaan Baru'}
           </h3>
           <div className="flex gap-4 mb-4">
              <div className="flex flex-col gap-2">
                 <label className="text-xs text-slate-400">Icon</label>
                 <select 
                   className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xl focus:outline-none"
                   value={selectedEmoji}
                   onChange={e => setSelectedEmoji(e.target.value)}
                 >
                    <option value="⚡">⚡</option>
                    <option value="📚">📚</option>
                    <option value="💪">💪</option>
                    <option value="🧘">🧘</option>
                    <option value="💧">💧</option>
                    <option value="💰">💰</option>
                    <option value="🎨">🎨</option>
                    <option value="🧠">🧠</option>
                 </select>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                 <label className="text-xs text-slate-400">Nama Kebiasaan (Identity Based)</label>
                 <input 
                   className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg w-full focus:border-primary focus:outline-none"
                   placeholder="Contoh: Saya adalah pembaca rutin"
                   value={title}
                   onChange={e => setTitle(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">Trigger (Kapan/Dimana?)</label>
              <input 
                 className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg w-full focus:border-primary focus:outline-none"
                 placeholder="Contoh: Setelah menyikat gigi..."
                 value={trigger}
                 onChange={e => setTrigger(e.target.value)}
              />
           </div>

           <div className="flex gap-2 mb-6">
              {['STUDY', 'HEALTH', 'SPIRITUAL', 'SKILL'].map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setCategory(cat as any)}
                   className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${category === cat ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                 >
                   {cat}
                 </button>
              ))}
           </div>

           <div className="flex gap-3">
              <button onClick={addHabit} className="flex-1 bg-primary text-white py-2 rounded-lg font-bold">Simpan</button>
              <button onClick={resetForm} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">Batal</button>
           </div>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-4">
        {habits.map(habit => (
          <div key={habit.id} className="bg-card border border-slate-700 rounded-2xl p-5 hover:border-slate-500 transition-all group relative overflow-hidden">
             
             {/* Progress Bar Background */}
             <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min(((habit.completedDates || []).length / 30) * 100, 100)}%`,
                    backgroundColor: habit.color
                  }}
                ></div>
             </div>

             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                {/* Info Section */}
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: `${habit.color}20` }}>
                      {habit.icon}
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-white">{habit.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                         <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{habit.category}</span>
                         <span className="italic flex items-center gap-1"><Zap size={10} /> "{habit.trigger}"</span>
                      </div>
                   </div>
                </div>

                {/* Interactive Week Heatmap */}
                <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                   {last7Days.map((date, idx) => {
                      const isDone = (habit.completedDates || []).includes(date);
                      const isToday = date === new Date().toISOString().split('T')[0];
                      const dayName = dayNames[new Date(date).getDay()];

                      return (
                        <button
                          key={date}
                          onClick={() => toggleCompletion(habit.id, date)}
                          className={`flex flex-col items-center justify-center w-8 h-10 rounded-lg transition-all duration-300 relative group/day ${isDone ? 'scale-100' : 'hover:bg-slate-700'}`}
                        >
                           <span className="text-[9px] text-slate-500 font-bold mb-1">{dayName}</span>
                           <div 
                             className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                               isDone 
                               ? `bg-${habit.category === 'STUDY' ? 'blue' : 'green'}-500 border-transparent text-white shadow-[0_0_10px_currentColor]` 
                               : `border-slate-600 ${isToday ? 'border-primary' : ''} text-transparent`
                             }`}
                             style={isDone ? { backgroundColor: habit.color, boxShadow: `0 0 10px ${habit.color}60` } : {}}
                           >
                              {isDone && <Check size={14} strokeWidth={4} />}
                           </div>
                           {isToday && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>}
                        </button>
                      );
                   })}
                </div>

                {/* Streak Counter */}
                <div className="flex items-center gap-4 min-w-[120px] justify-end">
                   <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xl font-black text-white">
                         {habit.streak} <Flame className={`${habit.streak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-600'}`} size={20} />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Current Streak</p>
                   </div>
                   
                   <div className="flex flex-col gap-1">
                     <button 
                       onClick={() => setHistoryHabitId(habit.id)}
                       className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                       title="Riwayat Habit"
                     >
                        <Calendar size={18} />
                     </button>
                     <button 
                       onClick={() => startEdit(habit)}
                       className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                     >
                        <Edit2 size={18} />
                     </button>
                     <button 
                       onClick={() => deleteHabit(habit.id)}
                       className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                     >
                        <Trash2 size={18} />
                     </button>
                   </div>
                </div>
             </div>
          </div>
        ))}

        {habits.length === 0 && (
           <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl">
              <TrendingUp className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 font-medium">Belum ada kebiasaan yang dilacak.</p>
              <p className="text-slate-500 text-sm mt-2">Mulai dari hal kecil, misal "Membaca 1 halaman".</p>
           </div>
        )}
      </div>

      {renderHistoryModal()}
    </div>
  );
};