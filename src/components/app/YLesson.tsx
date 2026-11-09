'use client';

import { useState } from 'react';
import { Y_EXCEPTIONS, Y_QUIZ, Y_RULES, yInWord, type YCase, type YInWord } from '@/lib/y-lesson';
import type { WordCard } from '@/lib/related';

type Speak = (text: string, rate?: number, sound?: string) => void;

const CASE_LABEL: Record<YCase, string> = { i: '« i »', ye: '« ye »', 'deux-i': 'i + i' };

/** The word with its y in colour. */
function WithY({ word }: { word: string }) {
  const w = word.toLocaleLowerCase('fr');
  return (
    <>
      {[...w].map((c, i) => (
        <span key={i} className={c === 'y' ? 'text-morange-ink' : undefined}>{c}</span>
      ))}
    </>
  );
}

/** joyeux → « joi » + « yeux »: the y split into its two i. */
function TwoI({ y, canSpeak, speak }: { y: YInWord; canSpeak: boolean; speak: Speak }) {
  const left = y.left ?? '';
  const right = y.right ?? '';
  const piece = (text: string, colored: 'last' | 'first') => (
    <button
      type="button"
      onClick={() => canSpeak && speak(text, 0.7)}
      aria-label={`Écouter ${text}`}
      className="rounded-xl bg-white px-3 py-1.5 font-display text-2xl font-bold text-ink ring-1 ring-ink/10 active:scale-95 sm:text-3xl"
    >
      {colored === 'last' ? (
        <>
          {text.slice(0, -1)}
          <span className="text-morange-ink">{text.slice(-1)}</span>
        </>
      ) : (
        <>
          <span className="text-morange-ink">{text[0]}</span>
          {text.slice(1)}
        </>
      )}
    </button>
  );
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-2">
      {piece(left, 'last')}
      <span aria-hidden="true" className="font-display text-2xl font-bold text-ink-soft">+</span>
      {piece(right, 'first')}
    </span>
  );
}

/**
 * « Le y, la lettre caméléon »: shown with every word that has a y. First
 * what the y says in *this* word (joyeux = joi + yeux: « dans joyeux, il y a
 * yeux ! »), then the whole lesson (three rules, exceptions) and a small quiz.
 */
export default function YLesson({ word, library, canSpeak, speak }: { word: string; library: WordCard[]; canSpeak: boolean; speak: Speak }) {
  const ys = yInWord(word);
  const [open, setOpen] = useState(false);
  if (ys.length === 0) return null;
  const lower = word.toLocaleLowerCase('fr');

  // « Dans joyeux, il y a yeux ! »: a word of the app hidden inside this one.
  const hidden = library
    .map((c) => c.word.toLocaleLowerCase('fr'))
    .find((w) => w !== lower && w.length >= 3 && w.includes('y') && lower.includes(w))
    ?? (lower === 'joyeux' ? 'yeux' : undefined);

  return (
    <section aria-labelledby="y-lesson-title" className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
      <h3 id="y-lesson-title" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">
        <span aria-hidden="true">🦎</span> Le son du y
      </h3>

      <ul className="mt-3 flex flex-col gap-3">
        {ys.map((y) => (
          <li key={y.at} className="rounded-2xl bg-[#FEF3E2] p-3 text-center">
            {y.kind === 'deux-i' ? (
              <>
                <p className="font-display text-3xl font-bold text-ink">
                  <WithY word={word} /> <span className="text-ink-soft">=</span>
                </p>
                <div className="mt-2">
                  <TwoI y={y} canSpeak={canSpeak} speak={speak} />
                </div>
                <p className="mt-3 text-sm leading-snug text-ink">
                  Ici, le <strong className="text-morange-ink">y</strong> est entre deux voyelles : il vaut <strong>deux i</strong>.
                  Le premier i va avec la voyelle d’avant (<strong>{y.joined}</strong>), le second fait « ye » avec la suite.
                </p>
                {hidden && (
                  <p className="mt-2 font-display text-lg font-bold text-mpurple">
                    Dans {lower}, il y a « {hidden} » ! 👀
                  </p>
                )}
              </>
            ) : y.kind === 'ye' ? (
              <p className="text-sm leading-snug text-ink">
                <span className="mb-1 block font-display text-3xl font-bold"><WithY word={word} /></span>
                Devant une voyelle, le <strong className="text-morange-ink">y</strong> fait <strong>« ye »</strong>, comme dans <strong>yeux</strong>.
              </p>
            ) : (
              <p className="text-sm leading-snug text-ink">
                <span className="mb-1 block font-display text-3xl font-bold"><WithY word={word} /></span>
                Ici, le <strong className="text-morange-ink">y</strong> se lit <strong>« i »</strong>, comme un i.
              </p>
            )}
            {canSpeak && (
              <button
                type="button"
                onClick={() => speak(word, 0.7)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream active:scale-95"
              >
                <span aria-hidden="true">🔈</span> Écouter {lower}
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 flex min-h-11 w-full items-center justify-between rounded-2xl bg-cream px-4 py-2 text-left font-bold text-ink active:scale-[0.99]"
      >
        <span>📚 La leçon du y, la lettre caméléon</span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && <FullLesson canSpeak={canSpeak} speak={speak} />}
    </section>
  );
}

function FullLesson({ canSpeak, speak }: { canSpeak: boolean; speak: Speak }) {
  return (
    <div className="mt-3">
      <p className="text-sm leading-snug text-ink">
        Le <strong className="text-morange-ink">y</strong> change de son selon sa place, comme le caméléon change de couleur.
        On regarde ce qu’il y a <strong>avant</strong> et <strong>après</strong> lui.
      </p>
      <ol className="mt-3 flex flex-col gap-3">
        {Y_RULES.map((r, n) => (
          <li key={r.kind} className="rounded-2xl p-3 ring-1 ring-ink/10">
            <p className="font-display text-lg font-bold text-ink">
              {n + 1}. {r.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink">{r.text}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.examples.map((ex) => {
                const two = r.kind === 'deux-i' ? yInWord(ex).find((y) => y.kind === 'deux-i') : undefined;
                return (
                  <li key={ex}>
                    <button
                      type="button"
                      onClick={() => canSpeak && speak(ex, 0.7)}
                      aria-label={`Écouter ${ex}`}
                      className="rounded-full bg-sand px-3 py-1.5 text-base font-bold text-ink active:scale-95"
                    >
                      <WithY word={ex} />
                      {two && <span className="ml-1 text-xs font-extrabold text-ink-soft">({two.left} + {two.right})</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-2xl bg-cream p-3 text-sm leading-snug text-ink">
        <strong>⚠️ Attention, des mots font exception :</strong>{' '}
        {Y_EXCEPTIONS.map((e, i) => (
          <span key={e.word}>
            {i > 0 && ', '}
            <strong>{e.word}</strong> se dit « {e.reads} »
          </span>
        ))}
        . On les apprend par cœur.
      </p>
      <YQuiz canSpeak={canSpeak} speak={speak} />
    </div>
  );
}

/** « À toi ! » — for each word, the child says what the y does. */
function YQuiz({ canSpeak, speak }: { canSpeak: boolean; speak: Speak }) {
  const [k, setK] = useState(0);
  const [picked, setPicked] = useState<YCase | null>(null);
  const done = k >= Y_QUIZ.length;
  if (done) {
    return (
      <div className="mt-4 rounded-2xl bg-mteal-light p-4 text-center">
        <p className="font-display text-xl font-bold text-ink">Bravo, tu connais le y ! 🦎</p>
        <button type="button" onClick={() => { setK(0); setPicked(null); }} className="mt-2 text-sm font-bold text-mteal-ink underline">
          Recommencer
        </button>
      </div>
    );
  }
  const word = Y_QUIZ[k];
  const answer = yInWord(word)[0].kind;
  const right = picked === answer;
  return (
    <div className="mt-4 rounded-2xl bg-mteal-light p-4 text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-mteal-ink">À toi ! · {k + 1}/{Y_QUIZ.length}</p>
      <button
        type="button"
        onClick={() => canSpeak && speak(word, 0.7)}
        aria-label={`Écouter ${word}`}
        className="mt-2 font-display text-4xl font-bold text-ink active:scale-95"
      >
        <WithY word={word} />
      </button>
      <p className="mt-1 text-sm font-bold text-ink-soft">Ici, le y fait…</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {(['i', 'ye', 'deux-i'] as YCase[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setPicked(c);
              if (c === answer && canSpeak) speak(word, 0.7);
            }}
            className={`min-h-12 min-w-20 rounded-full px-4 py-2 font-display text-lg font-bold ring-2 active:scale-95 ${
              picked === c ? (c === answer ? 'bg-mteal-ink text-white ring-mteal-ink' : 'bg-white text-mred ring-mred') : 'bg-white text-ink ring-ink/15'
            }`}
          >
            {CASE_LABEL[c]}
          </button>
        ))}
      </div>
      {picked && !right && <p className="mt-2 text-sm font-bold text-mred">Presque ! Regarde ce qu’il y a avant et après le y.</p>}
      {right && (
        <button
          type="button"
          onClick={() => { setK(k + 1); setPicked(null); }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 py-2 font-bold text-cream active:scale-95"
        >
          Mot suivant →
        </button>
      )}
    </div>
  );
}
