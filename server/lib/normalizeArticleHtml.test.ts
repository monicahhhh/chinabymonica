import { describe, it, expect } from "vitest";
import { normalizeArticleHtml } from "./normalizeArticleHtml";

describe("normalizeArticleHtml", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeArticleHtml("")).toBe("");
    expect(normalizeArticleHtml("   ")).toBe("");
  });

  it("strips inline font-family and font-size styles", () => {
    const input = '<p style="font-family: Arial; font-size: 14px;">Hello</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("font-family");
    expect(result).not.toContain("font-size");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips inline color and background styles", () => {
    const input = '<p style="color: red; background-color: #fff;">Text</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("color:");
    expect(result).not.toContain("background-color");
    expect(result).toContain("<p>Text</p>");
  });

  it("preserves non-conflicting styles like text-align", () => {
    const input = '<p style="text-align: center; font-size: 16px;">Centered</p>';
    const result = normalizeArticleHtml(input);
    expect(result).toContain("text-align: center");
    expect(result).not.toContain("font-size");
  });

  it("strips class and id attributes", () => {
    const input = '<p class="MsoNormal" id="p1">Content</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("class=");
    expect(result).not.toContain("id=");
    expect(result).toContain("<p>Content</p>");
  });

  it("strips data-* attributes", () => {
    const input = '<p data-pm-slice="1 1 []">Content</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("data-");
    expect(result).toContain("<p>Content</p>");
  });

  it("downgrades H1 to H2", () => {
    const input = "<h1>Big Title</h1>";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("<h2>Big Title</h2>");
  });

  it("removes empty paragraphs", () => {
    const input = "<p>Hello</p><p></p><p>World</p>";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("<p>Hello</p><p>World</p>");
  });

  it("removes empty paragraphs with just <br>", () => {
    const input = "<p>Hello</p><p><br></p><p>World</p>";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("<p>Hello</p><p>World</p>");
  });

  it("reduces excessive <br> tags", () => {
    const input = "Hello<br><br><br><br><br>World";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("Hello<br><br>World");
  });

  it("removes Word artifacts like <o:p>", () => {
    const input = '<p>Text<o:p>&nbsp;</o:p></p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("o:p");
    expect(result).toContain("Text");
  });

  it("removes <style> blocks from pasted content", () => {
    const input = '<style>.cls { color: red; }</style><p>Content</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("<style>");
    expect(result).toContain("<p>Content</p>");
  });

  it("removes mso-* style properties", () => {
    const input = '<p style="mso-line-height-rule: exactly; text-align: left;">Text</p>';
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("mso-");
    expect(result).toContain("text-align: left");
  });

  it("unwraps empty <span> tags", () => {
    const input = "<p><span>Hello World</span></p>";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("<p>Hello World</p>");
  });

  it("converts bare <div> to <p>", () => {
    const input = "<div>Simple text</div>";
    const result = normalizeArticleHtml(input);
    expect(result).toBe("<p>Simple text</p>");
  });

  it("does not double-wrap <div> containing block elements", () => {
    const input = "<div><p>Already a paragraph</p></div>";
    const result = normalizeArticleHtml(input);
    expect(result).toContain("<p>Already a paragraph</p>");
    // Should not have <p><p>
    expect(result).not.toContain("<p><p>");
  });

  it("handles complex real-world pasted content", () => {
    const input = `
      <meta charset="utf-8">
      <p style="font-family: 'Microsoft YaHei'; font-size: 16px; color: #333; line-height: 2; margin-bottom: 20px;" class="MsoNormal" data-pm-slice="1 1 []">
        <span style="font-size: 14px;">这是一段从微信公众号粘贴的文章内容。</span>
      </p>
      <h1 style="font-family: SimHei; font-size: 24px;">大标题</h1>
    `;
    const result = normalizeArticleHtml(input);
    expect(result).not.toContain("font-family");
    expect(result).not.toContain("font-size");
    expect(result).not.toContain("class=");
    expect(result).not.toContain("<meta");
    expect(result).not.toContain("<h1");
    expect(result).toContain("<h2");
    expect(result).toContain("这是一段从微信公众号粘贴的文章内容。");
    expect(result).toContain("大标题");
  });

  it("preserves valid HTML structure", () => {
    const input = `
      <h2>Section Title</h2>
      <p>First paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <blockquote><p>A quoted statement.</p></blockquote>
      <ul><li>Item 1</li><li>Item 2</li></ul>
    `;
    const result = normalizeArticleHtml(input);
    expect(result).toContain("<h2>Section Title</h2>");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>Item 1</li>");
  });
});
