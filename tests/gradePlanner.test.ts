import { describe, it, expect } from 'vitest';
import { requiredScore } from '../src/services/gradePlanner';
import { CourseGradePlan } from '../src/types';

describe('gradePlanner service', () => {
  it('normalizes weights proportionally when total weight is not equal to 100', () => {
    // Total raw weights = 20 + 20 + 40 = 80 (not 100)
    // Normalized weights:
    // Tugas: (20/80)*100 = 25%
    // UTS: (20/80)*100 = 25%
    // UAS: (40/80)*100 = 50%
    const plan: CourseGradePlan = {
      id: 'p1',
      courseId: 'c1',
      targetLetterGrade: 'A',
      targetScore: 80,
      components: [
        { id: 'c1', name: 'Tugas', weight: 20, maxScore: 100, achievedScore: 80, isCompleted: true }, // 80% * 25% = 20 pts
        { id: 'c2', name: 'UTS', weight: 20, maxScore: 100, achievedScore: 80, isCompleted: true },   // 80% * 25% = 20 pts
        { id: 'c3', name: 'UAS', weight: 40, maxScore: 100, isCompleted: false }                     // Remaining 50%
      ]
    };

    // Points accumulated = 20 + 20 = 40 pts
    // Points needed = 80 - 40 = 40 pts
    // Remaining weight = 50%
    // Required score on UAS = (40 / 50) * 100 = 80%
    const result = requiredScore(plan);
    expect(result.achievable).toBe(true);
    expect(result.requiredAverageOnRemaining).toBe(80);
    expect(result.remainingWeight).toBe(50);
  });

  it('detects mathematically impossible target (> 100%) and suggests achievable alternative', () => {
    // Accumulated: Tugas (30% weight) = 40/100 -> 12 pts
    // Remaining: UAS (40% weight) and Proyek (30% weight) -> remaining weight 70%
    // Target: 90 pts (A)
    // Even if student gets 100 on remaining 70%, max possible = 12 + 70 = 82 pts
    const plan: CourseGradePlan = {
      id: 'p2',
      courseId: 'c1',
      targetLetterGrade: 'A',
      targetScore: 90,
      components: [
        { id: 'c1', name: 'Tugas', weight: 30, maxScore: 100, achievedScore: 40, isCompleted: true },
        { id: 'c2', name: 'UAS', weight: 40, maxScore: 100, isCompleted: false },
        { id: 'c3', name: 'Proyek', weight: 30, maxScore: 100, isCompleted: false }
      ]
    };

    const result = requiredScore(plan);
    expect(result.achievable).toBe(false);
    expect(result.requiredAverageOnRemaining).toBeGreaterThan(100);
    expect(result.message).toContain('tidak mungkin dicapai secara matematis');
    expect(result.suggestedAlternativeTarget).toBeDefined();
    expect(result.suggestedAlternativeTarget?.letterGrade).toBe('A-'); // 80 cutoff <= 82 max
  });

  it('reports target as already safe when accumulated score already exceeds target', () => {
    // Tugas: 50% weight, achieved 90 -> 45 pts
    // UTS: 30% weight, achieved 90 -> 27 pts
    // Accumulated = 72 pts
    // Remaining: UAS 20%
    // Target is 'B' with score 70.
    const plan: CourseGradePlan = {
      id: 'p3',
      courseId: 'c1',
      targetLetterGrade: 'B',
      targetScore: 70,
      components: [
        { id: 'c1', name: 'Tugas', weight: 50, maxScore: 100, achievedScore: 90, isCompleted: true },
        { id: 'c2', name: 'UTS', weight: 30, maxScore: 100, achievedScore: 90, isCompleted: true },
        { id: 'c3', name: 'UAS', weight: 20, maxScore: 100, isCompleted: false }
      ]
    };

    const result = requiredScore(plan);
    expect(result.achievable).toBe(true);
    expect(result.isSafe).toBe(true);
    expect(result.requiredAverageOnRemaining).toBe(0);
    expect(result.message).toContain('Target sudah aman');
  });

  it('calculates exact requirement when 1 component remains (e.g. UAS 40%)', () => {
    // Tugas (20% weight, score 85) = 17 pts
    // Kuis (10% weight, score 80) = 8 pts
    // UTS (30% weight, score 75) = 22.5 pts
    // Accumulated = 17 + 8 + 22.5 = 47.5 pts
    // UAS (40% weight, incomplete)
    // Target: 'A' (85 pts)
    // Points needed = 85 - 47.5 = 37.5 pts
    // Required on UAS = (37.5 / 40) * 100 = 93.75%
    const plan: CourseGradePlan = {
      id: 'p4',
      courseId: 'c1',
      targetLetterGrade: 'A',
      targetScore: 85,
      components: [
        { id: 'c1', name: 'Tugas', weight: 20, maxScore: 100, achievedScore: 85, isCompleted: true },
        { id: 'c2', name: 'Kuis', weight: 10, maxScore: 100, achievedScore: 80, isCompleted: true },
        { id: 'c3', name: 'UTS', weight: 30, maxScore: 100, achievedScore: 75, isCompleted: true },
        { id: 'c4', name: 'UAS', weight: 40, maxScore: 100, isCompleted: false }
      ]
    };

    const result = requiredScore(plan);
    expect(result.achievable).toBe(true);
    expect(result.requiredAverageOnRemaining).toBe(93.75);
    expect(result.componentTargets?.['c4']).toBe(93.75);
  });
});
