import { Course, Task, Note, FlashcardDeck } from '../types';
import { GradeItem } from '../components/GradeCalc';
import { StorageService } from './storage';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Normalizes course name for robust matching:
 * lowercase, removes accents/diacritics, strips punctuation, and collapses multiple spaces.
 */
export function normalizeCourseName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Finds matching course for a given subject/title string.
 * Exact match first -> very close match (Levenshtein <= 2 or substring >= 5 chars).
 * If multiple candidate matches exist, returns null (never guess).
 */
export function findMatchingCourse(
  inputName: string,
  courses: Course[]
): Course | null {
  if (!inputName || !courses || courses.length === 0) return null;
  const normInput = normalizeCourseName(inputName);
  if (!normInput || normInput === 'umum' || normInput === 'general') return null;

  // 1. Exact normalized match
  const exactMatches = courses.filter(c => normalizeCourseName(c.name) === normInput);
  if (exactMatches.length === 1) {
    return exactMatches[0];
  }
  if (exactMatches.length > 1) {
    return null; // Ambiguous: multiple courses with same normalized name
  }

  // 2. Very close match
  const closeCandidates: Course[] = [];
  for (const course of courses) {
    const normCourse = normalizeCourseName(course.name);
    if (!normCourse) continue;

    const lev = levenshteinDistance(normInput, normCourse);
    const isSubstring =
      (normInput.length >= 5 && normCourse.includes(normInput)) ||
      (normCourse.length >= 5 && normInput.includes(normCourse));

    if (lev <= 2 || isSubstring) {
      closeCandidates.push(course);
    }
  }

  if (closeCandidates.length === 1) {
    return closeCandidates[0];
  }

  // 0 candidates or > 1 candidates (ambiguous) -> do not guess
  return null;
}

export interface CourseLinkingSnapshot {
  timestamp: number;
  tasks: Task[];
  notes: Note[];
  flashcards: FlashcardDeck[];
  gradeItems: GradeItem[];
}

export interface MigrationResult {
  migrated: boolean;
  linkedTasks: number;
  linkedNotes: number;
  linkedFlashcards: number;
  linkedGrades: number;
  totalUnlinked: number;
}

/**
 * Runs idempotent course linking migration.
 * Takes a snapshot before mutating, marks schema_course_links_v1 flag,
 * and sets courseId on items while preserving existing subject/folder fields.
 */
export function runCourseLinkingMigration(force: boolean = false): MigrationResult {
  if (!force && localStorage.getItem(STORAGE_KEYS.SCHEMA_COURSE_LINKS_V1) === 'true') {
    return {
      migrated: false,
      linkedTasks: 0,
      linkedNotes: 0,
      linkedFlashcards: 0,
      linkedGrades: 0,
      totalUnlinked: 0
    };
  }

  const courses = StorageService.getItem<Course[]>(STORAGE_KEYS.COURSES, []);
  const tasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  const notes = StorageService.getItem<Note[]>(STORAGE_KEYS.NOTES, []);
  const flashcards = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
  const gradeItems = StorageService.getItem<GradeItem[]>(STORAGE_KEYS.GRADE_DATA_V2, []);

  // Save safety snapshot before modifying
  const snapshot: CourseLinkingSnapshot = {
    timestamp: Date.now(),
    tasks: JSON.parse(JSON.stringify(tasks)),
    notes: JSON.parse(JSON.stringify(notes)),
    flashcards: JSON.parse(JSON.stringify(flashcards)),
    gradeItems: JSON.parse(JSON.stringify(gradeItems))
  };
  localStorage.setItem(STORAGE_KEYS.PRE_COURSE_LINK_SNAPSHOT, JSON.stringify(snapshot));

  let linkedTasks = 0;
  let linkedNotes = 0;
  let linkedFlashcards = 0;
  let linkedGrades = 0;

  // 1. Link Tasks
  const updatedTasks = tasks.map(t => {
    if (t.courseId) return t;
    const match = findMatchingCourse(t.subject, courses);
    if (match) {
      linkedTasks++;
      return { ...t, courseId: match.id, updatedAt: Date.now() };
    }
    return t;
  });

  // 2. Link Notes (by folder or tags)
  const updatedNotes = notes.map(n => {
    if (n.courseId) return n;
    // Try folder first
    let match = n.folder ? findMatchingCourse(n.folder, courses) : null;
    // If not matched, try tags
    if (!match && Array.isArray(n.tags)) {
      for (const tag of n.tags) {
        match = findMatchingCourse(tag, courses);
        if (match) break;
      }
    }
    if (match) {
      linkedNotes++;
      return { ...n, courseId: match.id, updatedAt: Date.now() };
    }
    return n;
  });

  // 3. Link Flashcards
  const updatedFlashcards = flashcards.map(f => {
    if (f.courseId) return f;
    const match = findMatchingCourse(f.subject || f.title, courses);
    if (match) {
      linkedFlashcards++;
      return { ...f, courseId: match.id, updatedAt: Date.now() };
    }
    return f;
  });

  // 4. Link Grade Items
  const updatedGrades = gradeItems.map(g => {
    if (g.courseId) return g;
    const match = findMatchingCourse(g.course, courses);
    if (match) {
      linkedGrades++;
      return { ...g, courseId: match.id, updatedAt: Date.now() };
    }
    return g;
  });

  StorageService.setItem(STORAGE_KEYS.TASKS, updatedTasks);
  StorageService.setItem(STORAGE_KEYS.NOTES, updatedNotes);
  StorageService.setItem(STORAGE_KEYS.FLASHCARDS, updatedFlashcards);
  StorageService.setItem(STORAGE_KEYS.GRADE_DATA_V2, updatedGrades);

  localStorage.setItem(STORAGE_KEYS.SCHEMA_COURSE_LINKS_V1, 'true');

  const unlinkedTasks = updatedTasks.filter(t => !t.courseId).length;
  const unlinkedNotes = updatedNotes.filter(n => !n.courseId).length;
  const unlinkedFlashcards = updatedFlashcards.filter(f => !f.courseId).length;

  return {
    migrated: true,
    linkedTasks,
    linkedNotes,
    linkedFlashcards,
    linkedGrades,
    totalUnlinked: unlinkedTasks + unlinkedNotes + unlinkedFlashcards
  };
}

/**
 * Reverts automatic linking using stored snapshot
 */
export function undoCourseLinking(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRE_COURSE_LINK_SNAPSHOT);
    if (!raw) return false;
    const snapshot: CourseLinkingSnapshot = JSON.parse(raw);

    StorageService.setItem(STORAGE_KEYS.TASKS, snapshot.tasks);
    StorageService.setItem(STORAGE_KEYS.NOTES, snapshot.notes);
    StorageService.setItem(STORAGE_KEYS.FLASHCARDS, snapshot.flashcards);
    StorageService.setItem(STORAGE_KEYS.GRADE_DATA_V2, snapshot.gradeItems);

    localStorage.removeItem(STORAGE_KEYS.SCHEMA_COURSE_LINKS_V1);
    localStorage.removeItem(STORAGE_KEYS.PRE_COURSE_LINK_SNAPSHOT);
    return true;
  } catch (err) {
    console.error("Failed to undo course linking:", err);
    return false;
  }
}

/**
 * Bulk links all tasks, notes, or flashcards with a given text name to a courseId
 */
export function bulkLinkSubjectToCourse(
  subjectName: string,
  targetCourseId: string
): { tasksCount: number; notesCount: number; flashcardsCount: number } {
  const normTarget = normalizeCourseName(subjectName);
  let tasksCount = 0;
  let notesCount = 0;
  let flashcardsCount = 0;

  const tasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  const updatedTasks = tasks.map(t => {
    if (normalizeCourseName(t.subject) === normTarget) {
      tasksCount++;
      return { ...t, courseId: targetCourseId, updatedAt: Date.now() };
    }
    return t;
  });

  const notes = StorageService.getItem<Note[]>(STORAGE_KEYS.NOTES, []);
  const updatedNotes = notes.map(n => {
    const folderMatch = n.folder && normalizeCourseName(n.folder) === normTarget;
    const tagMatch = Array.isArray(n.tags) && n.tags.some(tg => normalizeCourseName(tg) === normTarget);
    if (folderMatch || tagMatch) {
      notesCount++;
      return { ...n, courseId: targetCourseId, updatedAt: Date.now() };
    }
    return n;
  });

  const flashcards = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
  const updatedFlashcards = flashcards.map(f => {
    if (normalizeCourseName(f.subject) === normTarget || normalizeCourseName(f.title) === normTarget) {
      flashcardsCount++;
      return { ...f, courseId: targetCourseId, updatedAt: Date.now() };
    }
    return f;
  });

  if (tasksCount > 0) StorageService.setItem(STORAGE_KEYS.TASKS, updatedTasks);
  if (notesCount > 0) StorageService.setItem(STORAGE_KEYS.NOTES, updatedNotes);
  if (flashcardsCount > 0) StorageService.setItem(STORAGE_KEYS.FLASHCARDS, updatedFlashcards);

  return { tasksCount, notesCount, flashcardsCount };
}

/**
 * When a course is deleted, unlinks courseId from all related items without deleting them.
 * Returns the count of affected items.
 */
export function unlinkCourseFromAllItems(courseId: string): {
  tasksAffected: number;
  notesAffected: number;
  flashcardsAffected: number;
  gradesAffected: number;
  totalAffected: number;
} {
  let tasksAffected = 0;
  let notesAffected = 0;
  let flashcardsAffected = 0;
  let gradesAffected = 0;

  const tasks = StorageService.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
  const updatedTasks = tasks.map(t => {
    if (t.courseId === courseId) {
      tasksAffected++;
      const copy = { ...t, updatedAt: Date.now() };
      delete copy.courseId;
      return copy;
    }
    return t;
  });

  const notes = StorageService.getItem<Note[]>(STORAGE_KEYS.NOTES, []);
  const updatedNotes = notes.map(n => {
    if (n.courseId === courseId) {
      notesAffected++;
      const copy = { ...n, updatedAt: Date.now() };
      delete copy.courseId;
      return copy;
    }
    return n;
  });

  const flashcards = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
  const updatedFlashcards = flashcards.map(f => {
    if (f.courseId === courseId) {
      flashcardsAffected++;
      const copy = { ...f, updatedAt: Date.now() };
      delete copy.courseId;
      return copy;
    }
    return f;
  });

  const grades = StorageService.getItem<GradeItem[]>(STORAGE_KEYS.GRADE_DATA_V2, []);
  const updatedGrades = grades.map(g => {
    if (g.courseId === courseId) {
      gradesAffected++;
      const copy = { ...g, updatedAt: Date.now() };
      delete copy.courseId;
      return copy;
    }
    return g;
  });

  if (tasksAffected > 0) StorageService.setItem(STORAGE_KEYS.TASKS, updatedTasks);
  if (notesAffected > 0) StorageService.setItem(STORAGE_KEYS.NOTES, updatedNotes);
  if (flashcardsAffected > 0) StorageService.setItem(STORAGE_KEYS.FLASHCARDS, updatedFlashcards);
  if (gradesAffected > 0) StorageService.setItem(STORAGE_KEYS.GRADE_DATA_V2, updatedGrades);

  return {
    tasksAffected,
    notesAffected,
    flashcardsAffected,
    gradesAffected,
    totalAffected: tasksAffected + notesAffected + flashcardsAffected + gradesAffected
  };
}
