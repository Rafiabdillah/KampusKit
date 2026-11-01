import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { Code, Briefcase, ExternalLink, Github, Plus, CheckCircle2, Circle, Trash2, ArrowRight, DollarSign, Target, Play, X, MoreHorizontal, Link as LinkIcon, Edit2, Calendar, FolderGit2, Rocket, Layers, LayoutGrid, CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import { audioService } from '../services/audio';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface TechSkill {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  completed: boolean;
  description?: string;
}

interface Project {
  id: string;
  title: string;
  type: 'FAMILY_BUSINESS' | 'PERSONAL' | 'FREELANCE' | 'STARTUP';
  description: string;
  techStack: string[];
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED';
  githubLink?: string;
  demoLink?: string;
  progress: number;
  createdAt: number;
}

const DEFAULT_ROADMAP: TechSkill[] = [
  { id: '1', name: 'HTML & Web Basics', level: 'BEGINNER', completed: false, description: 'Semantik, Forms, dan Struktur DOM' },
  { id: '2', name: 'CSS Fundamentals', level: 'BEGINNER', completed: false, description: 'Flexbox, CSS Grid, Responsive Design' },
  { id: '3', name: 'JavaScript Core', level: 'BEGINNER', completed: false, description: 'Variabel, Fungsi, Array, Object, ES6+' },
  { id: '4', name: 'Git & Version Control', level: 'INTERMEDIATE', completed: false, description: 'Commit, Branching, Merge, GitHub' },
  { id: '5', name: 'JavaScript Async & APIs', level: 'INTERMEDIATE', completed: false, description: 'Promises, Async/Await, Fetch API' },
  { id: '6', name: 'Tailwind CSS', level: 'INTERMEDIATE', completed: false, description: 'Utility-first styling, Mobile-first' },
  { id: '7', name: 'React.js Fundamentals', level: 'ADVANCED', completed: false, description: 'Components, Props, State, Hooks' },
  { id: '8', name: 'State Management', level: 'ADVANCED', completed: false, description: 'Context API, Zustand, Redux' },
  { id: '9', name: 'Backend & DB Basics', level: 'ADVANCED', completed: false, description: 'Firebase, Node.js, RESTful APIs' },
];

export const ProjectPortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'ROADMAP'>('PROJECTS');
  const [mobileProjectTab, setMobileProjectTab] = useState<Project['status']>('IN_PROGRESS');
  
  const [roadmap, setRoadmap] = useState<TechSkill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [newProject, setNewProject] = useState<Partial<Project>>({ type: 'PERSONAL', status: 'IDEA', techStack: [], progress: 0 });
  const [techInput, setTechInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedRoadmap = StorageService.getItem<TechSkill[]>('coding_roadmap', DEFAULT_ROADMAP);
    setRoadmap(!savedRoadmap || savedRoadmap.length === 0 ? DEFAULT_ROADMAP : savedRoadmap);
    setProjects(StorageService.getItem<Project[]>('my_projects', []));
  }, []);

  const saveRoadmap = (data: TechSkill[]) => {
    setRoadmap(data);
    StorageService.setItem('coding_roadmap', data);
  };

  const saveProjects = (data: Project[]) => {
    setProjects(data);
    StorageService.setItem('my_projects', data);
  };

  const toggleSkill = (id: string) => {
    const updated = roadmap.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    saveRoadmap(updated);
    const isCompleted = updated.find(s => s.id === id)?.completed;
    if (isCompleted) {
      audioService.playAmbientSuccess();
      try {
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
      } catch (_err) {
        // ignore confetti failure
      }
    } else {
      audioService.playAmbientClick();
    }
  };

  const addProject = () => {
    if (!newProject.title) return;
    const project: Project = {
      id: StorageService.generateId(),
      title: newProject.title,
      type: newProject.type || 'PERSONAL',
      description: newProject.description || '',
      techStack: newProject.techStack || [],
      status: newProject.status || 'IDEA',
      githubLink: newProject.githubLink,
      demoLink: newProject.demoLink,
      progress: newProject.progress || 0,
      createdAt: Date.now()
    };
    saveProjects([...projects, project]);
    setNewProject({ type: 'PERSONAL', status: 'IDEA', techStack: [], progress: 0 });
    setIsModalOpen(false);
    audioService.playAmbientSuccess();
  };

  const updateProjectProgress = (id: string, progress: number) => {
    saveProjects((projects || []).map(p => p.id === id ? { ...p, progress } : p));
  };

  const updateProjectStatus = (id: string, status: Project['status']) => {
    saveProjects((projects || []).map(p => p.id === id ? { ...p, status } : p));
    audioService.playAmbientClick();
  };

  const deleteProject = (id: string) => {
    if (confirm('Hapus proyek ini secara permanen?')) {
      saveProjects((projects || []).filter(p => p.id !== id));
      audioService.playAmbientClick();
    }
  };

  const addTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      if (!newProject.techStack?.includes(techInput.trim())) {
        setNewProject({ ...newProject, techStack: [...(newProject.techStack || []), techInput.trim()] });
      }
      setTechInput('');
    }
  };

  const removeTech = (index: number) => {
    const updated = [...(newProject.techStack || [])];
    updated.splice(index, 1);
    setNewProject({ ...newProject, techStack: updated });
  };

  // KPIs
  const stats = useMemo(() => {
    const safeProjects = projects || [];
    const total = safeProjects.length;
    const completed = safeProjects.filter(p => p.status === 'COMPLETED').length;
    const inProgress = safeProjects.filter(p => p.status === 'IN_PROGRESS').length;
    const ideas = safeProjects.filter(p => p.status === 'IDEA').length;
    
    const skillsMastered = roadmap.filter(s => s.completed).length;
    const roadmapProgress = roadmap.length > 0 ? Math.round((skillsMastered / roadmap.length) * 100) : 0;

    return { total, completed, inProgress, ideas, skillsMastered, roadmapProgress };
  }, [projects, roadmap]);

  const renderProjectKanbanColumn = (status: Project['status'], title: string, icon: React.ReactNode, borderClass: string, bgClass: string, textClass: string) => {
    const columnProjects = (projects || []).filter(p => p.status === status);
    
    return (
      <div className={`flex flex-col h-full bg-zinc-950/50 rounded-3xl p-4 border ${borderClass} relative`}>
        <div className={`flex justify-between items-center mb-4 pb-2 border-b ${borderClass}`}>
           <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}>
             {icon} {title}
           </span>
           <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${bgClass} ${textClass} ${borderClass}`}>
             {columnProjects.length}
           </span>
        </div>
        
        <div className="flex-1 space-y-3">
           {columnProjects.length === 0 ? (
             <div className="h-28 flex items-center justify-center text-zinc-600 text-xs italic border-2 border-dashed border-zinc-900 rounded-2xl">Kosong</div>
           ) : (
             <AnimatePresence>
               {columnProjects.map(project => (
                 <motion.div 
                   key={project.id} 
                   layout 
                   initial={{ opacity: 0, scale: 0.95 }} 
                   animate={{ opacity: 1, scale: 1 }} 
                   exit={{ opacity: 0, scale: 0.95 }}
                   className={`bg-zinc-900/90 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg hover:border-white/15 transition-all group flex flex-col relative overflow-hidden`}
                 >
                   <div className="flex justify-between items-start mb-2.5 gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
                         project.type === 'FAMILY_BUSINESS' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                         project.type === 'FREELANCE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                         project.type === 'STARTUP' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                         'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      }`}>
                         { (project.type || 'PERSONAL').replace('_', ' ') }
                      </span>
                      <button onClick={() => deleteProject(project.id)} className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                         <Trash2 size={14} />
                      </button>
                   </div>
                   
                   <h4 className="font-bold text-white text-sm md:text-base mb-1.5 break-words">{project.title}</h4>
                   <p className="text-zinc-400 text-xs line-clamp-2 mb-3 leading-relaxed break-words">{project.description}</p>
                   
                   <div className="flex flex-wrap gap-1 mb-3">
                      {(project.techStack || []).map((tech, i) => (
                         <span key={i} className="bg-black/40 text-zinc-400 text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border border-white/5 shrink-0">
                            {tech}
                         </span>
                      ))}
                   </div>
                   
                   {/* Progress Slider */}
                   {status === 'IN_PROGRESS' && (
                      <div className="mb-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                         <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wide">
                            <span>Progres</span>
                            <span className="text-indigo-300">{project.progress}%</span>
                         </div>
                         <div className="relative pt-1">
                           <input 
                             type="range" min="0" max="100" step="5" value={project.progress} 
                             onChange={(e) => updateProjectProgress(project.id, parseInt(e.target.value))}
                             className="absolute top-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
                             title="Geser progres"
                           />
                           <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${project.progress}%` }}></div>
                           </div>
                         </div>
                      </div>
                   )}

                   <div className="flex flex-wrap justify-between items-center gap-2 mt-auto pt-3 border-t border-white/5">
                      <div className="flex gap-2">
                         {project.githubLink && (
                            <a href={project.githubLink} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 p-1.5 rounded-lg border border-white/5 transition-colors" title="Repo GitHub">
                               <Github size={13} />
                            </a>
                         )}
                         {project.demoLink && (
                            <a href={project.demoLink} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-400 bg-zinc-800/80 hover:bg-indigo-500/20 p-1.5 rounded-lg border border-white/5 transition-colors" title="Live Demo">
                               <ExternalLink size={13} />
                            </a>
                         )}
                      </div>
                      
                      {/* Quick Move Buttons */}
                      <div className="flex gap-1.5 ml-auto">
                        {status === 'IDEA' && <button onClick={() => updateProjectStatus(project.id, 'IN_PROGRESS')} className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg hover:bg-indigo-500/30 flex items-center gap-1"><Play size={10}/> Mulai</button>}
                        {status === 'IN_PROGRESS' && <button onClick={() => updateProjectStatus(project.id, 'COMPLETED')} className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg hover:bg-emerald-500/30 flex items-center gap-1"><CheckCircle2 size={10}/> Selesai</button>}
                        {status === 'COMPLETED' && <button onClick={() => updateProjectStatus(project.id, 'IN_PROGRESS')} className="text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-white/5 px-2.5 py-1 rounded-lg hover:bg-zinc-700">Revisi</button>}
                      </div>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in flex flex-col pb-28 sm:pb-16">
      {/* Header Bar with KPI Summary */}
      <div className="px-1 sm:px-2 mb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 mb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10 shrink-0">
                <FolderGit2 size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <span className="truncate">Proyek & Portofolio</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
              Kelola ide proyek nyata, pantau progres portofolio, dan pelajari roadmap keahlian untuk karir.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-white/10 shadow-inner shrink-0">
              <button
                onClick={() => setActiveTab('PROJECTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'PROJECTS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} /> <span>Kanban</span>
              </button>
              <button
                onClick={() => setActiveTab('ROADMAP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ROADMAP' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Target size={14} /> <span>Roadmap</span>
              </button>
            </div>

            {/* Add Project Button */}
            {activeTab === 'PROJECTS' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 flex-1 md:flex-initial"
              >
                <Plus size={16} /> <span>Proyek Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Mini Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block truncate">Total Proyek</span>
              <span className="text-lg sm:text-2xl font-black text-white">{stats.total}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-white/5 font-bold text-xs shrink-0 ml-1">
              <FolderGit2 size={15} />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider block truncate">Dikerjakan</span>
              <span className="text-lg sm:text-2xl font-black text-indigo-300">{stats.inProgress}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0 ml-1">
              <Code size={15} />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">Selesai Rilis</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-300">{stats.completed}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 ml-1">
              <Rocket size={15} />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wider block truncate">Roadmap Skill</span>
              <span className="text-lg sm:text-2xl font-black text-primary">{stats.roadmapProgress}%</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 text-xs font-bold shrink-0 ml-1">
              {stats.skillsMastered}/{roadmap.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PROJECTS' ? (
        /* Kanban View */
        <div className="w-full px-1 sm:px-2">
          {/* Mobile Kanban Tab Selector (Shown only on small screens) */}
          <div className="flex md:hidden bg-zinc-900/90 p-1 rounded-2xl border border-white/10 mb-4 gap-1">
            <button
              onClick={() => setMobileProjectTab('IDEA')}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileProjectTab === 'IDEA' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles size={12}/>
              Ide ({projects.filter(p => p.status === 'IDEA').length})
            </button>
            <button
              onClick={() => setMobileProjectTab('IN_PROGRESS')}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileProjectTab === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code size={12}/>
              Dibangun ({projects.filter(p => p.status === 'IN_PROGRESS').length})
            </button>
            <button
              onClick={() => setMobileProjectTab('COMPLETED')}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileProjectTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle2 size={12}/>
              Rilis ({projects.filter(p => p.status === 'COMPLETED').length})
            </button>
          </div>

          {/* Mobile Active Column View (md:hidden) */}
          <div className="md:hidden">
            {mobileProjectTab === 'IDEA' && renderProjectKanbanColumn('IDEA', 'Ide / Konsep', <Sparkles size={12}/>, 'border-white/5', 'bg-zinc-800', 'text-zinc-400')}
            {mobileProjectTab === 'IN_PROGRESS' && renderProjectKanbanColumn('IN_PROGRESS', 'Sedang Dibangun', <Code size={12}/>, 'border-indigo-500/15', 'bg-indigo-500/10', 'text-indigo-400')}
            {mobileProjectTab === 'COMPLETED' && renderProjectKanbanColumn('COMPLETED', 'Selesai & Rilis', <CheckCircle2 size={12}/>, 'border-emerald-500/15', 'bg-emerald-500/10', 'text-emerald-400')}
          </div>

          {/* Desktop 3-Column Kanban (hidden on mobile, visible on md+) */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 items-start">
            {renderProjectKanbanColumn('IDEA', 'Ide / Konsep', <Sparkles size={12}/>, 'border-white/5', 'bg-zinc-800', 'text-zinc-400')}
            {renderProjectKanbanColumn('IN_PROGRESS', 'Sedang Dibangun', <Code size={12}/>, 'border-indigo-500/15', 'bg-indigo-500/10', 'text-indigo-400')}
            {renderProjectKanbanColumn('COMPLETED', 'Selesai & Rilis', <CheckCircle2 size={12}/>, 'border-emerald-500/15', 'bg-emerald-500/10', 'text-emerald-400')}
          </div>
        </div>
      ) : (
        /* Roadmap View */
        <div className="grid md:grid-cols-3 gap-6 flex-1 px-1 sm:px-2 pb-12">
           <div className="md:col-span-2 bg-zinc-950/50 border border-white/5 p-4 sm:p-6 md:p-8 rounded-3xl flex flex-col">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 mb-1.5 tracking-tight">
                      <Target className="text-primary" size={22} />
                      Software Engineer Roadmap
                   </h2>
                   <p className="text-xs sm:text-sm text-zinc-400">Peta jalan keterampilan esensial untuk membangun aplikasi nyata (Web Full-Stack).</p>
                 </div>
              </div>
              
              <div className="relative flex-1">
                 <div className="absolute left-5 sm:left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-zinc-800 to-zinc-900 rounded-full"></div>
                 <div className="space-y-3 sm:space-y-4">
                    {roadmap.map((skill, idx) => (
                      <div 
                        key={skill.id} 
                        onClick={() => toggleSkill(skill.id)}
                        className={`relative flex items-center gap-3 sm:gap-5 p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${
                          skill.completed 
                            ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                            : 'bg-zinc-900/80 border-white/5 hover:border-white/15'
                        }`}
                      >
                         <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all shadow-inner ${
                           skill.completed 
                             ? 'bg-primary text-white shadow-primary/50 ring-4 ring-primary/20' 
                             : 'bg-zinc-950 text-zinc-500 border border-white/10 group-hover:border-white/20 group-hover:text-zinc-300'
                         }`}>
                            {skill.completed ? <CheckCircle2 size={20} className="sm:w-6 sm:h-6 animate-in zoom-in duration-300" /> : <span className="text-xs sm:text-sm font-black">{idx + 1}</span>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm sm:text-base md:text-lg transition-colors mb-0.5 sm:mb-1 tracking-tight truncate ${skill.completed ? 'text-primary' : 'text-zinc-100'}`}>
                              {skill.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mb-1.5 sm:mb-2 line-clamp-2">{skill.description}</p>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 sm:py-1 rounded-md inline-block ${
                              skill.level === 'BEGINNER' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                              skill.level === 'INTERMEDIATE' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            }`}>
                              {skill.level}
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-5 sm:p-6 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-20">
                   <Target size={80} className="text-indigo-400" />
                 </div>
                 <h3 className="font-bold text-white text-base sm:text-lg mb-2 relative z-10 flex items-center gap-2">
                   <TrendingUp size={18} className="text-indigo-400" /> Penguasaan
                 </h3>
                 <div className="relative z-10 flex items-end gap-2">
                   <span className="text-4xl sm:text-5xl font-black text-indigo-300">{stats.roadmapProgress}%</span>
                   <span className="text-xs sm:text-sm text-indigo-400/80 font-bold mb-1.5 uppercase tracking-wider">Selesai</span>
                 </div>
                 <p className="text-xs text-indigo-200 mt-3 sm:mt-4 relative z-10 leading-relaxed">
                   Setiap bahasa dan alat yang Anda pelajari membuka peluang proyek baru. Konsisten belajar langkah demi langkah.
                 </p>
              </div>

              <div className="bg-zinc-900/60 border border-white/5 p-5 sm:p-6 rounded-3xl">
                 <h3 className="font-bold text-white mb-2.5 flex items-center gap-2 text-sm sm:text-base"><Code size={16} className="text-primary"/> Tips Belajar</h3>
                 <ul className="text-xs text-zinc-400 space-y-2.5 sm:space-y-3">
                   <li className="flex gap-2">
                     <span className="text-primary shrink-0">✦</span> 
                     Jangan terpaku pada tutorial (Tutorial Hell). Segera bangun proyek nyata dengan skill baru.
                   </li>
                   <li className="flex gap-2">
                     <span className="text-primary shrink-0">✦</span> 
                     Pelajari fundamental sebelum framework. JS murni lebih penting dari React.
                   </li>
                   <li className="flex gap-2">
                     <span className="text-primary shrink-0">✦</span> 
                     Upload kode ke GitHub. Rekam jejak hijau (Contributions) sangat disukai rekruter.
                   </li>
                 </ul>
              </div>
           </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] p-3 sm:p-4 animate-fade-in backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 sm:top-6 right-4 sm:right-6 text-zinc-400 hover:text-white bg-zinc-800/80 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Briefcase size={20} />
              </div>
              Proyek Baru
            </h3>
            
            <div className="space-y-4">
              {/* Project Title */}
              <div>
                 <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nama Proyek</label>
                 <input 
                   className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm" 
                   placeholder="Contoh: Aplikasi POS Kedai Kopi" 
                   value={newProject.title || ''} 
                   onChange={e => setNewProject({...newProject, title: e.target.value})} 
                   autoFocus 
                 />
              </div>
              
              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Kategori Tujuan</label>
                   <select 
                     className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm appearance-none" 
                     value={newProject.type} 
                     onChange={e => setNewProject({...newProject, type: e.target.value as any})}
                   >
                      <option value="PERSONAL">Personal / Portofolio</option>
                      <option value="FAMILY_BUSINESS">Bisnis Keluarga (UKM)</option>
                      <option value="FREELANCE">Freelance / Klien</option>
                      <option value="STARTUP">Ide Startup / Bisnis</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Status Awal</label>
                   <select 
                     className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm appearance-none" 
                     value={newProject.status} 
                     onChange={e => setNewProject({...newProject, status: e.target.value as any})}
                   >
                      <option value="IDEA">💡 Ide (Belum Mulai)</option>
                      <option value="IN_PROGRESS">🚀 Sedang Dikerjakan</option>
                      <option value="COMPLETED">✅ Selesai & Rilis</option>
                   </select>
                 </div>
              </div>

              {/* Description */}
              <div>
                 <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Deskripsi Singkat</label>
                 <textarea 
                   className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-indigo-500 outline-none h-24 resize-none text-sm" 
                   placeholder="Aplikasi kasir sederhana berbasis web untuk membantu pencatatan kedai kopi paman..." 
                   value={newProject.description || ''} 
                   onChange={e => setNewProject({...newProject, description: e.target.value})} 
                 />
              </div>

              {/* Tech Stack */}
              <div>
                 <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tech Stack (Ketik & Tekan Enter)</label>
                 <div className="relative">
                   <input 
                     type="text" 
                     value={techInput}
                     onChange={e => setTechInput(e.target.value)}
                     onKeyDown={addTech}
                     placeholder="Contoh: React, Node.js, Firebase..."
                     className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-indigo-500 outline-none text-sm mb-3"
                   />
                 </div>
                 {newProject.techStack && newProject.techStack.length > 0 && (
                   <div className="flex flex-wrap gap-2 p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                      {newProject.techStack.map((tech, i) => (
                         <span key={i} className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1.5 font-semibold">
                            {tech} 
                            <button type="button" onClick={() => removeTech(i)} className="hover:text-rose-400 focus:outline-none"><X size={12}/></button>
                         </span>
                      ))}
                   </div>
                 )}
              </div>
              
              {/* External Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                 <div>
                   <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Github size={12}/> Link Repo GitHub</label>
                   <input 
                     className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:border-indigo-500 outline-none text-xs" 
                     placeholder="https://github.com/..." 
                     value={newProject.githubLink || ''} 
                     onChange={e => setNewProject({...newProject, githubLink: e.target.value})} 
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ExternalLink size={12}/> Link Live Demo</label>
                   <input 
                     className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-2.5 rounded-xl focus:border-indigo-500 outline-none text-xs" 
                     placeholder="https://my-app.vercel.app..." 
                     value={newProject.demoLink || ''} 
                     onChange={e => setNewProject({...newProject, demoLink: e.target.value})} 
                   />
                 </div>
              </div>

              {/* Actions */}
              <div className="pt-6 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)} 
                   className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors text-sm"
                 >
                   Batal
                 </button>
                 <button 
                   type="button" 
                   onClick={addProject} 
                   disabled={!newProject.title}
                   className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm flex justify-center items-center gap-2"
                 >
                   <Briefcase size={16} /> Simpan Proyek
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

