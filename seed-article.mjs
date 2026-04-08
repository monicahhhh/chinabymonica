/**
 * One-time migration script: seed the existing hardcoded Will Wang article into the database.
 * Converts the structured ContentBlock[] format into HTML for storage.
 * Run with: node seed-article.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

function blocksToHtml(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<h2>${escHtml(block.text)}</h2>`;
      case 'subheading':
        return `<h3>${escHtml(block.text)}</h3>`;
      case 'speaker':
        return `<p class="speaker"><strong>${escHtml(block.text)}</strong></p>`;
      case 'intro':
        return `<blockquote>${escHtml(block.text)}</blockquote>`;
      case 'paragraph':
      default:
        return `<p>${escHtml(block.text)}</p>`;
    }
  }).join('\n');
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The article data — extracted from client/src/lib/articles.ts
const article = {
  slug: 'will-wang-tianfan-solo-companies',
  category: 'global-growth',
  titleEN: 'Dialogue with BAI Capital Partner Will Wang: The Rise of Solo Companies and the Restructuring of VC Logic',
  titleZH: '对话 BAI 资本合伙人汪天凡：一人公司崛起与创投逻辑的重构',
  subtitleEN: 'BAI Capital Partner Will Wang shares insights on AI investment across four categories — media disruption, AI rollup, China advantage, and super human — and why the rise of solo companies is reshaping venture capital.',
  subtitleZH: 'BAI 资本合伙人汪天凡分享 AI 投资四大方向——媒体颠覆、AI 改造、中国优势、超级个体，以及一人公司崛起如何重塑创投逻辑。',
  author: 'Monica Wang',
  published: true,
  featured: true,
  sortOrder: 0,
  publishedAt: new Date('2025-07-19'),
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Read the articles.ts file to get content blocks
  const fs = await import('fs');
  const path = await import('path');
  const articlesFile = fs.readFileSync(
    path.join(process.cwd(), 'client/src/lib/articles.ts'),
    'utf-8'
  );

  // Extract contentEN and contentZH arrays using regex
  const contentENMatch = articlesFile.match(/contentEN:\s*\[([\s\S]*?)\],\s*contentZH:/);
  const contentZHMatch = articlesFile.match(/contentZH:\s*\[([\s\S]*?)\],\s*\},\s*\];/);

  if (!contentENMatch || !contentZHMatch) {
    console.error('Could not extract content blocks from articles.ts');
    // Fallback: use a simpler approach — just read the file and eval the content
    console.log('Trying alternative approach...');
  }

  // Alternative: dynamically parse the blocks
  // We'll use a simpler approach — read the file, find the article object, and extract blocks
  const parseBlocks = (text) => {
    const blocks = [];
    const blockRegex = /\{\s*type:\s*"(\w+)",\s*text:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      blocks.push({
        type: match[1],
        text: match[2]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\')
      });
    }
    return blocks;
  };

  // Split the file to get EN and ZH content sections
  const enSection = articlesFile.substring(
    articlesFile.indexOf('contentEN: ['),
    articlesFile.indexOf('],\n    contentZH:')
  );
  const zhSection = articlesFile.substring(
    articlesFile.indexOf('contentZH: ['),
    articlesFile.lastIndexOf('],\n  },\n];')
  );

  const blocksEN = parseBlocks(enSection);
  const blocksZH = parseBlocks(zhSection);

  console.log(`Parsed ${blocksEN.length} EN blocks, ${blocksZH.length} ZH blocks`);

  if (blocksEN.length === 0 || blocksZH.length === 0) {
    console.error('Failed to parse content blocks');
    process.exit(1);
  }

  const contentEN = blocksToHtml(blocksEN);
  const contentZH = blocksToHtml(blocksZH);

  // Connect to database
  const connection = await mysql.createConnection(url);

  // Check if article already exists
  const [existing] = await connection.execute(
    'SELECT id FROM articles WHERE slug = ?',
    [article.slug]
  );

  if (existing.length > 0) {
    console.log('Article already exists in database, updating...');
    await connection.execute(
      `UPDATE articles SET 
        category = ?, titleEN = ?, titleZH = ?, subtitleEN = ?, subtitleZH = ?,
        contentEN = ?, contentZH = ?, author = ?, published = ?, featured = ?,
        sortOrder = ?, publishedAt = ?
      WHERE slug = ?`,
      [
        article.category, article.titleEN, article.titleZH,
        article.subtitleEN, article.subtitleZH,
        contentEN, contentZH,
        article.author, article.published, article.featured,
        article.sortOrder, article.publishedAt,
        article.slug
      ]
    );
    console.log('Article updated successfully!');
  } else {
    await connection.execute(
      `INSERT INTO articles (slug, category, titleEN, titleZH, subtitleEN, subtitleZH, contentEN, contentZH, author, published, featured, sortOrder, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.slug, article.category, article.titleEN, article.titleZH,
        article.subtitleEN, article.subtitleZH,
        contentEN, contentZH,
        article.author, article.published, article.featured,
        article.sortOrder, article.publishedAt
      ]
    );
    console.log('Article inserted successfully!');
  }

  await connection.end();
  console.log('Migration complete!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
