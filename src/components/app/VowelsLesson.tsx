'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { useSpeech } from '@/lib/useSpeech';
import { playChime } from '@/lib/chime';
import { whyNot } from '@/lib/lessons';

/**
 * Leçon : voyelles et consonnes. The vowels sing (the air goes out freely),
 * the consonants block the air and need a vowel to be heard (m + a = ma).
 * Then the vowels that team up (ou, oi…) and the trap of « an, on, in »: the
 * n must be followed by a consonant or end the word (mangue, but ma-ni-oc).
 * Two little games at the end. Same sound splitter as the rest of the app.
 */

type Speak = ReturnType<typeof useSpeech>['speak'];

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];
const CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z'];
/** The sound each letter usually makes on its own (h is silent). */
const LETTER_SOUND: Record<string, string> = { c: 'k', q: 'k', x: 'ks', h: '' };
const soundOf = (letter: string) => (letter in LETTER_SOUND ? LETTER_SOUND[letter] : SOUNDS[letter] ? letter : '');

const BLENDS = [
  { c: 'm', v: 'a', syl: 'ma' },
  { c: 'p', v: 'a', syl: 'pa' },
  { c: 'l', v: 'u', syl: 'lu' },
  { c: 'r', v: 'i', syl: 'ri' },
];

const TEAMS = [
  { team: 'ou', word: 'doudou' },
  { team: 'oi', word: 'oiseau' },
  { team: 'au', word: 'jaune' },
  { team: 'eau', word: 'bateau' },
  { team: 'eu', word: 'fleur' },
  { team: 'ai', word: 'lait' },
];

const NASAL_PAIRS = [
  { sound: 'an', yes: 'mangue', no: 'manioc' },
  { sound: 'an', yes: 'tambour', no: 'banane' },
  { sound: 'on', yes: 'tonton', no: 'tomate' },
  { sound: 'in', yes: 'lapin', no: 'lapine' },
];

type QuizItem = { show: string; say: string; sound?: string; answer: boolean; why?: string };

const LETTER_QUIZ: QuizItem[] = ['a', 'm', 'o', 't', 'i', 'r', 'u', 's'].map((l) => ({
  show: l,
  say: SOUNDS[soundOf(l)]?.say ?? l,
  sound: soundOf(l),
  answer: VOWELS.includes(l),
}));

const AN_WORDS: [string, string, boolean][] = [
  ['mangue', 'man - gue', true],
  ['manioc', 'ma - ni - oc', false],
  ['tambour', 'tam - bour', true],
  ['banane', 'ba - na - ne', false],
  ['maman', 'ma - man', true],
  ['cabane', 'ca - ba - ne', false],
  ['dentifrice', 'den - ti - fri - ce', true],
  ['ananas', 'a - na - nas', false],
];
const AN_QUIZ: QuizItem[] = AN_WORDS.map(([word, syl, answer]) => ({
  show: word,
  say: word,
  answer,
  why: answer ? `On entend « an » : ${syl.replace(/\s*-\s*/g, '-')}.` : `${whyNot(word, syl, '', { key: 'an', text: 'an' }).lead} On lit ${syl.replace(/\s*-\s*/g, '-')}.`,
}));

function LetterTile({ letter, vowel, speak, canSpeak }: { letter: string; vowel: boolean; speak: Speak; canSpeak: boolean }) {
  const key = soundOf(letter);
  return (
    <button
      type="button"
      disabled={!canSpeak || !key}
      onClick={() => speak(SOUNDS[key].say, 0.6, key)}
      aria-label={key ? `${letter}, son ${SOUNDS[key].hint}` : `${letter}, lettre muette`}
      className="flex h-14 w-12 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-ink/10 active:scale-95 disabled:active:scale-100"
    >
      <span className="text-3xl font-bold leading-none" style={{ fontFamily: 'var(--font-read)', color: vowel ? '#E63946' : '#1A1A1A' }}>
        {letter}
      </span>
      <span className="text-[10px] font-bold text-ink-soft">{key ? SOUNDS[key].hint : 'muette'}</span>
    </button>
  );
}

function WordTiles({ word, speak, canSpeak, mark }: { word: string; speak: Speak; canSpeak: boolean; mark?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-1.5">
      {wordSounds(word).map((s, i) => {
        const silent = s.kind === 'silent' || !s.key;
        const marked = !!mark && s.key === mark;
        return (
          <button
            key={i}
            type="button"
            disabled={silent || !canSpeak}
            onClick={() => speak(SOUNDS[s.key].say, 0.6, s.key)}
            className="flex min-w-10 flex-col items-center rounded-2xl bg-white px-2 pb-1 pt-1.5 shadow-sm ring-1 ring-ink/10 active:scale-95 disabled:active:scale-100"
            style={marked ? { boxShadow: '0 0 0 3px #F4A340' } : undefined}
            aria-label={silent ? `${s.text}, lettre muette` : `${s.text}, son ${SOUNDS[s.key].hint}`}
          >
            <span
              className="text-2xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-read)', color: silent ? 'rgba(26,26,26,0.3)' : s.kind === 'vowel' ? '#E63946' : '#1A1A1A' }}
            >
              {s.text}
            </span>
            <span className="text-[10px] font-bold text-ink-soft">{silent ? 'muette' : SOUNDS[s.key].hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ id, emoji, title, accent, children }: { id: string; emoji: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-ink/5" aria-labelledby={id}>
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className="p-5 sm:p-7">
        <h2 id={id} className="font-display text-2xl font-bold text-ink">
          <span aria-hidden="true">{emoji} </span>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Quiz({
  title,
  question,
  items,
  yes,
  no,
  speak,
  canSpeak,
}: {
  title: string;
  question: string;
  items: QuizItem[];
  yes: string;
  no: string;
  speak: Speak;
  canSpeak: boolean;
}) {
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = q >= items.length;
  const current = items[q];

  const answer = (v: boolean) => {
    if (picked !== null) return;
    setPicked(v);
    if (v === current.answer) {
      setScore((n) => n + 1);
      playChime();
    }
  };

  return (
    <section className="mt-8 rounded-[28px] bg-mpurple p-5 text-cream shadow-lg sm:p-7" aria-live="polite">
      <h2 className="font-display text-2xl font-bold">
        <span aria-hidden="true">🎯 </span>
        {title}
      </h2>
      {!done ? (
        <>
          <p className="mt-2 text-cream/90">
            {q + 1} sur {items.length} : {question}
          </p>
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => speak(current.say, 0.7, current.sound)}
            className="mx-auto mt-5 block rounded-3xl bg-cream px-8 py-4 text-5xl font-bold text-ink shadow-md active:scale-95"
            style={{ fontFamily: 'var(--font-read)' }}
          >
            {current.show}
          </button>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[true, false].map((v) => {
              const right = picked !== null && v === current.answer;
              const wrong = picked === v && v !== current.answer;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => answer(v)}
                  className="min-h-14 rounded-2xl px-2 text-lg font-extrabold shadow-md active:scale-95"
                  style={{ backgroundColor: right ? '#2EC4B6' : wrong ? '#E63946' : '#FDF6EC', color: right || wrong ? '#FFFFFF' : '#5B1F8C' }}
                >
                  {v ? yes : no}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-4 text-center">
              <p className="font-bold">{picked === current.answer ? 'Bravo ! 🎉' : `Presque ! C’est ${current.answer ? yes : no}.`}</p>
              {current.why && <p className="mx-auto mt-1 max-w-md text-sm text-cream/90">{current.why}</p>}
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setQ((n) => n + 1);
                }}
                className="mt-3 rounded-full bg-cream px-6 py-3 font-extrabold text-mpurple shadow-md active:scale-95"
              >
                {q + 1 < items.length ? 'Suivant →' : 'Voir mon score'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-6xl" aria-hidden="true">
            {score === items.length ? '🏆' : '⭐'}
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {score} / {items.length}
          </p>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setScore(0);
              setQ(0);
            }}
            className="mt-4 rounded-full bg-cream px-6 py-3 font-extrabold text-mpurple shadow-md active:scale-95"
          >
            Rejouer
          </button>
        </div>
      )}
    </section>
  );
}

export default function VowelsLesson() {
  const { speak, supported: canSpeak } = useSpeech();

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <Link href="/app/sons" className="text-sm font-bold text-ink-soft">
          ← Les leçons
        </Link>

        <header className="mt-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-mpurple">Leçon · les sons</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-ink">Voyelles et consonnes</h1>
          <p className="mx-auto mt-4 flex h-24 w-32 items-center justify-center gap-2 rounded-[28px] bg-white text-6xl font-bold shadow-lg" style={{ fontFamily: 'var(--font-read)' }} aria-hidden="true">
            <span className="text-mred">a</span>
            <span className="text-ink">b</span>
          </p>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Dans l’app, les voyelles sont en <strong className="text-mred">rouge</strong> et les consonnes en <strong className="text-ink">noir</strong>.
            Voici pourquoi, et le piège de « an ».
          </p>
        </header>

        <Section id="voyelles" emoji="🎶" title="Les voyelles chantent" accent="#E63946">
          <p className="mt-2 text-ink">
            La bouche reste ouverte, l’air sort tout seul : on peut chanter une voyelle très longtemps. « aaaaaa », « ooooo ».
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {VOWELS.map((l) => (
              <LetterTile key={l} letter={l} vowel speak={speak} canSpeak={canSpeak} />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-ink-soft">Il y en a six : a, e, i, o, u et y.</p>
        </Section>

        <Section id="consonnes" emoji="🚧" title="Les consonnes bloquent l’air" accent="#1A1A1A">
          <p className="mt-2 text-ink">
            Les lèvres, la langue ou les dents arrêtent un peu l’air. Toute seule, une consonne s’entend mal : elle a besoin d’une voyelle
            pour faire une syllabe.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CONSONANTS.map((l) => (
              <LetterTile key={l} letter={l} vowel={false} speak={speak} canSpeak={canSpeak} />
            ))}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BLENDS.map((b) => (
              <li key={b.syl}>
                <button
                  type="button"
                  disabled={!canSpeak}
                  onClick={() => speak(b.syl, 0.7)}
                  className="w-full rounded-2xl bg-sand px-3 py-3 text-center active:scale-95"
                >
                  <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-read)' }}>
                    <span className="text-ink">{b.c}</span> + <span className="text-mred">{b.v}</span> = {b.syl}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="equipes" emoji="🤝" title="Des voyelles qui font équipe" accent="#2EC4B6">
          <p className="mt-2 text-ink">Parfois deux ou trois voyelles se tiennent la main : elles ne font plus qu’un seul son.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {TEAMS.map((t) => (
              <li key={t.team} className="flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-[#E6F8F5] p-3">
                <span className="w-14 text-center text-3xl font-bold text-mred" style={{ fontFamily: 'var(--font-read)' }}>
                  {t.team}
                </span>
                <WordTiles word={t.word} speak={speak} canSpeak={canSpeak} mark={wordSounds(t.team)[0]?.key} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="nasales" emoji="🪤" title="Le piège de « an », « on », « in »" accent="#F4A340">
          <p className="mt-2 text-ink">
            Une voyelle suivie de <strong>n</strong> (ou de <strong>m</strong>) peut faire un nouveau son : « an », « on », « in ».
          </p>
          <p className="mt-3 rounded-2xl bg-[#FFF4E3] px-4 py-3 font-bold text-ink">
            👉 Mais seulement si le n est suivi d’une <strong>consonne</strong>, ou s’il est à la <strong>fin du mot</strong>. Si une voyelle
            vient après, le n part avec elle : ma-ni-oc, ba-na-ne.
          </p>
          <ul className="mt-5 flex flex-col gap-4">
            {NASAL_PAIRS.map((p) => (
              <li key={p.yes} className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#E6F8F5] p-3">
                  <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-widest text-[#0E8C80]">✓ on entend « {p.sound} »</p>
                  <WordTiles word={p.yes} speak={speak} canSpeak={canSpeak} mark={p.sound} />
                </div>
                <div className="rounded-3xl bg-[#FDECEE] p-3">
                  <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-widest text-mred">✗ pas de « {p.sound} »</p>
                  <WordTiles word={p.no} speak={speak} canSpeak={canSpeak} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Pareil quand le n est doublé : dans <strong className="text-ink">pomme</strong> ou <strong className="text-ink">tonne</strong>, on
            n’entend pas « on ».
          </p>
        </Section>

        <Quiz
          title="Voyelle ou consonne ?"
          question="cette lettre chante ou bloque l’air ?"
          items={LETTER_QUIZ}
          yes="🎶 Voyelle"
          no="🚧 Consonne"
          speak={speak}
          canSpeak={canSpeak}
        />
        <Quiz
          title="On entend « an » ?"
          question="écoute bien le mot."
          items={AN_QUIZ}
          yes="✓ Oui, « an »"
          no="✗ Non"
          speak={speak}
          canSpeak={canSpeak}
        />

        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft ring-1 ring-ink/5">
          <span aria-hidden="true">👩🏾‍🏫 </span>
          <strong className="text-ink">Astuce parent :</strong> touchez chaque case pour entendre son son. Faites chanter les voyelles bien
          longtemps, puis essayez avec une consonne : « mmmm » marche, « p » s’arrête tout de suite. Une partie par jour suffit.
        </p>
        <div className="mt-6 text-center">
          <Link href="/app" className="font-bold text-mpurple underline underline-offset-4">
            Retour au mot du jour
          </Link>
        </div>
      </div>
    </main>
  );
}
