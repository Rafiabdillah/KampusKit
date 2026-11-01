import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { auth, signInWithPopup, googleProvider, signOut } from '../services/firebase';
import { StorageService } from '../services/storage';
import { Shield, Cloud, CloudOff, Trophy, Star, Zap, Activity, User, LogOut, CheckCircle, RefreshCw, Flame, Edit3, BrainCircuit, Target } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export const ProfileHub: React.FC = () => {
  const userProfile = useStore(state => state.userProfile);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [stats, setStats] = useState({
    tasksDone: 0,
    habitsDone: 0,
    notesCreated: 0,
    schulteBest: 0,
    goalsCompleted: 0
  });

  useEffect(() => {
    const tasks = StorageService.getItem<any[]>('tasks', []);
    const notes = StorageService.getItem<any[]>('notes', []);
    const habits = StorageService.getItem<any[]>('habits', []);
    const goals = StorageService.getItem<any[]>('user_goals', []);
    
    let habitsTotal = 0;
    habits.forEach(h => { if(h.completedDates) habitsTotal += h.completedDates.length; });

    setStats({
      tasksDone: tasks.filter(t => t.status === 'DONE').length,
      notesCreated: notes.length,
      habitsDone: habitsTotal,
      schulteBest: StorageService.getItem('schulte_best', 0),
      goalsCompleted: goals.filter(g => g.completed).length
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Optional: push initial data immediately after login
      // Automatically handled by onAuthStateChanged
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Keluar dari akun? Pelacakan GPS akan dihentikan dan data akun pada perangkat ini akan dibersihkan demi keamanan (pengaturan bahasa & tema tetap tersimpan).')) return;
    try {
      StorageService.clearUserData(true);
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleForceSync = async () => {
    if (!firebaseUser) return;
    setIsSyncing(true);
    try {
      await StorageService.syncToFirebase(firebaseUser.uid);
      setTimeout(() => setIsSyncing(false), 1000); // UI feedback
    } catch (e) {
      console.error("Sync failed", e);
      setIsSyncing(false);
    }
  };

  // RPG Logic Calculations
  const xp = userProfile.xp || 0;
  const level = userProfile.level || 1;
  const xpForNextLevel = level * 1000;
  const progressPercent = Math.min(100, Math.max(0, (xp / xpForNextLevel) * 100));

  const getRankName = (lvl: number) => {
    if (lvl < 5) return 'Novice Scholar';
    if (lvl < 10) return 'Dedicated Apprentice';
    if (lvl < 20) return 'Adept Explorer';
    if (lvl < 35) return 'Master of Focus';
    return 'Grandmaster Architect';
  };

  const achievementsData = [
      { id: 'first_blood', title: 'Langkah Pertama', desc: 'Dapatkan 100 XP pertama.', icon: <Star size={20}/>, color: 'text-yellow-500', bg: 'bg-yellow-500/10', iconBg: 'bg-yellow-500/20', border: 'border-yellow-500/20', unlocked: xp >= 100 },
      { id: 'level_5', title: 'Konsistensi', desc: 'Capai Level 5 di aplikasi.', icon: <Trophy size={20}/>, color: 'text-green-500', bg: 'bg-green-500/10', iconBg: 'bg-green-500/20', border: 'border-green-500/20', unlocked: level >= 5 },
      { id: 'cloud', title: 'Cloud Native', desc: 'Amankan data dengan Cloud Sync.', icon: <Cloud size={20}/>, color: 'text-blue-500', bg: 'bg-blue-500/10', iconBg: 'bg-blue-500/20', border: 'border-blue-500/20', unlocked: !!firebaseUser },
      { id: 'fire', title: 'On Fire', desc: 'Pertahankan 7 hari streak berturut-turut.', icon: <Flame size={20}/>, color: 'text-orange-500', bg: 'bg-orange-500/10', iconBg: 'bg-orange-500/20', border: 'border-orange-500/20', unlocked: (userProfile.streak || 0) >= 7 },
      { id: 'task_master', title: 'Task Master', desc: 'Selesaikan 10 tugas kuliah.', icon: <CheckCircle size={20}/>, color: 'text-purple-500', bg: 'bg-purple-500/10', iconBg: 'bg-purple-500/20', border: 'border-purple-500/20', unlocked: stats.tasksDone >= 10 },
      { id: 'writer', title: 'Pujangga Baru', desc: 'Tulis 5 catatan di Notes.', icon: <Edit3 size={20}/>, color: 'text-pink-500', bg: 'bg-pink-500/10', iconBg: 'bg-pink-500/20', border: 'border-pink-500/20', unlocked: stats.notesCreated >= 5 },
      { id: 'habit_builder', title: 'Habit Builder', desc: 'Lakukan kebiasaan total 20 kali.', icon: <Activity size={20}/>, color: 'text-emerald-500', bg: 'bg-emerald-500/10', iconBg: 'bg-emerald-500/20', border: 'border-emerald-500/20', unlocked: stats.habitsDone >= 20 },
      { id: 'focus_god', title: 'Fokus Dewa', desc: 'Selesaikan Brain Gym (Schulte) di bawah 15 detik.', icon: <BrainCircuit size={20}/>, color: 'text-cyan-500', bg: 'bg-cyan-500/10', iconBg: 'bg-cyan-500/20', border: 'border-cyan-500/20', unlocked: stats.schulteBest > 0 && stats.schulteBest <= 15 },
      { id: 'goal_getter', title: 'Goal Getter', desc: 'Selesaikan 3 Target Utama.', icon: <Target size={20}/>, color: 'text-rose-500', bg: 'bg-rose-500/10', iconBg: 'bg-rose-500/20', border: 'border-rose-500/20', unlocked: stats.goalsCompleted >= 3 },
  ];
  
  const badgesEarned = achievementsData.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Shield className="text-primary" />
            Profile & Cloud
          </h2>
          <p className="text-zinc-400 mt-1">Manage your identity, XP progression, and cloud sync.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Cloud & Auth */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden">
             {firebaseUser ? (
               <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             ) : (
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-600"></div>
             )}
             
             <h3 className="font-bold text-white mb-6 flex items-center gap-2">
               {firebaseUser ? <Cloud className="text-green-500" /> : <CloudOff className="text-zinc-500" />}
               Cloud Connection
             </h3>

             {firebaseUser ? (
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500/30">
                      {firebaseUser.photoURL ? (
                        <img src={firebaseUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-bold"><User size={20}/></div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-white truncate">{firebaseUser.displayName}</p>
                     <p className="text-xs text-zinc-400 truncate">{firebaseUser.email}</p>
                   </div>
                 </div>

                 <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-0.5">Secure Backup Active</p>
                      <p className="text-[10px] text-zinc-400">Your data is automatically synced to Firebase Firestore securely.</p>
                    </div>
                 </div>

                 <div className="flex gap-2">
                   <button 
                     onClick={handleForceSync}
                     disabled={isSyncing}
                     className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                     {isSyncing ? 'Syncing...' : 'Force Sync'}
                   </button>
                   <button 
                     onClick={handleLogout}
                     className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                     title="Sign Out"
                   >
                     <LogOut size={16} />
                   </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-6">
                 <p className="text-sm text-zinc-400">
                   You are currently using Local Storage. Sign in to sync your progress, invoices, and gym logs across all devices.
                 </p>
                 <button 
                   onClick={handleLogin}
                   disabled={isLoggingIn}
                   className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-white/10"
                 >
                   <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                   {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Right Col: Gamification RPG Stats */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass-card rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Shield size={120} />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                 {/* Avatar / Level Ring */}
                 <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-800 flex items-center justify-center bg-zinc-900 relative z-10 overflow-hidden shadow-2xl">
                       {userProfile.photo ? (
                         <img src={userProfile.photo} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-5xl font-black text-zinc-700">{(userProfile.name || 'M').charAt(0)}</span>
                       )}
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/40 border-2 border-black z-20 whitespace-nowrap">
                       Lv. {level}
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="flex-1 w-full text-center md:text-left">
                    <h2 className="text-3xl font-black text-white">{userProfile.name || 'Mahasiswa'}</h2>
                    <p className="text-primary font-bold tracking-widest uppercase text-sm mb-4">{getRankName(level)}</p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-zinc-400">
                         <span>XP PROGRESS</span>
                         <span>{xp} / {xpForNextLevel} XP</span>
                       </div>
                       <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${progressPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Stats / Achievements Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                 <Zap className="text-yellow-500 mb-2" size={24} />
                 <span className="text-2xl font-black text-white">{userProfile.streak || 0}</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Day Streak</span>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                 <Trophy className="text-amber-500 mb-2" size={24} />
                 <span className="text-2xl font-black text-white">{badgesEarned}</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Badges Earned</span>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                 <Star className="text-blue-500 mb-2" size={24} />
                 <span className="text-2xl font-black text-white">{stats.tasksDone}</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Tasks Done</span>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                 <Activity className="text-green-500 mb-2" size={24} />
                 <span className="text-2xl font-black text-white">{userProfile.semester || 1}</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Semester</span>
              </div>
           </div>

           {/* Badges List (Dynamic based on real stats) */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">Pencapaian (Achievements)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                 {achievementsData.sort((a, b) => (b.unlocked === a.unlocked ? 0 : b.unlocked ? -1 : 1)).map(ach => (
                    <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${ach.unlocked ? `${ach.bg} ${ach.border}` : 'bg-zinc-800/50 border-zinc-700/50 grayscale opacity-50'}`}>
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${ach.unlocked ? `${ach.iconBg} ${ach.color}` : 'bg-zinc-700 text-zinc-400'}`}>
                           {ach.icon}
                        </div>
                        <div>
                           <p className="font-bold text-sm text-white leading-tight mb-1">{ach.title}</p>
                           <p className="text-[10px] text-zinc-400 leading-tight">{ach.desc}</p>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
