import Link from 'next/link';
import { getTodayActivity } from '@/lib/airtable';
import { levelLabel } from '@/lib/levels';
import MysteryTiles, { letterCount } from '@/components/app/MysteryTiles';
import { themeEmoji } from '@/lib/themes';
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
            Prêts pour le mot du jour&nbsp;?
          </h1>
        </header>

        {todayActivity ? (
          <section
            aria-labelledby="today-word"
            className="overflow-hidden rounded-[28px] bg-white shadow-[0_14px_44px_-14px_rgba(91,31,140,0.35)] ring-1 ring-ink/5"
          >
            <div className="h-2 bg-gradient-to-r from-mred via-mamber to-mteal" />
            <Link href={`/app/activity?id=${todayActivity.id}`} className="block p-6 text-center sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mpurple">✨ Le mot mystère du jour</p>
              <h2 id="today-word" className="sr-only">
                Un mot mystère de {letterCount(todayActivity.frenchWord)} lettres à découvrir
              </h2>
              <MysteryTiles
                className="mx-auto mt-5 max-w-md"
                invite
                letters={Array.from(todayActivity.frenchWord).map((c) => ({ char: /[\s'’-]/.test(c) ? c : '?', color: '#1A1A1A' }))}
              />
              <p className="mt-5 font-display text-lg font-bold text-ink">
                {letterCount(todayActivity.frenchWord)} lettres… qui sera le plus rapide à le lire ?
              </p>
              <ul className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-bold">
                {todayActivity.theme && (
                  <li className="rounded-full bg-mteal-light px-3 py-1.5 text-[#115E59]">
                    {themeEmoji(todayActivity.theme)} {todayActivity.theme}
                  </li>
                )}
                {todayActivity.difficulty && (
                  <li className="rounded-full bg-sand px-3 py-1.5 text-ink">{levelLabel(todayActivity.difficulty)}</li>
                )}
                <li className="rounded-full bg-sand px-3 py-1.5 text-ink">⏱ 10 min</li>
              </ul>
              <span className="mt-7 flex min-h-14 items-center justify-center rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg transition-transform hover:bg-mred-dark active:scale-[0.98]">
                Découvrir le mot <span aria-hidden="true" className="ml-2">→</span>
              </span>
            </Link>
          </section>
        ) : (
          <section className="rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
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

        <div className="mt-5">
          <WeekProgress />
        </div>

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

        <h2 className="mb-3 mt-8 font-display text-xl font-bold text-ink">Encore plus</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/app/dictee"
            className="group flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5 transition-colors hover:bg-sand"
          >
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-mteal-light text-2xl" aria-hidden="true">
              📒
            </span>
            <span className="flex-1">
              <span className="block font-extrabold text-ink">Mon cahier de dictée</span>
              <span className="block text-sm text-ink-soft">Écrire avec le doigt, sur papier Seyès</span>
            </span>
            <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-ink/10 p-4" aria-label="Mes dessins prennent vie : bientôt disponible">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sand text-2xl opacity-70" aria-hidden="true">
              🎨
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-extrabold text-ink/70">
                Mes dessins prennent vie
                <span className="rounded-full bg-mpurple px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-cream">Bientôt</span>
              </span>
              <span className="block text-sm text-ink-soft">Le dessin de ton enfant devient un personnage animé</span>
            </span>
          </div>
        </div>

        <details className="group mt-8 rounded-3xl bg-white p-4 ring-1 ring-ink/5">
          <summary className="flex cursor-pointer list-none items-center gap-3 font-extrabold text-ink">
            <span aria-hidden="true" className="text-2xl">📲</span>
            <span className="flex-1">Mettre l’app sur l’écran de ton téléphone</span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">iPhone (Safari) :</strong> touche le bouton Partager <span aria-hidden="true">⬆️</span>, puis
              « Sur l’écran d’accueil ».
            </p>
            <p>
              <strong className="text-ink">Android (Chrome) :</strong> touche le menu <span aria-hidden="true">⋮</span>, puis « Ajouter à
              l’écran d’accueil » ou « Installer l’application ».
            </p>
            <p>L’icône Les Mounas apparaît alors avec tes autres applis, et l’app s’ouvre en plein écran.</p>
          </div>
        </details>
      </div>
    </main>
  );
}
