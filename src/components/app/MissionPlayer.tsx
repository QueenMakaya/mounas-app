'use client';

import { useState } from 'react';
import type { Mission } from '@/lib/missions';
import { saveMission } from '@/lib/mission-progress';
import { playChime } from '@/lib/chime';
import SpeakButton from '@/components/app/SpeakButton';

/*
 * One mission: the child hears the problem, answers with a number pad or
 * choice buttons, and can ask for hints one at a time. The parent has their
 * script in a collapsible panel.
 *
 * Teaching rules:
 *  - praise the effort and the method, never speed or "being good at maths";
 *    no timer, no score;
 *  - the answer is never shown before 3 tries AND every hint, and even then
 *    behind a button meant for the parent.
 */

const MIN_TRIES_BEFORE_ANSWER = 3;

const PRAISE = [
  'Bravo, tu as bien cherché !',
  'Tu as pris le temps de réfléchir, et tu as trouvé !',
  'Super, tu as essayé, tu as cherché, et tu as trouvé !',
  'Quel beau travail de recherche !',
];
const PRAISE_WITH_HINT = 'Tu as utilisé un indice, c’est une très bonne façon de chercher. Bravo !';
const PRAISE_AFTER_TRIES = 'Tu n’as pas abandonné, et tu as trouvé. Bravo pour ta patience !';

const NOT_YET = [
  'Pas encore ! Tu as essayé, c’est comme ça qu’on apprend.',
  'Bonne tentative ! On recompte doucement ensemble ?',
  'Pas tout à fait. Tu peux essayer une autre idée.',
  'Regarde bien encore une fois, prends ton temps.',
];

const normalize = (s: string) =>
  s
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The number in "Réponse" ("5", "5 girafes", "Il y en a 5"), if any. */
function expectedNumber(answer: string): number | null {
  const m = answer.replace(/\s/g, '').match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
}

export default function MissionPlayer({ mission: m, compact = false }: { mission: Mission; compact?: boolean }) {
  const target = m.answerType === 'nombre' ? expectedNumber(m.answer) : null;
  // A number mission whose answer isn't a number, or a photo mission, is
  // checked by the parent in real life.
  const parentChecks = m.answerType === 'photo' || (m.answerType === 'nombre' && target === null) || (m.answerType === 'choix' && m.choices.length === 0);

  const [typed, setTyped] = useState('');
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHarder, setShowHarder] = useState(false);
  const [harderDone, setHarderDone] = useState(false);

  const allHints = hints >= m.hints.length;
  const canRevealAnswer = !parentChecks && !solved && tries >= MIN_TRIES_BEFORE_ANSWER && allHints;

  const succeed = () => {
    setSolved(true);
    setLastWrong(null);
    setFeedback(
      tries >= 2 ? PRAISE_AFTER_TRIES : hints > 0 ? PRAISE_WITH_HINT : PRAISE[Math.floor(Math.random() * PRAISE.length)],
    );
    playChime();
    saveMission(m.id, { solved: true, tries, hints });
  };

  const miss = (value: string) => {
    const n = tries + 1;
    setTries(n);
    setLastWrong(value);
    setFeedback(
      NOT_YET[(n - 1) % NOT_YET.length] + (hints < m.hints.length ? ' Un indice peut t’aider.' : ''),
    );
    saveMission(m.id, { tries: n, hints });
  };

  const check = (value: string) => {
    if (solved || !value) return;
    if (m.answerType === 'nombre') {
      return Number(value) === target ? succeed() : miss(value);
    }
    return normalize(value) === normalize(m.answer) ? succeed() : miss(value);
  };

  const revealHint = () => {
    const n = Math.min(hints + 1, m.hints.length);
    setHints(n);
    saveMission(m.id, { tries, hints: n });
  };

  return (
    <div className="space-y-5">
      {/* ── The problem ── */}
      <div className="rounded-3xl bg-[#FEF3E2] px-5 py-6 text-center sm:px-8">
        {!compact && m.title && <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#C7600A]">{m.title}</p>}
        <p className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl">{m.statement}</p>
        <div className="mt-4 flex justify-center">
          <SpeakButton text={m.statement} label="Écouter la mission" rate={0.85} />
        </div>
      </div>

      {m.materials && (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink">
          <span className="font-extrabold">📋 Matériel · </span>
          {m.materials}
        </p>
      )}

      {/* ── Answering ── */}
      {!solved && m.answerType === 'nombre' && !parentChecks && (
        <NumberPad
          value={typed}
          onChange={(v) => {
            setTyped(v);
            setLastWrong(null);
          }}
          onSubmit={() => {
            check(typed);
          }}
        />
      )}

      {!solved && m.answerType === 'choix' && !parentChecks && (
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choisis ta réponse">
          {m.choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => check(c)}
              className={`min-h-14 rounded-2xl px-4 py-3 text-lg font-bold ring-2 transition-transform active:scale-[0.98] ${
                lastWrong === c ? 'bg-sand text-ink-soft ring-ink/10' : 'bg-white text-ink ring-mamber hover:bg-[#FEF3E2]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!solved && parentChecks && (
        <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-ink/10">
          <p className="text-ink-soft">Quand c’est fait, le parent vérifie avec l’enfant.</p>
          <button
            type="button"
            onClick={succeed}
            className="mt-4 min-h-14 w-full rounded-full bg-mteal px-6 text-lg font-extrabold text-ink shadow-md active:scale-[0.98]"
          >
            ✅ Mission réussie
          </button>
        </div>
      )}

      {/* ── Feedback ── */}
      {feedback && (
        <p
          role="status"
          className={`rounded-2xl px-4 py-3 text-center text-lg font-bold ${solved ? 'bg-mteal-light text-[#115E59]' : 'bg-[#FDECEE] text-ink'}`}
        >
          {solved && <span aria-hidden="true">🌟 </span>}
          {feedback}
        </p>
      )}
      {solved && !parentChecks && (
        <p className="text-center text-ink-soft">Tu peux expliquer comment tu as trouvé ?</p>
      )}

      {/* ── Hints, one at a time ── */}
      {m.hints.length > 0 && (
        <div className="space-y-2">
          {m.hints.slice(0, hints).map((h, i) => (
            <p key={i} className="flex gap-3 rounded-2xl bg-[#F1E9F8] px-4 py-3 text-ink">
              <span aria-hidden="true">💡</span>
              <span>
                <span className="font-extrabold">Indice {i + 1} · </span>
                {h}
              </span>
            </p>
          ))}
          {!solved && !allHints && (
            <button
              type="button"
              onClick={revealHint}
              className="min-h-12 w-full rounded-full bg-white px-5 font-bold text-mpurple ring-1 ring-mpurple/25 hover:bg-mpurple/5"
            >
              💡 {hints === 0 ? 'Un indice' : 'Un autre indice'} ({hints + 1}/{m.hints.length})
            </button>
          )}
        </div>
      )}

      {/* ── Answer: only after 3 tries and every hint, for the parent ── */}
      {canRevealAnswer &&
        (showAnswer ? (
          <div className="rounded-2xl bg-white px-4 py-4 text-center ring-1 ring-ink/10">
            <p className="text-sm font-bold uppercase tracking-widest text-ink-soft">La réponse</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{m.answer}</p>
            <p className="mt-2 text-ink-soft">Tu as beaucoup cherché, c’est ça le plus important. On la refera un autre jour !</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="min-h-12 w-full rounded-full px-5 text-sm font-bold text-ink-soft underline underline-offset-4"
          >
            Voir la réponse (pour le parent)
          </button>
        ))}

      {/* ── Harder variant ── */}
      {m.harder &&
        (showHarder ? (
          <div className="rounded-3xl bg-[#E4F0F8] px-5 py-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1D6FA4]">🚀 Plus difficile</p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">{m.harder}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SpeakButton text={m.harder} label="Écouter" rate={0.85} tone="soft" />
              <button
                type="button"
                disabled={harderDone}
                onClick={() => {
                  setHarderDone(true);
                  saveMission(m.id, { harder: true });
                }}
                className="min-h-12 rounded-full bg-white px-5 font-bold text-[#1D6FA4] ring-1 ring-[#1D6FA4]/30 disabled:opacity-70"
              >
                {harderDone ? '✅ Défi relevé, bravo pour tes efforts !' : 'On l’a fait !'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHarder(true)}
            className="min-h-12 w-full rounded-full bg-white px-5 font-bold text-[#1D6FA4] ring-1 ring-[#1D6FA4]/30 hover:bg-[#E4F0F8]"
          >
            🚀 Plus difficile
          </button>
        ))}

      {/* ── Parent panel ── */}
      {(m.parentScript || (m.answerType === 'photo' && m.answer)) && (
        <details className="group rounded-3xl bg-cream p-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 font-extrabold text-ink">
            <span aria-hidden="true" className="text-xl">👪</span>
            <span className="flex-1">Pour le parent</span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="mt-3 space-y-3 leading-relaxed text-ink">
            {m.parentScript && <p className="whitespace-pre-line">{m.parentScript}</p>}
            {m.answerType === 'photo' && m.answer && (
              <p>
                <span className="font-extrabold">Ce qu’on attend · </span>
                {m.answer}
              </p>
            )}
            <p className="text-sm text-ink-soft">
              Félicite les efforts et la façon de chercher (« tu as compté sur tes doigts », « tu as essayé une autre
              idée »), pas la rapidité.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

function NumberPad({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const press = (d: string) => onChange((value + d).replace(/^0+(?=\d)/, '').slice(0, 4));
  return (
    <div className="mx-auto max-w-xs">
      <output
        aria-live="polite"
        aria-label="Ta réponse"
        className="mb-3 flex min-h-16 items-center justify-center rounded-2xl bg-white font-display text-4xl font-bold text-ink ring-2 ring-mamber"
      >
        {value || <span className="text-ink/25">?</span>}
      </output>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="min-h-14 rounded-2xl bg-white text-2xl font-extrabold text-ink ring-1 ring-ink/10 active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(value.slice(0, -1))}
          aria-label="Effacer"
          className="min-h-14 rounded-2xl bg-sand text-xl font-bold text-ink active:scale-95"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="min-h-14 rounded-2xl bg-white text-2xl font-extrabold text-ink ring-1 ring-ink/10 active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value}
          className="min-h-14 rounded-2xl bg-mred text-lg font-extrabold text-cream disabled:opacity-40 active:scale-95"
        >
          OK
        </button>
      </div>
    </div>
  );
}
