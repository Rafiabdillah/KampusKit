import React, { useState, useEffect, useMemo } from 'react';
import { OrgEvent, Teammate } from '../types';
import { StorageService } from '../services/storage';
import { Users, Calendar, UserPlus, Trash2, Plus, Star, Flag, Ghost, AlertTriangle, Smile, Shield, MapPin, Tag, Search } from 'lucide-react';

export const CampusLife: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ORG' | 'CIRCLE'>('ORG');
  
  // State for Orgs
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<OrgEvent>>({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [searchEvent, setSearchEvent] = useState('');

  // State for Circle
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [newMate, setNewMate] = useState<Partial<Teammate>>({ role: 'NORMAL', rating: 3 });
  const [showMateForm, setShowMateForm] = useState(false);
  const [searchMate, setSearchMate] = useState('');

  useEffect(() => {
    setEvents(StorageService.getItem<OrgEvent[]>('campus_events', []));
    setTeammates(StorageService.getItem<Teammate[]>('teammates', []));
  }, []);

  // --- ORG LOGIC ---
  const saveEvents = (data: OrgEvent[]) => {
    setEvents(data);
    StorageService.setItem('campus_events', data);
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.organization) return;
    const event: OrgEvent = {
      id: StorageService.generateId(),
      title: newEvent.title,
      organization: newEvent.organization,
      date: newEvent.date || new Date().toISOString().split('T')[0],
      time: newEvent.time || '',
      location: newEvent.location || '',
      type: newEvent.type || 'Rapat',
      role: newEvent.role || 'Anggota',
      notes: newEvent.notes || ''
    };
    saveEvents([...events, event]);
    setNewEvent({});
    setShowEventForm(false);
  };

  const deleteEvent = (id: string) => {
    if (confirm('Hapus kegiatan organisasi ini?')) {
      saveEvents(events.filter(e => e.id !== id));
    }
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => e.title.toLowerCase().includes(searchEvent.toLowerCase()) || e.organization.toLowerCase().includes(searchEvent.toLowerCase()))
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
  }, [events, searchEvent]);

  const uniqueOrgs = useMemo(() => new Set(events.map(e => e.organization)).size, [events]);

  // --- CIRCLE LOGIC ---
  const saveTeammates = (data: Teammate[]) => {
    setTeammates(data);
    StorageService.setItem('teammates', data);
  };

  const addTeammate = () => {
    if (!newMate.name) return;
    const mate: Teammate = {
      id: StorageService.generateId(),
      name: newMate.name,
      role: newMate.role || 'NORMAL',
      rating: newMate.rating || 3,
      notes: newMate.notes || ''
    };
    saveTeammates([...teammates, mate]);
    setNewMate({ role: 'NORMAL', rating: 3 });
    setShowMateForm(false);
  };

  const deleteTeammate = (id: string) => {
    if (confirm('Hapus teman ini dari database circle?')) {
      saveTeammates(teammates.filter(t => t.id !== id));
    }
  };

  const filteredMates = useMemo(() => {
    return teammates
      .filter(m => m.name.toLowerCase().includes(searchMate.toLowerCase()))
      .sort((a, b) => b.rating - a.rating);
  }, [teammates, searchMate]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CARRY': return <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-1 rounded border border-green-500/20 flex items-center gap-1 font-semibold"><Shield size={10} /> Gendong Tim</span>;
      case 'BURDEN': return <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-1 rounded border border-red-500/20 flex items-center gap-1 font-semibold"><AlertTriangle size={10} /> Beban</span>;
      case 'GHOST': return <span className="bg-zinc-700 text-zinc-400 text-[10px] px-2 py-1 rounded border border-zinc-600 flex items-center gap-1 font-semibold"><Ghost size={10} /> Menghilang</span>;
      default: return <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded border border-blue-500/20 flex items-center gap-1 font-semibold"><Smile size={10} /> Aman / Normal</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Rapat': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Proyek': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Lapangan': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <Users className="text-primary" size={36} /> 
            Organisasi & Circle
          </h2>
          <p className="text-zinc-400 max-w-xl text-sm md:text-base">
            Kelola agenda kepanitiaan, rapat organisasi, dan rekam jejak performa teman sekelompok untuk strategi semester depan.
          </p>
        </div>
        
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex w-full md:w-auto">
           <button 
             onClick={() => setActiveTab('ORG')}
             className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ORG' ? 'bg-primary text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
           >
             <Flag size={16} /> Agenda Organisasi
           </button>
           <button 
             onClick={() => setActiveTab('CIRCLE')}
             className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'CIRCLE' ? 'bg-secondary text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
           >
             <UserPlus size={16} /> Circle & Tim
           </button>
        </div>
      </div>

      {/* --- TAB: ORGANISASI --- */}
      {activeTab === 'ORG' && (
        <div className="flex-1 flex flex-col gap-6">
           {/* Org Stats Header */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
             <div className="bg-zinc-900/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-center">
               <div className="text-zinc-400 text-xs font-semibold mb-1 flex items-center gap-1.5"><Flag size={12}/> Total Organisasi</div>
               <div className="text-2xl font-bold text-white">{uniqueOrgs}</div>
             </div>
             <div className="bg-zinc-900/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-center">
               <div className="text-zinc-400 text-xs font-semibold mb-1 flex items-center gap-1.5"><Calendar size={12}/> Total Kegiatan</div>
               <div className="text-2xl font-bold text-white">{events.length}</div>
             </div>
             <div className="col-span-2 relative">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                 type="text" 
                 placeholder="Cari kegiatan atau organisasi..." 
                 value={searchEvent}
                 onChange={(e) => setSearchEvent(e.target.value)}
                 className="w-full h-full bg-zinc-900/60 border border-zinc-800/60 text-white pl-11 pr-4 py-4 rounded-2xl outline-none focus:border-primary/50 transition-colors text-sm"
               />
             </div>
           </div>

           <div className="px-2">
              <button 
                onClick={() => setShowEventForm(!showEventForm)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <Plus size={18} className={showEventForm ? 'rotate-45 transition-transform' : 'transition-transform'} /> 
                {showEventForm ? 'Tutup Form' : 'Tambah Agenda / Rapat Baru'}
              </button>
           </div>

           {showEventForm && (
             <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-2xl mx-2 animate-slide-in">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nama Kegiatan / Agenda</label>
                     <input className="input-field" placeholder="Contoh: Rapat Pleno BEM" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Organisasi / Kepanitiaan</label>
                     <input className="input-field" placeholder="Contoh: BEM Fakultas" value={newEvent.organization || ''} onChange={e => setNewEvent({...newEvent, organization: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tanggal</label>
                     <input type="date" className="input-field" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Waktu</label>
                     <input type="time" className="input-field" value={newEvent.time || ''} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lokasi (Opsional)</label>
                     <input className="input-field" placeholder="Contoh: Gedung A / Zoom" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                   </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tipe Kegiatan</label>
                     <select className="input-field" value={newEvent.type || 'Rapat'} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                        <option value="Rapat">Rapat / Meeting</option>
                        <option value="Proyek">Pengerjaan Proyek</option>
                        <option value="Lapangan">Aksi Lapangan / Acara</option>
                        <option value="Lainnya">Lainnya</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Peran / Jabatan Saya</label>
                     <input className="input-field" placeholder="Contoh: Ketua Pelaksana, Staff Acara" value={newEvent.role || ''} onChange={e => setNewEvent({...newEvent, role: e.target.value})} />
                   </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Catatan Persiapan</label>
                  <textarea className="input-field h-24 resize-none" placeholder="Draft ide, barang bawaan, dresscode..." value={newEvent.notes || ''} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} />
                </div>
                <button onClick={addEvent} className="bg-primary hover:bg-primary/90 text-white w-full py-3.5 rounded-xl font-bold transition-colors">
                  Simpan Agenda
                </button>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-2">
              {filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
                   <Flag size={48} className="mx-auto mb-4 opacity-30" />
                   <p className="font-medium text-zinc-400">Belum ada agenda organisasi.</p>
                   <p className="text-sm mt-1">Tambahkan rapat atau kegiatan kepanitiaanmu di sini.</p>
                </div>
              ) : (
                filteredEvents.map(ev => {
                  const isPast = new Date(`${ev.date}T${ev.time || '23:59'}`) < new Date();
                  return (
                    <div key={ev.id} className={`bg-zinc-900 border ${isPast ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800'} p-5 rounded-2xl hover:border-zinc-600 transition-all group relative flex flex-col h-full`}>
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-bold tracking-wider">{ev.organization}</span>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wider border ${getTypeBadge(ev.type || '')}`}>
                              {ev.type || 'Rapat'}
                            </span>
                          </div>
                          <button onClick={() => deleteEvent(ev.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       
                       <h3 className={`font-bold text-lg mb-4 ${isPast ? 'text-zinc-400' : 'text-white'}`}>{ev.title}</h3>
                       
                       <div className="space-y-2.5 mb-5 flex-1">
                          <div className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                               <Calendar size={14} className={isPast ? 'text-zinc-500' : 'text-primary'}/>
                             </div>
                             <div>
                               <p className="font-medium">{new Date(ev.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'short'})}</p>
                               {ev.time && <p className="text-xs text-zinc-500">{ev.time} WIB</p>}
                             </div>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                               <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                 <MapPin size={14} className="text-zinc-400"/>
                               </div>
                               <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                               <Users size={14} className="text-zinc-400"/>
                             </div>
                             <span className="truncate">{ev.role}</span>
                          </div>
                       </div>
                       
                       {ev.notes && (
                         <div className="bg-zinc-950 p-3 rounded-xl text-xs text-zinc-400 mt-auto border border-zinc-800/50">
                            <span className="text-zinc-500 font-bold mb-1 flex items-center gap-1.5"><Tag size={10}/> Catatan:</span>
                            <p className="line-clamp-2 leading-relaxed">{ev.notes}</p>
                         </div>
                       )}
                    </div>
                  );
                })
              )}
           </div>
        </div>
      )}

      {/* --- TAB: CIRCLE & TEAM --- */}
      {activeTab === 'CIRCLE' && (
        <div className="flex-1 flex flex-col gap-6">
           <div className="bg-amber-500/10 border border-amber-500/20 p-4 md:p-5 rounded-2xl mx-2 flex items-start md:items-center gap-4">
              <div className="bg-amber-500/20 p-2 rounded-xl shrink-0 mt-1 md:mt-0">
                <Shield size={20} className="text-amber-500" />
              </div>
              <div>
                 <h4 className="font-bold text-amber-500 text-sm md:text-base mb-1">Database Rekam Jejak Teman Kelompok</h4>
                 <p className="text-xs md:text-sm text-amber-200/70 leading-relaxed">Evaluasi dan catat kinerja teman sekelas saat kerja kelompok. Bantu kamu memilih partner terbaik (dan menghindari free-rider) di semester berikutnya.</p>
              </div>
           </div>

           <div className="px-2">
              <button 
                onClick={() => setShowMateForm(!showMateForm)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <Plus size={18} className={showMateForm ? 'rotate-45 transition-transform' : 'transition-transform'} /> 
                {showMateForm ? 'Batal' : 'Tambah Database Teman Baru'}
              </button>
           </div>

           {showMateForm && (
             <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-2xl mx-2 animate-slide-in">
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nama Teman</label>
                     <input className="input-field" placeholder="Nama Lengkap / Panggilan" value={newMate.name || ''} onChange={e => setNewMate({...newMate, name: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1.5">Klasifikasi Kinerja</label>
                     <select className="input-field" value={newMate.role} onChange={e => setNewMate({...newMate, role: e.target.value as any})}>
                        <option value="NORMAL">✅ Normal (Standar / Aman)</option>
                        <option value="CARRY">⭐ Carry (Sangat Rajin / Gendong Tim)</option>
                        <option value="BURDEN">⚠️ Burden (Beban / Kurang Kontribusi)</option>
                        <option value="GHOST">👻 Ghost (Suka Menghilang / Sulit Dihubungi)</option>
                     </select>
                   </div>
                </div>
                
                <div className="mb-5 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                   <label className="block text-xs font-medium text-zinc-400 mb-3 text-center">Beri Rating Keseluruhan</label>
                   <div className="flex justify-center gap-2">
                      {[1,2,3,4,5].map(star => (
                         <button 
                           key={star} 
                           onClick={() => setNewMate({...newMate, rating: star})} 
                           className={`transition-all hover:scale-110 p-1 ${star <= (newMate.rating || 0) ? 'text-yellow-400' : 'text-zinc-700 hover:text-zinc-500'}`}
                         >
                            <Star size={32} fill={star <= (newMate.rating || 0) ? "currentColor" : "none"} />
                         </button>
                      ))}
                   </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Catatan Evaluasi Rahasia</label>
                  <textarea className="input-field h-24 resize-none" placeholder="Contoh: Jago bikin PPT, tapi sering telat kumpul bagian dia. Jangan digabung sama si X..." value={newMate.notes || ''} onChange={e => setNewMate({...newMate, notes: e.target.value})} />
                </div>
                <button onClick={addTeammate} className="bg-secondary hover:bg-secondary/90 text-white w-full py-3.5 rounded-xl font-bold transition-colors">
                  Simpan ke Database
                </button>
             </div>
           )}

           <div className="px-2 mb-2 relative">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input 
               type="text" 
               placeholder="Cari nama teman..." 
               value={searchMate}
               onChange={(e) => setSearchMate(e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-secondary/50 transition-colors text-sm"
             />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
              {filteredMates.length === 0 ? (
                 <div className="col-span-full text-center py-20 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-zinc-400">Database teman masih kosong.</p>
                    <p className="text-sm mt-1">Mulai catat teman-teman sekelasmu sekarang!</p>
                 </div>
              ) : (
                 filteredMates.map(tm => (
                    <div key={tm.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col hover:border-zinc-700 transition-all group">
                       <div className="flex items-start gap-4 mb-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-inner ${
                            tm.role === 'CARRY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                            tm.role === 'BURDEN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            tm.role === 'GHOST' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                         }`}>
                            {tm.name.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg truncate pr-6">{tm.name}</h4>
                            <div className="flex gap-1 text-yellow-500 mt-1 mb-2">
                               {Array.from({length: 5}).map((_, i) => (
                                 <Star key={i} size={12} fill={i < tm.rating ? "currentColor" : "none"} className={i >= tm.rating ? "text-zinc-700" : ""} />
                               ))}
                            </div>
                            {getRoleBadge(tm.role)}
                         </div>
                         <button onClick={() => deleteTeammate(tm.id)} className="absolute top-5 right-5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-950 rounded-md">
                            <Trash2 size={16} />
                         </button>
                       </div>
                       
                       <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/50 mt-auto flex-1">
                          <p className="text-sm text-zinc-400 italic line-clamp-3 leading-relaxed">
                            {tm.notes ? `"${tm.notes}"` : "Tidak ada catatan spesifik."}
                          </p>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      <style>{`
        .input-field {
          width: 100%;
          background-color: rgb(24 24 27); /* zinc-950 */
          border: 1px solid rgb(39 39 42); /* zinc-800 */
          color: white;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          outline: none;
          transition: all 0.2s;
          font-size: 0.875rem;
        }
        .input-field:focus {
          border-color: rgb(161 161 170); /* zinc-400 */
          background-color: rgb(9 9 11); /* zinc-950 dark */
        }
        .input-field::placeholder {
          color: rgb(82 82 91); /* zinc-500 */
        }
      `}</style>
    </div>
  );
};
