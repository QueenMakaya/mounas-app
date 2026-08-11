import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import { getAllPosts, formatDate } from '@/lib/blog';
import { COLORS } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Blog — Les Mounas',
  description:
    'Idées, astuces et inspirations pour transmettre le français à tes enfants, au quotidien.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <DiamondIcon size={20} />
          <h1
            className="mt-3 text-4xl font-bold sm:text-5xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Le blog
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.7)' }}>
            Des idées simples pour faire vivre le français à la maison.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-5">
          {posts.length === 0 ? (
            <p className="text-center italic" style={{ color: 'rgba(26,26,26,0.6)' }}>
              Les premiers articles arrivent bientôt !
            </p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-3xl p-6 transition-shadow hover:shadow-md sm:p-8"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.amber }}>
                  {formatDate(post.date)}
                </p>
                <h2
                  className="mt-2 text-2xl font-bold"
                  style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
                >
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 inline-block text-sm font-semibold" style={{ color: COLORS.purple }}>
                  Lire l&apos;article →
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
