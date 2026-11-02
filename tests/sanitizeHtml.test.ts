import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeNoteHtml } from '../src/utils/sanitizeHtml';

describe('note HTML sanitizer', () => {
  it('escapes user text so tags render as text', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
  });

  it('removes scripts, iframes, and inline event handlers', () => {
    const dirty = '<p onclick="steal()">Halo</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>';
    const clean = sanitizeNoteHtml(dirty);

    expect(clean).toContain('Halo');
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('onclick');
  });

  it('removes javascript: URLs but keeps safe links', () => {
    const dirty = '<a href="javascript:alert(1)">Bad</a><a href="https://kampuskit.app">Good</a>';
    const clean = sanitizeNoteHtml(dirty);

    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('href="https://kampuskit.app"');
  });

  it('allows image data URLs but blocks other data URLs', () => {
    const dirty = '<img src="data:text/html;base64,PHNjcmlwdD4="><img src="data:image/png;base64,AAAA">';
    const clean = sanitizeNoteHtml(dirty);

    expect(clean).not.toContain('data:text/html');
    expect(clean).toContain('data:image/png');
  });

  it('keeps normal formatting intact', () => {
    const clean = sanitizeNoteHtml('<h2>Judul</h2><strong>Poin</strong>');
    expect(clean).toBe('<h2>Judul</h2><strong>Poin</strong>');
  });
});
