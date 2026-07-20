# How to add a blog article

Each article is a single Markdown file in this folder (`src/content/blog/`).

## Steps

1. **Create a new file** here named after the URL you want, ending in `.md`.
   Example: `apprendre-les-couleurs.md` → published at `/blog/apprendre-les-couleurs`.
   Use only lowercase letters, numbers and dashes (no spaces or accents) in the filename.

2. **Start the file with a frontmatter block** between two `---` lines:

   ```markdown
   ---
   title: Apprendre les couleurs en s'amusant
   date: 2026-08-01
   excerpt: Une phrase courte qui s'affiche dans la liste des articles.
   author: Les Mounas
   ---

   Le contenu de ton article commence ici, en **Markdown**.
   ```

   - `title` — the headline shown on the page and in the list.
   - `date` — `YYYY-MM-DD`. Posts are sorted newest-first by this date.
   - `excerpt` — one-line summary for the blog index.
   - `author` — optional; defaults to "Les Mounas".

3. **Write the body in Markdown** below the frontmatter: `##` for headings,
   `**bold**`, `*italic*`, `- ` for lists, `> ` for quotes, and
   `[text](https://…)` for links.

4. **Save the file, commit, and push.** The new article appears automatically —
   no code changes needed. (In local dev, run `npm run dev` and it hot-reloads.)

That's it. This `README.md` file is ignored by the blog (only `.md` files with a
frontmatter `title` become articles, and README has none of the routing wiring),
so it won't show up as a post.
