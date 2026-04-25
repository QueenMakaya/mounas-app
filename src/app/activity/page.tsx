import { getTodayActivity } from '@/lib/airtable';
import CompleteButton from '@/components/CompleteButton';

export const dynamic = 'force-dynamic';

const DAY_NUMBER: Record<string, number> = {
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
  Dimanche: 7,
};

export default async function ActivityPage() {
  const activity = await getTodayActivity();

  if (!activity) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#FDF6EC', fontFamily: 'var(--font-nunito)' }}
      >
        <p className="text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Aucune activité aujourd'hui.
        </p>
        <p style={{ color: '#888' }}>Reviens demain — les Mounas seront là !</p>
        <a href="/" className="mt-8 text-sm underline" style={{ color: '#5B1F8C' }}>
          ← Retour à l'accueil
        </a>
      </main>
    );
  }

  const dayNumber = DAY_NUMBER[activity.day] ?? '—';
  const steps = activity.activitySteps
    ? activity.activitySteps.split('\n').filter((s) => s.trim())
    : [];
  const letters = activity.frenchWord.split('');
  const syllabes = activity.syllables ? activity.syllables.split('-') : [];

  return (
    <main
      className="min-h-screen px-4 sm:px-6 py-8 max-w-2xl mx-auto"
      style={{ backgroundColor: '#FDF6EC', fontFamily: 'var(--font-nunito)' }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <a href="/" className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
          ← Retour
        </a>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: '#F4A340', color: '#1A1A1A' }}
        >
          S{activity.week} · Jour {dayNumber} / 7
        </span>
      </div>

      {/* MOT DU JOUR */}
      <div className="text-center mb-12">
        <h1
          className="text-7xl font-bold leading-none mb-3"
          style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
        >
          {activity.frenchWord}
        </h1>
        <p className="text-xl italic mb-4" style={{ color: '#5B1F8C' }}>
          {activity.pronunciation}
        </p>
        <span
          className="inline-block px-4 py-1 rounded-full border text-sm mb-3"
          style={{ borderColor: '#1A1A1A22', color: '#1A1A1A', backgroundColor: '#FDF6EC' }}
        >
          {activity.syllables}
        </span>
        <p className="text-xs uppercase tracking-widest mt-2" style={{ color: '#888' }}>
          {activity.theme}
        </p>
      </div>

      {/* ── ÉTAPES 1–4 ── */}
      <div className="flex flex-col gap-6 mt-12">

        {/* ÉTAPE 1 — DÉCOUVERTE */}
        <section className="rounded-3xl p-6" style={{ backgroundColor: '#E63946' }}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#FDF6EC', opacity: 0.85 }}
          >
            ✨ ÉTAPE 1 · DÉCOUVERTE · 1 min
          </p>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#FDF6EC', fontFamily: 'var(--font-fraunces)' }}
          >
            On découvre un nouveau mot
          </h2>
          <div className="text-center mb-6">
            <span
              className="text-8xl font-bold leading-none"
              style={{ color: '#FDF6EC', fontFamily: 'var(--font-fraunces)' }}
            >
              {activity.frenchWord}
            </span>
          </div>
          <p className="text-base italic" style={{ color: '#FDF6EC', opacity: 0.9 }}>
            Aujourd'hui, montre ce mot à ton enfant. Pointe-le, dis-le avec joie.
          </p>
        </section>

        {/* ÉTAPE 2 — LIRE */}
        <section className="rounded-3xl p-6" style={{ backgroundColor: '#F4A340' }}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#1A1A1A', opacity: 0.7 }}
          >
            📖 ÉTAPE 2 · LIRE LE MOT · 1 min
          </p>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#1A1A1A', fontFamily: 'var(--font-fraunces)' }}
          >
            On essaie de lire ensemble
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {letters.map((letter, i) => (
              <span
                key={i}
                className="text-5xl font-bold"
                style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
              >
                {letter}
              </span>
            ))}
          </div>
          <p className="text-base mb-3" style={{ color: '#1A1A1A' }}>
            Glisse ton doigt sous chaque lettre. Lis lentement avec ton enfant.
          </p>
          <p className="text-sm italic" style={{ color: '#1A1A1A', opacity: 0.65 }}>
            💡 Pour les tout-petits, contente-toi de pointer. Pour les plus grands, encourage-les à essayer.
          </p>
        </section>

        {/* ÉTAPE 3 — SYLLABES */}
        <section className="rounded-3xl p-6" style={{ backgroundColor: '#2EC4B6' }}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#1A1A1A', opacity: 0.7 }}
          >
            🔢 ÉTAPE 3 · COMPTER LES SYLLABES · 1 min
          </p>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#1A1A1A', fontFamily: 'var(--font-fraunces)' }}
          >
            On compte les syllabes !
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {syllabes.map((syl, i) => (
              <div
                key={i}
                className="rounded-2xl px-5 py-4 flex flex-col items-center gap-2 min-w-[80px]"
                style={{ backgroundColor: '#FDF6EC' }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#1A8C83', color: '#FDF6EC' }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
                >
                  {syl}
                </span>
              </div>
            ))}
          </div>
          <p className="text-2xl font-bold text-center mb-4" style={{ color: '#1A1A1A' }}>
            {activity.syllablesCount} syllabe{activity.syllablesCount > 1 ? 's' : ''}
          </p>
          <p className="text-base" style={{ color: '#1A1A1A' }}>
            Tape dans tes mains pour chaque syllabe avec ton enfant ! Comptez ensemble : un, deux…
          </p>
        </section>

        {/* ÉTAPE 4 — PHONÉTIQUE */}
        <section className="rounded-3xl p-6" style={{ backgroundColor: '#5B1F8C' }}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#FDF6EC', opacity: 0.7 }}
          >
            🔊 ÉTAPE 4 · LA PHONÉTIQUE · 1 min
          </p>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#FDF6EC', fontFamily: 'var(--font-fraunces)' }}
          >
            Comment ça se prononce
          </h2>
          <p
            className="text-5xl italic text-center mb-6"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#FDF6EC', opacity: 0.9 }}
          >
            {activity.pronunciation}
          </p>
          <p className="text-base mb-5" style={{ color: '#FDF6EC' }}>
            Dis-le 3 fois avec ton enfant :{' '}
            <strong>{activity.frenchWord}</strong>,{' '}
            <strong>{activity.frenchWord}</strong>,{' '}
            <strong>{activity.frenchWord}</strong> !
          </p>
          <p className="text-sm italic" style={{ color: '#FDF6EC', opacity: 0.55 }}>
            🎵 Bientôt : un bouton pour écouter la prononciation
          </p>
        </section>

      </div>

      {/* ── SECTIONS CONSERVÉES — Phase 3 les remplacera ── */}

      {/* PRATIQUE */}
      <section className="rounded-3xl p-7 mt-6 mb-6" style={{ backgroundColor: '#2EC4B6' }}>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: '#1A1A1A', opacity: 0.7 }}
        >
          Pratique · 5 min
        </p>
        <h2
          className="text-2xl font-bold mb-5"
          style={{ color: '#1A1A1A', fontFamily: 'var(--font-fraunces)' }}
        >
          {activity.activityTitle}
        </h2>
        {activity.materials && (
          <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#FDF6EC' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#1A1A1A' }}>
              Matériel
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
              {activity.materials}
            </p>
          </div>
        )}
        {steps.length > 0 && (
          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li
                key={i}
                className="rounded-2xl p-4 flex gap-4 items-start"
                style={{ backgroundColor: '#FDF6EC' }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#1A8C83', color: '#FDF6EC' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                  {step}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* CONSOLIDATION */}
      <section className="rounded-3xl p-7 mb-6" style={{ backgroundColor: '#5B1F8C' }}>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: '#FDF6EC', opacity: 0.7 }}
        >
          Consolidation · 2 min
        </p>
        <h2
          className="text-2xl font-bold mb-5"
          style={{ color: '#FDF6EC', fontFamily: 'var(--font-fraunces)' }}
        >
          {activity.songTitle}
        </h2>
        {activity.songLyrics && (
          <pre
            className="text-sm leading-loose whitespace-pre-wrap mb-6"
            style={{ color: '#FDF6EC', fontFamily: 'var(--font-nunito)', opacity: 0.9 }}
          >
            {activity.songLyrics}
          </pre>
        )}
        <button
          className="rounded-full px-5 py-2 text-sm font-semibold cursor-default"
          style={{ backgroundColor: '#FDF6EC', color: '#5B1F8C' }}
          disabled
        >
          ▶ Chanter ensemble
        </button>
      </section>

      {/* BOUTON COMPLÉTION */}
      <div className="mt-6 mb-6 flex justify-center">
        <CompleteButton activityId={activity.id} />
      </div>

      {/* BADGE */}
      {activity.badgeName && (
        <section className="rounded-3xl p-7 text-center" style={{ backgroundColor: '#F4A340' }}>
          <div className="text-5xl mb-3">⭐</div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#1A1A1A', opacity: 0.7 }}
          >
            Badge débloqué
          </p>
          <h2
            className="text-2xl font-bold"
            style={{ color: '#1A1A1A', fontFamily: 'var(--font-fraunces)' }}
          >
            {activity.badgeName}
          </h2>
        </section>
      )}
    </main>
  );
}
