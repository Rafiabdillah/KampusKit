import { CourseGradePlan, GradeComponent } from '../types';

export interface RequiredScoreResult {
  achievable: boolean;
  isSafe: boolean;
  currentProjectedTotal: number;
  remainingWeight: number;
  requiredAverageOnRemaining: number;
  componentTargets?: Record<string, number>;
  message: string;
  suggestedAlternativeTarget?: {
    letterGrade: string;
    targetScore: number;
  };
}

export const DEFAULT_GRADE_CUTOFFS = [
  { letter: 'A', score: 85 },
  { letter: 'A-', score: 80 },
  { letter: 'B+', score: 75 },
  { letter: 'B', score: 70 },
  { letter: 'B-', score: 65 },
  { letter: 'C+', score: 60 },
  { letter: 'C', score: 55 },
  { letter: 'D', score: 40 },
  { letter: 'E', score: 0 }
];

export function requiredScore(
  plan: CourseGradePlan,
  customCutoffs?: { letter: string; score: number }[]
): RequiredScoreResult {
  const cutoffs = customCutoffs || DEFAULT_GRADE_CUTOFFS;
  const components = plan.components || [];

  if (components.length === 0) {
    return {
      achievable: false,
      isSafe: false,
      currentProjectedTotal: 0,
      remainingWeight: 100,
      requiredAverageOnRemaining: 0,
      message: 'Belum ada komponen nilai yang didaftarkan.'
    };
  }

  // 1. Normalization of weights to exactly 100%
  const rawWeightSum = components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  if (rawWeightSum <= 0) {
    return {
      achievable: false,
      isSafe: false,
      currentProjectedTotal: 0,
      remainingWeight: 100,
      requiredAverageOnRemaining: 0,
      message: 'Total bobot komponen harus lebih dari 0%.'
    };
  }

  const normalizedComponents = components.map(c => ({
    ...c,
    normalizedWeight: ((Number(c.weight) || 0) / rawWeightSum) * 100
  }));

  // 2. Calculate accumulated points so far
  let accumulatedPoints = 0;
  let remainingWeight = 0;
  const incompleteComponents: typeof normalizedComponents = [];

  for (const c of normalizedComponents) {
    if (c.isCompleted && c.achievedScore !== undefined && c.achievedScore !== null) {
      const max = c.maxScore > 0 ? c.maxScore : 100;
      const pct = Math.max(0, (c.achievedScore / max) * 100);
      accumulatedPoints += (pct / 100) * c.normalizedWeight;
    } else {
      remainingWeight += c.normalizedWeight;
      incompleteComponents.push(c);
    }
  }

  // Round accumulated points to 2 decimals
  accumulatedPoints = Math.round(accumulatedPoints * 100) / 100;
  remainingWeight = Math.round(remainingWeight * 100) / 100;

  // 3. If no components left (all completed)
  if (remainingWeight === 0 || incompleteComponents.length === 0) {
    const isTargetMet = accumulatedPoints >= plan.targetScore;
    return {
      achievable: isTargetMet,
      isSafe: isTargetMet,
      currentProjectedTotal: accumulatedPoints,
      remainingWeight: 0,
      requiredAverageOnRemaining: 0,
      message: isTargetMet
        ? `Semua komponen selesai. Nilai akhir Anda adalah ${accumulatedPoints.toFixed(2)} (Target ${plan.targetLetterGrade} tercapai!).`
        : `Semua komponen selesai. Nilai akhir Anda adalah ${accumulatedPoints.toFixed(2)} (Belum mencapai target ${plan.targetLetterGrade} ${plan.targetScore}).`
    };
  }

  // 4. Check if target is already safe (even if remaining gets 0)
  const pointsNeeded = plan.targetScore - accumulatedPoints;
  if (pointsNeeded <= 0) {
    return {
      achievable: true,
      isSafe: true,
      currentProjectedTotal: accumulatedPoints,
      remainingWeight,
      requiredAverageOnRemaining: 0,
      message: `Target sudah aman! Nilai terakumulasi (${accumulatedPoints.toFixed(2)}) sudah memenuhi target ${plan.targetLetterGrade} (${plan.targetScore}).`
    };
  }

  // 5. Calculate required average percentage on remaining weight
  const requiredPercentage = (pointsNeeded / remainingWeight) * 100;
  const roundedRequired = Math.round(requiredPercentage * 100) / 100;

  // 6. Check if mathematically impossible (> 100%)
  if (roundedRequired > 100) {
    const maxPossible = Math.round((accumulatedPoints + remainingWeight) * 100) / 100;
    const alternative = cutoffs.find(opt => opt.score <= maxPossible) || cutoffs[cutoffs.length - 1];

    return {
      achievable: false,
      isSafe: false,
      currentProjectedTotal: accumulatedPoints,
      remainingWeight,
      requiredAverageOnRemaining: roundedRequired,
      message: `Target ${plan.targetLetterGrade} (${plan.targetScore}) tidak mungkin dicapai secara matematis (membutuhkan ${roundedRequired.toFixed(2)}%). Nilai maksimum yang bisa diraih adalah ${maxPossible.toFixed(2)} (Target alternatif: ${alternative.letter}).`,
      suggestedAlternativeTarget: {
        letterGrade: alternative.letter,
        targetScore: alternative.score
      }
    };
  }

  // 7. Achievable: compute individual component targets
  const componentTargets: Record<string, number> = {};
  for (const c of incompleteComponents) {
    const max = c.maxScore > 0 ? c.maxScore : 100;
    const targetVal = Math.round(((roundedRequired / 100) * max) * 100) / 100;
    componentTargets[c.id] = targetVal;
  }

  return {
    achievable: true,
    isSafe: false,
    currentProjectedTotal: accumulatedPoints,
    remainingWeight,
    requiredAverageOnRemaining: roundedRequired,
    componentTargets,
    message: `Untuk meraih target ${plan.targetLetterGrade} (${plan.targetScore}), Anda membutuhkan rata-rata minimal ${roundedRequired.toFixed(2)}% pada komponen yang tersisa.`
  };
}

export function letterForScore(
  score: number,
  cutoffs: { letter: string; score: number }[] = DEFAULT_GRADE_CUTOFFS
): string {
  const sorted = [...cutoffs].sort((a, b) => b.score - a.score);
  return (sorted.find(c => score >= c.score) || sorted[sorted.length - 1]).letter;
}

/**
 * Nilai akhir (0..100) bila komponen yang belum dinilai mendapat skor hipotetis.
 * Komponen tanpa skor hipotetis dihitung 0.
 */
export function projectFinalScore(
  plan: CourseGradePlan,
  hypothetical: Record<string, number> = {}
): number {
  const components = plan.components || [];
  const rawWeightSum = components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  if (rawWeightSum <= 0) return 0;

  let total = 0;
  for (const c of components) {
    const max = c.maxScore > 0 ? c.maxScore : 100;
    const known = c.isCompleted && c.achievedScore !== undefined && c.achievedScore !== null;
    const score = known ? (c.achievedScore as number) : (hypothetical[c.id] ?? 0);
    const normalizedWeight = ((Number(c.weight) || 0) / rawWeightSum) * 100;
    total += (Math.max(0, score / max)) * normalizedWeight;
  }
  return Math.round(total * 100) / 100;
}
