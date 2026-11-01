import { Exam, Task, FlashcardDeck, FocusSession, TaskStatus } from '../types';

export const EXAM_WEIGHTS = {
  TOPIC: 0.40,
  FLASHCARD: 0.25,
  TASK: 0.20,
  FOCUS: 0.15
} as const;

export interface ExamReadinessResult {
  totalScore: number; // 0..100
  breakdown: {
    topicScore: number; // 0..100
    topicWeight: number; // 0.40
    topicContribution: number;

    flashcardScore: number; // 0..100
    flashcardWeight: number; // 0.25
    flashcardContribution: number;

    taskScore: number; // 0..100
    taskWeight: number; // 0.20
    taskContribution: number;

    focusScore: number; // 0..100
    focusWeight: number; // 0.15
    focusContribution: number;
  };
  metrics: {
    completedTopics: number;
    totalTopics: number;
    reviewedFlashcards: number;
    totalFlashcards: number;
    completedTasks: number;
    totalTasks: number;
    focusMinutes14Days: number;
    targetFocusMinutes: number;
  };
  explanation: string;
}

export function calculateExamReadiness(
  exam: Exam,
  courseData: {
    tasks?: Task[];
    flashcardDecks?: FlashcardDeck[];
    focusSessions?: FocusSession[];
    now?: number;
  }
): ExamReadinessResult {
  const {
    tasks = [],
    flashcardDecks = [],
    focusSessions = [],
    now = Date.now()
  } = courseData;

  // 1. Topics score (Weight: 40%)
  const topics = exam.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;
  const topicScore = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  const topicContribution = topicScore * EXAM_WEIGHTS.TOPIC;

  // 2. Flashcards score (Weight: 25%)
  let totalFlashcards = 0;
  let reviewedFlashcards = 0;
  for (const deck of flashcardDecks) {
    for (const card of deck.cards || []) {
      totalFlashcards++;
      if (card.repetition > 0) {
        reviewedFlashcards++;
      }
    }
  }
  const flashcardScore = totalFlashcards > 0 ? (reviewedFlashcards / totalFlashcards) * 100 : 0;
  const flashcardContribution = flashcardScore * EXAM_WEIGHTS.FLASHCARD;

  // 3. Tasks score (Weight: 20%)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const taskContribution = taskScore * EXAM_WEIGHTS.TASK;

  // 4. Focus hours score in past 14 days (Weight: 15%, Target: 6 hours = 360 min)
  const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
  const targetFocusMinutes = 360; // 6 hours

  const focusMinutes14Days = focusSessions
    .filter(s => s.startedAt >= fourteenDaysAgo)
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  const focusScore = Math.min(100, (focusMinutes14Days / targetFocusMinutes) * 100);
  const focusContribution = focusScore * EXAM_WEIGHTS.FOCUS;

  // Combined weighted score (0 to 100 rounded to integer)
  const totalScore = Math.round(
    topicContribution + flashcardContribution + taskContribution + focusContribution
  );

  let explanation: string;
  if (totalScore >= 85) {
    explanation = 'Kesiapan sangat prima! Pertahankan active recall ringan hingga hari H.';
  } else if (totalScore >= 65) {
    explanation = 'Kesiapan cukup baik. Fokuskan pada topik materi yang belum tuntas.';
  } else if (totalScore >= 40) {
    explanation = 'Masih butuh penguatan. Tingkatkan review flashcards dan selesaikan tugas terkait.';
  } else {
    explanation = 'Persiapan awal. Mulai pelajari silabus topik dan jadwalkan sesi fokus.';
  }

  return {
    totalScore,
    breakdown: {
      topicScore: Math.round(topicScore),
      topicWeight: EXAM_WEIGHTS.TOPIC,
      topicContribution: Math.round(topicContribution * 10) / 10,

      flashcardScore: Math.round(flashcardScore),
      flashcardWeight: EXAM_WEIGHTS.FLASHCARD,
      flashcardContribution: Math.round(flashcardContribution * 10) / 10,

      taskScore: Math.round(taskScore),
      taskWeight: EXAM_WEIGHTS.TASK,
      taskContribution: Math.round(taskContribution * 10) / 10,

      focusScore: Math.round(focusScore),
      focusWeight: EXAM_WEIGHTS.FOCUS,
      focusContribution: Math.round(focusContribution * 10) / 10,
    },
    metrics: {
      completedTopics,
      totalTopics,
      reviewedFlashcards,
      totalFlashcards,
      completedTasks,
      totalTasks,
      focusMinutes14Days,
      targetFocusMinutes
    },
    explanation
  };
}
