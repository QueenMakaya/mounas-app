'use client';

import { verbInfo } from '@/lib/verbs';

type Props = {
  word: string;
  /** Airtable « Nature » column (Verbe, Nom…), empty when not filled in. */
  nature: string;
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
};

/**
 * When the word of the day is a verb (danser): a small reminder of what a
 * verb is next to a noun of the same family (la danse), then the one form a
 * young child uses every day: « je danse ». An introduction to conjugation,
 * nothing more.
 */
export default function VerbReminder({ word, nature, canSpeak, speak }: Props) {
  const verb = verbInfo(word, nature);
  if (!verb) return null;
  const say = (text: string) => canSpeak && speak(text, 0.8);

  return (
    <aside className="animate-rise mt-4 rounded-3xl bg-[#F1E9F8] p-4 text-left ring-1 ring-mpurple/10 sm:p-5" aria-labelledby="verb-title">
      <p id="verb-title" className="text-xs font-extrabold uppercase tracking-widest text-mpurple">
        🏃 C’est un verbe !
      </p>
      <p className="mt-2 leading-relaxed text-ink">
        <strong className="uppercase">{verb.infinitive}</strong>, c’est un <strong>verbe</strong> : il dit ce qu’on <strong>fait</strong>, une action.
        {verb.noun && (
          <>
            {' '}Un <strong>nom</strong>, lui, dit ce qu’on <strong>voit</strong> ou ce qu’on <strong>a</strong> : une chose, un animal, une personne.
          </>
        )}
      </p>

      <div className={`mt-3 grid gap-2 ${verb.noun ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={() => say(verb.infinitive)}
          className="rounded-2xl bg-white p-3 text-center ring-1 ring-ink/10 active:scale-95"
        >
          <span className="block text-[11px] font-extrabold uppercase tracking-widest text-ink-soft">Le verbe · on le fait</span>
          <span className="mt-1 block font-display text-2xl font-bold text-mpurple">{verb.infinitive}</span>
        </button>
        {verb.noun && (
          <button
            type="button"
            onClick={() => say(verb.noun!)}
            className="rounded-2xl bg-white p-3 text-center ring-1 ring-ink/10 active:scale-95"
          >
            <span className="block text-[11px] font-extrabold uppercase tracking-widest text-ink-soft">Le nom · une chose</span>
            <span className="mt-1 block font-display text-2xl font-bold text-ink">{verb.noun}</span>
          </button>
        )}
      </div>

      {verb.je && (
        <div className="mt-3 rounded-2xl bg-white p-3 text-center ring-1 ring-ink/10">
          <p className="text-sm font-bold text-ink-soft">Quand c’est moi qui le fais, je dis :</p>
          <button
            type="button"
            onClick={() => say(verb.je!)}
            className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 font-display text-3xl font-bold text-mred active:scale-95"
          >
            {verb.je} <span aria-hidden="true" className="text-xl">🔈</span>
          </button>
          <p className="mt-1 text-sm text-ink-soft">
            Le verbe change un peu quand quelqu’un fait l’action : <strong>{verb.infinitive}</strong> → <strong>{verb.je}</strong>.
            C’est la <strong>conjugaison</strong>.
          </p>
        </div>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink">
        <span aria-hidden="true">💡 </span>
        <strong>Astuce parent · </strong>
        Mimez l’action ensemble et dites-la bien fort{verb.je ? ` : « ${verb.je} ! »` : ''}. Pas besoin d’aller plus loin pour l’instant.
      </p>
    </aside>
  );
}
