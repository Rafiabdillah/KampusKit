import { useStore } from '../store/useStore';
import React, { useState, useEffect } from 'react';
import { Goal, GoalStep } from '../types';
import { StorageService } from '../services/storage';
import { Target, Plus, CheckCircle2, Circle, Trash2, Calendar, Trophy, Briefcase, GraduationCap, Coins, ChevronDown, ChevronUp, Zap, Edit2 } from 'lucide-react';

// --- TEMPLATES (Strategi Pencapaian) ---
// Ini menjawab "Apa saja yang bisa dilakukan pengguna"
const GOAL_TEMPLATES = [
  {
    title: "Lulus Cum Laude (IPK > 3.5)",
    category: "AKADEMIK",
    steps: [
      "Tidak ada nilai C di transkrip semester ini.",
      "Selalu duduk di barisan depan saat kuliah.",
      "Mencatat ulang materi kuliah (Rewriting) setiap minggu.",
      "Aktif bertanya minimal 1x setiap pertemuan.",
      "Menyelesaikan tugas H-2 sebelum deadline."
    ]
  },
  {
    title: "Siap Magang di Perusahaan Top",
    category: "KARIR",
    steps: [
      "Membuat CV yang ATS-Friendly.",
      "Memperbaiki profil LinkedIn (All Star Profile).",
      "Menguasai Ms. Excel tingkat lanjut (Pivot/VLOOKUP).",
      "Simulasi wawancara kerja (Mock Interview).",
      "Mengirim lamaran ke minimal 10 perusahaan."
    ]
  },
  {
    title: "Jago Bahasa Inggris (TOEIC > 700)",
    category: "PERSONAL",
    steps: [
      "Menghafal 5 kosakata bisnis baru setiap hari.",
      "Mendengarkan podcast bahasa Inggris 15 menit/hari.",
      "Latihan soal grammar 2x seminggu.",
      "Berbicara sendiri (Self-talk) dalam bahasa Inggris di depan cermin.",
      "Mengikuti simulasi tes TOEIC online."
    ]
  },
  {
    title: "Tabungan Dana Darurat Mahasiswa",
    category: "KEUANGAN",
    steps: [
      "Mencatat pengeluaran harian selama 1 bulan.",
      "Membawa bekal makan siang 3x seminggu.",
      "Mengurangi jajan kopi kekinian (max 1x seminggu).",
      "Menyisihkan 10% uang saku di awal bulan.",
      "Menjual barang bekas yang tidak terpakai (Preloved)."
    ]
  },
  {
    title: "Skripsi / TA Lancar Jaya",
    category: "AKADEMIK",
    steps: [
      "Menentukan topik judul yang disukai & dikuasai.",
      "Membaca minimal 5 jurnal referensi utama.",
      "Membuat kerangka tulisan (outline) Bab 1-3.",
      "Bimbingan rutin minimal 2 minggu sekali.",
      "Menulis minimal 1 paragraf setiap hari (No Zero Day)."
    ]
  }
];

export const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const gainXp = useStore(state => state.gainXp);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('AKADEMIK');
  const [newDeadline, setNewDeadline] = useState('');
  const [newSteps, setNewSteps] = useState<string[]>(['']);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => {
    setGoals(StorageService.getItem<Goal[]>('user_goals', []));
  }, []);

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    StorageService.setItem('user_goals', updatedGoals);
  };

  const handleUseTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
    setNewTitle(template.title);
    setNewCategory(template.category as any);
    setNewSteps([...template.steps]);
  };

  const addStepField = () => setNewSteps([...newSteps, '']);
  
  const updateStepField = (index: number, value: string) => {
    const updated = [...newSteps];
    updated[index] = value;
    setNewSteps(updated);
  };

  const removeStepField = (index: number) => {
    const updated = newSteps.filter((_, i) => i !== index);
    setNewSteps(updated);
  };

  const handleSaveGoal = () => {
    if (!newTitle) return;

    if (editingGoalId) {
      const updatedGoals = goals.map(g => {
        if (g.id === editingGoalId) {
          const updatedSteps = newSteps
            .filter(s => s.trim() !== '')
            .map((s, index) => {
              const existingStep = index < (g.steps || []).length ? (g.steps || [])[index] : null;
              if (existingStep) {
                return { ...existingStep, text: s };
              }
              return {
                id: StorageService.generateId(),
                text: s,
                isCompleted: false
              };
            });
          
          const total = updatedSteps.length;
          const completed = updatedSteps.filter(s => s.isCompleted).length;
          const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

          return {
            ...g,
            title: newTitle,
            category: newCategory,
            deadline: newDeadline || g.deadline,
            steps: updatedSteps,
            progress,
            completed: progress === 100
          };
        }
        return g;
      });
      saveGoals(updatedGoals);
    } else {
      const steps: GoalStep[] = newSteps
        .filter(s => s.trim() !== '')
        .map(s => ({
          id: StorageService.generateId(),
          text: s,
          isCompleted: false
        }));

      const newGoal: Goal = {
        id: StorageService.generateId(),
        title: newTitle,
        category: newCategory,
        deadline: newDeadline || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        steps: steps,
        progress: 0,
        completed: false
      };

      saveGoals([...goals, newGoal]);
    }
    
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('AKADEMIK');
    setNewDeadline('');
    setNewSteps(['']);
    setEditingGoalId(null);
  };

  const openEditModal = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoalId(goal.id);
    setNewTitle(goal.title);
    setNewCategory(goal.category);
    setNewDeadline(goal.deadline);
    setNewSteps((goal.steps || []).map(s => s.text));
    setShowModal(true);
  };

  const deleteGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Hapus target ini?")) {
      saveGoals(goals.filter(g => g.id !== id));
    }
  };

  const toggleStep = (goalId: string, stepId: string) => {
    let gainedXp = false;
    let goalCompletedNow = false;

    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        let stepWasCompleted = false;
        const updatedSteps = (g.steps || []).map(s => {
          if (s.id === stepId) {
             stepWasCompleted = !s.isCompleted;
             return { ...s, isCompleted: stepWasCompleted };
          }
           return s;
        });
        
        // Recalculate progress
        const total = updatedSteps.length;
        const completed = updatedSteps.filter(s => s.isCompleted).length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (stepWasCompleted) gainedXp = true;
        if (progress === 100 && g.progress !== 100) goalCompletedNow = true;

        return { 
          ...g, 
          steps: updatedSteps, 
          progress,
          completed: progress === 100
        };
      }
      return g;
    });
    saveGoals(updatedGoals);
    
    if (gainedXp) gainXp(20);
    if (goalCompletedNow) gainXp(200);
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'AKADEMIK': return <GraduationCap size={16} className="text-blue-400"/>;
      case 'KARIR': return <Briefcase size={16} className="text-purple-400"/>;
      case 'KEUANGAN': return <Coins size={16} className="text-green-400"/>;
      default: return <Target size={16} className="text-orange-400"/>;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'AKADEMIK': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'KARIR': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'KEUANGAN': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Target className="text-red-500" size={32} /> 
            Target & Misi
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Pecah impian besarmu menjadi langkah-langkah nyata yang bisa dieksekusi hari ini.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> Buat Target Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {goals.map(goal => (
          <div 
            key={goal.id}
            className={`bg-card border rounded-xl overflow-hidden transition-all duration-300 ${goal.completed ? 'border-green-500/50 opacity-80' : 'border-slate-700 hover:border-slate-500 shadow-md'}`}
          >
            {/* Header */}
            <div 
              onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
              className="p-6 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${getCategoryColor(goal.category)}`}>
                    {getCategoryIcon(goal.category)} {goal.category}
                  </span>
                  {goal.completed && (
                    <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded flex items-center gap-1">
                      <Trophy size={12} /> SELESAI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">Progress</p>
                      <p className={`font-bold ${goal.progress === 100 ? 'text-green-400' : 'text-primary'}`}>{goal.progress}%</p>
                   </div>
                   <button onClick={(e) => openEditModal(goal, e)} className="text-slate-600 hover:text-primary transition-colors ml-2">
                     <Edit2 size={18} />
                   </button>
                   <button onClick={(e) => deleteGoal(goal.id, e)} className="text-slate-600 hover:text-red-400 transition-colors ml-2">
                     <Trash2 size={18} />
                   </button>
                   {expandedGoalId === goal.id ? <ChevronUp className="text-slate-500 ml-2"/> : <ChevronDown className="text-slate-500 ml-2"/>}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                   <h3 className={`text-xl font-bold mb-1 ${goal.completed ? 'text-slate-400 line-through' : 'text-white'}`}>{goal.title}</h3>
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={12} /> Target: {new Date(goal.deadline).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                   </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${goal.completed ? 'bg-green-500' : 'bg-primary'}`} 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Steps (Expanded) */}
            {expandedGoalId === goal.id && (
              <div className="bg-slate-800/30 border-t border-slate-700 p-6 animate-slide-in">
                <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Langkah-langkah Pencapaian:</h4>
                <div className="space-y-3">
                  {(goal.steps || []).map(step => (
                    <div 
                      key={step.id}
                      onClick={() => toggleStep(goal.id, step.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        step.isCompleted 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        step.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-transparent'
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <span className={`text-sm ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {step.text}
                      </span>
                    </div>
                  ))}
                  {(goal.steps || []).length === 0 && <p className="text-slate-500 text-sm italic">Belum ada langkah. Edit untuk menambahkan.</p>}
                </div>
              </div>
            )}
          </div>
        ))}

        {goals.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
             <Target size={48} className="text-slate-600 mx-auto mb-4" />
             <p className="text-slate-400 font-medium">Belum ada target yang dibuat.</p>
             <p className="text-slate-500 text-sm mt-1">"Sebuah tujuan tanpa rencana hanyalah harapan."</p>
             <button onClick={() => setShowModal(true)} className="mt-4 text-primary hover:underline">Mulai Buat Target</button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700">
               <h2 className="text-xl font-bold text-white">{editingGoalId ? 'Edit Target' : 'Buat Target Baru'}</h2>
               <p className="text-slate-400 text-sm">Tentukan tujuan dan strategi pencapaiannya.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Template Selector */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Gunakan Template Cepat:</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {GOAL_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseTemplate(tmpl)}
                      className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary px-3 py-2 rounded-lg text-xs text-left transition-all min-w-[150px]"
                    >
                      <div className="font-bold text-white mb-1 truncate">{tmpl.title}</div>
                      <div className="text-slate-400">{tmpl.steps.length} Langkah</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Judul Target</label>
                  <input 
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="Contoh: Lulus Cum Laude"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-sm text-slate-300 block mb-1">Kategori</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary focus:outline-none"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as any)}
                      >
                        <option value="AKADEMIK">Akademik</option>
                        <option value="KARIR">Karir</option>
                        <option value="KEUANGAN">Keuangan</option>
                        <option value="PERSONAL">Personal</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-sm text-slate-300 block mb-1">Deadline Target</label>
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary focus:outline-none"
                        value={newDeadline}
                        onChange={e => setNewDeadline(e.target.value)}
                      />
                   </div>
                </div>

                <div>
                   <label className="text-sm text-slate-300 block mb-2 flex justify-between items-center">
                     <span>Langkah-langkah (Action Plan)</span>
                     <span className="text-xs text-slate-500">Apa yang harus dilakukan?</span>
                   </label>
                   <div className="space-y-2">
                     {newSteps.map((step, idx) => (
                       <div key={idx} className="flex gap-2">
                         <span className="flex items-center justify-center w-8 bg-slate-800 text-slate-500 rounded text-xs font-bold">{idx+1}</span>
                         <input 
                            className="flex-1 bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:border-primary focus:outline-none"
                            placeholder={`Langkah ke-${idx+1}`}
                            value={step}
                            onChange={e => updateStepField(idx, e.target.value)}
                         />
                         <button onClick={() => removeStepField(idx)} className="text-slate-600 hover:text-red-400 p-2">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))}
                   </div>
                   <button 
                     onClick={addStepField}
                     className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                   >
                     <Plus size={16} /> Tambah Langkah
                   </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-lg text-slate-300 hover:bg-slate-700 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveGoal}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-lg shadow-primary/20"
              >
                {editingGoalId ? 'Simpan Perubahan' : 'Simpan Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};