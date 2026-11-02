import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Calendar, CheckSquare, BookOpen, Clock, GraduationCap, 
  Library, BrainCircuit, Settings, Layers, PenTool, Lightbulb, Compass, 
  Award, Target, Map, Repeat, Bot, Wallet, Moon, Utensils, Briefcase, 
  Quote, Users, CalendarDays, Menu, X, Dumbbell, Rocket, Zap, Brain, 
  Sparkles, Command, Coffee, Crown, UserCheck, BarChart2, ChevronDown, 
  ChevronRight, ChevronLeft, Search, PanelLeftClose, PanelLeft, Flame, Radio, BookMarked,
  Languages, ShieldCheck
} from 'lucide-react';
import { ViewState, Task, TaskStatus, Priority } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobile: boolean;
  tasks?: Task[];
  onOpenCommandPalette?: () => void;
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  onOpenBackgroundSettings?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  isMobile, 
  tasks = [],
  onOpenCommandPalette,
  isSidebarCollapsed = false,
  setIsSidebarCollapsed,
  onOpenBackgroundSettings
}) => {
  const userProfile = useStore(state => state.userProfile);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const renderAppIcon = () => {
    if (userProfile?.usePhotoAsLogo && userProfile?.photo) {
      return <img src={userProfile.photo} alt="Logo" className="w-full h-full object-cover" />;
    }
    const iconName = userProfile?.appIcon || 'K';
    if (iconName === 'K') return <img src="/logo.jpg" alt="Kampus Kit Logo" className="w-full h-full object-cover" />;
    if (iconName === 'Crown') return <Crown size={18} />;
    if (iconName === 'Rocket') return <Rocket size={18} />;
    if (iconName === 'Zap') return <Zap size={18} />;
    if (iconName === 'Brain') return <Brain size={18} />;
    if (iconName === 'Award') return <Award size={18} />;
    if (iconName === 'Sparkles') return <Sparkles size={18} />;
    if (iconName === 'Book') return <BookOpen size={18} />;
    if (iconName === 'Command') return <Command size={18} />;
    if (iconName === 'Coffee') return <Coffee size={18} />;
    return "K";
  };

  const semester = userProfile?.semester || 1;
  const isSenior = semester >= 5;
  const pendingTasksCount = (tasks || []).filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.HIGH).length;
  const disabledFeatures = userProfile?.disabledFeatures || [];
  
  const isEn = language === 'en';

  const menuGroups = [
    {
      title: isEn ? 'Command Center' : 'Command Center',
      items: [
        { id: 'dashboard', label: isEn ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard },
        { id: 'location', label: isEn ? 'GPS' : 'GPS', icon: Radio },
        { id: 'ai-chat', label: 'AI Assistant', icon: Bot },
        { id: 'statistics', label: isEn ? 'OS Stats' : 'Statistik OS', icon: BarChart2 },
      ].filter(item => !disabledFeatures.includes(item.id))
    },
    {
      title: isEn ? 'Workspace' : 'Workspace',
      items: [
        { id: 'tasks', label: isEn ? 'Tasks & Projects' : 'Tugas & Proyek', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'planner', label: isEn ? 'Daily Planner' : 'Planner Harian', icon: CalendarDays },
        { id: 'notes', label: isEn ? 'Notes' : 'Catatan', icon: BookOpen },
        { id: 'focus', label: 'Focus Space', icon: Clock },
        { id: 'flashcards', label: 'Flashcards', icon: Layers },
      ].filter(item => !disabledFeatures.includes(item.id))
    },
    {
      title: isEn ? 'Academic' : 'Akademik',
      items: [
        { id: 'course-hub', label: isEn ? 'Course Hub' : 'Hub Mata Kuliah', icon: BookOpen },
        { id: 'calendar', label: isEn ? 'Calendar' : 'Kalender', icon: CalendarDays },
        { id: 'schedule', label: isEn ? 'Class Schedule' : 'Jadwal Kuliah', icon: Calendar },
        { id: 'attendance', label: isEn ? 'Attendance' : 'Presensi', icon: UserCheck },
        { id: 'curriculum', label: isEn ? 'Curriculum Hub' : 'Kurikulum Belajar', icon: BookMarked },
        { id: 'micro-learning', label: 'Micro Learning', icon: Brain },
        { id: 'grades', label: isEn ? 'GPA Target' : 'Target IPK', icon: GraduationCap },
        { id: 'library', label: isEn ? 'Library' : 'Perpustakaan', icon: Library },
        { id: 'study-guide', label: isEn ? 'Study Guide' : 'Metode Belajar', icon: Compass },
        { id: 'citation', label: isEn ? 'Citations' : 'Sitasi & Ref', icon: Quote },
      ].filter(item => !disabledFeatures.includes(item.id))
    },
    {
      title: isEn ? 'Wellness & Life' : 'Wellness & Life',
      items: [
        { id: 'habits', label: isEn ? 'Habits' : 'Habits & Disiplin', icon: Repeat },
        { id: 'goals', label: isEn ? 'Goals' : 'Target Hidup', icon: Target },
        { id: 'journal', label: isEn ? 'Journal' : 'Jurnal Refleksi', icon: PenTool },
        { id: 'budget', label: isEn ? 'Budget' : 'Keuangan', icon: Wallet },
        { id: 'sleep', label: isEn ? 'Sleep Rhythm' : 'Pola Tidur', icon: Moon },
        { id: 'meals', label: isEn ? 'Nutrition' : 'Nutrisi', icon: Utensils },
        { id: 'sports', label: isEn ? 'Workout' : 'Olahraga', icon: Dumbbell },
        { id: 'gym', label: 'Gym Tracker', icon: Dumbbell },
      ].filter(item => !disabledFeatures.includes(item.id))
    },
    {
      title: isEn ? 'Growth & Future' : 'Growth & Future',
      items: [
        { id: 'projects', label: isEn ? 'Projects' : 'Proyek & Freelance', icon: Briefcase, badge: 0 } as any,
        { id: 'learning-path', label: 'AI Learning Path', icon: Map },
        { id: 'skills', label: 'Skill Roadmap', icon: Award },
        { id: 'invoice', label: 'Invoice Generator', icon: Wallet },
        { id: 'campus-life', label: isEn ? 'Campus Life' : 'Organisasi', icon: Users },
        { id: 'brain-gym', label: 'Brain Gym', icon: BrainCircuit },
        { id: 'motivation', label: isEn ? 'Motivation' : 'Motivasi', icon: Lightbulb },
        { id: 'compass', label: 'Life Compass', icon: Map },
        { id: 'career', label: isEn ? 'Career Prep' : 'Persiapan Karir', icon: Briefcase },
      ].filter(item => !disabledFeatures.includes(item.id))
    }
  ].filter(group => group.items.length > 0);

  const handleMobileNav = (viewId: ViewState) => {
    setView(viewId);
    setIsMobileMenuOpen(false);
  };

  const filteredMobileGroups = (() => {
    if (!mobileSearchQuery.trim()) return menuGroups;
    const q = mobileSearchQuery.toLowerCase().trim();
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      )
    })).filter(group => group.items.length > 0);
  })();

  // --- MOBILE (SMARTPHONE) VIEW ---
  if (isMobile) {
    const mobileItems: any[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calendar', label: 'Kalender', icon: CalendarDays },
      { id: 'tasks', label: 'Tugas', icon: CheckSquare, badge: pendingTasksCount },
      { id: 'notes', label: 'Catatan', icon: BookOpen },
    ].filter(item => !disabledFeatures.includes(item.id));

    return (
      <>
        {/* Full Screen Mobile Menu Overlay / Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col"
            >
              {/* Drawer Top Header */}
              <div className="flex h-[calc(4rem+env(safe-area-inset-top,0px))] items-center justify-between border-b border-white/[0.06] bg-zinc-950/95 pt-[env(safe-area-inset-top,0px)] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-black/30 text-lg overflow-hidden ${userProfile?.usePhotoAsLogo && userProfile?.photo ? '' : (userProfile?.appIconColor || 'bg-gradient-to-br from-primary to-indigo-500')}`}>
                    {renderAppIcon()}
                  </div>
                  <div>
                    <h1 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
                      Kampus Kit <span className="bg-white/[0.06] text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-white/[0.08]">V3.3</span>
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-[0.14em]">Semua Modul & Fitur</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95 touch-manipulation"
                  aria-label="Tutup Menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Search Box in Mobile Menu */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    placeholder="Cari modul (tugas, ipk, jadwal, ai...)"
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  {mobileSearchQuery && (
                    <button 
                      onClick={() => setMobileSearchQuery('')}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                      aria-label="Hapus Pencarian"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* User Profile Mini Banner */}
              <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex items-center gap-3" onClick={() => handleMobileNav('profile')}>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-primary/40 overflow-hidden relative flex-shrink-0">
                    {userProfile?.photo ? (
                      <img src={userProfile.photo} alt="U" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-primary font-bold">
                        {userProfile?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{userProfile?.name || 'Mahasiswa'}</p>
                    <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                      <span className="text-yellow-400 font-bold flex items-center gap-0.5"><Crown size={10} /> Lvl {userProfile?.level || 1}</span>
                      <span>•</span>
                      <span className="text-orange-400 font-bold flex items-center gap-0.5"><Flame size={10} /> {userProfile?.streak || 0}d</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleMobileNav('profile')}
                  className="text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  Profil
                </button>
              </div>
              
              {/* Scrollable Categories and Items */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
                {filteredMobileGroups.map((group, idx) => {
                  const isCollapsed = collapsedGroups.includes(group.title) && !mobileSearchQuery;
                  return (
                    <div key={idx} className="space-y-2">
                      <button 
                        onClick={() => toggleGroup(group.title)}
                        className="w-full flex items-center justify-between px-2 py-1 opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em]">{group.title}</h3>
                        {!mobileSearchQuery && (
                          isCollapsed ? <ChevronRight size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />
                        )}
                      </button>

                      {!isCollapsed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                          {group.items.map((item) => {
                            const isActive = currentView === item.id;
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleMobileNav(item.id as ViewState)}
                                className={`flex items-center justify-start gap-3.5 p-3 rounded-xl transition-colors text-left w-full overflow-hidden min-h-[52px] touch-manipulation active:scale-[0.98] ${
                                  isActive 
                                    ? 'bg-primary/10 text-white border border-primary/30'
                                    : 'bg-white/[0.03] text-zinc-300 border border-white/[0.05] hover:bg-white/[0.06]'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-white/[0.04] text-zinc-400'}`}>
                                  <Icon size={17} />
                                </div>
                                <span className="text-sm font-medium truncate flex-1 min-w-0">{item.label}</span>
                                {item.badge && item.badge > 0 ? (
                                  <span className="flex-shrink-0 ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {item.badge}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Preferences */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <h3 className="px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em]">Preferensi</h3>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-200">
                      <Languages size={18} className="text-zinc-400" />
                      Bahasa
                    </div>
                    <div className="flex items-center rounded-lg border border-white/[0.08] bg-black/30 p-0.5 text-[11px] font-mono">
                      <button
                        onClick={() => setLanguage('id')}
                        className={`rounded-md px-2.5 py-1 font-bold transition-colors ${language === 'id' ? 'bg-primary text-white' : 'text-zinc-400'}`}
                        aria-pressed={language === 'id'}
                      >
                        ID
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`rounded-md px-2.5 py-1 font-bold transition-colors ${language === 'en' ? 'bg-primary text-white' : 'text-zinc-400'}`}
                        aria-pressed={language === 'en'}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {onOpenBackgroundSettings && (
                    <button
                      onClick={() => {
                        onOpenBackgroundSettings();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06]"
                    >
                      <ShieldCheck size={18} className="text-emerald-400" />
                      Izin background & baterai
                    </button>
                  )}
                </div>

                {/* PWA Install */}
                <div className="pt-1">
                  <PWAInstallButton variant="full" />
                </div>

                {/* System Settings */}
                <div className="pt-1">
                  <h3 className="px-1 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em]">Sistem</h3>
                  <button
                    onClick={() => handleMobileNav('settings')}
                    className={`w-full flex items-center justify-start gap-3.5 p-3 rounded-xl transition-colors text-left min-h-[52px] touch-manipulation active:scale-[0.98] ${
                      currentView === 'settings'
                        ? 'bg-primary/10 text-white border border-primary/30'
                        : 'bg-white/[0.03] text-zinc-300 border border-white/[0.05]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentView === 'settings' ? 'bg-primary text-white' : 'bg-white/[0.04] text-zinc-400'}`}>
                      <Settings size={17} />
                    </div>
                    <span className="text-sm font-medium">Pengaturan Sistem</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating bottom dock */}
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 pointer-events-none">
          <nav className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-2xl border border-white/10 bg-zinc-950/90 p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            {mobileItems.map((item) => {
              const isActive = currentView === item.id && !isMobileMenuOpen;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileNav(item.id as ViewState)}
                  className={`relative flex h-13 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors touch-manipulation active:scale-95 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full border border-zinc-950 bg-rose-500 px-1 text-[8px] font-black text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={`text-[10px] tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </button>
              );
            })}

            <div className="mx-0.5 h-7 w-px bg-white/[0.08]"></div>

            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`flex h-13 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors touch-manipulation active:scale-95 ${
                isMobileMenuOpen 
                  ? 'bg-primary/10 text-primary'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }`}
              aria-label="Buka Semua Menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={20} strokeWidth={1.9} />
              <span className="text-[10px] font-medium tracking-tight">Menu</span>
            </button>
          </nav>
        </div>
      </>
    );
  }

  // --- DESKTOP / LAPTOP SIDEBAR VIEW ---
  const desktopItemClass = "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[13px] font-medium cursor-pointer mb-0.5";
  const inactiveDesktopClass = "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]";

  return (
    <aside 
      className={`h-full flex-shrink-0 flex flex-col z-40 bg-zinc-950/95 border-r border-white/[0.06] relative transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-[264px] xl:w-[280px]'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-black/30 text-lg overflow-hidden flex-shrink-0 ${userProfile?.usePhotoAsLogo && userProfile?.photo ? '' : (userProfile?.appIconColor || 'bg-gradient-to-br from-primary to-indigo-500')}`}>
            {renderAppIcon()}
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h1 className="text-[13px] font-semibold text-white tracking-tight flex items-center gap-2 truncate">
                Kampus Kit <span className="bg-white/[0.06] text-zinc-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-white/[0.08]">V3.3</span>
              </h1>
              <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-[0.16em]">OS Mahasiswa</p>
            </div>
          )}
        </div>

        {/* Sidebar Collapse Toggle Button */}
        {setIsSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 ml-1"
            title={isSidebarCollapsed ? "Perluas Sidebar (Ctrl+B)" : "Perkecil Sidebar (Ctrl+B)"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      {/* Quick Search Button (Command Palette Trigger) */}
      <div className="px-3 pt-3">
        <button
          onClick={onOpenCommandPalette}
          className={`w-full h-10 flex items-center gap-2.5 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-white text-xs transition-colors group ${
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'
          }`}
          title="Cari Cepat & Perintah (⌘K / Ctrl+K)"
          aria-label="Cari Cepat & Perintah"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search size={16} className="text-zinc-400 group-hover:text-primary transition-colors flex-shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Cari Modul & Fitur...</span>}
          </div>
          {!isSidebarCollapsed && (
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] font-mono text-zinc-400">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Scrollable Menu Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-4">
        {menuGroups.map((group, idx) => {
          const isCollapsed = collapsedGroups.includes(group.title) && !isSidebarCollapsed;
          return (
            <div key={idx} className="space-y-1">
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 opacity-80 hover:opacity-100 transition-opacity group/header"
                >
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] group-hover/header:text-zinc-300 transition-colors">
                    {group.title}
                  </h3>
                  {isCollapsed ? (
                    <ChevronRight size={12} className="text-zinc-500 group-hover/header:text-zinc-300" />
                  ) : (
                    <ChevronDown size={12} className="text-zinc-500 group-hover/header:text-zinc-300" />
                  )}
                </button>
              )}

              {(!isCollapsed || isSidebarCollapsed) && (
                <div className="space-y-1 animate-fade-in">
                  {group.items.map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)}
                        className={`${desktopItemClass} ${
                          isSidebarCollapsed ? 'justify-center px-0' : ''
                        } ${isActive ? 'bg-primary/10 text-white' : inactiveDesktopClass}`}
                        title={isSidebarCollapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        
                        <div className="relative">
                          <Icon 
                            size={18} 
                            className={`relative z-10 transition-colors ${
                              isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-200'
                            }`} 
                          />
                          {isSidebarCollapsed && item.badge && item.badge > 0 ? (
                            <span className="absolute -top-1.5 -right-2 min-w-[12px] h-[12px] bg-red-500 rounded-full border border-black text-[8px] font-bold text-white flex items-center justify-center z-20">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>

                        {!isSidebarCollapsed && (
                          <>
                            <span className="flex-1 relative z-10 truncate">{item.label}</span>
                            {item.badge && item.badge > 0 ? (
                              <span className="relative z-10 rounded-md border border-rose-500/20 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Settings item */}
        <div className="pt-2">
          {!isSidebarCollapsed && (
            <h3 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] mb-1.5">
              Sistem
            </h3>
          )}
          <div
            onClick={() => setView('settings')}
            className={`${desktopItemClass} ${
              isSidebarCollapsed ? 'justify-center px-0' : ''
            } ${currentView === 'settings' ? 'bg-primary/10 text-white' : inactiveDesktopClass}`}
            title={isSidebarCollapsed ? "Pengaturan" : undefined}
          >
            {currentView === 'settings' && (
              <motion.span
                layoutId="activeNavIndicator"
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Settings 
              size={18} 
              className={`relative z-10 transition-colors ${
                currentView === 'settings' ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-200'
              }`} 
            />
            {!isSidebarCollapsed && <span className="relative z-10">Pengaturan</span>}
          </div>
        </div>

        {/* PWA Install Button in Desktop Sidebar */}
        <div className="px-3 pb-2 pt-1">
          <PWAInstallButton 
            variant={isSidebarCollapsed ? 'icon-only' : 'full'} 
            className={isSidebarCollapsed ? 'w-full justify-center mx-auto' : ''}
          />
        </div>
      </div>

      {/* User Profile Footer Mini */}
      <div className="p-3 border-t border-white/[0.06]">
        <div 
          className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer group border ${
            currentView === 'profile' 
              ? 'border-primary/30 bg-primary/10'
              : 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]'
          } ${isSidebarCollapsed ? 'justify-center p-1' : ''}`}
          onClick={() => setView('profile')}
          title={isSidebarCollapsed ? `${userProfile?.name || 'Mahasiswa'} (Profil)` : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shadow-sm relative flex-shrink-0">
            {userProfile?.photo ? (
              <img src={userProfile.photo} alt="U" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-primary font-bold">
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-primary transition-colors">
                {userProfile?.name || 'Mahasiswa'}
              </p>
              <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1.5">
                <span>Sem {semester}</span>
                <span>•</span>
                <span className="text-yellow-400 font-bold">Lvl {userProfile?.level || 1}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
