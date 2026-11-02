export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Strip scripts, event handlers, and dangerous URLs from note HTML before it
 * is rendered into a print/export document that shares the app origin.
 */
export const sanitizeNoteHtml = (html: string): string => {
  if (typeof DOMParser === 'undefined') return escapeHtml(html);

  const parsed = new DOMParser().parseFromString(`<div id="print-root">${html}</div>`, 'text/html');
  const root = parsed.getElementById('print-root');
  if (!root) return '';

  root
    .querySelectorAll('script, style, iframe, object, embed, link, meta, form, input, button, textarea, select, base')
    .forEach(el => el.remove());

  const isSafeHref = (value: string) => /^(https?:|mailto:|tel:|#|\/|\.)/i.test(value);
  const isSafeSrc = (value: string) =>
    isSafeHref(value) || /^data:image\/(png|jpe?g|gif|webp);/i.test(value);

  root.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      const lower = value.toLowerCase();

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (name === 'href' || name === 'xlink:href') {
        if (!isSafeHref(value)) el.removeAttribute(attr.name);
      } else if (name === 'src') {
        if (!isSafeSrc(value)) el.removeAttribute(attr.name);
      } else if (name === 'style' && /expression\s*\(|url\s*\(/i.test(lower)) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return root.innerHTML;
};
