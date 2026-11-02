import { describe, it, expect, beforeEach } from 'vitest';
import { 
  normalizeCourseName, 
  levenshteinDistance, 
  findMatchingCourse,
  runCourseLinkingMigration,
  undoCourseLinking,
  unlinkCourseFromAllItems
} from '../src/services/courseLinking';
import { Course, Task, Note, FlashcardDeck } from '../src/types';
import { GradeItem } from '../src/components/GradeCalc';
import { StorageService } from '../src/services/storage';
import { STORAGE_KEYS } from '../src/services/storageKeys';

describe('courseLinking service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('normalizeCourseName', () => {
    it('normalizes lowercase, accents, punctuation and excess whitespace', () => {
      expect(normalizeCourseName('  Algoritma & Struktur Data  ')).toBe('algoritma struktur data');
      expect(normalizeCourseName('Kalkulus I (A)')).toBe('kalkulus i a');
      expect(normalizeCourseName('Statistika & Probabilitas - 2026')).toBe('statistika probabilitas 2026');
      expect(normalizeCourseName('')).toBe('');
    });
  });

  describe('levenshteinDistance', () => {
    it('calculates edit distances correctly', () => {
      expect(levenshteinDistance('kalkulus', 'kalkulus')).toBe(0);
      expect(levenshteinDistance('kalkulus', 'kalkulu')).toBe(1);
      expect(levenshteinDistance('kalkulus', 'kalkuls')).toBe(1);
      expect(levenshteinDistance('fisika', 'kimia')).toBe(3);
    });
  });

  describe('findMatchingCourse', () => {
    const mockCourses: Course[] = [
      { id: 'c1', name: 'Algoritma Pemrograman', room: 'R301', day: 'Senin', startTime: '08:00', endTime: '10:00', lecturer: 'Dr. John', credits: 3 },
      { id: 'c2', name: 'Basis Data Terdistribusi', room: 'Lab 2', day: 'Selasa', startTime: '10:00', endTime: '12:00', lecturer: 'Dr. Jane', credits: 4 },
      { id: 'c3', name: 'Kalkulus 1', room: 'R102', day: 'Rabu', startTime: '13:00', endTime: '15:00', lecturer: 'Prof. Gauss', credits: 3 }
    ];

    it('matches exact name match regardless of case/punctuation', () => {
      const match = findMatchingCourse('algoritma pemrograman', mockCourses);
      expect(match?.id).toBe('c1');
    });

    it('matches close typo with Levenshtein <= 2', () => {
      const match = findMatchingCourse('Kalkulus 2', mockCourses); // 1 char diff from 'Kalkulus 1'
      expect(match?.id).toBe('c3');
    });

    it('matches substring with >= 5 chars', () => {
      const match = findMatchingCourse('Basis Data', mockCourses);
      expect(match?.id).toBe('c2');
    });

    it('rejects ambiguous matches without guessing', () => {
      const coursesWithOverlap: Course[] = [
        { id: 'c1', name: 'Fisika Dasar 1', room: 'A', day: 'Senin', startTime: '08:00', endTime: '10:00', lecturer: 'A', credits: 3 },
        { id: 'c2', name: 'Fisika Dasar 2', room: 'B', day: 'Selasa', startTime: '10:00', endTime: '12:00', lecturer: 'B', credits: 3 },
      ];
      // 'Fisika Dasar' matches both as substring >= 5 chars -> should return null
      const match = findMatchingCourse('Fisika Dasar', coursesWithOverlap);
      expect(match).toBeNull();
    });

    it('ignores generic or general subject names', () => {
      expect(findMatchingCourse('Umum', mockCourses)).toBeNull();
      expect(findMatchingCourse('General', mockCourses)).toBeNull();
    });
  });

  describe('migration and undo', () => {
    it('runs idempotent migration, links items, creates snapshot, and allows undo', () => {
      const courses: Course[] = [
        { id: 'c-algo', name: 'Algoritma & Struktur Data', room: '301', day: 'Senin', startTime: '08:00', endTime: '10:00', lecturer: 'Dr. A', credits: 3 }
      ];
      const tasks: Task[] = [
        { id: 't1', title: 'Tugas Binary Search', subject: 'Algoritma & Struktur Data', deadline: '2026-11-01', status: 'TODO' as any, priority: 'HIGH' as any, tags: [], subtasks: [], createdAt: 123 },
        { id: 't2', title: 'Belanja', subject: 'Pribadi', deadline: '2026-11-02', status: 'TODO' as any, priority: 'LOW' as any, tags: [], subtasks: [], createdAt: 124 }
      ];
      const notes: Note[] = [
        { id: 'n1', title: 'Catatan Pohon Biner', date: '2026-11-01', folder: 'Algoritma & Struktur Data', content: 'Tree traversal', category: 'STUDY' as any, tags: ['algo'], createdAt: 100, updatedAt: 100, isFavorite: false }
      ];
      const decks: FlashcardDeck[] = [
        { id: 'd1', title: 'Flashcard Kompleksitas', subject: 'Algoritma & Struktur Data', cards: [] }
      ];
      const grades: GradeItem[] = [
        { id: 1, course: 'Algoritma & Struktur Data', credits: 3, grade: 4.0, letterGrade: 'A', semester: 1 }
      ];

      StorageService.setItem(STORAGE_KEYS.COURSES, courses);
      StorageService.setItem(STORAGE_KEYS.TASKS, tasks);
      StorageService.setItem(STORAGE_KEYS.NOTES, notes);
      StorageService.setItem(STORAGE_KEYS.FLASHCARDS, decks);
      StorageService.setItem(STORAGE_KEYS.GRADE_DATA_V2, grades);

      // Run migration
      const result = runCourseLinkingMigration(true);
      expect(result.migrated).toBe(true);
      expect(result.linkedTasks).toBe(1);
      expect(result.linkedNotes).toBe(1);
      expect(result.linkedFlashcards).toBe(1);
      expect(result.linkedGrades).toBe(1);

      // Verify items have courseId
      const updatedTasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
      expect(updatedTasks.find(t => t.id === 't1')?.courseId).toBe('c-algo');
      expect(updatedTasks.find(t => t.id === 't2')?.courseId).toBeUndefined();

      // Undo migration
      const undone = undoCourseLinking();
      expect(undone).toBe(true);

      const revertedTasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
      expect(revertedTasks.find(t => t.id === 't1')?.courseId).toBeUndefined();
    });

    it('unlinkCourseFromAllItems clears references safely', () => {
      const tasks: Task[] = [
        { id: 't1', title: 'Tugas', subject: 'Algo', courseId: 'target-c', deadline: '2026-11-01', status: 'TODO' as any, priority: 'HIGH' as any, tags: [], subtasks: [], createdAt: 123 },
        { id: 't2', title: 'Lainnya', subject: 'Lain', courseId: 'other-c', deadline: '2026-11-01', status: 'TODO' as any, priority: 'HIGH' as any, tags: [], subtasks: [], createdAt: 123 }
      ];
      StorageService.setItem(STORAGE_KEYS.TASKS, tasks);

      unlinkCourseFromAllItems('target-c');

      const after = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
      expect(after.find(t => t.id === 't1')?.courseId).toBeUndefined();
      expect(after.find(t => t.id === 't2')?.courseId).toBe('other-c');
    });
  });
});
