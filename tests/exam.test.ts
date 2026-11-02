import { describe, it, expect } from 'vitest';
import { calculateExamReadiness, EXAM_WEIGHTS } from '../src/services/examReadiness';
import { buildExamPrepPlan, extractTopicsFromNotesOffline } from '../src/services/examPlanner';
import { extractPlainText } from '../src/utils/textExtractor';
import { Exam, Task, FlashcardDeck, FocusSession, TaskStatus, Priority, Note } from '../src/types';

describe('Exam Readiness & Exam Planner', () => {
  describe('extractPlainText', () => {
    it('extracts clean text from HTML strings', () => {
      const html = '<p>Halo <strong>Dunia</strong></p><br/><li>Poin 1</li><li>Poin 2</li>';
      const text = extractPlainText(html);
      expect(text).toContain('Halo Dunia');
      expect(text).toContain('Poin 1');
      expect(text).toContain('Poin 2');
      expect(text).not.toContain('<p>');
    });

    it('extracts clean text from BlockNote JSON structures', () => {
      const blockNoteJson = JSON.stringify([
        {
          type: 'heading',
          props: { level: 1 },
          content: [{ type: 'text', text: 'Judul Materi Kuliah' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Paragraf penjelasan konsep.' }]
        },
        {
          type: 'table',
          content: {
            rows: [
              { cells: [[{ type: 'text', text: 'Kolom 1' }], [{ type: 'text', text: 'Kolom 2' }]] }
            ]
          }
        }
      ]);

      const text = extractPlainText(blockNoteJson);
      expect(text).toContain('Judul Materi Kuliah');
      expect(text).toContain('Paragraf penjelasan konsep.');
      expect(text).toContain('Kolom 1 | Kolom 2');
    });
  });

  describe('calculateExamReadiness', () => {
    const mockExam: Exam = {
      id: 'e1',
      courseId: 'c1',
      title: 'UTS Pemrograman Web',
      kind: 'UTS',
      date: '2026-11-15',
      topics: [
        { id: 'top-1', title: 'React Hooks', completed: false, masteryLevel: 1 },
        { id: 'top-2', title: 'Virtual DOM', completed: false, masteryLevel: 1 }
      ],
      updatedAt: Date.now()
    };

    it('returns 0% when no topics, cards, tasks, or focus hours are completed', () => {
      const result = calculateExamReadiness(mockExam, {
        tasks: [{ id: 't1', title: 'Tugas 1', subject: 'Web', status: TaskStatus.TODO, priority: Priority.MEDIUM, deadline: '2026-11-10', tags: [], subtasks: [], createdAt: 1 }],
        flashcardDecks: [{ id: 'd1', title: 'Deck 1', subject: 'Web', cards: [{ id: 'c1', front: 'Q', back: 'A', interval: 0, repetition: 0, easeFactor: 2.5, nextReview: 0 }] }],
        focusSessions: []
      });

      expect(result.totalScore).toBe(0);
      expect(result.breakdown.topicScore).toBe(0);
      expect(result.breakdown.flashcardScore).toBe(0);
      expect(result.breakdown.taskScore).toBe(0);
      expect(result.breakdown.focusScore).toBe(0);
    });

    it('returns 100% when all requirements are fully fulfilled', () => {
      const fullExam: Exam = {
        ...mockExam,
        topics: [
          { id: 'top-1', title: 'React Hooks', completed: true, masteryLevel: 5 },
          { id: 'top-2', title: 'Virtual DOM', completed: true, masteryLevel: 5 }
        ]
      };

      const now = Date.now();
      const result = calculateExamReadiness(fullExam, {
        tasks: [{ id: 't1', title: 'Tugas 1', subject: 'Web', status: TaskStatus.DONE, priority: Priority.MEDIUM, deadline: '2026-11-10', tags: [], subtasks: [], createdAt: 1 }],
        flashcardDecks: [{ id: 'd1', title: 'Deck 1', subject: 'Web', cards: [{ id: 'c1', front: 'Q', back: 'A', interval: 1, repetition: 1, easeFactor: 2.5, nextReview: 0 }] }],
        focusSessions: [
          { id: 'f1', startedAt: now - 3600000, minutes: 360, completed: true, updatedAt: now } // 6 hours
        ],
        now
      });

      expect(result.totalScore).toBe(100);
      expect(result.breakdown.topicScore).toBe(100);
      expect(result.breakdown.flashcardScore).toBe(100);
      expect(result.breakdown.taskScore).toBe(100);
      expect(result.breakdown.focusScore).toBe(100);
    });

    it('calculates partial weighted score correctly with transparent weights', () => {
      // 1 of 2 topics done = 50% * 0.40 = 20 pts
      // 0 of 1 flashcard done = 0 pts
      // 1 of 1 task done = 100% * 0.20 = 20 pts
      // 180 min of 360 min focus = 50% * 0.15 = 7.5 pts
      // Total = 20 + 0 + 20 + 7.5 = 47.5 -> rounded to 48 pts
      const partialExam: Exam = {
        ...mockExam,
        topics: [
          { id: 'top-1', title: 'React Hooks', completed: true, masteryLevel: 4 },
          { id: 'top-2', title: 'Virtual DOM', completed: false, masteryLevel: 1 }
        ]
      };

      const now = Date.now();
      const result = calculateExamReadiness(partialExam, {
        tasks: [{ id: 't1', title: 'Tugas 1', subject: 'Web', status: TaskStatus.DONE, priority: Priority.MEDIUM, deadline: '2026-11-10', tags: [], subtasks: [], createdAt: 1 }],
        flashcardDecks: [{ id: 'd1', title: 'Deck 1', subject: 'Web', cards: [{ id: 'c1', front: 'Q', back: 'A', interval: 0, repetition: 0, easeFactor: 2.5, nextReview: 0 }] }],
        focusSessions: [
          { id: 'f1', startedAt: now - 3600000, minutes: 180, completed: true, updatedAt: now }
        ],
        now
      });

      expect(result.totalScore).toBe(48);
      expect(result.breakdown.topicContribution).toBe(20);
      expect(result.breakdown.taskContribution).toBe(20);
      expect(result.breakdown.focusContribution).toBe(7.5);
    });
  });

  describe('buildExamPrepPlan', () => {
    const mockExam: Exam = {
      id: 'e1',
      courseId: 'c1',
      title: 'UAS Sistem Operasi',
      kind: 'UAS',
      date: '2026-11-20',
      topics: [
        { id: 't1', title: 'Process Management', completed: false, masteryLevel: 1 },
        { id: 't2', title: 'Memory Management', completed: false, masteryLevel: 1 },
        { id: 't3', title: 'Virtual Memory & Paging', completed: false, masteryLevel: 1 },
        { id: 't4', title: 'File System & Disk Scheduling', completed: false, masteryLevel: 1 }
      ],
      updatedAt: Date.now()
    };

    it('generates multi-day distribution for H-14 without sprint mode', () => {
      const plan = buildExamPrepPlan(mockExam, 14, new Date(2026, 10, 6));
      expect(plan.length).toBeGreaterThan(1);
      expect(plan[0].isSprintMode).toBe(false);
      // Last day before exam is H-1
      expect(plan[plan.length - 1].dayOffset).toBe(-1);
    });

    it('switches to Sprint Mode when daysAvailable <= 3', () => {
      const plan = buildExamPrepPlan(mockExam, 2, new Date(2026, 10, 18));
      expect(plan.length).toBe(2);
      expect(plan[0].isSprintMode).toBe(true);
      expect(plan[1].isSprintMode).toBe(true);
      expect(plan[0].actionTitle).toContain('Sprint');
    });
  });

  describe('extractTopicsFromNotesOffline', () => {
    it('extracts unique topics from note titles and headings without crashing', () => {
      const notes: Note[] = [
        {
          id: 'n1',
          title: 'Catatan: Struktur Data Tree',
          content: '## Binary Search Tree\nPenjelasan...\n### AVL Tree\nPenjelasan...',
          date: '2026-11-01',
          category: 'STUDY' as any,
          tags: [],
          createdAt: 1,
          updatedAt: 1,
          isFavorite: false
        }
      ];

      const topics = extractTopicsFromNotesOffline(notes);
      expect(topics.length).toBeGreaterThan(0);
      const titles = topics.map(t => t.title);
      expect(titles).toContain('Struktur Data Tree');
      expect(titles).toContain('Binary Search Tree');
      expect(titles).toContain('AVL Tree');
    });
  });
});
