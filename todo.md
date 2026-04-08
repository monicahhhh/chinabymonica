# Route Restructuring: /cn for Chinese

- [x] Update App.tsx: add /cn routes for all Chinese pages
- [x] Update LanguageContext: auto-detect language from URL path
- [x] Update Navbar: change 中文 button to link to /cn, English button to /
- [x] Update all internal links to be language-aware (prefix /cn for Chinese)
- [x] Update Footer links to be language-aware
- [x] Test all pages in both languages
- [x] Save checkpoint

# Full-Stack CMS Upgrade

- [x] Resolve upgrade conflicts (Home.tsx, NotFound.tsx keep existing code)
- [x] Create articles database table in drizzle/schema.ts
- [x] Run pnpm db:push to sync database schema
- [x] Create article CRUD API endpoints in server/routers.ts
- [x] Build admin panel UI for article management (create/edit/delete)
- [x] Update Insights page to read articles from database
- [x] Update ArticleDetail page to read from database
- [x] Migrate existing hardcoded article to database
- [x] Write vitest tests for article API

# Bug Fix

- [x] Fix admin panel - user logged in but cannot see article management buttons (verified: admin role correctly assigned in DB, login redirect to /admin/articles implemented)

# Rich Text Editor & Cover Image Upload

- [x] Install TipTap dependencies
- [x] Create TipTap rich text editor component with toolbar
- [x] Create server-side image upload endpoint (S3)
- [x] Add cover image upload UI to article form
- [x] Replace textarea with TipTap editor in AdminArticles
- [x] Test full flow (create/edit article with rich text and cover image)
- [x] Write vitest tests for image upload endpoint
- [x] Add vitest positive-path test for upload.image (mock storagePut)
- [x] End-to-end browser test: create article with rich text + cover image

# Article Auto-Formatting

- [x] Add comprehensive .article-content CSS styles matching editorial design (fonts, headings, paragraphs, blockquotes, links, images)
- [x] Add Chinese-specific article typography styles
- [x] Add HTML content normalization on save (clean up pasted HTML, ensure consistent structure)
- [x] Add auto-format via server-side normalization on article create/update

# Admin Login Flow Fix

- [x] Fix OAuth callback to redirect back to original page (e.g., /admin/articles) instead of always redirecting to /
- [x] Update getLoginUrl to accept and pass returnPath parameter

# Editor Preview Button

- [x] Add "预览" (Preview) button in the article editor form
- [x] Create ArticlePreview modal/dialog showing final rendered article with .article-content styles
- [x] Support previewing both Chinese and English content side by side or tab-switchable

# WeChat Article Paste Import

- [x] Add paste handler in RichTextEditor to detect and clean WeChat article HTML
- [x] Extract and re-upload WeChat images (mmbiz.qpic.cn) to S3 to avoid hotlink issues
- [x] Strip WeChat-specific inline styles, section wrappers, and formatting artifacts
- [x] Add auto-detect on paste for WeChat content with image re-hosting

# Draft Auto-Save

- [x] Store article draft data in localStorage with article ID or "new" key
- [x] Auto-save every 30 seconds when form has unsaved changes
- [x] Show auto-save status indicator (e.g., "已自动保存" / "未保存更改")
- [x] Prompt to restore draft when opening editor if a saved draft exists
- [x] Clear draft from localStorage after successful save to server

# Auto-Translate Chinese/English

- [x] Create server-side tRPC procedure for article translation using LLM
- [x] Add "自动翻译" (Auto Translate) buttons next to each content editor (ZH→EN and EN→ZH)
- [x] Show loading state during translation and allow editing after translation completes
- [x] Preserve HTML structure and formatting during translation

# Bug Fix - Save Article Not Working

- [x] Fix article save button not working - fixed async submit handling: handleSubmit now awaits onSubmit and only clears draft on success; handleCreate/handleUpdate return boolean for success/failure

# Database & Upload Limits Upgrade

- [x] Upgrade contentZH, contentEN columns from TEXT to MEDIUMTEXT (16MB max)
- [x] Increase cover image upload limit from 5MB to 10MB

# Homepage Insights Section - Dynamic Articles

- [x] Replace hardcoded Insights & Analysis section on EN homepage with real articles from DB
- [x] Add Insights & Analysis section to CN homepage (洞察与分析)
- [x] Show latest 3 published articles with cover image, category, title, and date
- [x] Link each article card to its detail page
