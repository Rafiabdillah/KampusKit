
import React, { useState, useEffect } from 'react';
import { Moon, Sun, AlarmClock, BedDouble, Info, Coffee, Smartphone, Wind, Zap, BatteryCharging, ArrowDown } from 'lucide-react';

interface SleepTime {
  time: Date;
  cycles: number;
  label: string;
  quality: 'IDEAL' | 'GOOD' | 'OK' | 'RISKY';
  duration: string;
}

export const SleepCalculator: React.FC = () => {
  const [mode, setMode] = useState<'WAKE_AT' | 'SLEEP_NOW' | 'NAP'>('SLEEP_NOW');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [calculatedTimes, setCalculatedTimes] = useState<SleepTime[]>([]);
  const [caffeineLimit, setCaffeineLimit] = useState<string>('');

  // Constants based on Neuroscience
  const FALL_ASLEEP_MINUTES = 14; 
  const CYCLE_MINUTES = 90;

  useEffect(() => {
    calculateResults();
  }, [mode, wakeTime]);

  const calculateResults = () => {
    const times: SleepTime[] = [];
    const now = new Date();

    if (mode === 'SLEEP_NOW') {
      const sleepStart = new Date(now.getTime() + FALL_ASLEEP_MINUTES * 60000);
      
      [6, 5, 4, 3].forEach(cycles => {
        const durationMins = cycles * CYCLE_MINUTES;
        const wakeDate = new Date(sleepStart.getTime() + durationMins * 60000);
        times.push({
          time: wakeDate,
          cycles,
          label: cycles === 5 ? 'Mahasiswa Ideal' : cycles === 6 ? 'Atlet/Recovery' : cycles === 4 ? 'Minimum' : 'Darurat',
          quality: cycles >= 5 ? 'IDEAL' : cycles === 4 ? 'GOOD' : 'RISKY',
          duration: `${(durationMins / 60).toFixed(1)} Jam`
        });
      });
    } 
    else if (mode === 'WAKE_AT') {
      const [hours, minutes] = wakeTime.split(':').map(Number);
      const wakeDate = new Date();
      wakeDate.setHours(hours, minutes, 0, 0);
      
      if (wakeDate.getTime() < now.getTime()) {
        wakeDate.setDate(wakeDate.getDate() + 1); 
      }

      const idealBedTime = new Date(wakeDate.getTime() - (7.5 * 60 + FALL_ASLEEP_MINUTES) * 60000);
      const caffCutoff = new Date(idealBedTime.getTime() - 10 * 60 * 60 * 1000);
      setCaffeineLimit(caffCutoff.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

      [6, 5, 4, 3].forEach(cycles => {
        const durationMins = cycles * CYCLE_MINUTES;
        const bedDate = new Date(wakeDate.getTime() - (durationMins + FALL_ASLEEP_MINUTES) * 60000);
        times.push({
          time: bedDate,
          cycles,
          label: cycles === 5 ? 'Mahasiswa Ideal' : cycles === 6 ? 'Maksimal' : cycles === 4 ? 'Cukup' : 'Kurang',
          quality: cycles >= 5 ? 'IDEAL' : cycles === 4 ? 'GOOD' : 'RISKY',
          duration: `${(durationMins / 60).toFixed(1)} Jam`
        });
      });
      times.sort((a,b) => a.time.getTime() - b.time.getTime());
    }
    else if (mode === 'NAP') {
       const sleepStart = new Date(now.getTime() + FALL_ASLEEP_MINUTES * 60000);
       
       times.push({
         time: new Date(sleepStart.getTime() + 20 * 60000),
         cycles: 0.2,
         label: 'Power Nap',
         quality: 'IDEAL',
         duration: '20 Min'
       });
       
       times.push({
         time: new Date(sleepStart.getTime() + 90 * 60000),
         cycles: 1,
         label: '1 Siklus Penuh',
         quality: 'GOOD',
         duration: '90 Min'
       });
    }

    setCalculatedTimes(times);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getQualityColor = (q: string) => {
    switch(q) {
      case 'IDEAL': return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case 'GOOD': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'OK': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'RISKY': return 'bg-rose-500/20 border-rose-500 text-rose-400';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-3xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3 mb-2">
          <Moon className="text-indigo-400" size={28} /> 
          Smart Sleep Cycles
        </h2>
        <p className="text-slate-400 max-w-md mx-auto text-xs md:text-sm">
          Hindari <span className="text-indigo-400 font-bold">Sleep Inertia</span> (kepala berat) dengan bangun di akhir siklus 90 menit.
        </p>
      </div>

      {/* Main Calculator Card */}
      <div className="bg-card border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative mb-8">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
         
         {/* Controls */}
         <div className="p-6 bg-slate-900/50 border-b border-slate-700">
            <div className="flex bg-black/40 p-1 rounded-xl mb-6 max-w-lg mx-auto overflow-x-auto">
                <button onClick={() => setMode('SLEEP_NOW')} className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'SLEEP_NOW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Tidur Sekarang</button>
                <button onClick={() => setMode('WAKE_AT')} className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'WAKE_AT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Set Alarm Pagi</button>
                <button onClick={() => setMode('NAP')} className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'NAP' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Power Nap</button>
            </div>

            <div className="text-center min-h-[80px] flex flex-col justify-center">
               {mode === 'WAKE_AT' ? (
                  <div className="flex flex-col items-center gap-2 animate-fade-in">
                     <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Saya harus bangun jam:</label>
                     <div className="relative">
                       <input 
                         type="time" 
                         value={wakeTime}
                         onChange={(e) => setWakeTime(e.target.value)}
                         className="text-4xl md:text-5xl bg-transparent text-white font-mono font-bold focus:outline-none text-center w-full cursor-pointer p-0 m-0"
                         style={{ colorScheme: 'dark' }}
                       />
                     </div>
                  </div>
               ) : mode === 'SLEEP_NOW' ? (
                  <p className="text-xl md:text-2xl text-white font-medium animate-fade-in px-4">
                     Jika tidur dalam <span className="text-indigo-400 font-bold">14 menit</span>...
                  </p>
               ) : (
                  <p className="text-xl md:text-2xl text-white font-medium animate-fade-in px-4">
                     Recharge energi tanpa pusing...
                  </p>
               )}
            </div>
         </div>

         {/* Results Grid */}
         <div className="p-4 md:p-6 bg-slate-900/20">
            <p className="text-center text-slate-500 text-xs mb-4">
               {mode === 'WAKE_AT' ? 'Pasang alarm tidur pada salah satu jam ini:' : 'Sebaiknya pasang alarm bangun pada:'}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
               {calculatedTimes.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 md:p-4 rounded-2xl border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer relative group ${getQualityColor(item.quality)}`}
                  >
                     {item.quality === 'IDEAL' && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg whitespace-nowrap z-10">REKOMENDASI</div>}
                     <span className="text-2xl md:text-3xl font-bold text-white font-mono mb-1">{formatTime(item.time)}</span>
                     <span className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-wide text-center">{item.label}</span>
                     <span className="text-[9px] md:text-[10px] opacity-60 mt-1">{item.duration} ({item.cycles} Siklus)</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* --- SLEEP SCIENCE & HYGIENE --- */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
         
         {/* Caffeine & Environment */}
         <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
               <Coffee size={18} className="text-orange-400"/> Batas Kafein
            </h3>
            {mode === 'WAKE_AT' && caffeineLimit ? (
               <div className="mb-4 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-center gap-3">
                  <div className="text-2xl font-bold text-orange-400">{caffeineLimit}</div>
                  <p className="text-xs text-orange-200 leading-tight">
                     Jam terakhir ngopi agar tidak mengganggu Deep Sleep.
                  </p>
               </div>
            ) : (
               <p className="text-xs text-slate-400 mb-4">Kafein memblokir rasa kantuk (adenosin) selama 6-10 jam. Hindari kopi sore.</p>
            )}
            
            <div className="space-y-3">
               <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl">
                  <Smartphone size={16} className="text-blue-400 mt-0.5 flex-shrink-0"/>
                  <div>
                     <p className="text-sm font-bold text-slate-200">Blue Light Filter</p>
                     <p className="text-xs text-slate-500">Nyalakan mode baca 2 jam sebelum tidur.</p>
                  </div>
               </div>
               <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl">
                  <Wind size={16} className="text-teal-400 mt-0.5 flex-shrink-0"/>
                  <div>
                     <p className="text-sm font-bold text-slate-200">Suhu (18-21°C)</p>
                     <p className="text-xs text-slate-500">Suhu dingin membantu masuk fase Deep Sleep.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Cycle Education */}
         <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
               <BedDouble size={18} className="text-purple-400"/> Struktur Tidur
            </h3>
            
            <div className="relative h-24 w-full bg-slate-800 rounded-xl mb-4 overflow-hidden flex items-end px-2">
               {/* Visual Wave */}
               <svg viewBox="0 0 100 20" className="w-full h-full opacity-50" preserveAspectRatio="none">
                  <path d="M0,5 Q10,20 20,5 T40,5 T60,5 T80,5 T100,5" fill="none" stroke="#818cf8" strokeWidth="2" />
               </svg>
               <div className="absolute top-2 left-2 text-[9px] text-slate-400 bg-slate-900/50 px-1 rounded">REM (Mimpi)</div>
               <div className="absolute bottom-2 left-10 text-[9px] text-slate-400 bg-slate-900/50 px-1 rounded">Deep Sleep (Fisik)</div>
            </div>

            <ul className="space-y-2 text-xs text-slate-400">
               <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold min-w-[60px]">90 Menit:</span>
                  Satu siklus lengkap (Light - Deep - REM).
               </li>
               <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold min-w-[60px]">Deep Sleep:</span>
                  Pemulihan otot & hapus racun otak (Awal malam).
               </li>
               <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold min-w-[60px]">REM Sleep:</span>
                  Konsolidasi memori & emosi (Jelang pagi).
               </li>
            </ul>
         </div>

      </div>

      {/* Nap Warning */}
      {mode === 'NAP' && (
         <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex gap-3 animate-slide-up">
            <Zap className="text-yellow-500 flex-shrink-0" />
            <div>
               <h4 className="text-yellow-500 font-bold text-sm">Aturan Power Nap</h4>
               <p className="text-xs text-yellow-200/80 mt-1">
                  Jangan tidur antara 30-60 menit! Anda akan bangun saat Deep Sleep dan merasa "mabuk" (Sleep Inertia). Pilih 20 menit (hanya N1/N2) atau sekalian 90 menit (Full Cycle).
               </p>
            </div>
         </div>
      )}
    </div>
  );
};
