import React, { useState, useEffect } from 'react';
import { InterviewQuestion } from '../types';
import { StorageService } from '../services/storage';
import { Briefcase, MessageSquare, CheckCircle, ChevronRight, PenTool, Save, RotateCcw } from 'lucide-react';

const COMMON_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    question: "Ceritakan tentang diri Anda.",
    category: 'GENERAL',
    tips: "Rumus: Masa Lalu (Pendidikan) + Masa Sekarang (Posisi saat ini) + Masa Depan (Kenapa melamar). Jangan curhat pribadi.",
  },
  {
    id: 'q2',
    question: "Apa kelemahan terbesar Anda?",
    category: 'BEHAVIORAL',
    tips: "Sebutkan kelemahan nyata (bukan 'saya terlalu perfeksionis'), lalu jelaskan langkah konkret yang sedang Anda lakukan untuk memperbaikinya.",
  },
  {
    id: 'q3',
    question: "Ceritakan masa di mana Anda menghadapi konflik dalam tim.",
    category: 'BEHAVIORAL',
    tips: "Gunakan metode STAR: Situation (Situasi), Task (Tugas), Action (Aksi Anda), Result (Hasil). Fokus pada solusi, bukan menyalahkan.",
  },
  {
    id: 'q4',
    question: "Kenapa kami harus menerima Anda?",
    category: 'GENERAL',
    tips: "Hubungkan skill Anda dengan masalah yang dihadapi perusahaan. Berikan 'Value Proposition'.",
  },
  {
    id: 'q5',
    question: "Apa rencana Anda 5 tahun ke depan?",
    category: 'GENERAL',
    tips: "Tunjukkan ambisi yang realistis dan relevan dengan jalur karir di perusahaan ini.",
  }
];

const CV_CHECKLIST = [
  "Menggunakan format ATS-Friendly (sederhana, tanpa kolom rumit).",
  "Mencantumkan kontak aktif (Email profesional & LinkedIn).",
  "Ringkasan profil (Summary) singkat dan padat.",
  "Pengalaman ditulis dengan format: Role + Action Verbs + Result (Angka).",
  "Skill relevan dengan posisi yang dilamar.",
  "Tidak ada typo (salah ketik).",
  "Nama file PDF jelas (Nama_Posisi.pdf).",
  "Mencantumkan proyek/portofolio (jika ada)."
];

export const CareerPrep: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INTERVIEW' | 'CV'>('INTERVIEW');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    // Load answers if exist, else use default
    const savedQuestions = StorageService.getItem<InterviewQuestion[]>('interview_prep', []);
    if (savedQuestions.length === 0) {
      setQuestions(COMMON_QUESTIONS);
    } else {
      setQuestions(savedQuestions);
    }

    const savedChecklist = StorageService.getItem<string[]>('cv_checklist', []);
    setCheckedItems(savedChecklist);
  }, []);

  const handleSaveAnswer = () => {
    if (!selectedQuestionId) return;
    const updated = questions.map(q => 
      q.id === selectedQuestionId ? { ...q, userAnswer: draftAnswer } : q
    );
    setQuestions(updated);
    StorageService.setItem('interview_prep', updated);
    alert('Jawaban disimpan! Berlatihlah mengucapkannya.');
  };

  const handleSelectQuestion = (q: InterviewQuestion) => {
    setSelectedQuestionId(q.id);
    setDraftAnswer(q.userAnswer || '');
  };

  const toggleCheck = (item: string) => {
    let newChecked;
    if (checkedItems.includes(item)) {
      newChecked = checkedItems.filter(i => i !== item);
    } else {
      newChecked = [...checkedItems, item];
    }
    setCheckedItems(newChecked);
    StorageService.setItem('cv_checklist', newChecked);
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-primary" /> KarirKit
          </h2>
          <p className="text-slate-400">Persiapan karir: Simulasi wawancara & Ceklis CV.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
           <button 
             onClick={() => setActiveTab('INTERVIEW')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'INTERVIEW' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
           >
             Interview
           </button>
           <button 
             onClick={() => setActiveTab('CV')}
             className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'CV' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
           >
             CV Check
           </button>
        </div>
      </div>

      {activeTab === 'INTERVIEW' && (
        <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
           {/* List Questions */}
           <div className="w-full md:w-1/3 bg-card border border-slate-700 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                 <h3 className="font-bold text-white">Daftar Pertanyaan</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                 {questions.map(q => (
                   <button
                     key={q.id}
                     onClick={() => handleSelectQuestion(q)}
                     className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                       selectedQuestionId === q.id 
                       ? 'bg-primary/10 border-primary text-white' 
                       : 'bg-transparent border-transparent hover:bg-slate-800 text-slate-300'
                     }`}
                   >
                     <div className="font-bold mb-1">{q.question}</div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">{q.category}</span>
                        {q.userAnswer && <CheckCircle size={14} className="text-green-500" />}
                     </div>
                   </button>
                 ))}
              </div>
           </div>

           {/* Workspace */}
           <div className="flex-1 bg-card border border-slate-700 rounded-xl p-6 flex flex-col overflow-hidden">
              {selectedQuestionId ? (
                <>
                  <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-2">
                       {questions.find(q => q.id === selectedQuestionId)?.question}
                     </h3>
                     <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3">
                        <MessageSquare className="text-yellow-500 flex-shrink-0 mt-1" size={18} />
                        <div>
                           <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Tips HRD:</p>
                           <p className="text-sm text-slate-300 leading-relaxed">
                             {questions.find(q => q.id === selectedQuestionId)?.tips}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                     <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <PenTool size={14} /> Draft Jawaban Anda (Metode STAR)
                     </label>
                     <textarea 
                       className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-primary leading-relaxed"
                       placeholder="Tulis poin-poin jawaban Anda di sini agar tidak blank saat wawancara..."
                       value={draftAnswer}
                       onChange={e => setDraftAnswer(e.target.value)}
                     />
                  </div>

                  <div className="mt-4 flex justify-end">
                     <button 
                       onClick={handleSaveAnswer}
                       className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                     >
                       <Save size={18} /> Simpan Jawaban
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                   <Briefcase size={48} className="mb-4 opacity-50" />
                   <p>Pilih pertanyaan di sebelah kiri untuk mulai latihan.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'CV' && (
        <div className="bg-card border border-slate-700 rounded-xl p-8 max-w-3xl mx-auto w-full animate-slide-in">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <CheckCircle className="text-green-500" /> Ceklis Kelayakan CV
           </h3>
           <div className="space-y-4">
              {CV_CHECKLIST.map((item, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    checkedItems.includes(item) 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                  }`}
                >
                   <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                     checkedItems.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500'
                   }`}>
                      {checkedItems.includes(item) && <CheckCircle size={16} />}
                   </div>
                   <input 
                     type="checkbox" 
                     className="hidden" 
                     checked={checkedItems.includes(item)}
                     onChange={() => toggleCheck(item)}
                   />
                   <span className={`text-sm ${checkedItems.includes(item) ? 'text-white' : 'text-slate-300'}`}>
                     {item}
                   </span>
                </label>
              ))}
           </div>
           
           <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div>
                 <p className="text-xs text-blue-400 font-bold uppercase mb-1">Status Kesiapan</p>
                 <p className="text-white font-bold text-lg">
                   {checkedItems.length} / {CV_CHECKLIST.length} Item Terpenuhi
                 </p>
              </div>
              <div className="h-16 w-16 relative flex items-center justify-center">
                 <svg className="transform -rotate-90 w-full h-full">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500 transition-all duration-1000" strokeDasharray={175} strokeDashoffset={175 - (175 * checkedItems.length / CV_CHECKLIST.length)} />
                 </svg>
                 <span className="absolute text-xs font-bold text-white">{Math.round((checkedItems.length / CV_CHECKLIST.length) * 100)}%</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
