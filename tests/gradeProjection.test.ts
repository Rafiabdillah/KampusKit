import { describe, it, expect } from 'vitest';
import { projectFinalScore, letterForScore } from '../src/services/gradePlanner';
import { CourseGradePlan } from '../src/types';

const plan: CourseGradePlan = {
  id: 'p1',
  courseId: 'c1',
  targetLetterGrade: 'A',
  targetScore: 85,
  updatedAt: 0,
  components: [
    { id: 'a', name: 'Tugas', weight: 30, maxScore: 100, achievedScore: 80, isCompleted: true },
    { id: 'b', name: 'UTS', weight: 30, maxScore: 100, isCompleted: false },
    { id: 'c', name: 'UAS', weight: 40, maxScore: 100, isCompleted: false }
  ]
};

describe('projectFinalScore', () => {
  it('counts unscored components as zero by default', () => {
    expect(projectFinalScore(plan)).toBe(24);
  });

  it('uses hypothetical scores for components not yet graded', () => {
    expect(projectFinalScore(plan, { b: 90, c: 90 })).toBe(87);
  });

  it('normalizes weights that do not add up to 100', () => {
    const half: CourseGradePlan = {
      ...plan,
      components: [
        { id: 'a', name: 'Tugas', weight: 20, maxScore: 100, achievedScore: 100, isCompleted: true },
        { id: 'b', name: 'UAS', weight: 20, maxScore: 100, achievedScore: 50, isCompleted: true }
      ]
    };
    expect(projectFinalScore(half)).toBe(75);
  });

  it('respects a non-100 max score', () => {
    const scaled: CourseGradePlan = {
      ...plan,
      components: [{ id: 'a', name: 'Kuis', weight: 100, maxScore: 50, achievedScore: 40, isCompleted: true }]
    };
    expect(projectFinalScore(scaled)).toBe(80);
  });
});

describe('letterForScore', () => {
  it('maps scores to Indonesian cutoffs', () => {
    expect(letterForScore(85)).toBe('A');
    expect(letterForScore(84.99)).toBe('A-');
    expect(letterForScore(39)).toBe('E');
  });
});
