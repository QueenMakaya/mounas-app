import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, getPostSlugs, formatDate } from '@/lib/blog';
import { COLORS } from '@/lib/config';

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Article introuvable — Les Mounas' };
  return {
    title: `${post.title} — Les Mounas`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) notFound();

  return (
    <main className="px-4 py-16 sm:px-6">
      <article className="mx-auto max-w-2xl">
        <Link href="/blog" className="text-sm font-semibold" style={{ color: COLORS.purple }}>
          ← Tous les articles
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.amber }}>
            {formatDate(post.date)} · {post.author}
          </p>
          <h1
            className="mt-3 text-4xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            {post.title}
          </h1>
        </header>

        <div
          className="blog-content mt-8"
          style={{ color: 'rgba(26,26,26,0.85)' }}
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <footer className="mt-12 border-t pt-6" style={{ borderColor: 'rgba(26,26,26,0.1)' }}>
          <Link href="/blog" className="text-sm font-semibold" style={{ color: COLORS.purple }}>
            ← Retour au blog
          </Link>
        </footer>
      </article>
    </main>
  );
}
