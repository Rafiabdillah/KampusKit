import React, { useId, useMemo, useState } from 'react';
import {
  Exam, ExamTopic, Note, Task, FlashcardDeck, Flashcard, FocusSession, StudyBlock, PlannerSettings
} from '../types';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';
import { calculateExamReadiness } from '../services/examReadiness';
import {
  buildExamPrepPlan, examPlanToStudyBlocks, extractTopicsFromNotesOffline, ExamPrepPlanDay
} from '../services/examPlanner';
import { AIService } from '../services/ai';
import { extractPlainText } from '../utils/textExtractor';
import { diffDays, formatLocalDate } from '../utils/dateUtils';

interface ExamManagerProps {
  courseId: string;
  courseName: string;
  exams: Exam[];
  notes: Note[];
  tasks: Task[];
  flashcardDecks: FlashcardDeck[];
  focusSessions: FocusSession[];
}

type ExamKind = Exam['kind'];

const KIND_LABEL: Record<ExamKind, string> = {
  QUIZ: 'Kuis',
  UTS: 'UTS',
  UAS: 'UAS',
  PRACTICAL: 'Praktikum',
  OTHER: 'Ujian lain'
};

interface ExamForm {
  id?: string;
  kind: ExamKind;
  title: string;
  date: string;
  time: string;
  room: string;
  weightPercent: string;
  targetScore: string;
}

const EMPTY_FORM: ExamForm = {
  kind: 'UTS', title: '', date: '', time: '', room: '', weightPercent: '', targetScore: ''
};

const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  dailyStudyTargetMinutes: 120,
  preferredStudyHours: { start: '18:00', end: '22:00' },
  breakIntervalMinutes: 10
};

const MIN_NOTE_TEXT_LENGTH = 80;
const MAX_NOTE_TEXT_LENGTH = 12000;

const fieldClass =
  'w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const labelClass = 'block text-xs font-bold text-zinc-300 mb-1';
const primaryBtn =
  'bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold ' +
  'px-3.5 py-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px]';
const quietBtn =
  'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 text-xs font-bold ' +
  'px-3.5 py-2 rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]';

function countdownLabel(date: string): { text: string; past: boolean } {
  const days = diffDays(formatLocalDate(new Date()), date);
  if (days < 0) return { text: `Lewat ${-days} hari`, past: true };
  if (days === 0) return { text: 'Hari ini', past: false };
  if (days === 1) return { text: 'Besok', past: false };
  return { text: `${days} hari lagi`, past: false };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function notifyStorageChanged() {
  window.dispatchEvent(new Event('storage'));
}

interface PlanState {
  examId: string;
  days: ExamPrepPlanDay[];
  message?: string;
}

interface AiState {
  examId: string;
  status: 'loading' | 'error' | 'ready';
  cards: { front: string; back: string }[];
  error?: string;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  courseId, courseName, exams, notes, tasks, flashcardDecks, focusSessions
}) => {
  const formId = useId();
  const [form, setForm] = useState<ExamForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState('');
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [ai, setAi] = useState<AiState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  const persistExam = (next: Exam) => {
    const all = StorageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
    const exists = all.some(e => e.id === next.id);
    const updated = exists ? all.map(e => (e.id === next.id ? next : e)) : [...all, next];
    StorageService.setItem(STORAGE_KEYS.EXAMS, updated);
    notifyStorageChanged();
  };

  const removeExam = (examId: string) => {
    const all = StorageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
    StorageService.setItem(STORAGE_KEYS.EXAMS, all.filter(e => e.id !== examId));
    const blocks = StorageService.getItem<StudyBlock[]>(STORAGE_KEYS.STUDY_PLAN_BLOCKS, []);
    StorageService.setItem(
      STORAGE_KEYS.STUDY_PLAN_BLOCKS,
      blocks.filter(b => !(b.examId === examId && !b.completed))
    );
    setConfirmDeleteId(null);
    if (openExamId === examId) setOpenExamId(null);
    setNotice('Ujian dihapus beserta blok belajarnya yang belum selesai.');
    notifyStorageChanged();
  };

  const openForm = (exam?: Exam) => {
    setFormError(null);
    setForm(
      exam
        ? {
            id: exam.id,
            kind: exam.kind,
            title: exam.title,
            date: exam.date,
            time: exam.time || '',
            room: exam.room || '',
            weightPercent: exam.weightPercent !== undefined ? String(exam.weightPercent) : '',
            targetScore: exam.targetScore !== undefined ? String(exam.targetScore) : ''
          }
        : EMPTY_FORM
    );
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return setFormError('Judul ujian wajib diisi.');
    if (!form.date) return setFormError('Tanggal ujian wajib diisi.');

    const weight = form.weightPercent.trim() === '' ? undefined : Number(form.weightPercent);
    const target = form.targetScore.trim() === '' ? undefined : Number(form.targetScore);
    if (weight !== undefined && (Number.isNaN(weight) || weight < 0 || weight > 100)) {
      return setFormError('Bobot harus antara 0 dan 100.');
    }
    if (target !== undefined && (Number.isNaN(target) || target < 0 || target > 100)) {
      return setFormError('Target nilai harus antara 0 dan 100.');
    }

    const previous = exams.find(x => x.id === form.id);
    persistExam({
      id: form.id || newId('exam'),
      courseId,
      kind: form.kind,
      title: form.title.trim(),
      date: form.date,
      time: form.time || undefined,
      room: form.room.trim() || undefined,
      weightPercent: weight,
      targetScore: target,
      topics: previous?.topics || [],
      updatedAt: Date.now()
    });
    setForm(null);
    setFormError(null);
    setNotice(previous ? 'Ujian diperbarui.' : 'Ujian ditambahkan.');
  };

  const updateTopics = (exam: Exam, topics: ExamTopic[]) => {
    persistExam({ ...exam, topics, updatedAt: Date.now() });
  };

  const addTopic = (exam: Exam) => {
    const title = topicDraft.trim();
    if (!title) return;
    if (exam.topics.some(t => t.title.toLowerCase() === title.toLowerCase())) {
      setNotice('Topik itu sudah ada di daftar.');
      return;
    }
    updateTopics(exam, [...exam.topics, { id: newId('topic'), title, completed: false }]);
    setTopicDraft('');
  };

  const importTopicsFromNotes = (exam: Exam) => {
    const found = extractTopicsFromNotesOffline(notes);
    const known = new Set(exam.topics.map(t => t.title.toLowerCase()));
    const fresh = found.filter(t => !known.has(t.title.toLowerCase()));
    if (fresh.length === 0) {
      setNotice(
        notes.length === 0
          ? 'Belum ada catatan yang tertaut ke mata kuliah ini.'
          : 'Tidak ada topik baru di catatan mata kuliah ini.'
      );
      return;
    }
    updateTopics(exam, [...exam.topics, ...fresh]);
    setNotice(`${fresh.length} topik diambil dari catatan.`);
  };

  const buildPlan = (exam: Exam) => {
    const daysUntil = diffDays(formatLocalDate(new Date()), exam.date);
    if (daysUntil < 1) {
      setPlan({ examId: exam.id, days: [], message: 'Rencana belajar butuh ujian yang jatuh besok atau lebih lambat.' });
      return;
    }
    if (exam.topics.length === 0 && daysUntil > 3) {
      setPlan({ examId: exam.id, days: [], message: 'Tambahkan minimal satu topik supaya materi bisa dibagi per hari.' });
      return;
    }
    setPlan({ examId: exam.id, days: buildExamPrepPlan(exam, daysUntil, new Date()) });
  };

  const savePlan = (exam: Exam) => {
    if (!plan || plan.examId !== exam.id) return;
    const settings = StorageService.getItem<PlannerSettings>(
      STORAGE_KEYS.PLANNER_SETTINGS,
      DEFAULT_PLANNER_SETTINGS
    );
    const existing = StorageService.getItem<StudyBlock[]>(STORAGE_KEYS.STUDY_PLAN_BLOCKS, []);
    const kept = existing.filter(b => !(b.examId === exam.id && b.type === 'EXAM_PREP' && !b.completed));
    const { blocks, skippedDates } = examPlanToStudyBlocks(exam, plan.days, kept, settings);
    StorageService.setItem(STORAGE_KEYS.STUDY_PLAN_BLOCKS, [...kept, ...blocks]);
    notifyStorageChanged();
    setPlan(null);
    setNotice(
      skippedDates.length > 0
        ? `${blocks.length} blok disimpan ke Planner. ${skippedDates.length} hari dilewati karena tidak ada ruang sebelum pukul 23.00.`
        : `${blocks.length} blok disimpan ke Planner.`
    );
  };

  const generateCards = async (exam: Exam) => {
    const text = notes
      .map(n => extractPlainText(n.content))
      .filter(Boolean)
      .join('\n\n')
      .slice(0, MAX_NOTE_TEXT_LENGTH);
    if (text.trim().length < MIN_NOTE_TEXT_LENGTH) {
      setAi({
        examId: exam.id,
        status: 'error',
        cards: [],
        error: 'Catatan mata kuliah ini belum cukup panjang untuk dijadikan kartu. Tautkan atau tulis catatan dulu.'
      });
      return;
    }
    setAi({ examId: exam.id, status: 'loading', cards: [] });
    try {
      const cards = await AIService.generateFlashcards(text);
      if (!cards.length) throw new Error('AI tidak mengembalikan kartu. Coba lagi.');
      setAi({ examId: exam.id, status: 'ready', cards });
    } catch (err) {
      setAi({
        examId: exam.id,
        status: 'error',
        cards: [],
        error: err instanceof Error ? err.message : 'Gagal membuat kartu.'
      });
    }
  };

  const saveCards = (exam: Exam) => {
    if (!ai || ai.status !== 'ready') return;
    const now = Date.now();
    const cards: Flashcard[] = ai.cards.map((c, i) => ({
      id: `card-${now}-${i}`,
      front: c.front,
      back: c.back,
      nextReview: now,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5
    }));
    const deck: FlashcardDeck = {
      id: newId('deck'),
      title: `${KIND_LABEL[exam.kind]}: ${exam.title}`,
      subject: courseName,
      courseId,
      cards,
      updatedAt: now
    };
    const decks = StorageService.getItem<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARDS, []);
    StorageService.setItem(STORAGE_KEYS.FLASHCARDS, [...decks, deck]);
    notifyStorageChanged();
    setAi(null);
    setNotice(`${cards.length} kartu disimpan di deck "${deck.title}".`);
  };

  return (
    <div className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold text-white text-base">Ujian {courseName}</h3>
        {!form && (
          <button type="button" onClick={() => openForm()} className={primaryBtn}>
            Tambah ujian
          </button>
        )}
      </div>

      {notice && (
        <p role="status" className="text-xs text-zinc-200 bg-zinc-900/70 border border-white/10 rounded-xl px-3.5 py-2.5">
          {notice}
        </p>
      )}

      {form && (
        <form onSubmit={submitForm} className="p-4 bg-zinc-900/60 rounded-xl border border-white/10 space-y-3" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-kind`} className={labelClass}>Jenis ujian</label>
              <select
                id={`${formId}-kind`}
                value={form.kind}
                onChange={e => setForm({ ...form, kind: e.target.value as ExamKind })}
                className={fieldClass}
              >
                {(Object.keys(KIND_LABEL) as ExamKind[]).map(k => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-title`} className={labelClass}>Judul</label>
              <input
                id={`${formId}-title`}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Judul ujian"
                maxLength={80}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label htmlFor={`${formId}-date`} className={labelClass}>Tanggal</label>
              <input
                id={`${formId}-date`}
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label htmlFor={`${formId}-time`} className={labelClass}>Jam (opsional)</label>
              <input
                id={`${formId}-time`}
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-room`} className={labelClass}>Ruang (opsional)</label>
              <input
                id={`${formId}-room`}
                value={form.room}
                onChange={e => setForm({ ...form, room: e.target.value })}
                maxLength={30}
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formId}-weight`} className={labelClass}>Bobot (%)</label>
                <input
                  id={`${formId}-weight`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  value={form.weightPercent}
                  onChange={e => setForm({ ...form, weightPercent: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-target`} className={labelClass}>Target nilai</label>
                <input
                  id={`${formId}-target`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  value={form.targetScore}
                  onChange={e => setForm({ ...form, targetScore: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
          {formError && <p role="alert" className="text-xs text-rose-300 font-medium">{formError}</p>}
          <div className="flex gap-2 flex-wrap">
            <button type="submit" className={primaryBtn}>{form.id ? 'Simpan perubahan' : 'Simpan ujian'}</button>
            <button type="button" onClick={() => { setForm(null); setFormError(null); }} className={quietBtn}>
              Batal
            </button>
          </div>
        </form>
      )}

      {sortedExams.length === 0 && !form && (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm text-zinc-200 font-medium">Belum ada ujian untuk {courseName}.</p>
          <p className="text-xs text-zinc-400">
            Catat UTS atau UAS pertama untuk melihat hitung mundur, estimasi kesiapan, dan rencana belajar.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {sortedExams.map(exam => {
          const cd = countdownLabel(exam.date);
          const readiness = calculateExamReadiness(exam, { tasks, flashcardDecks, focusSessions });
          const isOpen = openExamId === exam.id;
          const doneTopics = exam.topics.filter(t => t.completed).length;
          const panelId = `${formId}-panel-${exam.id}`;
          return (
            <li key={exam.id} className="bg-zinc-900/60 rounded-xl border border-white/10">
              <div className="p-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-300">{KIND_LABEL[exam.kind]}</p>
                  <h4 className="text-sm font-bold text-white break-words">{exam.title}</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    {exam.date}
                    {exam.time ? `, ${exam.time}` : ''}
                    {exam.room ? `, ruang ${exam.room}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white font-mono">{cd.text}</p>
                  {!cd.past && (
                    <p className="text-xs text-zinc-300">Kesiapan {readiness.totalScore}%</p>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={quietBtn}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => { setOpenExamId(isOpen ? null : exam.id); setPlan(null); setAi(null); }}
                >
                  {isOpen ? 'Tutup detail' : `Detail (${doneTopics}/${exam.topics.length} topik)`}
                </button>
                <button type="button" className={quietBtn} onClick={() => openForm(exam)}>
                  Ubah
                </button>
                {confirmDeleteId === exam.id ? (
                  <>
                    <button type="button" className={primaryBtn} onClick={() => removeExam(exam.id)}>
                      Ya, hapus {exam.title}
                    </button>
                    <button type="button" className={quietBtn} onClick={() => setConfirmDeleteId(null)}>
                      Batal
                    </button>
                  </>
                ) : (
                  <button type="button" className={quietBtn} onClick={() => setConfirmDeleteId(exam.id)}>
                    Hapus
                  </button>
                )}
              </div>

              {isOpen && (
                <div id={panelId} className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                  <section aria-label="Estimasi kesiapan">
                    <h5 className="text-xs font-bold text-white">Estimasi kesiapan: {readiness.totalScore}%</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Dihitung dari data di aplikasi. Ini estimasi, bukan prediksi nilai.
                    </p>
                    <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-200">
                      <div className="flex justify-between gap-2">
                        <dt>Topik selesai</dt>
                        <dd className="font-mono">{readiness.metrics.completedTopics}/{readiness.metrics.totalTopics}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Kartu pernah direview</dt>
                        <dd className="font-mono">{readiness.metrics.reviewedFlashcards}/{readiness.metrics.totalFlashcards}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Tugas selesai</dt>
                        <dd className="font-mono">{readiness.metrics.completedTasks}/{readiness.metrics.totalTasks}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Fokus 14 hari</dt>
                        <dd className="font-mono">{readiness.metrics.focusMinutes14Days}/{readiness.metrics.targetFocusMinutes} menit</dd>
                      </div>
                    </dl>
                    <p className="text-xs text-zinc-300 mt-2">{readiness.explanation}</p>
                  </section>

                  <section aria-label="Topik ujian">
                    <h5 className="text-xs font-bold text-white mb-2">Topik</h5>
                    {exam.topics.length === 0 ? (
                      <p className="text-xs text-zinc-400">Belum ada topik. Tambahkan manual atau ambil dari catatan.</p>
                    ) : (
                      <ul className="space-y-1">
                        {exam.topics.map(t => (
                          <li key={t.id} className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-100 min-h-[44px] flex-1">
                              <input
                                type="checkbox"
                                checked={t.completed}
                                onChange={() =>
                                  updateTopics(exam, exam.topics.map(x => (x.id === t.id ? { ...x, completed: !x.completed } : x)))
                                }
                                className="w-4 h-4 accent-primary"
                              />
                              <span className={t.completed ? 'line-through text-zinc-400' : ''}>{t.title}</span>
                            </label>
                            <button
                              type="button"
                              className="text-xs text-zinc-300 hover:text-white underline min-h-[44px] px-2"
                              onClick={() => updateTopics(exam, exam.topics.filter(x => x.id !== t.id))}
                            >
                              Hapus<span className="sr-only"> topik {t.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex gap-2 flex-wrap items-end">
                      <div className="flex-1 min-w-[10rem]">
                        <label htmlFor={`${formId}-topic-${exam.id}`} className={labelClass}>Topik baru</label>
                        <input
                          id={`${formId}-topic-${exam.id}`}
                          value={topicDraft}
                          onChange={e => setTopicDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(exam); } }}
                          maxLength={80}
                          className={fieldClass}
                        />
                      </div>
                      <button type="button" className={quietBtn} onClick={() => addTopic(exam)}>Tambah topik</button>
                      <button type="button" className={quietBtn} onClick={() => importTopicsFromNotes(exam)}>
                        Ambil topik dari catatan
                      </button>
                    </div>
                  </section>

                  <section aria-label="Rencana belajar">
                    <h5 className="text-xs font-bold text-white mb-2">Rencana belajar</h5>
                    <button type="button" className={quietBtn} onClick={() => buildPlan(exam)}>
                      Susun rencana belajar
                    </button>
                    {plan && plan.examId === exam.id && (
                      <div className="mt-3 space-y-2">
                        {plan.message && <p role="alert" className="text-xs text-amber-200">{plan.message}</p>}
                        {plan.days.length > 0 && (
                          <>
                            <ol className="space-y-1 text-xs text-zinc-100">
                              {plan.days.map(d => (
                                <li key={d.date} className="flex justify-between gap-3">
                                  <span className="min-w-0 break-words">{d.date}: {d.actionTitle}</span>
                                  <span className="font-mono shrink-0">{d.targetMinutes} mnt</span>
                                </li>
                              ))}
                            </ol>
                            <div className="flex gap-2 flex-wrap">
                              <button type="button" className={primaryBtn} onClick={() => savePlan(exam)}>
                                Simpan {plan.days.length} blok ke Planner
                              </button>
                              <button type="button" className={quietBtn} onClick={() => setPlan(null)}>Batal</button>
                            </div>
                            <p className="text-xs text-zinc-400">
                              Blok dibuat di jam belajar pilihanmu dan digeser bila bentrok. Waktunya bisa diubah di Planner.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </section>

                  <section aria-label="Kartu dari catatan">
                    <h5 className="text-xs font-bold text-white mb-2">Kartu dari catatan</h5>
                    <button
                      type="button"
                      className={quietBtn}
                      disabled={ai?.status === 'loading'}
                      onClick={() => generateCards(exam)}
                    >
                      {ai?.examId === exam.id && ai.status === 'loading' ? 'Membuat kartu dengan Gemini...' : 'Buat kartu dari catatan'}
                    </button>
                    {ai && ai.examId === exam.id && ai.status === 'error' && (
                      <p role="alert" className="mt-2 text-xs text-rose-300">
                        {ai.error} Tidak ada kartu yang disimpan.
                      </p>
                    )}
                    {ai && ai.examId === exam.id && ai.status === 'ready' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-zinc-300">
                          Pratinjau {ai.cards.length} kartu dari Gemini. Periksa sebelum disimpan.
                        </p>
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {ai.cards.map((c, i) => (
                            <li key={i} className="text-xs bg-zinc-950/60 border border-white/10 rounded-lg p-2.5">
                              <p className="text-white font-medium break-words">{c.front}</p>
                              <p className="text-zinc-300 mt-1 break-words">{c.back}</p>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" className={primaryBtn} onClick={() => saveCards(exam)}>
                            Simpan {ai.cards.length} kartu
                          </button>
                          <button type="button" className={quietBtn} onClick={() => setAi(null)}>Buang</button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
