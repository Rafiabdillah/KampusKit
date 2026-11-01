import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, Subtask } from '../types';
import { StorageService } from '../services/storage';
import { audioService } from '../services/audio';
import { playNotificationSound } from '../utils/sound';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Calendar, AlertCircle, Clock, CheckCircle2, ArrowRight, ArrowLeft, 
  Bell, CheckSquare, Filter, ChevronDown, ChevronUp, Trash2, Tag, Timer, 
  Search, LayoutGrid, List, Sparkles, Check, Play, Edit3, Flame, 
  Layers, BarChart3, BookOpen, AlertTriangle
} from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  courses?: any[];
  setView?: (view: any) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks = [], 
  setTasks, 
  courses = [],
  setView 
}) => {
  const { gainXp } = useStore();

  // View state: 'LIST' or 'KANBAN'
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
  
  // Filtering & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEADLINE' | 'PRIORITY' | 'NEWEST'>('DEADLINE');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    subject: string;
    courseId: string;
    priority: Priority;
    deadline: string;
    estimatedMinutes: number;
    reminder: string;
    tags: string[];
    tagInput: string;
    subtasks: { id: string; title: string; completed: boolean }[];
    subtaskInput: string;
  }>({
    title: '',
    subject: 'Umum',
    courseId: '',
    priority: Priority.MEDIUM,
    deadline: new Date().toISOString().split('T')[0],
    estimatedMinutes: 30,
    reminder: '',
    tags: [],
    tagInput: '',
    subtasks: [],
    subtaskInput: ''
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const safeTasks = tasks || [];
    const total = safeTasks.length;
    const todo = safeTasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgress = safeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const done = safeTasks.filter(t => t.status === TaskStatus.DONE).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue = safeTasks.filter(t => {
      if (t.status === TaskStatus.DONE) return false;
      const d = new Date(t.deadline);
      return d < today;
    }).length;

    const highPriority = safeTasks.filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.HIGH).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, todo, inProgress, done, overdue, highPriority, completionRate };
  }, [tasks]);

  // Check if a task is overdue
  const isOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    return deadline < today;
  };

  // Get relative date label
  const getRelativeDeadline = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Terlambat ${Math.abs(diffDays)} hari`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (diffDays === 0) return { text: 'Hari Ini', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (diffDays === 1) return { text: 'Besok', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    if (diffDays <= 3) return { text: `${diffDays} hari lagi`, color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' };
    return { text: new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), color: 'text-zinc-400 bg-zinc-800/80 border-white/5' };
  };

  // Filter and Sort Tasks
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchSubject = task.subject.toLowerCase().includes(query);
        const matchTags = (task.tags || []).some(tag => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchSubject && !matchTags) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

      // Subject filter
      if (subjectFilter !== 'ALL' && task.subject !== subjectFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DEADLINE') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'PRIORITY') {
        const priorityWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'NEWEST') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return 0;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, subjectFilter, sortBy]);

  // Open modal for new task
  const handleOpenNewModal = () => {
    setEditingTaskId(null);
    setFormData({
      title: '',
      subject: courses.length > 0 ? courses[0].name : 'Umum',
      courseId: courses.length > 0 ? courses[0].id : '',
      priority: Priority.MEDIUM,
      deadline: new Date().toISOString().split('T')[0],
      estimatedMinutes: 30,
      reminder: '',
      tags: [],
      tagInput: '',
      subtasks: [],
      subtaskInput: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing task
  const handleOpenEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      subject: task.subject || 'Umum',
      courseId: task.courseId || '',
      priority: task.priority || Priority.MEDIUM,
      deadline: task.deadline,
      estimatedMinutes: task.estimatedMinutes || 30,
      reminder: task.reminder || '',
      tags: task.tags || [],
      tagInput: '',
      subtasks: task.subtasks || [],
      subtaskInput: ''
    });
    setIsModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = () => {
    if (!formData.title.trim() || !formData.deadline) return;

    if (editingTaskId) {
      // Update existing
      const updated = (tasks || []).map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            title: formData.title.trim(),
            subject: formData.subject,
            courseId: formData.courseId || undefined,
            priority: formData.priority,
            deadline: formData.deadline,
            estimatedMinutes: formData.estimatedMinutes,
            reminder: formData.reminder,
            tags: formData.tags,
            subtasks: formData.subtasks,
            updatedAt: Date.now()
          };
        }
        return t;
      });
      setTasks(updated);
      StorageService.setItem('tasks', updated);
      audioService.playAmbientClick();
    } else {
      // Create new
      const newTaskItem: Task = {
        id: StorageService.generateId(),
        title: formData.title.trim(),
        subject: formData.subject || 'Umum',
        courseId: formData.courseId || undefined,
        deadline: formData.deadline,
        status: TaskStatus.TODO,
        priority: formData.priority,
        subtasks: formData.subtasks || [],
        createdAt: Date.now(),
        reminder: formData.reminder,
        estimatedMinutes: formData.estimatedMinutes,
        tags: formData.tags,
        updatedAt: Date.now()
      };
      const updated = [...(tasks || []), newTaskItem];
      setTasks(updated);
      StorageService.setItem('tasks', updated);
      playNotificationSound();
      audioService.playAmbientClick();
    }

    setIsModalOpen(false);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updated = (tasks || []).filter(t => t.id !== id);
    setTasks(updated);
    StorageService.setItem('tasks', updated);
    audioService.playAmbientClick();
  };

  // Update Status with reward
  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    const updated = (tasks || []).map(t => {
      if (t.id === id) {
        const update: Partial<Task> = { status: newStatus };
        if (newStatus === TaskStatus.IN_PROGRESS && !t.startedAt) {
          update.startedAt = Date.now();
        }
        if (newStatus === TaskStatus.DONE) {
          update.completedAt = Date.now();
          // Mark all subtasks as completed too
          if (t.subtasks && t.subtasks.length > 0) {
            update.subtasks = t.subtasks.map(s => ({ ...s, completed: true }));
          }
          // Confetti celebration
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 }
            });
          } catch (e) {
            // fallback
          }
          gainXp(50);
          audioService.playAmbientSuccess();
        } else {
          audioService.playAmbientClick();
        }
        return { ...t, ...update };
      }
      return t;
    });
    setTasks(updated);
    StorageService.setItem('tasks', updated);
  };

  // Toggle Subtask
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = (tasks || []).map(t => {
      if (t.id === taskId) {
        const updatedSubs = (t.subtasks || []).map(s => 
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        
        // If all subtasks are now completed, suggest/mark task as done
        const allCompleted = updatedSubs.length > 0 && updatedSubs.every(s => s.completed);
        let newStatus = t.status;
        if (allCompleted && t.status !== TaskStatus.DONE) {
          newStatus = TaskStatus.DONE;
          try {
            confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
          } catch (_err) {
            // ignore confetti failure in non-browser env
          }
          gainXp(40);
          audioService.playAmbientSuccess();
        } else if (!allCompleted && t.status === TaskStatus.DONE) {
          newStatus = TaskStatus.IN_PROGRESS;
          audioService.playAmbientClick();
        } else {
          audioService.playAmbientClick();
        }

        return { ...t, subtasks: updatedSubs, status: newStatus };
      }
      return t;
    });
    setTasks(updated);
    StorageService.setItem('tasks', updated);
  };

  // Add subtask directly on task card
  const handleAddSubtaskOnCard = (taskId: string, title: string) => {
    if (!title.trim()) return;
    const newSub: Subtask = {
      id: StorageService.generateId(),
      title: title.trim(),
      completed: false
    };
    const updated = (tasks || []).map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      }
      return t;
    });
    setTasks(updated);
    StorageService.setItem('tasks', updated);
    audioService.playAmbientClick();
  };

  // Priority Badge UI
  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return (
          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <AlertCircle size={10} className="stroke-[2.5]" /> Tinggi
          </span>
        );
      case Priority.MEDIUM:
        return (
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
            Sedang
          </span>
        );
      case Priority.LOW:
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
            Rendah
          </span>
        );
    }
  };

  // State for mobile kanban active column
  const [mobileKanbanTab, setMobileKanbanTab] = useState<TaskStatus>(TaskStatus.TODO);

  // Render Single Task Item (Reusable for List and Kanban)
  const renderTaskCard = (task: Task, isKanbanView = false) => {
    const isExpanded = expandedTaskId === task.id;
    const completedSubs = (task.subtasks || []).filter(s => s.completed).length;
    const totalSubs = (task.subtasks || []).length;
    const subProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;
    const deadlineInfo = getRelativeDeadline(task.deadline);
    const isDone = task.status === TaskStatus.DONE;

    return (
      <div 
        key={task.id}
        id={`task-item-${task.id}`}
        className={`bg-zinc-900/90 backdrop-blur-md rounded-2xl border transition-all duration-200 group relative flex flex-col w-full overflow-hidden ${
          isDone 
            ? 'border-white/5 opacity-80 hover:opacity-100 bg-zinc-950/60' 
            : isOverdue(task.deadline)
              ? 'border-rose-500/40 shadow-lg shadow-rose-950/20 hover:border-rose-500/60'
              : 'border-white/10 hover:border-white/20 shadow-md hover:shadow-xl'
        } ${isKanbanView ? 'p-3.5 sm:p-4' : 'p-3.5 sm:p-5'}`}
      >
        {/* Card Header Top */}
        <div className="flex justify-between items-start gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            {renderPriorityBadge(task.priority)}
            
            <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-300 bg-zinc-800/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/5 flex items-center gap-1 max-w-[140px] sm:max-w-none truncate">
              <BookOpen size={10} className="text-primary shrink-0" /> <span className="truncate">{task.subject}</span>
            </span>

            {!task.courseId && task.subject !== 'Umum' && (
              <button
                onClick={() => handleOpenEditModal(task)}
                className="text-[9px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0 transition-colors"
                title="Tautkan ke mata kuliah"
              >
                Belum terhubung
              </button>
            )}

            {task.estimatedMinutes && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1 shrink-0">
                <Timer size={10} /> {task.estimatedMinutes}m
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => handleOpenEditModal(task)}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors"
              title="Edit Tugas"
            >
              <Edit3 size={14} />
            </button>
            <button 
              onClick={() => handleDeleteTask(task.id)}
              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              title="Hapus Tugas"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Task Title & Status Checkbox */}
        <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5">
          <button
            onClick={() => handleUpdateStatus(task.id, isDone ? TaskStatus.TODO : TaskStatus.DONE)}
            className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
              isDone 
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'border-zinc-600 hover:border-primary text-transparent hover:text-primary/50 bg-black/20'
            }`}
            title={isDone ? 'Tandai belum selesai' : 'Tandai selesai (+50 XP)'}
          >
            <Check size={14} className="stroke-[3]" />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm sm:text-base leading-snug break-words transition-all ${
              isDone ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-100'
            }`}>
              {task.title}
            </h4>

            {/* Tags if any */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {task.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] text-zinc-400 bg-black/40 px-1.5 sm:px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                    <Tag size={9} className="text-zinc-500" /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Micro-learning progress bar if subtasks exist */}
        {totalSubs > 0 && (
          <div className="mb-2.5 bg-black/20 p-2 sm:p-2.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Layers size={11} className="text-primary" /> Micro-steps
              </span>
              <span className="font-mono text-zinc-300">{completedSubs}/{totalSubs} ({Math.round(subProgress)}%)</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isDone ? 'bg-zinc-600' : 'bg-gradient-to-r from-primary to-indigo-400'}`}
                style={{ width: `${subProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Collapsible Micro-steps Subtasks Area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-2.5 bg-zinc-950/70 p-3 rounded-xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Langkah Kecil (Micro-steps)</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">Bagi tugas agar ringan</span>
              </div>

              <div className="space-y-1.5 mb-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {(task.subtasks || []).map(sub => (
                  <div 
                    key={sub.id} 
                    onClick={() => handleToggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-white/5 cursor-pointer transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      sub.completed ? 'bg-primary border-primary text-white' : 'border-zinc-600'
                    }`}>
                      {sub.completed && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <span className={`text-xs flex-1 break-words ${sub.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Inline Add Subtask input */}
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  id={`subtask-card-input-${task.id}`}
                  placeholder="Tambah langkah micro..." 
                  className="bg-zinc-900 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg flex-1 outline-none focus:border-primary min-w-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleAddSubtaskOnCard(task.id, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const el = document.getElementById(`subtask-card-input-${task.id}`) as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleAddSubtaskOnCard(task.id, el.value);
                      el.value = '';
                    }
                  }}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 text-xs font-bold"
                >
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Footer: Deadline, Quick Move, Subtask Accordion & Timer Launch */}
        <div className="mt-auto pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded-lg border flex items-center gap-1 shrink-0 ${deadlineInfo.color}`}>
              <Calendar size={10} /> {deadlineInfo.text}
            </span>

            {totalSubs > 0 && (
              <button
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className="text-[10px] sm:text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-2 py-0.5 sm:py-1 rounded-lg border border-white/5 flex items-center gap-1 transition-colors"
                title="Lihat / Tambah sub-langkah"
              >
                <Layers size={10} className="text-primary" />
                <span>{completedSubs}/{totalSubs}</span>
                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {/* Quick launch to Focus Timer */}
            {setView && !isDone && (
              <button
                onClick={() => setView('focus')}
                className="text-[10px] sm:text-[11px] font-semibold text-zinc-300 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Mulai Fokus Pomodoro"
              >
                <Play size={9} className="fill-current" /> <span className="hidden sm:inline">Fokus</span>
              </button>
            )}

            {/* Status Cycle Button */}
            {task.status === TaskStatus.TODO && (
              <button
                onClick={() => handleUpdateStatus(task.id, TaskStatus.IN_PROGRESS)}
                className="text-[10px] sm:text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                Mulai <ArrowRight size={10} />
              </button>
            )}

            {task.status === TaskStatus.IN_PROGRESS && (
              <button
                onClick={() => handleUpdateStatus(task.id, TaskStatus.DONE)}
                className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
              >
                Selesai <Check size={10} />
              </button>
            )}

            {task.status === TaskStatus.DONE && (
              <button
                onClick={() => handleUpdateStatus(task.id, TaskStatus.IN_PROGRESS)}
                className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 px-2 py-1 rounded-lg border border-white/5 transition-colors"
              >
                Buka Lagi
              </button>
            )}
          </div>
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10 shrink-0">
                <CheckSquare size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <span className="truncate">Manajemen Tugas</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
              Alokasikan waktu belajar, pecah target rumit jadi langkah mikro (Micro-Learning), dan raih XP.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* View Mode Toggle: List vs Kanban */}
            <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-white/10 shadow-inner shrink-0">
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'LIST' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-zinc-400 hover:text-white'
                }`}
                title="Tampilan Daftar Agenda"
              >
                <List size={14} /> <span>Daftar</span>
              </button>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'KANBAN' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'
                }`}
                title="Papan Kolom Kanban"
              >
                <LayoutGrid size={14} /> <span>Kanban</span>
              </button>
            </div>

            {/* Add Task Button */}
            <button
              onClick={handleOpenNewModal}
              className="bg-primary hover:bg-primary/90 text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 flex-1 md:flex-initial"
            >
              <Plus size={16} /> <span>Tugas Baru</span>
            </button>
          </div>
        </div>

        {/* KPI Mini Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider block truncate">Total Tugas</span>
              <span className="text-lg sm:text-2xl font-black text-white">{stats.total}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-white/5 font-bold text-xs shrink-0 ml-1">
              {stats.completionRate}%
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider block truncate">Berjalan</span>
              <span className="text-lg sm:text-2xl font-black text-indigo-300">{stats.inProgress}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0 ml-1">
              <Clock size={15} />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">Selesai</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-300">{stats.done}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 ml-1">
              <CheckCircle2 size={15} />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 uppercase tracking-wider block truncate">Mendesak</span>
              <span className="text-lg sm:text-2xl font-black text-rose-400">{stats.overdue + stats.highPriority}</span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0 ml-1">
              <AlertTriangle size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-1 sm:px-2 mb-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input 
              type="text"
              placeholder="Cari tugas, mata kuliah, atau tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 text-white text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                statusFilter === 'ALL' ? 'bg-white/15 text-white border border-white/20' : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter(TaskStatus.TODO)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                statusFilter === TaskStatus.TODO ? 'bg-zinc-700 text-white border border-zinc-500' : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Akan Dikerjakan ({stats.todo})
            </button>
            <button
              onClick={() => setStatusFilter(TaskStatus.IN_PROGRESS)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                statusFilter === TaskStatus.IN_PROGRESS ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Berjalan ({stats.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter(TaskStatus.DONE)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                statusFilter === TaskStatus.DONE ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Selesai ({stats.done})
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns (Subject, Priority, Sort) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
          {/* Subject selector */}
          <select 
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-zinc-300 px-3 py-2 rounded-xl outline-none focus:border-primary appearance-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Semua Mata Kuliah</option>
            <option value="Umum">Umum</option>
            {(courses || []).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="bg-zinc-900 border border-white/10 text-zinc-300 px-3 py-2 rounded-xl outline-none focus:border-primary appearance-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value={Priority.HIGH}>Prioritas Tinggi</option>
            <option value={Priority.MEDIUM}>Prioritas Sedang</option>
            <option value={Priority.LOW}>Prioritas Rendah</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="col-span-2 sm:col-auto sm:ml-auto bg-zinc-900 border border-white/10 text-zinc-300 px-3 py-2 rounded-xl outline-none focus:border-primary appearance-none cursor-pointer w-full sm:w-auto"
          >
            <option value="DEADLINE">Urut: Deadline Terdekat</option>
            <option value="PRIORITY">Urut: Prioritas Utama</option>
            <option value="NEWEST">Urut: Terbaru Dibuat</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: List View or Kanban View */}
      {viewMode === 'LIST' ? (
        /* List View */
        <div className="w-full px-1 sm:px-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 sm:p-8 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-600 flex items-center justify-center mb-3">
                  <CheckSquare size={24} />
                </div>
                <h4 className="font-bold text-zinc-300 mb-1">Tidak ada tugas ditemukan</h4>
                <p className="text-zinc-500 text-xs max-w-sm mb-4">
                  {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
                    ? 'Coba sesuaikan filter pencarian Anda di atas.'
                    : 'Mulai buat tugas pertama Anda untuk memecah target belajar jadi lebih ringan.'}
                </p>
                <button
                  onClick={handleOpenNewModal}
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  + Tambah Tugas Sekarang
                </button>
              </motion.div>
            ) : (
              filteredTasks.map(task => (
                <motion.div 
                  key={task.id} 
                  layout 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  transition={{ duration: 0.18 }}
                  className="w-full"
                >
                  {renderTaskCard(task, false)}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Kanban View */
        <div className="w-full px-1 sm:px-2">
          {/* Mobile Kanban Tab Selector (Shown only on small screens) */}
          <div className="flex md:hidden bg-zinc-900/90 p-1 rounded-2xl border border-white/10 mb-4 gap-1">
            <button
              onClick={() => setMobileKanbanTab(TaskStatus.TODO)}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileKanbanTab === TaskStatus.TODO ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              Akan Dikerjakan ({filteredTasks.filter(t => t.status === TaskStatus.TODO).length})
            </button>
            <button
              onClick={() => setMobileKanbanTab(TaskStatus.IN_PROGRESS)}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileKanbanTab === TaskStatus.IN_PROGRESS ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Berjalan ({filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length})
            </button>
            <button
              onClick={() => setMobileKanbanTab(TaskStatus.DONE)}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileKanbanTab === TaskStatus.DONE ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Selesai ({filteredTasks.filter(t => t.status === TaskStatus.DONE).length})
            </button>
          </div>

          {/* Mobile Active Column View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredTasks.filter(t => t.status === mobileKanbanTab).map(task => (
              renderTaskCard(task, true)
            ))}
            {filteredTasks.filter(t => t.status === mobileKanbanTab).length === 0 && (
              <div className="h-32 flex items-center justify-center text-zinc-600 text-xs italic border-2 border-dashed border-zinc-800/80 rounded-2xl">
                Tidak ada tugas di kolom ini
              </div>
            )}
          </div>

          {/* Desktop 3-Column Kanban (hidden on mobile, visible on md+) */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 items-start">
            {/* Column 1: TODO */}
            <div className="bg-zinc-950/50 rounded-3xl p-4 border border-white/5 flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span> Akan Dikerjakan
                </span>
                <span className="text-xs bg-zinc-900 text-zinc-400 font-mono font-bold px-2 py-0.5 rounded-full border border-white/5">
                  {filteredTasks.filter(t => t.status === TaskStatus.TODO).length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredTasks.filter(t => t.status === TaskStatus.TODO).map(task => (
                  renderTaskCard(task, true)
                ))}
                {filteredTasks.filter(t => t.status === TaskStatus.TODO).length === 0 && (
                  <div className="h-28 flex items-center justify-center text-zinc-600 text-xs italic border-2 border-dashed border-zinc-900 rounded-2xl">
                    Kosong
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: IN_PROGRESS */}
            <div className="bg-zinc-950/50 rounded-3xl p-4 border border-indigo-500/10 flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-indigo-500/10">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> Sedang Dikerjakan
                </span>
                <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).map(task => (
                  renderTaskCard(task, true)
                ))}
                {filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length === 0 && (
                  <div className="h-28 flex items-center justify-center text-zinc-600 text-xs italic border-2 border-dashed border-zinc-900 rounded-2xl">
                    Tidak ada tugas aktif
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: DONE */}
            <div className="bg-zinc-950/50 rounded-3xl p-4 border border-emerald-500/10 flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-emerald-500/10">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Selesai
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {filteredTasks.filter(t => t.status === TaskStatus.DONE).length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredTasks.filter(t => t.status === TaskStatus.DONE).map(task => (
                  renderTaskCard(task, true)
                ))}
                {filteredTasks.filter(t => t.status === TaskStatus.DONE).length === 0 && (
                  <div className="h-28 flex items-center justify-center text-zinc-600 text-xs italic border-2 border-dashed border-zinc-900 rounded-2xl">
                    Belum ada yang selesai
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
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
            
            <h3 className="text-xl sm:text-2xl font-black text-white mb-5 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
                <CheckSquare size={18} />
              </div>
              <span className="truncate">{editingTaskId ? 'Edit Tugas' : 'Tambah Tugas Baru'}</span>
            </h3>
            
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Judul Tugas</label>
                <input 
                  className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors text-sm" 
                  placeholder="Contoh: Analisis Laporan Keuangan Semester" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  autoFocus 
                />
              </div>
              
              {/* Subject & Course Linking Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Mata Kuliah Terhubung</label>
                <select 
                  className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-primary outline-none text-sm"
                  value={formData.courseId || (formData.subject === 'Umum' ? 'CUSTOM_UMUM' : 'CUSTOM_FREE')}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'CUSTOM_UMUM') {
                      setFormData({ ...formData, courseId: '', subject: 'Umum' });
                    } else if (val === 'CUSTOM_FREE') {
                      setFormData({ ...formData, courseId: '', subject: '' });
                    } else {
                      const matched = (courses || []).find(c => c.id === val);
                      setFormData({
                        ...formData,
                        courseId: val,
                        subject: matched ? matched.name : formData.subject
                      });
                    }
                  }}
                >
                  <option value="CUSTOM_UMUM">Umum / Bebas</option>
                  {(courses || []).map(course => (
                    <option key={course.id} value={course.id}>{course.name} ({course.credits} SKS)</option>
                  ))}
                  <option value="CUSTOM_FREE">Lainnya (Teks Bebas...)</option>
                </select>
                {(!formData.courseId && formData.subject !== 'Umum') && (
                  <input
                    type="text"
                    placeholder="Ketik nama mata kuliah / topik bebas..."
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-2 w-full bg-zinc-950/80 border border-white/10 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-primary"
                  />
                )}
              </div>

              {/* Deadline & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Deadline</label>
                  <input 
                    type="date" 
                    className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-primary outline-none text-sm"
                    value={formData.deadline} 
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Prioritas</label>
                  <select 
                    className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-primary outline-none text-sm"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                  >
                    <option value={Priority.LOW}>Rendah (Low)</option>
                    <option value={Priority.MEDIUM}>Sedang (Medium)</option>
                    <option value={Priority.HIGH}>Tinggi (High Priority)</option>
                  </select>
                </div>
              </div>

              {/* Estimated Minutes */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Estimasi Waktu Belajar (Menit)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    className="w-full bg-zinc-950/80 border border-white/10 text-white px-4 py-3 rounded-xl focus:border-primary outline-none text-sm" 
                    value={formData.estimatedMinutes} 
                    onChange={e => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 15 })} 
                    step="5" 
                    min="5" 
                  />
                  <div className="flex gap-1.5 shrink-0">
                    {[15, 30, 45, 60].map(min => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setFormData({ ...formData, estimatedMinutes: min })}
                        className={`text-xs font-bold px-2.5 py-2.5 rounded-lg border transition-all ${
                          formData.estimatedMinutes === min 
                            ? 'bg-primary/20 text-primary border-primary/40' 
                            : 'bg-zinc-800/80 text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Micro-learning steps builder */}
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} /> Langkah Kecil (Micro-Learning Steps)
                </label>
                <p className="text-[11px] text-zinc-400">Pecah tugas besar menjadi 2-4 target sederhana untuk menghindari prokrastinasi.</p>

                <div className="space-y-2">
                  {formData.subtasks.map((sub, idx) => (
                    <div key={sub.id} className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-xl border border-white/5 text-xs">
                      <span className="text-zinc-300">{idx + 1}. {sub.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            subtasks: formData.subtasks.filter(s => s.id !== sub.id)
                          });
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Cari 3 jurnal referensi..."
                    value={formData.subtaskInput}
                    onChange={e => setFormData({ ...formData, subtaskInput: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && formData.subtaskInput.trim()) {
                        e.preventDefault();
                        const newSub = { id: StorageService.generateId(), title: formData.subtaskInput.trim(), completed: false };
                        setFormData({
                          ...formData,
                          subtasks: [...formData.subtasks, newSub],
                          subtaskInput: ''
                        });
                      }
                    }}
                    className="bg-zinc-900 border border-white/10 text-white text-xs px-3 py-2 rounded-xl flex-1 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.subtaskInput.trim()) {
                        const newSub = { id: StorageService.generateId(), title: formData.subtaskInput.trim(), completed: false };
                        setFormData({
                          ...formData,
                          subtasks: [...formData.subtasks, newSub],
                          subtaskInput: ''
                        });
                      }
                    }}
                    className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tag / Label (Opsional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Contoh: #makalah, #kelompok, #presentasi"
                    value={formData.tagInput}
                    onChange={e => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && formData.tagInput.trim()) {
                        e.preventDefault();
                        const cleanTag = formData.tagInput.trim().replace(/^#/, '');
                        if (!formData.tags.includes(cleanTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, cleanTag], tagInput: '' });
                        }
                      }
                    }}
                    className="bg-zinc-950/80 border border-white/10 text-white text-xs px-3 py-2.5 rounded-xl flex-1 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.tagInput.trim()) {
                        const cleanTag = formData.tagInput.trim().replace(/^#/, '');
                        if (!formData.tags.includes(cleanTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, cleanTag], tagInput: '' });
                        }
                      }
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    + Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                        className="hover:text-rose-400"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveTask} 
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {editingTaskId ? 'Simpan Perubahan' : 'Buat Tugas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; cursor: pointer; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
};
