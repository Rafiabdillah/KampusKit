import { useState, useEffect, useMemo, useCallback } from 'react';
import { Course, Task, Note, FlashcardDeck, FocusSession, Exam, CourseGradePlan } from '../types';
import { GradeItem } from '../components/GradeCalc';
import { AttendanceRecord } from '../components/AttendanceTracker';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { normalizeCourseName } from '../services/courseLinking';
import { calculateAttendanceStats, AttendanceStats } from '../utils/attendanceUtils';
import { formatLocalDate } from '../utils/dateUtils';

export interface CourseDataResult {
  course: Course | null;
  tasks: Task[];
  activeTasksCount: number;
  notes: Note[];
  flashcardDecks: FlashcardDeck[];
  attendanceRecord: AttendanceRecord | null;
  attendanceStats: AttendanceStats | null;
  grades: GradeItem[];
  exams: Exam[];
  nextExam: Exam | null;
  gradePlan: CourseGradePlan | null;
  focusSessions: FocusSession[];
  focusMinutes7Days: number;
  reload: () => void;
}

export function useCourseData(courseId: string | null | undefined): CourseDataResult {
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    const handleSync = () => reload();
    const handleStorage = () => reload();

    window.addEventListener('kampuskit_sync_complete', handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('kampuskit_sync_complete', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [reload]);

  return useMemo(() => {
    if (!courseId) {
      return {
        course: null,
        tasks: [],
        activeTasksCount: 0,
        notes: [],
        flashcardDecks: [],
        attendanceRecord: null,
        attendanceStats: null,
        grades: [],
        exams: [],
        nextExam: null,
        gradePlan: null,
        focusSessions: [],
        focusMinutes7Days: 0,
        reload
      };
    }

    const courses = StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []);
    const course = courses.find(c => c.id === courseId) || null;
    const normCourseName = course ? normalizeCourseName(course.name) : '';

    // Tasks
    const allTasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const courseTasks = allTasks.filter(t => {
      if (t.courseId) return t.courseId === courseId;
      if (normCourseName && t.subject) return normalizeCourseName(t.subject) === normCourseName;
      return false;
    });
    const activeTasksCount = courseTasks.filter(t => t.status !== 'DONE').length;

    // Notes
    const allNotes = StorageService.getItem<Note[]>(STORAGE_KEYS.NOTES, []);
    const courseNotes = allNotes.filter(n => {
      if (n.courseId) return n.courseId === courseId;
      if (normCourseName && n.folder) return normalizeCourseName(n.folder) === normCourseName;
      return false;
    });

    // Flashcards
    const allDecks = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
    const courseDecks = allDecks.filter(d => {
      if (d.courseId) return d.courseId === courseId;
      if (normCourseName && (d.subject || d.title)) {
        return normalizeCourseName(d.subject) === normCourseName || normalizeCourseName(d.title) === normCourseName;
      }
      return false;
    });

    // Attendance
    const allAttendance = StorageService.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_V2, []);
    const attendanceRecord = allAttendance.find(a => {
      if (a.courseId === courseId || a.courseId === `course-${courseId}`) return true;
      if (normCourseName && a.courseName) return normalizeCourseName(a.courseName) === normCourseName;
      return false;
    }) || null;
    const attendanceStats = attendanceRecord ? calculateAttendanceStats(attendanceRecord) : null;

    // Grades
    const allGrades = StorageService.getItem<GradeItem[]>(STORAGE_KEYS.GRADE_DATA_V2, []);
    const courseGrades = allGrades.filter(g => {
      if (g.courseId) return g.courseId === courseId;
      if (normCourseName && g.course) return normalizeCourseName(g.course) === normCourseName;
      return false;
    });

    // Exams
    const allExams = StorageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
    const courseExams = allExams
      .filter(e => e.courseId === courseId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const nowStr = formatLocalDate(new Date());
    const nextExam = courseExams.find(e => e.date >= nowStr) || (courseExams.length > 0 ? courseExams[0] : null);

    // Grade Plan
    const allGradePlans = StorageService.getItem<CourseGradePlan[]>(STORAGE_KEYS.COURSE_GRADE_PLANS, []);
    const gradePlan = allGradePlans.find(p => p.courseId === courseId) || null;

    // Focus Sessions
    const allFocus = StorageService.getItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
    const courseFocus = allFocus.filter(f => f.courseId === courseId);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const focusMinutes7Days = courseFocus
      .filter(f => f.startedAt >= sevenDaysAgo)
      .reduce((sum, f) => sum + (f.minutes || 0), 0);

    return {
      course,
      tasks: courseTasks,
      activeTasksCount,
      notes: courseNotes,
      flashcardDecks: courseDecks,
      attendanceRecord,
      attendanceStats,
      grades: courseGrades,
      exams: courseExams,
      nextExam,
      gradePlan,
      focusSessions: courseFocus,
      focusMinutes7Days,
      reload
    };
  }, [courseId, version, reload]);
}
