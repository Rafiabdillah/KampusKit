import { describe, expect, it } from 'vitest';
import { buildViewSearch, getViewFromSearch, isKnownView } from '../src/utils/viewRouting';

describe('viewRouting', () => {
  it('reads a valid view from the query string', () => {
    expect(getViewFromSearch('?view=tasks')).toBe('tasks');
    expect(getViewFromSearch('?foo=1&view=course-hub')).toBe('course-hub');
  });

  it('rejects unknown or missing views', () => {
    expect(getViewFromSearch('')).toBeNull();
    expect(getViewFromSearch('?view=javascript:alert(1)')).toBeNull();
    expect(getViewFromSearch('?view=tasks2')).toBeNull();
    expect(isKnownView(null)).toBe(false);
  });

  it('writes the view while preserving unrelated params', () => {
    expect(buildViewSearch('', 'notes')).toBe('?view=notes');
    expect(buildViewSearch('?shareId=abc&view=tasks', 'schedule')).toBe('?shareId=abc&view=schedule');
  });

  it('drops the view param for the default dashboard', () => {
    expect(buildViewSearch('?view=notes', 'dashboard')).toBe('');
    expect(buildViewSearch('?shareId=abc&view=notes', 'dashboard')).toBe('?shareId=abc');
  });

  it('round-trips through the URL helpers', () => {
    const search = buildViewSearch('?tab=2', 'flashcards');
    expect(getViewFromSearch(search)).toBe('flashcards');
  });
});
