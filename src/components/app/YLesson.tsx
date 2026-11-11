'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { useSpeech } from '@/lib/useSpeech';
import { playChime } from '@/lib/chime';

/**
 * Leçon spéciale : la lettre Y. Three ways to read it, the traps, then a
 * short quiz. Every tile can be tapped to hear its sound; every word to hear
 * it whole. Uses the same sound splitter as the daily word (src/lib/phonics.ts),
 * so what the child hears here is what the app says everywhere else.
 */

type RuleKey = 'i' | 'ye' | 'ii';

const RULES: {
  key: RuleKey;
  emoji: string;
  title: string;
  rule: string;
  tip: string;
  accent: string;
  tint: string;
  words: { word: string; split?: string }[];
}[] = [
  {
    key: 'i',
    emoji: '1️⃣',
    title: 'Le Y fait « i »',
    rule: 'Quand le Y est entre deux consonnes, il se lit comme un i.',
    tip: 'On peut le remplacer par un i dans sa tête : st-i-lo, p-i-jama.',
    accent: '#2EC4B6',
    tint: '#E6F8F5',
    words: [{ word: 'stylo' }, { word: 'pyjama' }, { word: 'cygne' }],
  },
  {
    key: 'ye',
    emoji: '2️⃣',
    title: 'Le Y fait « ye »',
    rule: 'Au début d’un mot, devant une voyelle, le Y se lit « ye », comme dans « yeux ».',
    tip: 'Le Y colle à la voyelle qui suit : ye + eu = yeu, ye + a = ya.',
    accent: '#F4A340',
    tint: '#FFF4E3',
    words: [{ word: 'yeux' }, { word: 'yaourt' }, { word: 'yoga' }],
  },
  {
    key: 'ii',
    emoji: '3️⃣',
    title: 'Le Y vaut deux i',
    rule: 'Entre deux voyelles, le Y compte pour deux i : il prête un i à la voyelle d’avant, et garde un i pour la suite.',
    tip: 'o + i = « oi », a + i = « ai ». Dans joyeux, il y a yeux !',
    accent: '#5B1F8C',
    tint: '#F1E9F8',
    words: [
      { word: 'joyeux', split: 'joi + yeux' },
      { word: 'crayon', split: 'crai + yon' },
      { word: 'noyau', split: 'noi + yau' },
      { word: 'voyage', split: 'voi + yage' },
    ],
  },
];

const TRAPS = [
  { word: 'yoyo', say: 'yo-yo' },
  { word: 'papaye', say: 'pa-pa-ye' },
  { word: 'goyave', say: 'go-ya-ve' },
];

const QUIZ: { word: string; answer: RuleKey }[] = [
  { word: 'stylo', answer: 'i' },
  { word: 'yeux', answer: 'ye' },
  { word: 'crayon', answer: 'ii' },
  { word: 'pyjama', answer: 'i' },
  { word: 'yaourt', answer: 'ye' },
  { word: 'joyeux', answer: 'ii' },
];

const CHOICES: { key: RuleKey; label: string }[] = [
  { key: 'i', label: '« i »' },
  { key: 'ye', label: '« ye »' },
  { key: 'ii', label: 'deux i' },
];

type Speak = ReturnType<typeof useSpeech>['speak'];

function WordTiles({ word, speak, canSpeak, accent }: { word: string; speak: Speak; canSpeak: boolean; accent: string }) {
  const sounds = wordSounds(word);
  return (
    <div className="flex flex-wrap items-end justify-center gap-1.5">
      {sounds.map((s, i) => {
        const isY = s.text.toLocaleLowerCase('fr').includes('y');
        const silent = s.kind === 'silent' || !s.key;
        return (
          <button
            key={i}
            type="button"
            disabled={silent || !canSpeak}
            onClick={() => speak(SOUNDS[s.key].say, 0.6, s.key)}
            className="flex min-w-11 flex-col items-center rounded-2xl bg-white px-2 pb-1 pt-1.5 shadow-sm ring-1 ring-ink/10 active:scale-95 disabled:active:scale-100"
            style={isY ? { boxShadow: `0 0 0 3px ${accent}` } : undefined}
            aria-label={silent ? `${s.text}, lettre muette` : `${s.text}, son ${SOUNDS[s.key].hint}`}
          >
            <span
              className="text-3xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-read)', color: silent ? 'rgba(26,26,26,0.3)' : s.kind === 'vowel' ? '#E63946' : '#1A1A1A' }}
            >
              {s.text}
            </span>
            <span className="text-[11px] font-bold text-ink-soft">{silent ? 'muette' : SOUNDS[s.key].hint}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function YLesson() {
  const { speak, supported: canSpeak } = useSpeech();
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<RuleKey | null>(null);
  const [score, setScore] = useState(0);
  const done = q >= QUIZ.length;
  const current = QUIZ[q];

  const answer = (key: RuleKey) => {
    if (picked) return;
    setPicked(key);
    if (key === current.answer) {
      setScore((n) => n + 1);
      playChime();
      if (canSpeak) speak('Bravo !', 0.9);
    } else if (canSpeak) {
      speak(current.word, 0.7);
    }
  };
  const next = () => {
    setPicked(null);
    setQ((n) => n + 1);
  };
  const restart = () => {
    setPicked(null);
    setScore(0);
    setQ(0);
  };

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <Link href="/app/sons" className="text-sm font-bold text-ink-soft">
          ← Les leçons
        </Link>

        <header className="mt-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-mpurple">Leçon spéciale · les sons</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-ink">La lettre Y</h1>
          <p
            className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-[28px] bg-mpurple text-6xl font-bold text-cream shadow-lg"
            style={{ fontFamily: 'var(--font-read)' }}
            aria-hidden="true"
          >
            Yy
          </p>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Le Y est une lettre un peu coquine : elle se lit de <strong className="text-ink">trois façons</strong>. On les découvre
            ensemble, puis on joue !
          </p>
        </header>

        {RULES.map((r) => (
          <section key={r.key} className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-ink/5" aria-labelledby={`rule-${r.key}`}>
            <div className="h-2" style={{ backgroundColor: r.accent }} />
            <div className="p-5 sm:p-7">
              <h2 id={`rule-${r.key}`} className="font-display text-2xl font-bold text-ink">
                <span aria-hidden="true">{r.emoji} </span>
                {r.title}
              </h2>
              <p className="mt-2 text-ink">{r.rule}</p>
              <ul className="mt-5 flex flex-col gap-4">
                {r.words.map(({ word, split }) => (
                  <li key={word} className="rounded-3xl p-4" style={{ backgroundColor: r.tint }}>
                    <WordTiles word={word} speak={speak} canSpeak={canSpeak} accent={r.accent} />
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                      {split && (
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold" style={{ color: r.accent }}>
                          {split}
                        </span>
                      )}
                      {canSpeak && (
                        <button
                          type="button"
                          onClick={() => speak(word, 0.75)}
                          className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-cream active:scale-95"
                        >
                          🔊 {word}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-ink">
                <span aria-hidden="true">💡 </span>
                {r.tip}
              </p>
            </div>
          </section>
        ))}

        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-ink/5 sm:p-7" aria-labelledby="traps">
          <h2 id="traps" className="font-display text-2xl font-bold text-ink">
            <span aria-hidden="true">🙈 </span>Attention, les petits malins
          </h2>
          <p className="mt-2 text-ink">Dans ces mots, le Y ne prête pas de i : on le lit simplement « ye ».</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-3">
            {TRAPS.map((t) => (
              <li key={t.word}>
                <button
                  type="button"
                  disabled={!canSpeak}
                  onClick={() => speak(t.word, 0.75)}
                  className="flex flex-col items-center rounded-3xl bg-[#FFF4E3] px-5 py-3 active:scale-95"
                >
                  <span className="text-3xl font-bold text-ink" style={{ fontFamily: 'var(--font-read)' }}>
                    {t.word}
                  </span>
                  <span className="text-xs font-bold text-ink-soft">on lit : {t.say}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-[28px] bg-mpurple p-5 text-cream shadow-lg sm:p-7" aria-labelledby="quiz" aria-live="polite">
          <h2 id="quiz" className="font-display text-2xl font-bold">
            <span aria-hidden="true">🎯 </span>À toi de jouer !
          </h2>
          {!done ? (
            <>
              <p className="mt-2 text-cream/90">
                Mot {q + 1} sur {QUIZ.length} : comment se lit le Y ?
              </p>
              <button
                type="button"
                disabled={!canSpeak}
                onClick={() => speak(current.word, 0.75)}
                className="mx-auto mt-5 block rounded-3xl bg-cream px-8 py-4 text-5xl font-bold text-ink shadow-md active:scale-95"
                style={{ fontFamily: 'var(--font-read)' }}
              >
                {current.word}
              </button>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {CHOICES.map((c) => {
                  const right = picked && c.key === current.answer;
                  const wrong = picked === c.key && c.key !== current.answer;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => answer(c.key)}
                      className="min-h-14 rounded-2xl px-2 text-lg font-extrabold shadow-md active:scale-95"
                      style={{
                        backgroundColor: right ? '#2EC4B6' : wrong ? '#E63946' : '#FDF6EC',
                        color: right || wrong ? '#FFFFFF' : '#5B1F8C',
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {picked && (
                <div className="mt-4 text-center">
                  <p className="font-bold">
                    {picked === current.answer
                      ? 'Bravo ! 🎉'
                      : `Presque ! Ici le Y fait ${CHOICES.find((c) => c.key === current.answer)?.label}.`}
                  </p>
                  <button
                    type="button"
                    onClick={next}
                    className="mt-3 rounded-full bg-cream px-6 py-3 font-extrabold text-mpurple shadow-md active:scale-95"
                  >
                    {q + 1 < QUIZ.length ? 'Mot suivant →' : 'Voir mon score'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-6xl" aria-hidden="true">
                {score === QUIZ.length ? '🏆' : '⭐'}
              </p>
              <p className="mt-2 font-display text-3xl font-bold">
                {score} / {QUIZ.length}
              </p>
              <p className="mt-1 text-cream/90">
                {score === QUIZ.length ? 'Champion·ne du Y !' : 'Super travail ! On recommence pour tout réussir ?'}
              </p>
              <div className="mt-5 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={restart}
                  className="rounded-full bg-cream px-6 py-3 font-extrabold text-mpurple shadow-md active:scale-95"
                >
                  Rejouer
                </button>
                <Link href="/app" className="font-bold underline underline-offset-4">
                  Retour au mot du jour
                </Link>
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft ring-1 ring-ink/5">
          <span aria-hidden="true">👩🏾‍🏫 </span>
          <strong className="text-ink">Astuce parent :</strong> touche chaque case pour entendre son son. Ne cherche pas à tout retenir en
          une fois : une règle par jour suffit, et on revient au quiz quand on croise un Y dans un mot.
        </p>
      </div>
    </main>
  );
}
