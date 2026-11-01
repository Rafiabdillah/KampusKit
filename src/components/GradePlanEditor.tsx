import React, { useId, useMemo, useState } from 'react';
import { CourseGradePlan, GradeComponent, AcademicGradingScale } from '../types';
import type { GradeItem } from './GradeCalc';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import {
  DEFAULT_GRADE_CUTOFFS, requiredScore, projectFinalScore, letterForScore
} from '../services/gradePlanner';
import { GRADING_SYSTEMS } from '../utils/intl';

interface GradePlanEditorProps {
  courseId: string;
  courseName: string;
  credits?: number;
  gradePlan: CourseGradePlan | null;
}

const fieldClass =
  'w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-bold text-zinc-300 mb-1';
const primaryBtn =
  'bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold ' +
  'px-3.5 py-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px]';
const quietBtn =
  'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 text-xs font-bold ' +
  'px-3.5 py-2 rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]';

const TEMPLATE: { name: string; weight: number }[] = [
  { name: 'Tugas', weight: 30 },
  { name: 'UTS', weight: 30 },
  { name: 'UAS', weight: 40 }
];

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankComponent(name = '', weight = 0): GradeComponent {
  return { id: newId('comp'), name, weight, maxScore: 100, isCompleted: false };
}

function numberOrUndefined(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

export const GradePlanEditor: React.FC<GradePlanEditorProps> = ({ courseId, courseName, credits, gradePlan }) => {
  const uid = useId();
  const [draft, setDraft] = useState<CourseGradePlan | null>(gradePlan);
  const [dirty, setDirty] = useState(false);
  const [whatIf, setWhatIf] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [transcriptStep, setTranscriptStep] = useState<{ semester: string } | null>(null);

  const startPlan = (useTemplate: boolean) => {
    const target = DEFAULT_GRADE_CUTOFFS[0];
    setDraft({
      id: newId('gradeplan'),
      courseId,
      targetLetterGrade: target.letter,
      targetScore: target.score,
      components: useTemplate ? TEMPLATE.map(t => blankComponent(t.name, t.weight)) : [blankComponent()],
      updatedAt: Date.now()
    });
    setDirty(true);
  };

  const edit = (next: CourseGradePlan) => {
    setDraft(next);
    setDirty(true);
    setNotice(null);
  };

  const updateComponent = (id: string, patch: Partial<GradeComponent>) => {
    if (!draft) return;
    edit({ ...draft, components: draft.components.map(c => (c.id === id ? { ...c, ...patch } : c)) });
  };

  const validation = useMemo(() => {
    if (!draft) return { problems: [] as string[], weightSum: 0 };
    const problems: string[] = [];
    const weightSum = draft.components.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    if (draft.components.some(c => !c.name.trim())) problems.push('Setiap komponen perlu nama.');
    if (draft.components.some(c => !(Number(c.weight) > 0))) problems.push('Bobot setiap komponen harus lebih dari 0.');
    if (draft.components.some(c => !(Number(c.maxScore) > 0))) problems.push('Skor maksimum harus lebih dari 0.');
    if (draft.components.some(c => c.isCompleted && (c.achievedScore === undefined || c.achievedScore < 0))) {
      problems.push('Komponen yang sudah dinilai perlu skor 0 atau lebih.');
    }
    return { problems, weightSum };
  }, [draft]);

  const result = useMemo(() => (draft ? requiredScore(draft) : null), [draft]);

  const allCompleted = !!draft && draft.components.length > 0 && draft.components.every(c => c.isCompleted);
  const remaining = draft ? draft.components.filter(c => !c.isCompleted) : [];

  const projected = useMemo(() => {
    if (!draft) return 0;
    const seed: Record<string, number> = {};
    for (const c of draft.components) {
      if (c.isCompleted) continue;
      seed[c.id] = whatIf[c.id] ?? result?.componentTargets?.[c.id] ?? 0;
    }
    return projectFinalScore(draft, seed);
  }, [draft, whatIf, result]);

  const save = () => {
    if (!draft || validation.problems.length > 0) return;
    const all = StorageService.getItem<CourseGradePlan[]>(STORAGE_KEYS.COURSE_GRADE_PLANS, []);
    const next = { ...draft, updatedAt: Date.now() };
    const exists = all.some(p => p.id === next.id);
    StorageService.setItem(
      STORAGE_KEYS.COURSE_GRADE_PLANS,
      exists ? all.map(p => (p.id === next.id ? next : p)) : [...all, next]
    );
    window.dispatchEvent(new Event('storage'));
    setDraft(next);
    setDirty(false);
    setNotice('Rencana nilai disimpan.');
  };

  const openTranscriptStep = () => {
    const items = StorageService.getItem<GradeItem[]>(STORAGE_KEYS.GRADE_DATA_V2, []);
    const lastSemester = items.reduce((m, g) => Math.max(m, Number(g.semester) || 1), 1);
    setTranscriptStep({ semester: String(lastSemester) });
  };

  const saveToTranscript = () => {
    if (!draft || !transcriptStep) return;
    const semester = Math.max(1, Math.floor(Number(transcriptStep.semester) || 1));
    const finalScore = projectFinalScore(draft);
    const letter = letterForScore(finalScore);
    const scale = StorageService.getItem<string>('academic_grading_scale', 'ID_4_0') as AcademicGradingScale;
    const option = GRADING_SYSTEMS[scale]?.options.find(o => o.label === letter);
    if (!option) {
      setNotice(`Skala nilai aktif tidak punya huruf ${letter}. Ganti skala di Kalkulator IPK, lalu coba lagi.`);
      setTranscriptStep(null);
      return;
    }
    const items = StorageService.getItem<GradeItem[]>(STORAGE_KEYS.GRADE_DATA_V2, []);
    const index = items.findIndex(g => g.courseId === courseId);
    const entry: GradeItem = {
      id: index >= 0 ? items[index].id : Date.now(),
      course: courseName,
      courseId,
      credits: credits || (index >= 0 ? items[index].credits : 3),
      grade: option.value,
      letterGrade: option.label,
      semester,
      updatedAt: Date.now()
    };
    StorageService.setItem(
      STORAGE_KEYS.GRADE_DATA_V2,
      index >= 0 ? items.map((g, i) => (i === index ? entry : g)) : [...items, entry]
    );
    window.dispatchEvent(new Event('storage'));
    setTranscriptStep(null);
    setNotice(`${courseName} masuk transkrip semester ${semester} dengan nilai ${option.label} (${finalScore.toFixed(2)}).`);
  };

  if (!draft) {
    return (
      <section aria-label="Rencana nilai" className="glass-card p-5 rounded-2xl border-white/10 space-y-3">
        <h3 className="font-bold text-white text-base">Rencana nilai {courseName}</h3>
        <p className="text-xs text-zinc-300">
          Belum ada rencana. Isi komponen penilaian dan bobotnya untuk tahu nilai minimum yang dibutuhkan di sisa komponen.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className={primaryBtn} onClick={() => startPlan(true)}>
            Mulai dengan Tugas, UTS, UAS
          </button>
          <button type="button" className={quietBtn} onClick={() => startPlan(false)}>
            Mulai dari kosong
          </button>
        </div>
      </section>
    );
  }

  const statusLabel = !result
    ? ''
    : result.remainingWeight === 0
      ? 'Semua komponen sudah dinilai'
      : result.isSafe
        ? 'Target sudah aman'
        : result.achievable
          ? 'Target masih bisa dicapai'
          : 'Target tidak bisa dicapai';

  return (
    <section aria-label="Rencana nilai" className="glass-card p-5 rounded-2xl border-white/10 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold text-white text-base">Rencana nilai {courseName}</h3>
        <button type="button" className={primaryBtn} onClick={save} disabled={!dirty || validation.problems.length > 0}>
          Simpan rencana
        </button>
      </div>

      {notice && (
        <p role="status" className="text-xs text-zinc-200 bg-zinc-900/70 border border-white/10 rounded-xl px-3.5 py-2.5">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div>
          <label htmlFor={`${uid}-letter`} className={labelClass}>Target huruf</label>
          <select
            id={`${uid}-letter`}
            value={draft.targetLetterGrade}
            onChange={e => {
              const cutoff = DEFAULT_GRADE_CUTOFFS.find(c => c.letter === e.target.value);
              edit({ ...draft, targetLetterGrade: e.target.value, targetScore: cutoff ? cutoff.score : draft.targetScore });
            }}
            className={fieldClass}
          >
            {DEFAULT_GRADE_CUTOFFS.map(c => (
              <option key={c.letter} value={c.letter}>{c.letter} (mulai {c.score})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-target`} className={labelClass}>Target skor akhir</label>
          <input
            id={`${uid}-target`}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            value={draft.targetScore}
            onChange={e => edit({ ...draft, targetScore: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
            className={fieldClass}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-400 -mt-2">Batas huruf memakai skala Indonesia 4.0.</p>

      <fieldset className="space-y-3">
        <legend className="text-xs font-bold text-white mb-1">Komponen penilaian</legend>
        {draft.components.map((c, i) => (
          <div key={c.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/10 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`${uid}-name-${c.id}`} className={labelClass}>Nama</label>
                <input
                  id={`${uid}-name-${c.id}`}
                  value={c.name}
                  maxLength={40}
                  onChange={e => updateComponent(c.id, { name: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${uid}-w-${c.id}`} className={labelClass}>Bobot</label>
                <input
                  id={`${uid}-w-${c.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={c.weight}
                  onChange={e => updateComponent(c.id, { weight: Number(e.target.value) || 0 })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${uid}-max-${c.id}`} className={labelClass}>Skor maksimum</label>
                <input
                  id={`${uid}-max-${c.id}`}
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={c.maxScore}
                  onChange={e => updateComponent(c.id, { maxScore: Number(e.target.value) || 0 })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${uid}-got-${c.id}`} className={labelClass}>Skor didapat</label>
                <input
                  id={`${uid}-got-${c.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  disabled={!c.isCompleted}
                  value={c.achievedScore ?? ''}
                  onChange={e => updateComponent(c.id, { achievedScore: numberOrUndefined(e.target.value) })}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-zinc-100 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={c.isCompleted}
                  onChange={e => updateComponent(c.id, {
                    isCompleted: e.target.checked,
                    achievedScore: e.target.checked ? c.achievedScore : undefined
                  })}
                  className="w-4 h-4 accent-primary"
                />
                Sudah dinilai
              </label>
              <button
                type="button"
                className={quietBtn}
                onClick={() => edit({ ...draft, components: draft.components.filter(x => x.id !== c.id) })}
              >
                Hapus<span className="sr-only"> komponen {c.name || i + 1}</span>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={quietBtn}
          onClick={() => edit({ ...draft, components: [...draft.components, blankComponent()] })}
        >
          Tambah komponen
        </button>
      </fieldset>

      {validation.weightSum !== 100 && draft.components.length > 0 && (
        <p role="status" className="text-xs text-amber-200">
          Total bobot {validation.weightSum}%, bukan 100%. Perhitungan menormalkan bobot ke 100%.
        </p>
      )}
      {validation.problems.length > 0 && (
        <ul role="alert" className="text-xs text-rose-300 space-y-1 list-disc pl-4">
          {validation.problems.map(p => <li key={p}>{p}</li>)}
        </ul>
      )}

      {result && validation.problems.length === 0 && (
        <div aria-live="polite" className="p-4 bg-zinc-900/60 rounded-xl border border-white/10 space-y-2">
          <h4 className="text-sm font-bold text-white">{statusLabel}</h4>
          <p className="text-xs text-zinc-200">{result.message}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-200">
            <div><dt className="text-zinc-400">Poin terkumpul</dt><dd className="font-mono">{result.currentProjectedTotal.toFixed(2)}</dd></div>
            <div><dt className="text-zinc-400">Bobot tersisa</dt><dd className="font-mono">{result.remainingWeight.toFixed(2)}%</dd></div>
            <div><dt className="text-zinc-400">Rata-rata dibutuhkan</dt><dd className="font-mono">{result.remainingWeight === 0 ? '-' : `${result.requiredAverageOnRemaining.toFixed(2)}%`}</dd></div>
          </dl>
          {result.componentTargets && result.achievable && !result.isSafe && (
            <ul className="text-xs text-zinc-100 space-y-0.5">
              {remaining.map(c => (
                <li key={c.id}>
                  {c.name}: minimal <span className="font-mono">{result.componentTargets?.[c.id]}</span> dari {c.maxScore}
                </li>
              ))}
            </ul>
          )}
          {result.suggestedAlternativeTarget && (
            <p className="text-xs text-zinc-200">
              Target terdekat yang masih mungkin: {result.suggestedAlternativeTarget.letterGrade} (mulai {result.suggestedAlternativeTarget.targetScore}).
            </p>
          )}
        </div>
      )}

      {remaining.length > 0 && validation.problems.length === 0 && (
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-white">Simulasi: bagaimana jika skornya segini?</legend>
          {remaining.map(c => {
            const max = c.maxScore > 0 ? c.maxScore : 100;
            const value = whatIf[c.id] ?? result?.componentTargets?.[c.id] ?? 0;
            return (
              <div key={c.id}>
                <label htmlFor={`${uid}-sim-${c.id}`} className={labelClass}>
                  {c.name}: <span className="font-mono">{value}</span> dari {max}
                </label>
                <input
                  id={`${uid}-sim-${c.id}`}
                  type="range"
                  min={0}
                  max={max}
                  step={max > 20 ? 1 : 0.5}
                  value={Math.min(value, max)}
                  onChange={e => setWhatIf({ ...whatIf, [c.id]: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            );
          })}
          <p className="text-xs text-zinc-100" aria-live="polite">
            Nilai akhir proyeksi: <span className="font-mono font-bold">{projected.toFixed(2)}</span>, huruf{' '}
            <span className="font-bold">{letterForScore(projected)}</span>.
          </p>
        </fieldset>
      )}

      {allCompleted && validation.problems.length === 0 && (
        <div className="space-y-2">
          {!transcriptStep ? (
            <button type="button" className={primaryBtn} onClick={openTranscriptStep}>
              Masukkan ke transkrip
            </button>
          ) : (
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/10 space-y-3 max-w-md">
              <p className="text-xs text-zinc-200">
                Nilai akhir {projectFinalScore(draft).toFixed(2)} menjadi {letterForScore(projectFinalScore(draft))}
                {credits ? `, ${credits} SKS` : ', 3 SKS bila SKS mata kuliah belum diisi'}.
              </p>
              <div>
                <label htmlFor={`${uid}-sem`} className={labelClass}>Semester</label>
                <input
                  id={`${uid}-sem`}
                  type="number"
                  min={1}
                  value={transcriptStep.semester}
                  onChange={e => setTranscriptStep({ semester: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={primaryBtn} onClick={saveToTranscript}>Simpan ke transkrip</button>
                <button type="button" className={quietBtn} onClick={() => setTranscriptStep(null)}>Batal</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
