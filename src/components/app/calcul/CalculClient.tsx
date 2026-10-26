'use client';

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import BackButton from '@/components/app/BackButton';
import SpeakButton from '@/components/app/SpeakButton';
import { playChime } from '@/lib/chime';
import { localDate } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import {
  LEVELS,
  MASTER_OK,
  OPS,
  WINDOW,
  calculSnapshot,
  emptyCalcul,
  levelById,
  levelProgress,
  nextProblem,
  opInfo,
  parseCalcul,
  problemSaid,
  readCalcul,
  recordAnswer,
  saveCalcul,
  setLevel,
  subscribeCalcul,
  type CalculState,
  type Change,
  type Problem,
} from '@/lib/calcul';

/*
 * The calculation drills, one at a time, with a big keypad the child can use
 * alone. No limit: a counter shows how many are done, and « J'ai fini » ends
 * whenever she wants. The parent area (closed by default) shows where she is
 * and lets the parent set the level to match the Kumon book.
 */

type Feedback = 'ok' | 'wrong' | 'shown' | null;

const ACCENT: Record<string, string> = { addition: '#0E8C80', soustraction: '#1D6FA4', multiplication: '#5B1F8C' };
const TINT: Record<string, string> = { addition: '#E3F8F5', soustraction: '#E4F0F8', multiplication: '#F1E9F8' };

function useCalcul(): CalculState {
  const raw = useSyncExternalStore(subscribeCalcul, calculSnapshot, () => '');
  if (!raw) return emptyCalcul();
  try {
    return parseCalcul(JSON.parse(raw));
  } catch {
    return emptyCalcul();
  }
}

export default function CalculClient() {
  const state = useCalcul();
  const { supported: canSpeak, speak } = useSpeech();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [session, setSession] = useState({ done: 0, ok: 0 });
  const [change, setChange] = useState<Change>(null);
  const [stopped, setStopped] = useState(false);
  const shownAt = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const level = levelById(problem?.level ?? state.level);
  const accent = ACCENT[level.op];

  const show = (from: CalculState, previous: Problem | null) => {
    setProblem(nextProblem(from, previous));
    setInput('');
    setTries(0);
    setFeedback(null);
    shownAt.current = performance.now();
  };

  const start = () => {
    setStopped(false);
    setChange(null);
    show(readCalcul(), null);
  };

  const submit = () => {
    if (!problem || !input || feedback === 'ok' || feedback === 'shown') return;
    const right = Number(input) === problem.answer;
    if (tries === 0) {
      // Only the first answer counts, as on a Kumon sheet corrected afterwards.
      const ms = performance.now() - shownAt.current;
      const result = recordAnswer(readCalcul(), problem, right, ms);
      saveCalcul(result.state);
      setSession((s) => ({ done: s.done + 1, ok: s.ok + (right ? 1 : 0) }));
      setChange(result.change);
      if (result.change === 'up') {
        playChime();
        if (canSpeak) speak('Bravo, tu passes au niveau suivant !', 0.9);
      }
    }
    if (right) {
      setFeedback('ok');
      if (tries === 0) playChime();
      timer.current = window.setTimeout(() => show(readCalcul(), problem), 800);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setFeedback('wrong');
      setInput('');
      if (canSpeak) speak('Presque ! Essaie encore.', 0.9);
      return;
    }
    // Second miss: the answer is shown, and the calculation will come back.
    setFeedback('shown');
    setInput(String(problem.answer));
  };

  const press = (d: string) => {
    if (!problem || feedback === 'ok' || feedback === 'shown') return;
    if (feedback === 'wrong') setFeedback(null);
    setInput((v) => (v.length >= 4 ? v : v === '0' ? d : v + d));
  };
  const erase = () => {
    if (feedback === 'ok' || feedback === 'shown') return;
    setInput((v) => v.slice(0, -1));
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!problem || stopped) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') {
      if (feedback === 'shown') show(readCalcul(), problem);
      else submit();
    }
  });
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pickLevel = (id: string) => {
    const next = setLevel(readCalcul(), id);
    saveCalcul(next);
    setChange(null);
    if (problem) show(next, null);
  };

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <BackButton />
        <header className="mb-5 mt-3">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">🔢 Le calcul</h1>
          <p className="mt-2 text-ink-soft">Un calcul à la fois, autant qu’elle veut. Le niveau s’adapte à ses réponses, comme dans un cahier Kumon.</p>
        </header>

        <section
          aria-label="Les calculs"
          className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5"
        >
          <div className="h-2" style={{ backgroundColor: accent }} />
          <div className="p-5 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: TINT[level.op], color: accent }}>
                {opInfo(level.op).label} · {level.short}
              </span>
              {session.done > 0 && (
                <span className="rounded-full bg-sand px-3 py-1.5 text-ink" aria-live="polite">
                  {session.done} {session.done === 1 ? 'calcul' : 'calculs'} · {session.ok} juste{session.ok > 1 ? 's' : ''} du premier coup
                </span>
              )}
            </div>

            {change === 'up' && (
              <p className="animate-rise mb-4 rounded-2xl bg-[#E5F4EC] px-4 py-3 text-center font-display text-lg font-bold text-[#1F6B4C]" aria-live="polite">
                🎉 Niveau suivant : {levelById(state.level).label} !
              </p>
            )}
            {change === 'down' && (
              <p className="animate-rise mb-4 rounded-2xl bg-[#FEF3E2] px-4 py-3 text-center text-sm font-bold text-morange-ink" aria-live="polite">
                On revoit un peu le niveau d’avant pour bien le consolider : {levelById(state.level).label}.
              </p>
            )}

            {stopped ? (
              <Summary session={session} onMore={start} />
            ) : !problem ? (
              <div className="py-6 text-center">
                <p className="font-display text-xl font-bold text-ink">{levelById(state.level).label}</p>
                <p className="mt-1 text-sm text-ink-soft">Elle en fait autant qu’elle veut : 2, 10 ou 20.</p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-6 min-h-16 w-full max-w-sm rounded-full px-6 text-xl font-extrabold text-cream shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: accent }}
                >
                  ▶ C’est parti !
                </button>
              </div>
            ) : (
              <>
                <ProblemView problem={problem} input={input} feedback={feedback} accent={accent} />
                <div className="mt-2 flex min-h-12 items-center justify-center gap-3" aria-live="polite">
                  {feedback === 'ok' && <p className="animate-pop font-display text-2xl font-bold text-[#2D9B6F]">Bravo ! ✓</p>}
                  {feedback === 'wrong' && <p className="font-bold text-morange-ink">Presque ! Essaie encore.</p>}
                  {feedback === 'shown' && (
                    <button
                      type="button"
                      onClick={() => show(readCalcul(), problem)}
                      className="min-h-12 rounded-full bg-ink px-6 font-extrabold text-cream active:scale-95"
                    >
                      Suivant →
                    </button>
                  )}
                  {!feedback && <SpeakButton text={problemSaid(problem)} rate={0.8} tone="soft" />}
                </div>
                <Keypad onDigit={press} onErase={erase} onSubmit={submit} canSubmit={Boolean(input) && feedback !== 'ok' && feedback !== 'shown'} accent={accent} />
                <button
                  type="button"
                  onClick={() => {
                    if (timer.current) window.clearTimeout(timer.current);
                    setStopped(true);
                    setProblem(null);
                  }}
                  className="mx-auto mt-6 flex min-h-12 items-center justify-center rounded-full px-6 font-bold text-ink ring-1 ring-ink/15 hover:bg-sand"
                >
                  J’ai fini pour aujourd’hui
                </button>
              </>
            )}
          </div>
        </section>

        <ParentArea state={state} onPick={pickLevel} />
      </div>
    </main>
  );
}

/** Small numbers on one line; two-digit additions and subtractions in columns, as on paper. */
function ProblemView({ problem: p, input, feedback, accent }: { problem: Problem; input: string; feedback: Feedback; accent: string }) {
  const symbol = opInfo(p.op).symbol;
  const columns = p.op !== 'multiplication' && (p.a >= 10 || p.b >= 10);
  const box = (
    <span
      className={`inline-flex min-w-[2.5ch] items-center justify-end rounded-2xl px-3 ring-2 ${columns ? 'w-full' : ''} ${feedback === 'wrong' ? 'animate-shake' : ''}`}
      style={{
        color: feedback === 'shown' ? '#C7600A' : feedback === 'ok' ? '#2D9B6F' : '#1A1A1A',
        backgroundColor: feedback === 'ok' ? '#E5F4EC' : '#FFFFFF',
        ['--tw-ring-color' as string]: feedback === 'ok' ? '#2D9B6F' : accent,
      }}
    >
      {input || ' '}
    </span>
  );
  return (
    <div className="flex justify-center py-4 font-display font-bold tabular-nums text-ink" aria-label={`${p.a} ${symbol} ${p.b} égale ?`}>
      {columns ? (
        <div className="text-right text-6xl leading-tight">
          <div>{p.a}</div>
          <div>
            <span className="mr-4" style={{ color: accent }}>{symbol}</span>
            {p.b}
          </div>
          <div className="mt-1 border-t-4 border-ink pt-2">{box}</div>
        </div>
      ) : (
        <p className="flex flex-wrap items-center justify-center gap-3 text-6xl">
          <span>{p.a}</span>
          <span style={{ color: accent }}>{symbol}</span>
          <span>{p.b}</span>
          <span>=</span>
          {box}
        </p>
      )}
    </div>
  );
}

function Keypad({
  onDigit,
  onErase,
  onSubmit,
  canSubmit,
  accent,
}: {
  onDigit: (d: string) => void;
  onErase: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  accent: string;
}) {
  const key = 'flex h-16 items-center justify-center rounded-2xl text-3xl font-extrabold shadow-[0_3px_0_rgba(26,26,26,0.12)] active:translate-y-0.5 active:shadow-none';
  return (
    <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2.5">
      {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => (
        <button key={d} type="button" onClick={() => onDigit(d)} className={`${key} bg-cream text-ink ring-1 ring-ink/10`}>
          {d}
        </button>
      ))}
      <button type="button" onClick={onErase} aria-label="Effacer" className={`${key} bg-sand text-ink`}>
        ⌫
      </button>
      <button type="button" onClick={() => onDigit('0')} className={`${key} bg-cream text-ink ring-1 ring-ink/10`}>
        0
      </button>
      <button type="button" onClick={onSubmit} disabled={!canSubmit} aria-label="Valider" className={`${key} text-cream disabled:opacity-40`} style={{ backgroundColor: accent }}>
        ✓
      </button>
    </div>
  );
}

function Summary({ session, onMore }: { session: { done: number; ok: number }; onMore: () => void }) {
  return (
    <div className="animate-rise py-4 text-center">
      <p className="text-5xl" aria-hidden="true">🙌</p>
      <h2 className="mt-3 font-display text-2xl font-bold text-ink">
        {session.done === 0 ? 'À bientôt !' : `${session.done} ${session.done === 1 ? 'calcul' : 'calculs'}, bravo pour ton effort !`}
      </h2>
      {session.done > 0 && (
        <p className="mt-2 text-ink-soft">
          {session.ok} juste{session.ok > 1 ? 's' : ''} du premier coup. Les calculs ratés reviendront pour s’entraîner.
        </p>
      )}
      <button type="button" onClick={onMore} className="mt-6 min-h-14 w-full max-w-sm rounded-full bg-ink px-6 text-lg font-extrabold text-cream shadow-md active:scale-[0.98]">
        ▶ Encore quelques-uns
      </button>
    </div>
  );
}

const pct = (a: number, b: number) => (b === 0 ? '—' : `${Math.round((a / b) * 100)} %`);
const secs = (ms: number, n: number) => (n === 0 ? '—' : `${(ms / n / 1000).toFixed(1).replace('.', ',')} s`);

/** For the parent: the level (to match the book), where she stands, and what she did. */
function ParentArea({ state, onPick }: { state: CalculState; onPick: (id: string) => void }) {
  const { level, count, ok, time, fastEnough } = levelProgress(state);
  const practised = LEVELS.filter((l) => (state.stats[l.id]?.answered ?? 0) > 0);
  const today = useSyncExternalStore(subscribeCalcul, localDate, () => '');
  const lastDays = Object.entries(state.days)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  return (
    <details className="group mt-6 rounded-3xl bg-white p-4 ring-1 ring-ink/5 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center gap-3 font-extrabold text-ink">
        <span aria-hidden="true" className="text-2xl">👪</span>
        <span className="flex-1">Espace parent · niveau et progrès</span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
      </summary>

      <div className="mt-4 space-y-5 text-sm text-ink-soft">
        <div>
          <label htmlFor="calcul-level" className="block font-extrabold text-ink">
            Niveau actuel
          </label>
          <p className="mt-1">Choisis le niveau qui correspond à là où elle en est dans son cahier. L’app avance ensuite toute seule.</p>
          <select
            id="calcul-level"
            value={state.level}
            onChange={(e) => onPick(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl bg-cream px-3 font-bold text-ink ring-1 ring-ink/15"
          >
            {OPS.map((o) => (
              <optgroup key={o.op} label={o.label}>
                {LEVELS.filter((l) => l.op === o.op).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                    {state.stats[l.id]?.mastered ? ' ✓' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-cream p-4">
          <p className="font-extrabold text-ink">{level.label}</p>
          {count === 0 ? (
            <p className="mt-1">Pas encore de calcul à ce niveau.</p>
          ) : (
            <p className="mt-1">
              Sur les {count} dernier{count > 1 ? 's' : ''} calculs : {ok} juste{ok > 1 ? 's' : ''} du premier coup, environ{' '}
              {time.toFixed(1).replace('.', ',')} s chacun (objectif {level.target} s).
              {count >= WINDOW && ok >= MASTER_OK && !fastEnough && ' Tout est juste : encore un peu d’entraînement pour que ça devienne facile.'}
            </p>
          )}
          <p className="mt-2 text-xs">
            Le niveau suivant s’ouvre quand {MASTER_OK} des {WINDOW} derniers calculs sont justes du premier coup, faits sans trop chercher. Si
            elle se trompe souvent, l’app revient au niveau d’avant pour consolider. Un calcul raté revient un peu plus tard.
          </p>
        </div>

        {lastDays.length > 0 && (
          <div>
            <p className="font-extrabold text-ink">Ces derniers jours</p>
            <ul className="mt-2 flex flex-col gap-1">
              {lastDays.map(([d, x]) => (
                <li key={d} className="flex justify-between">
                  <span>{d === today ? 'Aujourd’hui' : new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span className="font-bold text-ink">
                    {x.done} calcul{x.done > 1 ? 's' : ''} · {pct(x.ok, x.done)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {practised.length > 0 && (
          <div>
            <p className="font-extrabold text-ink">Par niveau</p>
            <ul className="mt-2 flex flex-col gap-1">
              {practised.map((l) => {
                const s = state.stats[l.id];
                return (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span>
                      {s.mastered && <span aria-label="maîtrisé">✓ </span>}
                      {l.label}
                    </span>
                    <span className="whitespace-nowrap font-bold text-ink">
                      {s.answered} · {pct(s.firstTry, s.answered)} · {secs(s.ms, s.answered)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
