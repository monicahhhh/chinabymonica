/**
 * wechatCleaner.ts (shared)
 *
 * Cleans HTML pasted from WeChat Official Account articles.
 * Shared between client and server for testability.
 */

/**
 * Detect if pasted HTML is likely from a WeChat article.
 */
export function isWeChatHtml(html: string): boolean {
  return (
    html.includes("mmbiz.qpic.cn") ||
    html.includes("data-mpa-") ||
    html.includes("js_editor") ||
    html.includes("rich_media_content") ||
    html.includes("data-role=") ||
    html.includes("mpvoice")
  );
}

/**
 * Extract all image URLs from WeChat HTML (mmbiz.qpic.cn).
 */
export function extractWeChatImages(html: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']*mmbiz\.qpic\.cn[^"']*)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let url = match[1];
    url = url.replace(/&amp;/g, "&");
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  const dataSrcRegex = /data-src=["']([^"']*mmbiz\.qpic\.cn[^"']*)["']/gi;
  while ((match = dataSrcRegex.exec(html)) !== null) {
    let url = match[1];
    url = url.replace(/&amp;/g, "&");
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
}

/**
 * Clean WeChat HTML for use in the article editor.
 */
export function cleanWeChatHtml(html: string): string {
  let result = html;

  // Remove <style> blocks
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove <script> blocks
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove WeChat-specific elements
  result = result.replace(/<mpvoice[^>]*>[\s\S]*?<\/mpvoice>/gi, "");
  result = result.replace(/<mp-miniprogram[^>]*>[\s\S]*?<\/mp-miniprogram>/gi, "");
  result = result.replace(/<mp-common-product[^>]*>[\s\S]*?<\/mp-common-product>/gi, "");

  // Convert <section> to <div> (WeChat uses sections for layout)
  result = result.replace(/<section([^>]*)>/gi, "<div$1>");
  result = result.replace(/<\/section>/gi, "</div>");

  // Strip inline styles
  const stripProps = [
    "font-family",
    "font-size",
    "color",
    "background-color",
    "background",
    "line-height",
    "letter-spacing",
    "text-indent",
    "margin",
    "margin-top",
    "margin-bottom",
    "margin-left",
    "margin-right",
    "padding",
    "padding-top",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "max-width",
    "min-height",
    "box-sizing",
    "outline",
    "visibility",
    "white-space",
    "word-break",
    "overflow-wrap",
    "word-wrap",
    "widows",
    "orphans",
    "caret-color",
  ];

  result = result.replace(/\sstyle="([^"]*)"/gi, (_match, styleValue: string) => {
    const parts = styleValue
      .split(";")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const kept = parts.filter((part: string) => {
      const prop = part.split(":")[0]?.trim().toLowerCase() ?? "";
      if (prop.startsWith("mso-")) return false;
      return !stripProps.includes(prop);
    });
    return kept.length > 0 ? ` style="${kept.join("; ")}"` : "";
  });

  // Strip class, id, data-* attributes
  result = result.replace(/\sclass="[^"]*"/gi, "");
  result = result.replace(/\sclass='[^']*'/gi, "");
  result = result.replace(/\sid="[^"]*"/gi, "");
  result = result.replace(/\sid='[^']*'/gi, "");
  result = result.replace(/\sdata-[a-z-]+="[^"]*"/gi, "");
  result = result.replace(/\sdata-[a-z-]+='[^']*'/gi, "");

  // Fix WeChat image lazy-loading: use data-src if src is placeholder
  result = result.replace(
    /<img([^>]*)src="[^"]*"([^>]*)data-src="([^"]*)"([^>]*)>/gi,
    '<img$1src="$3"$2$4>'
  );

  // Remove empty spans
  result = result.replace(/<span\s*>([\s\S]*?)<\/span>/gi, "$1");

  // Remove empty divs
  result = result.replace(/<div\s*>\s*<\/div>/gi, "");

  // Convert simple divs to paragraphs
  result = result.replace(/<div\s*>([\s\S]*?)<\/div>/gi, (_match, content: string) => {
    if (/<(p|h[1-6]|ul|ol|blockquote|div|table|pre|hr|img)\b/i.test(content)) {
      return content;
    }
    const trimmed = content.trim();
    if (!trimmed) return "";
    return `<p>${trimmed}</p>`;
  });

  // Remove empty paragraphs
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, "");
  result = result.replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "");

  // Normalize heading levels: H1 → H2
  result = result.replace(/<h1(\s|>)/gi, "<h2$1");
  result = result.replace(/<\/h1>/gi, "</h2>");

  // Clean up whitespace
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.trim();

  return result;
}
