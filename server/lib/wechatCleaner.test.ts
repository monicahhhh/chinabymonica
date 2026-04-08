import { describe, it, expect } from "vitest";
import { isWeChatHtml, extractWeChatImages, cleanWeChatHtml } from "../../shared/wechatCleaner";

describe("isWeChatHtml", () => {
  it("detects WeChat HTML by mmbiz domain", () => {
    const html = '<img src="https://mmbiz.qpic.cn/mmbiz_jpg/abc123/0?wx_fmt=jpeg">';
    expect(isWeChatHtml(html)).toBe(true);
  });

  it("detects WeChat HTML by data-mpa attribute", () => {
    const html = '<section data-mpa-template="t">content</section>';
    expect(isWeChatHtml(html)).toBe(true);
  });

  it("detects WeChat HTML by js_editor class", () => {
    const html = '<div class="js_editor">content</div>';
    expect(isWeChatHtml(html)).toBe(true);
  });

  it("detects WeChat HTML by rich_media_content", () => {
    const html = '<div class="rich_media_content">content</div>';
    expect(isWeChatHtml(html)).toBe(true);
  });

  it("detects WeChat HTML by mpvoice tag", () => {
    const html = '<mpvoice frameborder="0"></mpvoice>';
    expect(isWeChatHtml(html)).toBe(true);
  });

  it("returns false for normal HTML", () => {
    const html = "<p>Hello world</p><img src='https://example.com/img.jpg'>";
    expect(isWeChatHtml(html)).toBe(false);
  });
});

describe("extractWeChatImages", () => {
  it("extracts images from src attributes", () => {
    const html = `
      <img src="https://mmbiz.qpic.cn/mmbiz_jpg/abc/0?wx_fmt=jpeg" />
      <img src="https://mmbiz.qpic.cn/mmbiz_png/def/0?wx_fmt=png" />
    `;
    const images = extractWeChatImages(html);
    expect(images).toHaveLength(2);
    expect(images[0]).toContain("mmbiz.qpic.cn");
    expect(images[1]).toContain("mmbiz.qpic.cn");
  });

  it("extracts images from data-src attributes", () => {
    const html = `
      <img src="" data-src="https://mmbiz.qpic.cn/mmbiz_jpg/xyz/0?wx_fmt=jpeg" />
    `;
    const images = extractWeChatImages(html);
    expect(images).toHaveLength(1);
    expect(images[0]).toContain("mmbiz.qpic.cn");
  });

  it("deduplicates image URLs", () => {
    const html = `
      <img src="https://mmbiz.qpic.cn/mmbiz_jpg/same/0?wx_fmt=jpeg" />
      <img src="https://mmbiz.qpic.cn/mmbiz_jpg/same/0?wx_fmt=jpeg" />
    `;
    const images = extractWeChatImages(html);
    expect(images).toHaveLength(1);
  });

  it("decodes &amp; in URLs", () => {
    const html = '<img src="https://mmbiz.qpic.cn/img?a=1&amp;b=2">';
    const images = extractWeChatImages(html);
    expect(images[0]).toBe("https://mmbiz.qpic.cn/img?a=1&b=2");
  });

  it("returns empty array for non-WeChat HTML", () => {
    const html = '<img src="https://example.com/photo.jpg">';
    const images = extractWeChatImages(html);
    expect(images).toHaveLength(0);
  });
});

describe("cleanWeChatHtml", () => {
  it("removes <style> blocks", () => {
    const html = '<style>.foo { color: red; }</style><p>Hello</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("<style>");
    expect(result).toContain("<p>Hello</p>");
  });

  it("removes <script> blocks", () => {
    const html = '<script>alert("x")</script><p>Content</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("<script>");
    expect(result).toContain("Content");
  });

  it("removes WeChat-specific elements", () => {
    const html = '<mpvoice frameborder="0">audio</mpvoice><p>Text</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("mpvoice");
    expect(result).toContain("Text");
  });

  it("converts <section> to <div>", () => {
    const html = '<section class="foo"><p>Inside</p></section>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("<section");
    expect(result).not.toContain("</section>");
  });

  it("strips common inline styles", () => {
    const html = '<p style="font-family: Arial; font-size: 16px; color: red; text-align: center;">Text</p>';
    const result = cleanWeChatHtml(html);
    // font-family, font-size, color should be stripped; text-align should be kept
    expect(result).not.toContain("font-family");
    expect(result).not.toContain("font-size");
    expect(result).not.toContain("color:");
    expect(result).toContain("text-align");
  });

  it("strips mso- prefixed styles", () => {
    const html = '<p style="mso-line-height-rule: exactly; text-align: left;">Text</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("mso-");
    expect(result).toContain("text-align");
  });

  it("strips class and id attributes", () => {
    const html = '<p class="rich_media_content" id="js_content">Text</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("class=");
    expect(result).not.toContain("id=");
    expect(result).toContain("Text");
  });

  it("strips data-* attributes", () => {
    const html = '<p data-mpa-template="t" data-role="outer">Text</p>';
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("data-mpa");
    expect(result).not.toContain("data-role");
  });

  it("removes empty paragraphs", () => {
    const html = '<p></p><p>Content</p><p>  </p>';
    const result = cleanWeChatHtml(html);
    expect(result).toBe("<p>Content</p>");
  });

  it("downgrades h1 to h2", () => {
    const html = "<h1>Title</h1><p>Content</p>";
    const result = cleanWeChatHtml(html);
    expect(result).toContain("<h2>Title</h2>");
    expect(result).not.toContain("<h1>");
  });

  it("removes empty spans", () => {
    const html = "<p><span>Hello</span> world</p>";
    const result = cleanWeChatHtml(html);
    expect(result).toContain("Hello world");
    expect(result).not.toContain("<span");
  });

  it("handles complex WeChat HTML", () => {
    const html = `
      <style>.content { font-size: 14px; }</style>
      <section class="js_editor" data-mpa-template="t">
        <section style="font-family: Arial; color: #333;">
          <h1 style="font-size: 24px;">标题</h1>
          <p style="line-height: 2; letter-spacing: 1px;">内容段落</p>
          <img src="" data-src="https://mmbiz.qpic.cn/mmbiz_jpg/test/0?wx_fmt=jpeg" />
        </section>
      </section>
    `;
    const result = cleanWeChatHtml(html);
    expect(result).not.toContain("<style>");
    expect(result).not.toContain("<section");
    expect(result).not.toContain("font-family");
    expect(result).toContain("<h2>");
    expect(result).toContain("标题");
    expect(result).toContain("内容段落");
  });
});
