import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

/**
 * File-based blog. Each post is a Markdown file in `src/content/blog/`.
 * The filename (without `.md`) becomes the URL slug.
 *
 * Every file starts with a small frontmatter block:
 *
 *   ---
 *   title: My great post
 *   date: 2026-07-17
 *   excerpt: A one-line summary shown in the blog list.
 *   author: Les Mounas
 *   ---
 *
 *   Your **Markdown** content starts here…
 *
 * See src/content/blog/README.md for the full "how to add an article" guide.
 */

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
};

export type Post = PostMeta & { contentHtml: string };

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip optional surrounding quotes.
    value = value.replace(/^["']|["']$/g, '');
    if (key) data[key] = value;
  }
  return { data, body: match[2] };
}

function readPostFile(slug: string): { data: Record<string, string>; body: string } | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
}

function toMeta(slug: string, data: Record<string, string>): PostMeta {
  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    excerpt: data.excerpt || '',
    author: data.author || 'Les Mounas',
  };
}

/** All post slugs (used for static generation). */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    // Skip the authoring guide and any underscore-prefixed drafts.
    .filter((f) => f.toLowerCase() !== 'readme.md' && !f.startsWith('_'))
    .map((f) => f.replace(/\.md$/, ''));
}

/** Post metadata for every article, newest first. */
export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const parsed = readPostFile(slug);
      return parsed ? toMeta(slug, parsed.data) : null;
    })
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single rendered post, or null if the slug doesn't exist. */
export function getPost(slug: string): Post | null {
  const parsed = readPostFile(slug);
  if (!parsed) return null;
  const contentHtml = marked.parse(parsed.body, { async: false }) as string;
  return { ...toMeta(slug, parsed.data), contentHtml };
}

/** Human-friendly date, e.g. "17 juillet 2026". Falls back to the raw string. */
export function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
