import { ViewState } from '../types';

// Exhaustive map: adding a ViewState without updating this record is a type error.
const VIEW_FLAGS: Record<ViewState, true> = {
  profile: true,
  invoice: true,
  gym: true,
  dashboard: true,
  calendar: true,
  schedule: true,
  attendance: true,
  'micro-learning': true,
  curriculum: true,
  tasks: true,
  notes: true,
  focus: true,
  grades: true,
  library: true,
  'brain-gym': true,
  flashcards: true,
  settings: true,
  journal: true,
  motivation: true,
  'study-guide': true,
  'learning-path': true,
  skills: true,
  goals: true,
  compass: true,
  habits: true,
  'ai-chat': true,
  budget: true,
  sleep: true,
  meals: true,
  career: true,
  citation: true,
  'campus-life': true,
  sports: true,
  statistics: true,
  projects: true,
  location: true,
  'course-hub': true,
  planner: true,
};

export const KNOWN_VIEWS: ReadonlySet<string> = new Set(Object.keys(VIEW_FLAGS));

export function isKnownView(value: string | null): value is ViewState {
  return value !== null && KNOWN_VIEWS.has(value);
}

export function getViewFromSearch(search: string): ViewState | null {
  const view = new URLSearchParams(search).get('view');
  return isKnownView(view) ? view : null;
}

export function buildViewSearch(search: string, view: ViewState): string {
  const params = new URLSearchParams(search);
  if (view === 'dashboard') {
    params.delete('view');
  } else {
    params.set('view', view);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
