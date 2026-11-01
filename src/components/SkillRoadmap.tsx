
import React, { useState, useEffect } from 'react';
import { Award, Briefcase, Zap, Keyboard, Monitor, CheckCircle2, Circle, TrendingUp, Lock, ArrowUp, ExternalLink, BookOpen, Plus, X, Save, Star, Youtube, Globe, Cpu, DollarSign } from 'lucide-react';
import { StorageService } from '../services/storage';

// --- TYPES ---
interface LearningResource {
  title: string;
  url: string;
  type: 'VIDEO' | 'ARTICLE' | 'COURSE';
}

interface Skill {
  id: string;
  title: string;
  category: 'HARD' | 'SOFT' | 'TOOLS' | 'BUSINESS';
  status: 'LOCKED' | 'LEARNING' | 'MASTERED';
  tier: 1 | 2 | 3; // 1: Basic, 2: Intermediate, 3: Advanced
  desc: string;
  proof?: string; // User note/link proving mastery
  resources?: LearningResource[];
  xpReward: number;
}

// --- DEFAULT CURRICULUM (Expanded) ---
const DEFAULT_SKILLS: Skill[] = [
  // =================================================================
  // TIER 1: FOUNDATION (Mahasiswa Baru Wajib Bisa)
  // =================================================================
  {
    id: 'typing',
    title: '10-Finger Typing',
    category: 'HARD',
    status: 'LEARNING',
    tier: 1,
    desc: 'Mengetik cepat tanpa melihat keyboard (min 50 WPM). Efisiensi dasar kerja admin & skripsi.',
    xpReward: 100,
    resources: [{ title: 'TypingClub Free Course', url: 'https://www.typingclub.com/', type: 'COURSE' }]
  },
  {
    id: 'google-workspace',
    title: 'Google Workspace',
    category: 'TOOLS',
    status: 'LEARNING',
    tier: 1,
    desc: 'Kolaborasi via Docs, Sheets, Slide. Tahu cara share link, comment, dan revision history.',
    xpReward: 100,
    resources: [{ title: 'Google Workspace Training', url: 'https://support.google.com/a/users/answer/9282958', type: 'ARTICLE' }]
  },
  {
    id: 'ai-prompting',
    title: 'AI Prompt Engineering (Basic)',
    category: 'TOOLS',
    status: 'LOCKED',
    tier: 1,
    desc: 'Cara bertanya ke ChatGPT/Gemini agar hasilnya akurat, bukan halusinasi.',
    xpReward: 150,
    resources: [{ title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', type: 'ARTICLE' }]
  },
  {
    id: 'grooming',
    title: 'Professional Grooming',
    category: 'SOFT',
    status: 'LEARNING',
    tier: 1,
    desc: 'Etika penampilan, bau badan, dan tata krama dasar di lingkungan profesional.',
    xpReward: 50
  },
  {
    id: 'financial-literacy',
    title: 'Budgeting Dasar',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 1,
    desc: 'Membedakan aset vs liabilitas, mencatat pengeluaran, dan konsep dana darurat.',
    xpReward: 100
  },
  {
    id: 'email-etiquette',
    title: 'Etika Email Profesional',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 1,
    desc: 'Menulis subjek yang jelas, salam pembuka, dan body email yang sopan ke Dosen/HRD.',
    xpReward: 50
  },
  {
    id: 'business-model-canvas',
    title: 'Business Model Canvas',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 1,
    desc: 'Memetakan ide bisnis dalam 1 halaman (Value Proposition, Customer Segments, Revenue Streams).',
    xpReward: 150,
    resources: [{ title: 'Atlassian BMC Guide', url: 'https://www.atlassian.com/agile/project-management/business-model-canvas', type: 'ARTICLE' }]
  },
  {
    id: 'design-thinking',
    title: 'Design Thinking & Empathy',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 1,
    desc: 'Metodologi inovasi: Memahami masalah nyata dari sudut pandang calon pelanggan.',
    xpReward: 150,
    resources: [{ title: 'Interaction Design Foundation: Design Thinking', url: 'https://www.interaction-design.org/literature/topics/design-thinking', type: 'ARTICLE' }]
  },

  // =================================================================
  // TIER 2: INTERMEDIATE (Persiapan Magang & Organisasi / Startup)
  // =================================================================
  {
    id: 'excel-admin',
    title: 'Excel for Business',
    category: 'TOOLS',
    status: 'LOCKED',
    tier: 2,
    desc: 'VLOOKUP, Pivot Table, IF Condition, dan Data Cleaning dasar.',
    xpReward: 200,
    resources: [{ title: 'Excel for Business (YouTube)', url: 'https://www.youtube.com/results?search_query=excel+vlookup+pivot+table', type: 'VIDEO' }]
  },
  {
    id: 'public-speaking',
    title: 'Public Speaking',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 2,
    desc: 'Berbicara di depan umum tanpa teks, intonasi suara, dan kontak mata.',
    xpReward: 150
  },
  {
    id: 'canva-design',
    title: 'Desain Grafis (Canva)',
    category: 'HARD',
    status: 'LOCKED',
    tier: 2,
    desc: 'Membuat presentasi, poster, dan CV yang estetis visual.',
    xpReward: 150
  },
  {
    id: 'copywriting-basic',
    title: 'Copywriting Dasar',
    category: 'HARD',
    status: 'LOCKED',
    tier: 2,
    desc: 'Menulis caption atau teks yang persuasif untuk jualan/kampanye.',
    xpReward: 200
  },
  {
    id: 'project-management',
    title: 'Manajemen Proyek (Trello/Notion)',
    category: 'TOOLS',
    status: 'LOCKED',
    tier: 2,
    desc: 'Mengelola tugas tim menggunakan papan Kanban atau Timeline.',
    xpReward: 200
  },
  {
    id: 'investing-basic',
    title: 'Investasi Dasar (Reksadana/Saham)',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 2,
    desc: 'Paham compound interest, profil risiko, dan cara baca prospektus.',
    xpReward: 250
  },
  {
    id: 'english-biz',
    title: 'Business English',
    category: 'HARD',
    status: 'LOCKED',
    tier: 2,
    desc: 'Menulis email dan memo bisnis dalam Bahasa Inggris (Target TOEIC > 700).',
    xpReward: 200
  },
  {
    id: 'lean-startup',
    title: 'Lean Startup & MVP',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 2,
    desc: 'Konsep Build-Measure-Learn dan membuat Minimum Viable Product untuk testing pasar.',
    xpReward: 250,
    resources: [{ title: 'The Lean Startup Methodology', url: 'http://theleanstartup.com/principles', type: 'ARTICLE' }]
  },
  {
    id: 'sales-persuasion',
    title: 'Sales & Persuasion',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 2,
    desc: 'Teknik meyakinkan klien, menangani penolakan (handling objections), dan closing.',
    xpReward: 250
  },
  {
    id: 'pitching',
    title: 'Pitching & Networking',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 2,
    desc: 'Pitch deck creation, elevator pitch 30 detik, dan membangun jejaring koneksi.',
    xpReward: 250
  },

  // =================================================================
  // TIER 3: ADVANCED (Siap Kerja / Founder / Leader)
  // =================================================================
  {
    id: 'data-viz',
    title: 'Data Visualization & Storytelling',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 3,
    desc: 'Menerjemahkan data ruwet menjadi grafik yang bermakna untuk pengambil keputusan.',
    xpReward: 300
  },
  {
    id: 'leadership',
    title: 'Leadership & Conflict',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 3,
    desc: 'Memimpin tim, delegasi tugas, dan mediasi konflik interpersonal.',
    xpReward: 400
  },
  {
    id: 'seo-basic',
    title: 'SEO & Digital Marketing',
    category: 'HARD',
    status: 'LOCKED',
    tier: 3,
    desc: 'Memahami cara kerja mesin pencari dan algoritma media sosial.',
    xpReward: 350
  },
  {
    id: 'negotiation',
    title: 'Negosiasi Gaji & Kontrak',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 3,
    desc: 'Teknik tawar-menawar win-win solution untuk karir dan deal bisnis.',
    xpReward: 400
  },
  {
    id: 'python-basic',
    title: 'Python for Automation',
    category: 'HARD',
    status: 'LOCKED',
    tier: 3,
    desc: 'Scripting dasar untuk otomatisasi tugas berulang (Excel/File).',
    xpReward: 500
  },
  {
    id: 'critical-thinking',
    title: 'Critical Thinking & Problem Solving',
    category: 'SOFT',
    status: 'LOCKED',
    tier: 3,
    desc: 'Menganalisis akar masalah (Root Cause Analysis) dan bias kognitif.',
    xpReward: 400
  },
  {
    id: 'startup-finance',
    title: 'Startup Finance & Unit Economics',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 3,
    desc: 'Menghitung CAC (Customer Acquisition Cost), LTV (Lifetime Value), dan Burn Rate.',
    xpReward: 500
  },
  {
    id: 'product-market-fit',
    title: 'Product-Market Fit',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 3,
    desc: 'Validasi apakah pasar benar-benar menginginkan dan bersedia membayar untuk produkmu.',
    xpReward: 550,
    resources: [{ title: 'Lenny Ratchitsky: PMF Guide', url: 'https://www.lennysnewsletter.com/', type: 'ARTICLE' }]
  },
  {
    id: 'legal-compliance',
    title: 'Basic Legal & Compliance',
    category: 'BUSINESS',
    status: 'LOCKED',
    tier: 3,
    desc: 'Pemahaman PT vs CV, HKI (Hak Kekayaan Intelektual), dan kontrak perjanjian kerja.',
    xpReward: 450
  }
];

export const SkillRoadmap: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'HARD' | 'SOFT' | 'TOOLS' | 'BUSINESS'>('ALL');
  
  // Custom Skill Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillTitle, setNewSkillTitle] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('HARD');
  const [newSkillTier, setNewSkillTier] = useState<1|2|3>(1);

  // Proof Form
  const [proofText, setProofText] = useState('');

  useEffect(() => {
    const savedSkills = StorageService.getItem<Skill[]>('student_skills_v4', []); // Changed key to v4 to force update
    if (savedSkills.length === 0) {
      setSkills(DEFAULT_SKILLS);
      StorageService.setItem('student_skills_v4', DEFAULT_SKILLS);
    } else {
      // Merge new default skills if they don't exist in saved (simple check by ID)
      const merged = [...savedSkills];
      DEFAULT_SKILLS.forEach(def => {
        if (!savedSkills.find(s => s.id === def.id)) {
          merged.push(def);
        }
      });
      // Sort by Tier then ID to keep order somewhat sane
      merged.sort((a,b) => {
         if (a.tier !== b.tier) return a.tier - b.tier;
         return 0; 
      });
      
      setSkills(merged);
    }
  }, []);

  const saveSkills = (updated: Skill[]) => {
    setSkills(updated);
    StorageService.setItem('student_skills_v4', updated);
  };

  const handleStatusChange = (id: string, newStatus: Skill['status'], proof?: string) => {
    const updated = skills.map(s => {
      if (s.id === id) {
        return { ...s, status: newStatus, proof: proof || s.proof };
      }
      return s;
    });
    saveSkills(updated);
    if (selectedSkill) setSelectedSkill(updated.find(s => s.id === id) || null);
  };

  const addNewSkill = () => {
    if (!newSkillTitle) return;
    const newSkill: Skill = {
      id: StorageService.generateId(),
      title: newSkillTitle,
      category: newSkillCategory,
      tier: newSkillTier,
      status: 'LOCKED',
      desc: 'Skill tambahan kustom.',
      xpReward: newSkillTier * 100
    };
    saveSkills([...skills, newSkill]);
    setShowAddForm(false);
    setNewSkillTitle('');
  };

  const deleteSkill = (id: string) => {
    if (confirm('Hapus skill ini dari roadmap?')) {
      saveSkills(skills.filter(s => s.id !== id));
      setSelectedSkill(null);
    }
  };

  // Stats
  const totalXP = skills.filter(s => s.status === 'MASTERED').reduce((acc, s) => acc + s.xpReward, 0);
  const totalMastered = skills.filter(s => s.status === 'MASTERED').length;
  const filteredSkills = filter === 'ALL' ? skills : skills.filter(s => s.category === filter);

  const getStatusIcon = (status: string) => {
    if (status === 'MASTERED') return <CheckCircle2 className="text-green-400" size={18} />;
    if (status === 'LEARNING') return <Zap className="text-yellow-400 animate-pulse" size={18} />;
    return <Lock className="text-slate-500" size={18} />;
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-6xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Award className="text-yellow-500" size={32} /> 
            Skill Tree 3.1
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Peta kompetensi modern. Selesaikan Tier 1 untuk membuka fondasi karirmu.
          </p>
        </div>
        
        {/* Stats HUD */}
        <div className="flex gap-4">
           <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 min-w-[120px]">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Skill XP</p>
              <p className="text-2xl font-black text-yellow-400 flex items-center gap-1">
                 {totalXP} <span className="text-xs font-normal text-slate-500">pts</span>
              </p>
           </div>
           <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 min-w-[120px]">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Mastery</p>
              <p className="text-2xl font-black text-green-400 flex items-center gap-1">
                 {totalMastered} <span className="text-xs font-normal text-slate-500">/ {skills.length}</span>
              </p>
           </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 sticky top-0 bg-dark/95 z-20 py-4 -mx-4 px-4 md:static md:bg-transparent md:p-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: 'Semua', icon: null },
            { key: 'HARD', label: 'Hard Skill', icon: <Keyboard size={14}/> },
            { key: 'SOFT', label: 'Soft Skill', icon: <Zap size={14}/> },
            { key: 'TOOLS', label: 'Tools', icon: <Monitor size={14}/> },
            { key: 'BUSINESS', label: 'Bisnis', icon: <Briefcase size={14}/> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filter === tab.key 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all"
        >
          <Plus size={16} /> Custom Skill
        </button>
      </div>

      {/* ROADMAP GRID (TIER BASED) */}
      <div className="space-y-12">
        {[1, 2, 3].map(tier => {
           const tierSkills = filteredSkills.filter(s => s.tier === tier);
           if (tierSkills.length === 0) return null;

           return (
             <div key={tier} className="relative">
                {/* Connector Line (Visual only) */}
                {tier !== 1 && (
                   <div className="absolute -top-8 left-8 w-1 h-8 bg-slate-800 -z-10"></div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold border-2 ${
                      tier === 1 ? 'bg-blue-500 text-white border-blue-400' :
                      tier === 2 ? 'bg-purple-500 text-white border-purple-400' :
                      'bg-orange-500 text-white border-orange-400'
                   }`}>
                      Tier {tier}
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">
                         {tier === 1 ? 'Basic Foundation' : tier === 2 ? 'Intermediate Proficiency' : 'Advanced Mastery'}
                      </h3>
                      <p className="text-sm text-slate-400">
                         {tier === 1 ? 'Kemampuan dasar yang wajib dimiliki.' : tier === 2 ? 'Keahlian untuk bersaing di dunia kerja.' : 'Skill tingkat tinggi untuk posisi strategis.'}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4 md:pl-0">
                   {tierSkills.map(skill => (
                      <div 
                        key={skill.id}
                        onClick={() => setSelectedSkill(skill)}
                        className={`relative group cursor-pointer overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${
                           skill.status === 'LOCKED' ? 'bg-slate-900/50 border-slate-800 opacity-60 grayscale' :
                           skill.status === 'MASTERED' ? 'bg-gradient-to-br from-slate-800 to-green-900/20 border-green-500/50 shadow-green-500/10' :
                           'bg-slate-800 border-primary/50 shadow-primary/10'
                        }`}
                      >
                         {skill.status === 'MASTERED' && (
                            <div className="absolute top-0 right-0 p-2">
                               <Star className="text-yellow-400 fill-yellow-400" size={16} />
                            </div>
                         )}
                         <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                               skill.category === 'HARD' ? 'bg-blue-500/20 text-blue-400' :
                               skill.category === 'SOFT' ? 'bg-pink-500/20 text-pink-400' :
                               skill.category === 'TOOLS' ? 'bg-cyan-500/20 text-cyan-400' :
                               'bg-amber-500/20 text-amber-400'
                            }`}>
                               {skill.category}
                            </span>
                            {getStatusIcon(skill.status)}
                         </div>
                         
                         <h4 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{skill.title}</h4>
                         <p className="text-xs text-slate-400 line-clamp-2 mb-4">{skill.desc}</p>
                         
                         {skill.status === 'LEARNING' && (
                            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                               <div className="h-full bg-yellow-400 animate-pulse w-1/2"></div>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           );
        })}
      </div>

      {/* --- SKILL DETAIL MODAL --- */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className="bg-card w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className={`p-6 border-b border-slate-700 flex justify-between items-start ${
                 selectedSkill.status === 'MASTERED' ? 'bg-green-900/20' : 'bg-slate-800/50'
              }`}>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] bg-black/30 text-slate-300 px-2 py-1 rounded border border-white/10">{selectedSkill.category}</span>
                       <span className="text-[10px] bg-black/30 text-yellow-400 px-2 py-1 rounded border border-white/10 flex items-center gap-1"><Star size={10}/> +{selectedSkill.xpReward} XP</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selectedSkill.title}</h2>
                 </div>
                 <button onClick={() => setSelectedSkill(null)} className="text-slate-400 hover:text-white p-1 bg-black/20 rounded-full"><X size={20}/></button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 <div>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen size={16}/> Deskripsi</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{selectedSkill.desc}</p>
                 </div>

                 {/* Learning Resources */}
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Globe size={16}/> Sumber Belajar (Rekomendasi)</h3>
                    <div className="space-y-2">
                       {selectedSkill.resources && selectedSkill.resources.length > 0 ? (
                          selectedSkill.resources.map((res, i) => (
                             <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all group">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                   {res.type === 'VIDEO' ? <Youtube size={16}/> : <BookOpen size={16}/>}
                                </div>
                                <div className="flex-1">
                                   <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{res.title}</p>
                                   <p className="text-[10px] text-slate-500">{res.type}</p>
                                </div>
                                <ExternalLink size={14} className="text-slate-500"/>
                             </a>
                          ))
                       ) : (
                          <div className="text-center py-4">
                             <p className="text-xs text-slate-500 italic">Belum ada resource otomatis. Cari di Google/Youtube dengan kata kunci: "{selectedSkill.title} tutorial".</p>
                             <a href={`https://www.google.com/search?q=belajar+${selectedSkill.title}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs text-blue-400 hover:underline">
                                Cari di Google <ExternalLink size={10}/>
                             </a>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Status Action Area */}
                 <div className="border-t border-slate-700 pt-6">
                    {selectedSkill.status === 'LOCKED' && (
                       <div className="text-center">
                          <p className="text-sm text-slate-400 mb-4">Skill ini masih terkunci. Siap untuk mulai belajar?</p>
                          <button 
                            onClick={() => handleStatusChange(selectedSkill.id, 'LEARNING')}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all w-full flex items-center justify-center gap-2"
                          >
                             <Zap size={18}/> Mulai Pelajari (Unlock)
                          </button>
                       </div>
                    )}

                    {selectedSkill.status === 'LEARNING' && (
                       <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl animate-slide-in">
                          <h4 className="text-sm font-bold text-yellow-500 mb-2 flex items-center gap-2"><Award size={16}/> Klaim Penguasaan (Mastery)</h4>
                          <p className="text-xs text-slate-300 mb-4">
                             Untuk menyelesaikan skill ini, tuliskan bukti kompetensimu. (Contoh: "Selesai nonton course X", "Membuat project Y", "Dapat sertifikat Z").
                          </p>
                          <textarea 
                             className="w-full bg-black/30 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-yellow-500 focus:outline-none mb-3"
                             placeholder="Saya telah menguasai skill ini dengan cara..."
                             rows={3}
                             value={proofText}
                             onChange={(e) => setProofText(e.target.value)}
                          />
                          <button 
                            disabled={!proofText}
                            onClick={() => { handleStatusChange(selectedSkill.id, 'MASTERED', proofText); setProofText(''); }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                             Konfirmasi & Klaim {selectedSkill.xpReward} XP
                          </button>
                       </div>
                    )}

                    {selectedSkill.status === 'MASTERED' && (
                       <div className="text-center bg-green-500/10 border border-green-500/20 p-5 rounded-xl">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-green-500/30">
                             <CheckCircle2 size={32}/>
                          </div>
                          <h4 className="text-lg font-bold text-white mb-1">Skill Mastered!</h4>
                          <p className="text-xs text-slate-400 mb-4">Bukti: "{selectedSkill.proof}"</p>
                          <button 
                            onClick={() => handleStatusChange(selectedSkill.id, 'LEARNING')}
                            className="text-xs text-slate-500 hover:text-white underline"
                          >
                             Reset ke Learning (Ulangi)
                          </button>
                       </div>
                    )}
                 </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center">
                 <button onClick={() => deleteSkill(selectedSkill.id)} className="text-red-400 text-xs hover:underline flex items-center gap-1"><X size={12}/> Hapus Skill</button>
                 <span className="text-[10px] text-slate-500">ID: {selectedSkill.id}</span>
              </div>
           </div>
        </div>
      )}

      {/* --- ADD SKILL FORM --- */}
      {showAddForm && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-xl">
               <h3 className="text-xl font-bold text-white mb-4">Tambah Custom Skill</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs text-slate-400 block mb-1">Nama Skill</label>
                     <input className="input-field" autoFocus value={newSkillTitle} onChange={e => setNewSkillTitle(e.target.value)} placeholder="Contoh: Digital Marketing" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Kategori</label>
                        <select className="input-field" value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value as any)}>
                           <option value="HARD">Hard Skill</option>
                           <option value="SOFT">Soft Skill</option>
                           <option value="TOOLS">Tools</option>
                           <option value="BUSINESS">Business</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Tier (Level)</label>
                        <select className="input-field" value={newSkillTier} onChange={e => setNewSkillTier(Number(e.target.value) as any)}>
                           <option value={1}>Tier 1 (Basic)</option>
                           <option value={2}>Tier 2 (Mid)</option>
                           <option value={3}>Tier 3 (Adv)</option>
                        </select>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-slate-700 text-white rounded-lg">Batal</button>
                     <button onClick={addNewSkill} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">Simpan</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      <style>{`
        .input-field {
          width: 100%;
          background-color: rgb(15 23 42); 
          border: 1px solid rgb(51 65 85);
          color: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.875rem;
        }
        .input-field:focus { border-color: rgb(99 102 241); }
      `}</style>
    </div>
  );
};
