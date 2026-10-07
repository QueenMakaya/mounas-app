import Link from 'next/link';
import { getTodayActivity } from '@/lib/airtable';
import { levelLabel } from '@/lib/levels';
import SyllableWord from '@/components/app/SyllableWord';
import SpeakButton from '@/components/app/SpeakButton';
import WeekProgress from '@/components/app/WeekProgress';

export const dynamic = 'force-dynamic';

const HOW_IT_WORKS = [
  { emoji: '👀', text: 'On découvre le mot' },
  { emoji: '👏', text: 'On joue avec les sons' },
  { emoji: '🎵', text: 'On bouge et on chante' },
];

export default async function HomePage() {
  const todayActivity = await getTodayActivity();

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-6">
          <p className="text-sm font-bold text-ink-soft">Bonjour 👋</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Le mot du jour, en 10&nbsp;minutes
          </h1>
        </header>

        <WeekProgress />

        {todayActivity ? (
          <section
            aria-labelledby="today-word"
            className="mt-5 overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-12px_rgba(26,26,26,0.2)] ring-1 ring-ink/5"
          >
            <div className="h-2 bg-gradient-to-r from-mred via-mamber to-mteal" />
            <div className="p-6 text-center sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mred">Aujourd’hui on apprend</p>
              <h2 id="today-word" className="mt-4 break-words font-display text-6xl font-bold leading-none sm:text-7xl">
                <SyllableWord word={todayActivity.frenchWord} syllables={todayActivity.syllables} />
              </h2>
              {todayActivity.pronunciation && (
                <p className="mt-3 text-lg italic text-mpurple">{todayActivity.pronunciation}</p>
              )}
              <div className="mt-4 flex justify-center">
                <SpeakButton text={todayActivity.frenchWord} tone="soft" />
              </div>
              <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-bold">
                {todayActivity.theme && (
                  <li className="rounded-full bg-mteal-light px-3 py-1.5 text-[#115E59]">{todayActivity.theme}</li>
                )}
                {todayActivity.difficulty && (
                  <li className="rounded-full bg-sand px-3 py-1.5 text-ink">{levelLabel(todayActivity.difficulty)}</li>
                )}
                <li className="rounded-full bg-sand px-3 py-1.5 text-ink">⏱ 10 min</li>
              </ul>
              <Link
                href={`/app/activity?id=${todayActivity.id}`}
                className="mt-7 flex min-h-14 items-center justify-center rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg transition-transform hover:bg-mred-dark active:scale-[0.98]"
              >
                Commencer avec mon enfant <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
            <p className="text-5xl" aria-hidden="true">🌙</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink">Pas de mot prévu aujourd’hui</h2>
            <p className="mt-2 text-ink-soft">Pioche un mot parmi tous ceux déjà prêts.</p>
            <Link
              href="/app/select"
              className="mt-6 flex min-h-14 items-center justify-center rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg hover:bg-mred-dark"
            >
              🎲 Choisir un mot
            </Link>
          </section>
        )}

        <ol className="mt-6 grid grid-cols-3 gap-2 text-center">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.text} className="rounded-2xl px-2 py-3">
              <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
              <p className="mt-1 text-xs font-bold leading-snug text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

        {todayActivity && (
          <Link
            href="/app/select"
            className="group mt-4 flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5 transition-colors hover:bg-sand"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-mamber text-2xl" aria-hidden="true">
              🎲
            </span>
            <span className="flex-1">
              <span className="block font-extrabold text-ink">Envie d’un autre mot ?</span>
              <span className="block text-sm text-ink-soft">Choisis par niveau et par thème</span>
            </span>
            <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">→</span>
          </Link>
        )}
      </div>
    </main>
  );
}
