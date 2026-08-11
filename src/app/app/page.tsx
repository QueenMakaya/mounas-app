import Image from 'next/image';
import Link from 'next/link';
import { getTodayActivity } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const todayActivity = await getTodayActivity();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: '#FDF6EC', fontFamily: 'var(--font-nunito)' }}
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* A. HEADER */}
        <header className="text-center mb-10">
          <Image
            src="/logo-mounas.png"
            alt="Les Mounas"
            width={400}
            height={400}
            priority
            className="mx-auto mb-8 w-[200px] h-auto"
            style={{ mixBlendMode: 'multiply' }}
          />
          <p
            className="text-xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
          >
            Apprendre en s&apos;amusant
          </p>
          <p
            className="text-sm italic mb-12"
            style={{ color: 'rgba(26,26,26,0.6)' }}
          >
            Famille + culture afro
          </p>
        </header>

        {todayActivity ? (
          <>
            {/* B. CARTE SUGGESTION DU JOUR */}
            <section
              className="max-w-md mx-auto rounded-3xl p-8 text-center shadow-lg"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(26,26,26,0.1)',
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-4 font-bold"
                style={{ color: 'rgba(26,26,26,0.6)' }}
              >
                Aujourd&apos;hui on apprend
              </p>
              <h1
                className="text-7xl font-bold leading-none mb-3"
                style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
              >
                {todayActivity.frenchWord}
              </h1>
              <p
                className="text-xl italic mb-3"
                style={{ color: '#5B1F8C' }}
              >
                {todayActivity.pronunciation}
              </p>
              <span
                className="inline-block rounded-full px-4 py-1 text-sm mb-6"
                style={{ backgroundColor: '#CCFBF1', color: '#115E59' }}
              >
                {todayActivity.theme} · Niveau {todayActivity.difficulty}
              </span>
              <div className="flex justify-center">
                <Link
                  href="/app/activity"
                  className="rounded-full py-4 px-8 text-lg font-bold shadow-md transition-colors duration-200 bg-[#E63946] hover:bg-red-700"
                  style={{ color: '#FDF6EC' }}
                >
                  Faire cette activité →
                </Link>
              </div>
            </section>

            {/* C. SÉPARATEUR */}
            <div className="my-10 flex items-center justify-center max-w-md mx-auto">
              <div
                className="flex-1 border-t"
                style={{ borderColor: 'rgba(26,26,26,0.15)' }}
              />
              <span
                className="px-4 italic"
                style={{ color: 'rgba(26,26,26,0.5)' }}
              >
                ou
              </span>
              <div
                className="flex-1 border-t"
                style={{ borderColor: 'rgba(26,26,26,0.15)' }}
              />
            </div>

            {/* D. CARTE SÉLECTEUR */}
            <section
              className="max-w-md mx-auto rounded-3xl p-6 text-center"
              style={{
                backgroundColor: '#FDF6EC',
                border: '2px dashed #F4A340',
              }}
            >
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
              >
                Choisir un autre mot
              </h2>
              <p
                className="text-sm mb-5"
                style={{ color: 'rgba(26,26,26,0.6)' }}
              >
                Filtre par thème et difficulté
              </p>
              <div className="flex justify-center">
                <Link
                  href="/app/select"
                  className="rounded-full py-3 px-6 font-bold shadow-sm transition-colors duration-200 bg-[#F4A340] hover:bg-yellow-500"
                  style={{ color: '#1A1A1A' }}
                >
                  🎲 Choisir un mot →
                </Link>
              </div>
            </section>
          </>
        ) : (
          /* E. CAS EDGE — Aucune activité disponible */
          <section
            className="max-w-md mx-auto rounded-3xl p-8 text-center"
            style={{
              backgroundColor: '#FDF6EC',
              border: '2px dashed #F4A340',
            }}
          >
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
            >
              Choisis un mot pour commencer
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'rgba(26,26,26,0.6)' }}
            >
              Filtre par thème et difficulté
            </p>
            <div className="flex justify-center">
              <Link
                href="/app/select"
                className="rounded-full py-4 px-8 text-lg font-bold shadow-md transition-colors duration-200 bg-[#F4A340] hover:bg-yellow-500"
                style={{ color: '#1A1A1A' }}
              >
                🎲 Choisir un mot →
              </Link>
            </div>
          </section>
        )}

        {/* F. FOOTER */}
        <footer className="mt-16 text-center">
          <p
            className="text-xs"
            style={{ color: 'rgba(26,26,26,0.4)' }}
          >
            Les Mounas · 2025
          </p>
        </footer>
      </div>
    </main>
  );
}
