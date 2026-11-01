/**
 * Safely extracts human-readable plain text from Note content,
 * supporting BlockNote JSON block documents, raw HTML strings, and markdown.
 */
export function extractPlainText(content?: string): string {
  if (!content || typeof content !== 'string') return '';
  const trimmed = content.trim();
  if (!trimmed) return '';

  // 1. Try parsing as BlockNote JSON array of blocks
  if (trimmed.startsWith('[')) {
    try {
      const blocks = JSON.parse(trimmed);
      if (Array.isArray(blocks)) {
        const lines: string[] = [];

        for (const b of blocks) {
          if (!b) continue;

          // Helper to parse inline content elements
          const parseInline = (c: any): string => {
            if (!c) return '';
            if (typeof c === 'string') return c;
            if (Array.isArray(c)) {
              return c.map(item => (typeof item === 'string' ? item : item?.text || '')).join('');
            }
            if (typeof c === 'object' && c.text) return c.text;
            return '';
          };

          const text = parseInline(b.content);

          // Handle table blocks
          if (b.type === 'table' || (b.content && typeof b.content === 'object' && Array.isArray(b.content.rows))) {
            const rows = b.content?.rows || [];
            for (const r of rows) {
              const cells = Array.isArray(r?.cells) ? r.cells : [];
              const rowTexts = cells.map((cell: any) => parseInline(cell));
              lines.push(rowTexts.join(' | '));
            }
            continue;
          }

          if (text) {
            lines.push(text);
          }
        }

        if (lines.length > 0) {
          return lines.join('\n').trim();
        }
      }
    } catch {
      // Not valid JSON, fallback to HTML / markdown cleanup below
    }
  }

  // 2. Strip HTML tags and entities
  const noHtml = trimmed
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  return noHtml.replace(/\n{3,}/g, '\n\n').trim();
}
