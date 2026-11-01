import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Task, Course, TaskStatus, Transaction, Habit } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle, Calendar as CalIcon, TrendingUp, Wallet, CheckSquare, Target, GraduationCap, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore } from '../store/useStore';

interface AttendanceRecord {
  courseId: string;
  courseName: string;
  totalMeetings: number;
  attended: number;
  absent: number;
}

interface GradeItem {
  id: number;
  course: string;
  credits: number;
  grade: number;
}

export const Statistics = ({ tasks, courses }: { tasks: Task[], courses: Course[] }) => {
  const userProfile = useStore(state => state.userProfile);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    setAttendance(StorageService.getItem<AttendanceRecord[]>('attendance', []));
    setTransactions(StorageService.getItem<Transaction[]>('transactions', []));
    setGrades(StorageService.getItem<GradeItem[]>('grade_data', []));
    setHabits(StorageService.getItem<Habit[]>('habits', []));

    // Generate weekly data (Last 7 days)
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d);
    }

    const data = last7Days.map(date => {
      const dayName = days[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];

      // Tasks completed on this day
      const tasksCompleted = tasks.filter(t => {
        if (t.status !== TaskStatus.DONE) return false;
        if (t.completedAt) {
          const compDate = new Date(t.completedAt).toISOString().split('T')[0];
          return compDate === dateStr;
        }
        return t.deadline === dateStr;
      }).length;

      // Classes on this day
      const classesToday = courses.filter(c => c.day === dayName).length;

      // Simple Productivity Score
      const productivityScore = (tasksCompleted * 10) + (classesToday * 5);

      return {
        name: dayName.substring(0, 3), // Sen, Sel, etc.
        fullDate: dateStr,
        'Tugas Selesai': tasksCompleted,
        'Jadwal Kelas': classesToday,
        'Skor Produktivitas': productivityScore
      };
    });

    setChartData(data);
  }, [tasks, courses]);

  // Overall KPIs
  const totalTasksDone = tasks.filter(t => t.status === TaskStatus.DONE).length;
  
  // Deduplicate attendance by normalized courseName to prevent double counting from old data
  const uniqueAttendance = Object.values(
    attendance.reduce((acc, rec) => {
      const normalized = rec.courseName.trim().toLowerCase();
      if (!acc[normalized]) {
        acc[normalized] = { ...rec, courseName: rec.courseName.trim() };
      } else {
        acc[normalized].attended = Math.max(acc[normalized].attended, rec.attended);
        acc[normalized].absent = Math.max(acc[normalized].absent, rec.absent);
      }
      return acc;
    }, {} as Record<string, AttendanceRecord>)
  );

  const totalAttended = uniqueAttendance.reduce((sum, r) => sum + r.attended, 0);
  const totalAbsent = uniqueAttendance.reduce((sum, r) => sum + r.absent, 0);
  const attendanceRate = totalAttended + totalAbsent > 0 
    ? Math.round((totalAttended / (totalAttended + totalAbsent)) * 100) 
    : 100;

  // Task Status Data
  const taskStatusData = [
    { name: 'Selesai', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#10b981' },
    { name: 'Sedang Berjalan', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#f59e0b' },
    { name: 'Belum Mulai', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // Budget Data (Current Month)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  const income = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expense = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  // Expense Breakdown
  const expenseByCategory = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.entries(expenseByCategory)
    .map(([name, value], index) => {
      const colors = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
      return { name, value, color: colors[index % colors.length] };
    })
    .sort((a, b) => b.value - a.value);

  // Grade / GPA Calculation
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  const totalPoints = grades.reduce((sum, g) => sum + (g.grade * g.credits), 0);
  const currentGpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.00;
  const targetGpa = userProfile?.targetGpa || 4.0;
  const gpaDiff = targetGpa - currentGpa;

  // Habits Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const habitsCompletedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const totalHabits = habits.length;

  return (
    <div className="h-auto lg:h-full w-full flex flex-col animate-fade-in max-w-7xl mx-auto overflow-y-auto lg:overflow-hidden custom-scrollbar pr-1 lg:pr-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Activity className="text-primary" size={24} /> Statistik & Analitik
          </h2>
          <p className="text-zinc-400 mt-1 text-xs">Visualisasi komprehensif data akademik, keuangan, dan produktivitasmu.</p>
        </div>
      </div>

      {/* Main KPI Grid - Shrink 0 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
        <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckSquare size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">Tugas Selesai</p>
            <h3 className="text-xl font-black text-white truncate">{totalTasksDone}</h3>
          </div>
        </div>
        
        <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">IPK Saat Ini</p>
            <h3 className="text-xl font-black text-white truncate">{currentGpa.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">Kehadiran</p>
            <h3 className="text-xl font-black text-white truncate">{attendanceRate}%</h3>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full ${balance >= 0 ? 'bg-primary/20 text-primary' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center shrink-0`}>
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate">Saldo Bulan Ini</p>
            <h3 className={`text-lg font-black truncate ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              Rp {balance.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable on small, flex on large */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-4 lg:pb-0">
        
        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 lg:min-h-[260px]">
          {/* Productivity Trend */}
          <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col min-h-[250px] lg:min-h-0">
            <h3 className="text-sm font-bold text-white mb-4 shrink-0">Tren Produktivitas (7 Hari Terakhir)</h3>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: -10, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="Tugas Selesai" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Jadwal Kelas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="Skor Produktivitas" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Academic Target */}
          <div className="lg:col-span-1 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col min-h-[250px] lg:min-h-0 justify-center relative">
            <h3 className="text-sm font-bold text-white absolute top-5 left-5">Target Akademik</h3>
            <div className="flex flex-col items-center justify-center mt-6 gap-6">
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-800" />
                  <circle 
                    cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 - (Math.min(100, (currentGpa / targetGpa) * 100) / 100) * (2 * Math.PI * 54)}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-3xl font-black text-white">{currentGpa.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex w-full justify-around bg-zinc-950/50 rounded-xl p-3 border border-white/5">
                <div className="text-center">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Target IPK</p>
                  <p className="text-base font-bold text-white">{targetGpa.toFixed(2)}</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Selisih</p>
                  <div className={`flex items-center gap-1 text-base font-bold ${gpaDiff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {gpaDiff > 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    {Math.abs(gpaDiff).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0 lg:flex-1 lg:min-h-0">
          
          {/* Expense Distribution */}
          <div className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col min-h-[250px] lg:min-h-0">
            <h3 className="text-sm font-bold text-white mb-2 shrink-0">Distribusi Pengeluaran</h3>
            <div className="flex-1 min-h-0 relative">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-zinc-500 text-xs">Belum ada pengeluaran bulan ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Task Status & Habits */}
          <div className="flex flex-col gap-4 min-h-[350px] lg:min-h-0">
            {/* Task Breakdown */}
            <div className="flex-1 bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col min-h-[200px] lg:min-h-0">
              <h3 className="text-sm font-bold text-white mb-2 shrink-0">Status Tugas</h3>
              <div className="flex-1 min-h-0 relative">
                {taskStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-zinc-500 text-xs">Belum ada tugas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Habits Summary */}
            <div className="flex-1 bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-h-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" /> Kebiasaan Hari Ini
                </h3>
                <span className="text-xs font-bold text-zinc-400">{habitsCompletedToday} / {totalHabits}</span>
              </div>
              
              <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${totalHabits > 0 ? (habitsCompletedToday / totalHabits) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 text-center mt-3">
                {totalHabits === 0 
                  ? 'Belum ada data kebiasaan (Habit) yang dilacak.' 
                  : habitsCompletedToday === totalHabits 
                    ? 'Sempurna! Semua kebiasaan selesai hari ini. 🎉' 
                    : 'Ayo selesaikan kebiasaan harianmu!'}
              </p>
            </div>
          </div>

          {/* Attendance Rates per Course */}
          <div className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col min-h-[250px] lg:min-h-0">
            <h3 className="text-sm font-bold text-white mb-4 shrink-0">Kehadiran per Kelas</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {uniqueAttendance.length > 0 ? (
                uniqueAttendance.map((rec) => {
                  const total = rec.attended + rec.absent;
                  const percentage = total > 0 ? Math.round((rec.attended / total) * 100) : 0;
                  let color = 'bg-emerald-500';
                  if (percentage < 75) color = 'bg-rose-500';
                  else if (percentage < 85) color = 'bg-amber-500';

                  return (
                    <div key={rec.courseId} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end text-xs">
                        <span className="font-bold text-zinc-300 truncate max-w-[70%]">{rec.courseName}</span>
                        <span className={`font-black ${percentage < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>{percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                  <GraduationCap size={24} className="opacity-20" />
                  <span>Belum ada data presensi kelas</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

