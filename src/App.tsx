import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { CommandPalette } from './components/CommandPalette';

const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectPortfolio = React.lazy(() => import('./components/ProjectPortfolio').then(m => ({ default: m.ProjectPortfolio })));
const Schedule = React.lazy(() => import('./components/Schedule').then(m => ({ default: m.Schedule })));
const TaskManager = React.lazy(() => import('./components/TaskManager').then(m => ({ default: m.TaskManager })));
const Notes = React.lazy(() => import('./components/Notes').then(m => ({ default: m.Notes })));
const FocusTimer = React.lazy(() => import('./components/FocusTimer').then(m => ({ default: m.FocusTimer })));
const GradeCalc = React.lazy(() => import('./components/GradeCalc').then(m => ({ default: m.GradeCalc })));
const Library = React.lazy(() => import('./components/Library').then(m => ({ default: m.Library })));
const BrainGym = React.lazy(() => import('./components/BrainGym').then(m => ({ default: m.BrainGym })));
const Flashcards = React.lazy(() => import('./components/Flashcards').then(m => ({ default: m.Flashcards })));
const Settings = React.lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const ProfileHub = React.lazy(() => import('./components/ProfileHub').then(m => ({ default: m.ProfileHub })));
const Journal = React.lazy(() => import('./components/Journal').then(m => ({ default: m.Journal })));
const Motivation = React.lazy(() => import('./components/Motivation').then(m => ({ default: m.Motivation })));
const StudyGuide = React.lazy(() => import('./components/StudyGuide').then(m => ({ default: m.StudyGuide })));
const SkillRoadmap = React.lazy(() => import('./components/SkillRoadmap').then(m => ({ default: m.SkillRoadmap })));
const GoalTracker = React.lazy(() => import('./components/GoalTracker').then(m => ({ default: m.GoalTracker })));
const LifeCompass = React.lazy(() => import('./components/LifeCompass').then(m => ({ default: m.LifeCompass })));
const HabitTracker = React.lazy(() => import('./components/HabitTracker').then(m => ({ default: m.HabitTracker }))); 
const OfflineAI = React.lazy(() => import('./components/OfflineAI').then(m => ({ default: m.OfflineAI }))); 
const BudgetManager = React.lazy(() => import('./components/BudgetManager').then(m => ({ default: m.BudgetManager })));
const SleepCalculator = React.lazy(() => import('./components/SleepCalculator').then(m => ({ default: m.SleepCalculator })));
const MealPlanner = React.lazy(() => import('./components/MealPlanner').then(m => ({ default: m.MealPlanner }))); 
const CareerPrep = React.lazy(() => import('./components/CareerPrep').then(m => ({ default: m.CareerPrep }))); 
const AILearningPath = React.lazy(() => import('./components/AILearningPath').then(m => ({ default: m.AILearningPath }))); 
const CitationGenerator = React.lazy(() => import('./components/CitationGenerator').then(m => ({ default: m.CitationGenerator }))); 
const CampusLife = React.lazy(() => import('./components/CampusLife').then(m => ({ default: m.CampusLife })));
const SportsRoutine = React.lazy(() => import('./components/SportsRoutine').then(m => ({ default: m.SportsRoutine })));
const CalendarView = React.lazy(() => import('./components/CalendarView').then(m => ({ default: m.CalendarView }))); 
const AttendanceTracker = React.lazy(() => import('./components/AttendanceTracker').then(m => ({ default: m.AttendanceTracker })));
const Statistics = React.lazy(() => import('./components/Statistics').then(m => ({ default: m.Statistics })));
const GymTracker = React.lazy(() => import('./components/GymTracker').then(m => ({ default: m.GymTracker })));
const InvoiceGenerator = React.lazy(() => import('./components/InvoiceGenerator').then(m => ({ default: m.InvoiceGenerator })));
const LocationTracker = React.lazy(() => import('./components/LocationTracker').then(m => ({ default: m.LocationTracker })));
const CurriculumHub = React.lazy(() => import('./components/CurriculumHub').then(m => ({ default: m.CurriculumHub })));

import { auth, onAuthStateChanged, User } from './services/firebase';
import { StorageService } from './services/storage';
import { gpsTrackerService } from './services/gpsTrackerService';
import { BackgroundPermissionModal } from './components/BackgroundPermissionModal';
import { useStore } from './store/useStore';
import { TRANSLATIONS, AppLanguage } from './utils/translations';
import { audioService } from './services/audio';
import { SharingService, SharedDataType } from './services/sharing';
import { NotificationService } from './services/notifications';
import { THEMES } from './constants';
import { useSwipe } from './hooks/useSwipe';
import { buildViewSearch, getViewFromSearch } from './utils/viewRouting';
import { ViewState, Task, Course, Note, UserProfile, Book, TaskStatus, Priority, FlashcardDeck } from './types';
import { 
  Plus, CheckSquare, BookOpen, Calendar as CalIcon, Download, Search, 
  Flame, Crown, Bot, ChevronRight, LayoutDashboard, BarChart2, Clock, 
  Layers, CalendarDays, UserCheck, GraduationCap, Library as LibraryIcon, 
  Compass, Quote, Repeat, Target, PenTool, Wallet, Moon, Utensils, 
  Dumbbell, Briefcase, Award, Users, BrainCircuit, Lightbulb, Map, 
  Settings as SettingsIcon, User as UserIcon, Sparkles, Brain, AlertCircle,
  WifiOff, Radio, MapPin, BookMarked, Share2, ExternalLink, X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Robust View Error Boundary to guard against blank app screens
class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode; currentView: string; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`Error in view [${this.props.currentView}]:`, error, errorInfo);
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.currentView !== this.props.currentView && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Modul Sedang Dipulihkan</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            Terjadi kendala saat merender modul ini. Catatan dan data penting Anda tetap tersimpan dengan aman.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2.5 bg-primary hover:bg-primary/80 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
              Muat Ulang Tampilan
            </button>
            <button
              onClick={this.props.onReset}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MicroLearning = React.lazy(() => import('./components/MicroLearning').then(m => ({ default: m.MicroLearning })));
const BirthdayModal = React.lazy(() => import('./components/BirthdayModal').then(m => ({ default: m.BirthdayModal })));
const SmartMotivationModal = React.lazy(() => import('./components/SmartMotivationModal').then(m => ({ default: m.SmartMotivationModal })));
const CourseHub = React.lazy(() => import('./components/CourseHub').then(m => ({ default: m.CourseHub })));
const DailyPlanner = React.lazy(() => import('./components/DailyPlanner').then(m => ({ default: m.DailyPlanner })));

const getViewMetadata = (view: string, lang: AppLanguage): { title: string; category: string; icon: React.ElementType } => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;
  const isEn = lang === 'en';

  const map: Record<string, { title: string; category: string; icon: React.ElementType }> = {
    'dashboard': { title: t.dashboard, category: t.commandCenter, icon: LayoutDashboard },
    'location': { title: isEn ? 'Live GPS Locator' : 'GPS Sahabat (Live)', category: t.commandCenter, icon: Radio },
    'ai-chat': { title: t.aiChat, category: t.commandCenter, icon: Bot },
    'statistics': { title: t.statistics, category: t.commandCenter, icon: BarChart2 },
    'tasks': { title: t.tasks, category: t.workspace, icon: CheckSquare },
    'planner': { title: isEn ? 'Daily Study Planner' : 'Planner Harian', category: t.workspace, icon: CalendarDays },
    'notes': { title: t.notes, category: t.workspace, icon: BookOpen },
    'focus': { title: t.focus, category: t.workspace, icon: Clock },
    'flashcards': { title: t.flashcards, category: t.workspace, icon: Layers },
    'course-hub': { title: isEn ? 'Course Hub' : 'Hub Mata Kuliah', category: t.academic, icon: BookOpen },
    'calendar': { title: t.calendar, category: t.academic, icon: CalendarDays },
    'schedule': { title: t.schedule, category: t.academic, icon: CalIcon },
    'attendance': { title: t.attendance, category: t.academic, icon: UserCheck },
    'curriculum': { title: t.curriculum, category: t.academic, icon: BookMarked },
    'micro-learning': { title: t.microLearning, category: t.academic, icon: Brain },
    'grades': { title: t.grades, category: t.academic, icon: GraduationCap },
    'library': { title: t.library, category: t.academic, icon: LibraryIcon },
    'study-guide': { title: t.studyGuide, category: t.academic, icon: Compass },
    'citation': { title: t.citation, category: t.academic, icon: Quote },
    'habits': { title: t.habits, category: t.wellness, icon: Repeat },
    'goals': { title: t.goals, category: t.wellness, icon: Target },
    'journal': { title: t.journal, category: t.wellness, icon: PenTool },
    'budget': { title: t.budget, category: t.wellness, icon: Wallet },
    'sleep': { title: t.sleep, category: t.wellness, icon: Moon },
    'meals': { title: t.meals, category: t.wellness, icon: Utensils },
    'sports': { title: t.sports, category: t.wellness, icon: Dumbbell },
    'gym': { title: t.gym, category: t.wellness, icon: Dumbbell },
    'projects': { title: isEn ? 'Projects & Portfolio' : 'Proyek & Portofolio', category: t.growth, icon: Briefcase },
    'skills': { title: t.skills, category: t.growth, icon: Award },
    'learning-path': { title: t.learningPath, category: t.growth, icon: Map },
    'campus-life': { title: t.campusLife, category: t.growth, icon: Users },
    'brain-gym': { title: 'Brain Gym', category: t.growth, icon: BrainCircuit },
    'motivation': { title: isEn ? 'Motivation & Energy' : 'Motivasi & Semangat', category: t.growth, icon: Lightbulb },
    'compass': { title: t.compass, category: t.growth, icon: Map },
    'career': { title: t.career, category: t.growth, icon: Briefcase },
    'invoice': { title: 'Invoice Generator', category: t.growth, icon: Wallet },
    'profile': { title: t.profile, category: t.system, icon: UserIcon },
    'settings': { title: t.settings, category: t.system, icon: SettingsIcon },
  };

  return map[view] || { title: 'KampusKit OS', category: t.system, icon: LayoutDashboard };
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const handleSetView = (view: ViewState, historyMode: 'push' | 'replace' = 'push') => {
    try {
      const nextSearch = buildViewSearch(window.location.search, view);
      if (nextSearch !== window.location.search) {
        const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
        if (historyMode === 'push') {
          window.history.pushState({ view }, '', nextUrl);
        } else {
          window.history.replaceState({ view }, '', nextUrl);
        }
      }
    } catch {
      // History API unavailable; in-app navigation still works.
    }
    React.startTransition(() => {
      setCurrentView(view);
    });
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showSmartMotivation, setShowSmartMotivation] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return StorageService.getItem<boolean>('sidebar_collapsed', false);
  });
  
  const [sharedDataState, setSharedDataState] = useState<{ id: string, type: SharedDataType, data: any } | null>(null);
  const [incomingShare, setIncomingShare] = useState<{ title: string; text: string; url: string } | null>(null);
  const [shareCourseId, setShareCourseId] = useState<string>('');
  
  const userProfile = useStore(state => state.userProfile);
  const setUserProfile = useStore(state => state.setUserProfile);
  const gainXp = useStore(state => state.gainXp);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language];
  
  const [isMobile, setIsMobile] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [currentView]);

  const mobileCoreTabs: ViewState[] = ['dashboard', 'calendar', 'tasks', 'notes'];
  
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
      onSwipeLeft: () => {
          if (!isMobile) return;
          const currentIndex = mobileCoreTabs.indexOf(currentView);
          if (currentIndex !== -1 && currentIndex < mobileCoreTabs.length - 1) {
              handleSetView(mobileCoreTabs[currentIndex + 1]);
          }
      },
      onSwipeRight: () => {
          if (!isMobile) return;
          const currentIndex = mobileCoreTabs.indexOf(currentView);
          if (currentIndex !== -1 && currentIndex > 0) {
              handleSetView(mobileCoreTabs[currentIndex - 1]);
          }
      },
      threshold: 60
  });

  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => gpsTrackerService.getState().isBroadcasting);
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);

  // Subscribe to background GPS status
  useEffect(() => {
    return gpsTrackerService.subscribe((state) => {
      setIsGpsActive(state.isBroadcasting);
    });
  }, []);

  useEffect(() => {
    StorageService.setItem('sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Network connectivity listener for offline/online resilience
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (auth.currentUser) {
        StorageService.syncToFirebase(auth.currentUser.uid).catch(() => {});
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global Keyboard Shortcuts for Laptop/Desktop Power Users & Escape Modal Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Escape -> Close any active modal
      if (key === 'escape') {
        setIsCommandPaletteOpen(false);
        setShowFabMenu(false);
        setIsBgModalOpen(false);
        setSharedDataState(null);
        setIncomingShare(null);
        return;
      }

      // Cmd+K or Ctrl+K -> Command Palette
      if (isCmdOrCtrl && key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Cmd+B or Ctrl+B -> Toggle Sidebar Collapse
      if (isCmdOrCtrl && key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        return;
      }

      // Cmd+Shift shortcuts for fast view navigation (Windows / macOS)
      if (isCmdOrCtrl && e.shiftKey) {
        if (key === 'd') { e.preventDefault(); handleSetView('dashboard'); }
        else if (key === 't') { e.preventDefault(); handleSetView('tasks'); }
        else if (key === 'n') { e.preventDefault(); handleSetView('notes'); }
        else if (key === 's') { e.preventDefault(); handleSetView('schedule'); }
        else if (key === 'p') { e.preventDefault(); handleSetView('profile'); }
        else if (key === 'f') { e.preventDefault(); handleSetView('focus'); }
        else if (key === 'a') { e.preventDefault(); handleSetView('ai-chat'); }
        else if (key === 'l') { e.preventDefault(); handleSetView('location'); }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Android Native Back-Button Gesture / History Listener
  useEffect(() => {
    const handlePopState = () => {
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      } else if (isBgModalOpen) {
        setIsBgModalOpen(false);
      } else if (showFabMenu) {
        setShowFabMenu(false);
      } else if (sharedDataState) {
        setSharedDataState(null);
      }

      const viewFromUrl = getViewFromSearch(window.location.search);
      React.startTransition(() => {
        setCurrentView(viewFromUrl ?? 'dashboard');
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCommandPaletteOpen, isBgModalOpen, showFabMenu, sharedDataState]);

  useEffect(() => {
    // 1. Instantly load local data from localStorage without waiting for network or Firebase
    setTasks(StorageService.getItem<Task[]>('tasks', []));
    setCourses(StorageService.getItem<Course[]>('courses', []));
    setNotes(StorageService.getItem<Note[]>('notes', []));
    setBooks(StorageService.getItem<Book[]>('library_books', []));
    
    const savedProfile = StorageService.getItem<UserProfile | null>('user_profile', null);
    if (savedProfile) {
      const today = new Date().toISOString().split('T')[0];
      let newStreak = savedProfile.streak || 0;
      
      if (savedProfile.lastLogin !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (savedProfile.lastLogin === yesterday) {
          newStreak++; 
        } else {
          newStreak = 1; 
        }
        
        const updatedProfile = { 
            ...useStore.getState().userProfile,
            ...savedProfile, 
            lastLogin: today, 
            streak: newStreak,
            xp: savedProfile.xp || 0,
            level: savedProfile.level || 1
        };
        setUserProfile(updatedProfile);
        StorageService.setItem('user_profile', updatedProfile);
      } else {
        setUserProfile({
            ...useStore.getState().userProfile,
            ...savedProfile,
            xp: savedProfile.xp || 0,
            level: savedProfile.level || 1
        });
      }
      
      if (savedProfile.birthDate) {
        const today = new Date();
        const birthDate = new Date(savedProfile.birthDate);
        if (today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate()) {
          const birthdayShownKey = `birthday_shown_${today.getFullYear()}`;
          if (!localStorage.getItem(birthdayShownKey)) {
            setShowBirthdayModal(true);
            localStorage.setItem(birthdayShownKey, 'true');
          }
        }
      }
    }

    // App is ready instantly!
    setIsLoaded(true);

    // 2. Setup Firebase auth & non-blocking background sync
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      gpsTrackerService.init(user);
      if (user) {
        StorageService.setUserId(user.uid);
        
        // Background sync only if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          StorageService.syncFromFirebase(user.uid).then((hasChanged) => {
            if (hasChanged) {
              setTasks(StorageService.getItem<Task[]>('tasks', []));
              setCourses(StorageService.getItem<Course[]>('courses', []));
              setNotes(StorageService.getItem<Note[]>('notes', []));
              setBooks(StorageService.getItem<Book[]>('library_books', []));
            }
          }).catch(() => {});
        }
      } else {
        StorageService.setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Smart circadian in-app motivation check
  useEffect(() => {
    if (!isLoaded) return;
    const profile = useStore.getState().userProfile;
    if (profile.smartDailyModalEnabled === false) return;

    const now = new Date();
    const hour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    let timeSlot = '';
    if (hour >= 5 && hour < 11) timeSlot = 'morning';
    else if (hour >= 11 && hour < 16) timeSlot = 'midday';
    else if (hour >= 16 && hour < 20) timeSlot = 'evening';
    else if (hour >= 20 && hour <= 23) timeSlot = 'night';

    if (timeSlot) {
      const storageKey = `smart_moti_slot_${todayStr}_${timeSlot}`;
      if (!localStorage.getItem(storageKey)) {
        const timer = setTimeout(() => {
          setShowSmartMotivation(true);
          localStorage.setItem(storageKey, 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded]);

  useEffect(() => {
    // Check for shared link, Web Share Target, or direct view shortcut (Android WebAPK / Windows Taskbar Jump List)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = getViewFromSearch(window.location.search);
    if (viewParam) {
      handleSetView(viewParam, 'replace');
    }

    // Web Share Target PWA handling (?shared=1&share_title=...&share_text=...&share_url=...)
    const sharedParam = urlParams.get('shared');
    const rawShareTitle = urlParams.get('share_title') || urlParams.get('title') || '';
    const rawShareText = urlParams.get('share_text') || urlParams.get('text') || '';
    const rawShareUrl = urlParams.get('share_url') || urlParams.get('url') || '';

    if (sharedParam === '1' || rawShareTitle || rawShareText || rawShareUrl) {
      const sanitizeInput = (str: string) =>
        Array.from(str)
          .filter(ch => {
            const code = ch.charCodeAt(0);
            return (code >= 32 && code !== 127) || code === 10 || code === 13 || code === 9;
          })
          .join('')
          .slice(0, 50000);
      const cleanTitle = sanitizeInput(rawShareTitle);
      const cleanText = sanitizeInput(rawShareText);
      const cleanUrl = sanitizeInput(rawShareUrl);

      if (cleanTitle || cleanText || cleanUrl) {
        setIncomingShare({
          title: cleanTitle,
          text: cleanText,
          url: cleanUrl,
        });
      }

      // Clean share params without dropping the active view
      try {
        const cleanUrl = new URL(window.location.href);
        ['shared', 'share_title', 'share_text', 'share_url', 'title', 'text', 'url'].forEach(param => {
          cleanUrl.searchParams.delete(param);
        });
        window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      } catch {
        // Fallback ignore
      }
    }

    const shareId = urlParams.get('shareId');
    if (shareId) {
      SharingService.getSharedData(shareId).then(res => {
        if (res) {
          setSharedDataState({ id: shareId, type: res.type, data: res.data });
        }
      }).catch(err => console.error("Error fetching shared data:", err));
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleSyncComplete = () => {
      setTasks(StorageService.getItem<Task[]>('tasks', []));
      setCourses(StorageService.getItem<Course[]>('courses', []));
      setNotes(StorageService.getItem<Note[]>('notes', []));
      setBooks(StorageService.getItem<Book[]>('library_books', []));
    };
    window.addEventListener('kampuskit_sync_complete', handleSyncComplete);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('kampuskit_sync_complete', handleSyncComplete);
    }
  }, []);

  useEffect(() => {
    if (userProfile.notificationsEnabled) {
      NotificationService.setupForegroundListener();
      NotificationService.startLocalReminders();
    } else {
      if ((window as any)._reminderInterval) {
        clearInterval((window as any)._reminderInterval);
      }
    }
  }, [userProfile.notificationsEnabled]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') || 
        target.getAttribute('role') === 'button' ||
        target.closest('[role="button"]') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer')
      ) {
        audioService.playAmbientClick();
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeId = userProfile.theme || 'COSMIC';
    let colors;

    if (themeId === 'CUSTOM' && userProfile.customColors) {
      colors = userProfile.customColors;
    } else {
      const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
      colors = selectedTheme.colors;
    }
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-dark', colors.dark);
    root.style.setProperty('--color-card', colors.card);

    const radiusMode = userProfile.uiStyle?.radiusMode || 'MODERN';
    if (radiusMode === 'ROUND') {
      root.style.setProperty('--radius-md', '0.75rem');
      root.style.setProperty('--radius-lg', '1rem');
      root.style.setProperty('--radius-xl', '1.5rem');
      root.style.setProperty('--radius-2xl', '2rem');
      root.style.setProperty('--radius-3xl', '3rem');
    } else if (radiusMode === 'SHARP') {
      root.style.setProperty('--radius-md', '0px');
      root.style.setProperty('--radius-lg', '0px');
      root.style.setProperty('--radius-xl', '0px');
      root.style.setProperty('--radius-2xl', '0px');
      root.style.setProperty('--radius-3xl', '0px');
    } else {
      root.style.setProperty('--radius-md', '0.375rem');
      root.style.setProperty('--radius-lg', '0.5rem');
      root.style.setProperty('--radius-xl', '0.75rem');
      root.style.setProperty('--radius-2xl', '1rem');
      root.style.setProperty('--radius-3xl', '1.5rem');
    }

    const fontMode = userProfile.uiStyle?.fontMode || 'SANS';
    if (fontMode === 'SERIF') {
      root.style.setProperty('--font-primary', 'Merriweather');
    } else if (fontMode === 'MONO') {
      root.style.setProperty('--font-primary', 'JetBrains Mono');
    } else {
      root.style.setProperty('--font-primary', 'Inter');
    }

  }, [
    userProfile.theme, 
    userProfile.customColors?.primary, 
    userProfile.customColors?.secondary, 
    userProfile.customColors?.dark, 
    userProfile.customColors?.card, 
    userProfile.uiStyle?.radiusMode, 
    userProfile.uiStyle?.fontMode
  ]);

  const handleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: TaskStatus.DONE } : t
    );
    setTasks(updatedTasks);
    StorageService.setItem('tasks', updatedTasks);
    gainXp(50);
    audioService.playAmbientSuccess();
  };

  const navigateTo = (view: ViewState) => {
    handleSetView(view);
    setShowFabMenu(false);
  };

  const handleImportSharedData = () => {
    if (!sharedDataState) return;

    if (sharedDataState.type === 'schedule') {
      const existing = StorageService.getItem<Course[]>('courses', []);
      const toImport = sharedDataState.data as Course[];
      const newCourses = [...existing, ...toImport.map(c => ({...c, id: Math.random().toString(36).substr(2, 9)}))];
      setCourses(newCourses);
      StorageService.setItem('courses', newCourses);
      alert('Jadwal berhasil diimport!');
    } else if (sharedDataState.type === 'flashcards') {
      const existing = StorageService.getItem<FlashcardDeck[]>('flashcards', []);
      const toImport = sharedDataState.data as FlashcardDeck;
      const newDecks = [...existing, {...toImport, id: Math.random().toString(36).substr(2, 9)}];
      StorageService.setItem('flashcards', newDecks);
      alert('Deck Flashcards berhasil diimport!');
    }

    setSharedDataState(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('shareId');
    window.history.replaceState({}, '', url);
  };

  const handleSaveSharedAsNote = (title: string, text: string, url: string, courseId: string) => {
    const finalTitle = title.trim() || text.split('\n')[0]?.trim().slice(0, 50) || 'Catatan dari Berbagi';
    let content = text.trim();
    if (url.trim()) {
      content = content ? `${content}\n\nSumber: ${url.trim()}` : url.trim();
    }
    const matchedCourse = courses.find(c => c.id === courseId);
    const newNote: Note = {
      id: Date.now().toString(),
      title: finalTitle,
      content,
      folder: 'Umum',
      tags: ['Shared', ...(matchedCourse ? [matchedCourse.name] : [])],
      date: new Date().toISOString(),
      updatedAt: Date.now(),
      courseId: courseId || undefined
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    StorageService.setItem('notes', updated);
    setIncomingShare(null);
    setShareCourseId('');
    handleSetView('notes');
  };

  const handleSaveSharedAsTask = (title: string, text: string, url: string, courseId: string) => {
    const finalTitle = title.trim() || text.trim().slice(0, 60) || 'Tugas dari Berbagi';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const matchedCourse = courses.find(c => c.id === courseId);
    let desc = text.trim();
    if (url.trim()) {
      desc = desc ? `${desc}\n\nLampiran: ${url.trim()}` : url.trim();
    }
    const newTask: Task = {
      id: Date.now().toString(),
      title: finalTitle,
      subject: matchedCourse ? matchedCourse.name : 'Umum',
      deadline: todayStr,
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      description: desc,
      tags: [],
      subtasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      courseId: courseId || undefined
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageService.setItem('tasks', updated);
    setIncomingShare(null);
    setShareCourseId('');
    handleSetView('tasks');
  };

  if (!isLoaded) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Memuat Kampus Kit OS...</p>
        </div>
      </div>
    );
  }

  const handleAddTask = (newTask: Partial<Task>) => {
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title || 'Tugas Baru',
      subject: newTask.subject || 'Umum',
      deadline: newTask.deadline || new Date().toISOString().split('T')[0],
      status: newTask.status || TaskStatus.TODO,
      priority: newTask.priority || Priority.MEDIUM,
      tags: newTask.tags || [],
      subtasks: newTask.subtasks || [],
      createdAt: Date.now()
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    StorageService.setItem('tasks', updated);
  };

  const handleAddNote = (newNote: Partial<Note>) => {
    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title || 'Catatan Baru',
      content: newNote.content || '',
      category: (newNote.category as any) || 'STUDY',
      date: newNote.date || new Date().toISOString(),
      tags: newNote.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    };
    const updated = [note, ...notes];
    setNotes(updated);
    StorageService.setItem('notes', updated);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'gym': return <GymTracker />;
      case 'invoice': return <InvoiceGenerator />;
      case 'dashboard': return <Dashboard tasks={tasks} courses={courses} notes={notes} books={books} setView={handleSetView} />;
      case 'course-hub': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Hub Mata Kuliah...</div></div>}><CourseHub setView={handleSetView} /></React.Suspense>;
      case 'planner': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Daily Planner...</div></div>}><DailyPlanner onNavigateToView={handleSetView} onLaunchFocus={() => handleSetView('focus')} /></React.Suspense>;
      case 'curriculum': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Kurikulum & Mode Belajar...</div></div>}><CurriculumHub onNavigateToView={handleSetView} onAddTask={handleAddTask} onAddNote={handleAddNote} /></React.Suspense>;
      case 'location': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Location Tracker...</div></div>}><LocationTracker /></React.Suspense>;
      case 'ai-chat': return <OfflineAI />;
      case 'calendar': return <CalendarView tasks={tasks} />;
      case 'schedule': return <Schedule courses={courses} setCourses={setCourses} tasks={tasks} />;
      case 'attendance': return <AttendanceTracker courses={courses} />;
      case 'micro-learning': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Micro Learning...</div></div>}><MicroLearning /></React.Suspense>;
      case 'statistics': return <Statistics tasks={tasks} courses={courses} />;
      case 'projects': return <ProjectPortfolio />;
      case 'tasks': return <TaskManager tasks={tasks} setTasks={(newTasks) => { setTasks(newTasks); }} courses={courses} />;
      case 'campus-life': return <CampusLife />;
      case 'goals': return <GoalTracker />;
      case 'habits': return <HabitTracker />;
      case 'flashcards': return <Flashcards />;
      case 'notes': return <Notes notes={notes} setNotes={setNotes} courses={courses} />;
      case 'journal': return <Journal />;
      case 'motivation': return <Motivation />;
      case 'study-guide': return <StudyGuide />;
      case 'learning-path': return <React.Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse text-zinc-500 font-bold">Memuat Learning Path...</div></div>}><AILearningPath /></React.Suspense>;
      case 'skills': return <SkillRoadmap />;
      case 'compass': return <LifeCompass />;
      case 'library': return <Library />;
      case 'focus': return <FocusTimer tasks={tasks} onTaskComplete={handleTaskComplete} />;
      case 'grades': return <GradeCalc courses={courses} />;
      case 'brain-gym': return <BrainGym />;
      case 'budget': return <BudgetManager />;
      case 'sleep': return <SleepCalculator />;
      case 'meals': return <MealPlanner />;
      case 'career': return <CareerPrep />;
      case 'citation': return <CitationGenerator />;
      case 'sports': return <SportsRoutine />;
      case 'settings': return <Settings />;
      case 'profile': return <ProfileHub />;
      default: return <Dashboard tasks={tasks} courses={courses} notes={notes} books={books} setView={handleSetView} />;
    }
  };

  const activeMeta = getViewMetadata(currentView, language);
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="h-[100dvh] w-full text-zinc-100 font-sans selection:bg-primary/30 selection:text-white overflow-hidden flex flex-col md:flex-row relative">
      
      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={handleSetView}
      />

      {/* Shared Data Import Modal */}
      {sharedDataState && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSharedDataState(null)}></div>
           <div className="relative bg-zinc-900 border border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                    <Download size={24} />
                 </div>
                 <span className="bg-primary/20 border border-primary/50 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Shared Data</span>
              </div>
              
              <div className="relative z-10">
                 <h2 className="text-2xl font-black text-white mb-2">Import Data Teman</h2>
                 <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                    Seseorang telah membagikan {sharedDataState.type === 'schedule' ? 'Jadwal Kuliah' : 'Deck Flashcards'} kepadamu. Apakah kamu ingin menyimpannya?
                 </p>
                 
                 <div className="flex gap-3">
                   <button onClick={() => setSharedDataState(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all">
                      Batal
                   </button>
                   <button onClick={handleImportSharedData} className="flex-1 bg-primary hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2">
                      <Download size={18} /> Import Sekarang
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {showBirthdayModal && (
        <Suspense fallback={null}>
          <BirthdayModal onClose={() => setShowBirthdayModal(false)} />
        </Suspense>
      )}

      {/* Responsive Navigation Component */}
      <Navigation 
        currentView={currentView} 
        setView={handleSetView} 
        isMobile={isMobile} 
        tasks={tasks}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onOpenBackgroundSettings={() => {
          audioService.playAmbientClick();
          setIsBgModalOpen(true);
        }}
      />
      
      {/* Main Workspace Frame */}
      <main 
        className="flex-1 flex flex-col relative h-full overflow-hidden transition-colors duration-500 min-w-0" 
        onTouchStart={onTouchStart} 
        onTouchMove={onTouchMove} 
        onTouchEnd={onTouchEnd}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none z-10"></div>

        {/* 📱 MOBILE (HP) TOP HEADER BAR */}
        {isMobile && (
          <header className="flex-shrink-0 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-zinc-950/85 backdrop-blur-xl border-b border-white/[0.06] pl-[max(0.875rem,env(safe-area-inset-left,0px))] pr-[max(0.875rem,env(safe-area-inset-right,0px))] flex items-center justify-between z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/12 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
                <ActiveIcon size={16} />
              </div>
              <span className="font-semibold text-[15px] text-white truncate tracking-tight">{activeMeta.title}</span>
              {isGpsActive && currentView !== 'location' && (
                <button
                  onClick={() => handleSetView('location')}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex-shrink-0 active:scale-95 transition-transform"
                  title="GPS aktif di latar belakang. Klik untuk membuka peta."
                  aria-label="GPS aktif"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all"
                aria-label="Cari Fitur"
                title="Cari Fitur"
              >
                <Search size={18} />
              </button>

              <button
                onClick={() => handleSetView('ai-chat')}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 active:scale-95 transition-all"
                aria-label="AI Assistant"
                title="AI Assistant"
              >
                <Bot size={18} />
              </button>

              <button
                onClick={() => handleSetView('profile')}
                className="w-9 h-9 ml-0.5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden relative active:scale-95 transition-all"
                aria-label="Profil"
              >
                {userProfile?.photo ? (
                  <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </button>
            </div>
          </header>
        )}

        {/* 💻 DESKTOP (LAPTOP) TOP BREADCRUMB & UTILITY BAR */}
        {!isMobile && (
          <header className="flex-shrink-0 h-14 border-b border-white/[0.06] px-6 xl:px-8 flex items-center justify-between z-20 bg-zinc-950/50 backdrop-blur-md">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider hidden lg:inline">{activeMeta.category}</span>
              <ChevronRight size={12} className="text-zinc-700 hidden lg:inline" />
              <div className="flex items-center gap-1.5 font-semibold text-zinc-100 truncate">
                <ActiveIcon size={14} className="text-primary flex-shrink-0" />
                <span className="truncate text-[13px]">{activeMeta.title}</span>
              </div>
            </div>

            {/* Right: Core utilities */}
            <div className="flex items-center gap-2">
              {/* Online / Offline status */}
              {!isOnline ? (
                <div
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-300"
                  title={language === 'en' ? 'App running in offline mode. Data stored locally on device.' : 'Aplikasi berjalan dalam mode offline. Data tersimpan lokal di perangkat.'}
                >
                  <WifiOff size={13} className="text-amber-400 flex-shrink-0" />
                  <span className="hidden xl:inline">{language === 'en' ? 'Offline' : 'Offline'}</span>
                </div>
              ) : (
                <div
                  className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 text-[11px] font-medium text-emerald-400"
                  title={language === 'en' ? 'Connected to internet & synchronized' : 'Terhubung ke internet & tersinkronisasi'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="hidden xl:inline">{language === 'en' ? 'Synced' : 'Tersinkron'}</span>
                </div>
              )}

              {/* Background GPS indicator */}
              {isGpsActive && currentView !== 'location' && (
                <button
                  onClick={() => handleSetView('location')}
                  className="flex h-9 items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15"
                  title={language === 'en' ? 'Real-time GPS active in background. Click to open live map.' : 'GPS Real-time aktif di latar belakang. Klik untuk membuka peta lokasi.'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xl:inline">{language === 'en' ? 'Live GPS' : 'GPS Live'}</span>
                </button>
              )}

              {/* Search */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                title={language === 'en' ? 'Quick Search (⌘K)' : 'Cari Cepat (⌘K)'}
              >
                <Search size={15} />
                <span className="hidden xl:inline">{language === 'en' ? 'Search' : 'Cari'}</span>
                <kbd className="hidden lg:inline rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                  ⌘K
                </kbd>
              </button>

              {/* AI Assistant */}
              <button
                onClick={() => handleSetView('ai-chat')}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                title="Buka AI Assistant"
              >
                <Bot size={15} />
                <span className="hidden xl:inline">AI</span>
              </button>

              {/* Language */}
              <div className="flex h-9 items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-0.5 text-[11px] font-mono">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-1.5 rounded-lg font-bold transition-all ${
                    language === 'id'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Bahasa Indonesia"
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1.5 rounded-lg font-bold transition-all ${
                    language === 'en'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>

              {/* Streak */}
              <div
                className="flex h-9 items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.08] px-2.5 text-xs font-bold text-orange-300"
                title={language === 'en' ? 'Daily streak' : 'Streak harian'}
              >
                <Flame size={14} />
                <span className="stat-value">{userProfile?.streak || 0}</span>
              </div>

              {/* Level */}
              <div
                onClick={() => handleSetView('profile')}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.08] px-2.5 text-xs font-bold text-yellow-300 cursor-pointer transition-colors hover:bg-yellow-500/15"
                title="Buka Profil & Lencana"
              >
                <Crown size={14} />
                <span className="stat-value">Lvl {userProfile?.level || 1}</span>
              </div>
            </div>
          </header>
        )}

        {/* Offline Notice Banner */}
        {!isOnline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300 z-10">
            <div className="flex items-center gap-2">
              <WifiOff size={14} className="text-amber-400 flex-shrink-0" />
              <span>
                <strong>Mode Offline:</strong> Tidak ada koneksi internet. Seluruh data catatan, tugas, jadwal, dan flashcard Anda tetap aman dan dapat diedit secara lokal di perangkat.
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 hidden sm:inline font-mono">
              Tersimpan Lokal
            </span>
          </div>
        )}
        
        {/* Main Dynamic View Content */}
        <div ref={contentScrollRef} className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'pt-4 pb-[calc(11.5rem+env(safe-area-inset-bottom,0px))] pl-[max(0.875rem,env(safe-area-inset-left,0px))] pr-[max(0.875rem,env(safe-area-inset-right,0px))] sm:pl-6 sm:pr-6' : 'px-6 pt-6 pb-[7.5rem] xl:px-8 xl:pt-8 xl:pb-[8rem]'} max-w-[1680px] mx-auto w-full relative`}>
           <React.Suspense fallback={
             <div className="flex h-full w-full min-h-[300px] items-center justify-center">
               <div className="flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-xs text-zinc-500 font-medium">Memuat modul...</p>
               </div>
             </div>
           }>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="min-h-full"
                >
                  <ViewErrorBoundary currentView={currentView} onReset={() => handleSetView('dashboard')}>
                    {renderContent()}
                  </ViewErrorBoundary>
                </motion.div>
              </AnimatePresence>
           </React.Suspense>
        </div>

        {/* Floating Action Button (Mobile/Tablet/Desktop) */}
        <div className={`absolute ${isMobile ? 'right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(6rem+env(safe-area-inset-bottom,0px))]' : 'right-8 bottom-8'} z-40 flex flex-col items-end gap-3 pointer-events-none`}>
           <div className="pointer-events-auto flex flex-col items-end gap-3">
             {showFabMenu && (
               <div className="flex flex-col items-end gap-2.5 animate-slide-up">
                  <button 
                    onClick={() => navigateTo('tasks')}
                    className="flex items-center gap-3 bg-zinc-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <span className="text-xs font-bold">Tugas Baru</span>
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                       <CheckSquare size={16} />
                    </div>
                  </button>
                  <button 
                    onClick={() => navigateTo('notes')}
                    className="flex items-center gap-3 bg-zinc-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <span className="text-xs font-bold">Catatan Baru</span>
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                       <BookOpen size={16} />
                    </div>
                  </button>
                  <button 
                    onClick={() => navigateTo('schedule')}
                    className="flex items-center gap-3 bg-zinc-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <span className="text-xs font-bold">Jadwal Kuliah</span>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                       <CalIcon size={16} />
                    </div>
                  </button>
               </div>
             )}
             
             <button 
               onClick={() => setShowFabMenu(!showFabMenu)}
               className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/15 ${
                 showFabMenu ? 'bg-red-500 rotate-45' : 'bg-primary hover:bg-primary/90 shadow-primary/30'
               }`}
               aria-label="Aksi Cepat"
             >
               <Plus size={26} />
             </button>
           </div>
        </div>

        {/* Dynamic Modals */}
        {showBirthdayModal && (
          <React.Suspense fallback={null}>
            <BirthdayModal 
              onClose={() => setShowBirthdayModal(false)}
            />
          </React.Suspense>
        )}

        {showSmartMotivation && (
          <React.Suspense fallback={null}>
            <SmartMotivationModal 
              onClose={() => setShowSmartMotivation(false)}
              onNavigate={(view) => handleSetView(view)}
              preferredCategories={userProfile?.motivationPreferredCategories}
            />
          </React.Suspense>
        )}

        {/* Global Background Runner & Battery Permission Modal */}
        <BackgroundPermissionModal 
          isOpen={isBgModalOpen}
          onClose={() => setIsBgModalOpen(false)}
        />

        {/* Web Share Target Incoming Modal */}
        {incomingShare && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Simpan Data yang Dibagikan</h3>
                    <p className="text-xs text-zinc-400">Diterima dari aplikasi lain via Web Share Target</p>
                  </div>
                </div>
                <button
                  onClick={() => setIncomingShare(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Judul</label>
                  <input
                    type="text"
                    value={incomingShare.title}
                    onChange={(e) => setIncomingShare({ ...incomingShare, title: e.target.value })}
                    placeholder="Judul catatan atau tugas..."
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Isi Konten / Teks</label>
                  <textarea
                    rows={4}
                    value={incomingShare.text}
                    onChange={(e) => setIncomingShare({ ...incomingShare, text: e.target.value })}
                    placeholder="Teks atau ringkasan materi yang dibagikan..."
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {incomingShare.url && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Tautan / URL</label>
                    <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-blue-400 break-all">
                      <ExternalLink size={14} className="shrink-0" />
                      <span className="truncate flex-1">{incomingShare.url}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Hubungkan ke Mata Kuliah (Opsional)</label>
                  <select
                    value={shareCourseId}
                    onChange={(e) => setShareCourseId(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Tanpa Mata Kuliah (Umum) --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.credits} SKS)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={() => handleSaveSharedAsNote(incomingShare.title, incomingShare.text, incomingShare.url, shareCourseId)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                >
                  <BookOpen size={16} />
                  <span>Simpan sebagai Catatan</span>
                </button>

                <button
                  onClick={() => handleSaveSharedAsTask(incomingShare.title, incomingShare.text, incomingShare.url, shareCourseId)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
                >
                  <CheckSquare size={16} />
                  <span>Simpan sebagai Tugas</span>
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setIncomingShare(null)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
