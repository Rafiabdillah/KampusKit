
import React, { useState, useEffect } from 'react';
import { CalendarEvent, Task, TaskStatus } from '../types';
import { StorageService } from '../services/storage';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Clock, CheckSquare, Flag, MapPin } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onAddTask?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  
  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('PERSONAL');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  useEffect(() => {
    setEvents(StorageService.getItem<CalendarEvent[]>('calendar_events', []));
  }, []);

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    StorageService.setItem('calendar_events', updated);
  };

  const addEvent = () => {
    if (!newEventTitle) return;
    
    if (editingEventId) {
      const updated = events.map(e => e.id === editingEventId ? { ...e, title: newEventTitle, time: newEventTime, type: newEventType } : e);
      saveEvents(updated);
      setEditingEventId(null);
    } else {
      const event: CalendarEvent = {
        id: StorageService.generateId(),
        title: newEventTitle,
        date: selectedDate,
        time: newEventTime,
        type: newEventType
      };
      saveEvents([...events, event]);
    }
    
    setNewEventTitle('');
    setNewEventTime('');
    setShowEventForm(false);
  };

  const editEvent = (event: CalendarEvent) => {
    setNewEventTitle(event.title);
    setNewEventTime(event.time || '');
    setNewEventType(event.type);
    setEditingEventId(event.id);
    setShowEventForm(true);
  };

  const deleteEvent = (id: string) => {
    if(confirm('Hapus acara ini?')) {
        saveEvents(events.filter(e => e.id !== id));
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const generateCalendarGrid = () => {
    const grid = [];
    // Padding days
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`pad-${i}`} className="h-24 md:h-32 bg-transparent border-b border-r border-white/5 opacity-30"></div>);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;
      
      // Get items for this day
      const dayTasks = tasks.filter(t => t.deadline === dateStr && t.status !== TaskStatus.DONE);
      const dayEvents = events.filter(e => e.date === dateStr);
      
      grid.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(dateStr)}
          className={`h-24 md:h-32 border-b border-r border-white/5 p-2 relative cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/5' : ''}`}
        >
          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1 ${isToday ? 'bg-primary text-white' : 'text-slate-300'}`}>
            {d}
          </div>
          
          {/* Indicators */}
          <div className="flex flex-col gap-1 overflow-hidden">
             {dayTasks.map(t => (
               <div key={t.id} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 truncate border border-red-500/30 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 {t.title}
               </div>
             ))}
             {dayEvents.map(e => (
               <div key={e.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate border flex items-center gap-1 ${e.type === 'ACADEMIC' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${e.type === 'ACADEMIC' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                 {e.title}
               </div>
             ))}
          </div>
        </div>
      );
    }
    return grid;
  };

  // Side Panel Content
  const selectedDateTasks = tasks.filter(t => t.deadline === selectedDate);
  const selectedDateEvents = events.filter(e => e.date === selectedDate);

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-full w-full flex flex-col lg:flex-row gap-6 animate-fade-in pb-4">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col bg-card border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
         {/* Header */}
         <div className="p-4 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900/50 border-b border-white/5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
               <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 min-w-0">
                  <CalendarDays className="text-primary shrink-0"/>
                  <span className="truncate">{monthNames[currentDate.getMonth()]}</span> <span className="text-slate-500 font-light shrink-0">{currentDate.getFullYear()}</span>
               </h2>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
               <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors" aria-label="Bulan sebelumnya"><ChevronLeft/></button>
               <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Hari Ini</button>
               <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors" aria-label="Bulan berikutnya"><ChevronRight/></button>
            </div>
         </div>

         {/* Week Days Header */}
         <div className="grid grid-cols-7 bg-slate-800/30 border-b border-white/5">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
               <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</div>
            ))}
         </div>

         {/* Calendar Grid */}
         <div className="flex-1 grid grid-cols-7 overflow-y-auto custom-scrollbar bg-slate-900/20">
            {generateCalendarGrid()}
         </div>
      </div>

      {/* Side Panel (Details) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
         <div className="bg-card border border-slate-700 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
            <div className="mb-6">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Terpilih</h3>
               <p className="text-xl font-bold text-white">{formatDateDisplay(selectedDate)}</p>
            </div>

            {/* Tasks Section */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><CheckSquare size={16} className="text-red-400"/> Deadline Tugas</h4>
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{selectedDateTasks.length}</span>
               </div>
               <div className="space-y-2">
                  {selectedDateTasks.length === 0 ? (
                     <p className="text-xs text-slate-500 italic">Tidak ada deadline tugas.</p>
                  ) : selectedDateTasks.map(t => (
                     <div key={t.id} className="bg-red-500/5 border border-red-500/20 p-3 rounded-xl">
                        <p className={`font-medium text-sm ${t.status === TaskStatus.DONE ? 'line-through text-slate-500' : 'text-white'}`}>{t.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] bg-black/20 text-slate-400 px-2 py-0.5 rounded">{t.subject}</span>
                           <Flag size={10} className={t.priority === 'HIGH' ? 'text-red-500' : 'text-slate-500'} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Events Section */}
            <div className="flex-1">
               <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-purple-400"/> Agenda / Acara</h4>
                  <button onClick={() => setShowEventForm(!showEventForm)} className="text-xs bg-primary/20 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1"><Plus size={12}/> Baru</button>
               </div>

               {showEventForm && (
                  <div className="bg-slate-800 p-3 rounded-xl mb-3 animate-slide-in border border-slate-700">
                     <input 
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white mb-2"
                        placeholder="Nama Acara..."
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                     />
                     <div className="flex gap-2 mb-2">
                        <input type="time" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} />
                        <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white flex-1" value={newEventType} onChange={e => setNewEventType(e.target.value as any)}>
                           <option value="PERSONAL">Pribadi</option>
                           <option value="ACADEMIC">Akademik</option>
                           <option value="ORG">Organisasi</option>
                        </select>
                     </div>
                     <button onClick={addEvent} className="w-full bg-primary text-white text-xs font-bold py-2 rounded hover:bg-primary/90">Simpan</button>
                  </div>
               )}

               <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedDateEvents.length === 0 && !showEventForm ? (
                     <p className="text-xs text-slate-500 italic">Tidak ada acara terjadwal.</p>
                  ) : selectedDateEvents.map(e => (
                     <div key={e.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl group relative">
                        <div className="flex justify-between items-start">
                           <p className="font-bold text-sm text-white cursor-pointer hover:text-primary" onClick={() => editEvent(e)}>{e.title}</p>
                           <button onClick={() => deleteEvent(e.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                           {e.time && <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded"><Clock size={10}/> {e.time}</span>}
                           <span className="uppercase text-[9px] font-bold tracking-wider">{e.type}</span>
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
