/**
 * normalizeArticleHtml.ts
 *
 * Cleans and normalizes HTML content pasted into the article editor.
 * Ensures consistent structure so the article-content CSS styles
 * render every article uniformly.
 *
 * What it does:
 * 1. Strips inline styles (font-size, font-family, color, background, etc.)
 *    so the editorial CSS takes over.
 * 2. Removes empty paragraphs and excessive <br> tags.
 * 3. Normalizes heading levels (no H1 in body — map to H2/H3).
 * 4. Strips class/id attributes from pasted content.
 * 5. Removes Word/Google Docs artifacts (mso-*, o:p, etc.).
 */

// Inline styles to strip — these are the ones that conflict with our CSS
const STRIP_STYLE_PROPS = [
  'font-family',
  'font-size',
  'color',
  'background-color',
  'background',
  'line-height',
  'letter-spacing',
  'text-indent',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
];

/**
 * Remove specific inline style properties from a style attribute value.
 * Returns the cleaned style string, or empty string if nothing remains.
 */
function cleanStyleAttr(styleValue: string): string {
  const parts = styleValue.split(';').map(s => s.trim()).filter(Boolean);
  const kept = parts.filter(part => {
    const prop = part.split(':')[0]?.trim().toLowerCase() ?? '';
    // Remove mso-* properties (Word artifacts)
    if (prop.startsWith('mso-')) return false;
    return !STRIP_STYLE_PROPS.includes(prop);
  });
  return kept.join('; ');
}

/**
 * Main normalization function.
 * Takes raw HTML string and returns cleaned HTML.
 */
export function normalizeArticleHtml(html: string): string {
  if (!html || html.trim() === '') return '';

  let result = html;

  // 1. Remove Word/Google Docs artifacts
  // Remove <o:p> tags (Word)
  result = result.replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '');
  // Remove <!--[if ...]> ... <![endif]--> conditionals
  result = result.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
  // Remove XML namespace declarations
  result = result.replace(/<\?xml[\s\S]*?\?>/gi, '');
  // Remove <meta> tags
  result = result.replace(/<meta[^>]*>/gi, '');
  // Remove <style> blocks (pasted from external sources)
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 2. Clean inline styles — strip conflicting properties
  result = result.replace(/\sstyle="([^"]*)"/gi, (match, styleValue: string) => {
    const cleaned = cleanStyleAttr(styleValue);
    return cleaned ? ` style="${cleaned}"` : '';
  });
  result = result.replace(/\sstyle='([^']*)'/gi, (match, styleValue: string) => {
    const cleaned = cleanStyleAttr(styleValue);
    return cleaned ? ` style="${cleaned}"` : '';
  });

  // 3. Strip class and id attributes (except our own)
  result = result.replace(/\sclass="[^"]*"/gi, '');
  result = result.replace(/\sclass='[^']*'/gi, '');
  result = result.replace(/\sid="[^"]*"/gi, '');
  result = result.replace(/\sid='[^']*'/gi, '');

  // 4. Strip data-* attributes
  result = result.replace(/\sdata-[a-z-]+="[^"]*"/gi, '');
  result = result.replace(/\sdata-[a-z-]+='[^']*'/gi, '');

  // 5. Normalize heading levels: H1 → H2 (article title is already H1)
  result = result.replace(/<h1(\s|>)/gi, '<h2$1');
  result = result.replace(/<\/h1>/gi, '</h2>');

  // 6. Remove empty paragraphs (but keep <br> as paragraph breaks)
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, '');
  result = result.replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '');

  // 7. Remove excessive consecutive <br> tags (more than 2)
  result = result.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  // 8. Remove <span> wrappers that have no attributes (just pass-through)
  result = result.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');

  // 9. Remove <div> wrappers that have no attributes (normalize to <p>)
  // Only simple divs with just text content
  result = result.replace(/<div\s*>([\s\S]*?)<\/div>/gi, (match, content: string) => {
    // If content already contains block elements, don't wrap in <p>
    if (/<(p|h[1-6]|ul|ol|blockquote|div|table|pre|hr)\b/i.test(content)) {
      return content;
    }
    const trimmed = content.trim();
    if (!trimmed) return '';
    return `<p>${trimmed}</p>`;
  });

  // 10. Clean up whitespace
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.trim();

  return result;
}
