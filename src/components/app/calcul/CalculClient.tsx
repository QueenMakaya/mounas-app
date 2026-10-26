'use client';

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import BackButton from '@/components/app/BackButton';
import { CalculIcon } from '@/components/app/AppSections';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/app/DrawingCanvas';
import { playChime } from '@/lib/chime';
import { localDate } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import {
  LEVELS,
  MASTER_OK,
  OPS,
  SERIES,
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
  setMode,
  subscribeCalcul,
  type CalcMode,
  type CalculState,
  type Change,
  type Problem,
} from '@/lib/calcul';

/*
 * The calculation drills, Kumon style: series of 10, one calculation at a
 * time, written big in the middle of the screen. The child answers with big
 * number tokens (no calculator: the calculation stays the star), the answer
 * is checked as soon as it has the right number of digits, and the next one
 * comes. A scratch pad sits beside it (below on a phone) for circles, sticks
 * or whatever method the child uses. No limit: series follow one another.
 * The parent area (closed by default) shows where the child is and lets the
 * parent pick the level and « Mélange » or « Seulement ce niveau ».
 */

type Feedback = 'ok' | 'wrong' | 'shown' | null;

const ACCENT: Record<string, string> = { addition: '#0E8C80', soustraction: '#1D6FA4', multiplication: '#5B1F8C' };
/** The number tokens, in the app's soft colours. */
const TOKEN_COLORS = ['#FDECEE', '#FEF3E2', '#E3F8F5', '#E4F0F8', '#F1E9F8'];

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
  /** The current series: one entry per calculation answered (right the first time or not). */
  const [series, setSeries] = useState<boolean[]>([]);
  const [session, setSession] = useState({ done: 0, ok: 0 });
  const [change, setChange] = useState<Change>(null);
  const [screen, setScreen] = useState<'start' | 'calc' | 'page' | 'end'>('start');
  const [scratchOpen, setScratchOpen] = useState(false);
  const scratch = useRef<DrawingCanvasHandle>(null);
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
    scratch.current?.clear();
    shownAt.current = performance.now();
  };

  const startSeries = () => {
    setSeries([]);
    setChange(null);
    setScreen('calc');
    show(readCalcul(), null);
  };

  /** After a calculation: the next one, or the end of the page. */
  const advance = (done: number) => {
    if (done >= SERIES) {
      playChime();
      setScreen('page');
      setProblem(null);
      return;
    }
    show(readCalcul(), problem);
  };

  const check = (value: string) => {
    if (!problem || !value || feedback === 'ok' || feedback === 'shown') return;
    const right = Number(value) === problem.answer;
    let done = series.length;
    if (tries === 0) {
      // Only the first answer counts, as on a Kumon page corrected afterwards.
      const result = recordAnswer(readCalcul(), problem, right, performance.now() - shownAt.current);
      saveCalcul(result.state);
      done += 1;
      setSeries((s) => [...s, right]);
      setSession((s) => ({ done: s.done + 1, ok: s.ok + (right ? 1 : 0) }));
      if (result.change) setChange(result.change);
      if (result.change === 'up' && canSpeak) speak('Bravo, tu passes au niveau suivant !', 0.9);
    }
    if (right) {
      setFeedback('ok');
      timer.current = window.setTimeout(() => advance(done), 700);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setFeedback('wrong');
      timer.current = window.setTimeout(() => setInput(''), 500);
      if (canSpeak) speak('Presque ! Essaie encore.', 0.9);
      return;
    }
    // Second miss: the answer is shown, and the calculation will come back.
    setFeedback('shown');
    setInput(String(problem.answer));
  };

  // Checked as soon as the answer has as many digits as the right one.
  const press = (d: string) => {
    if (!problem || feedback === 'ok' || feedback === 'shown') return;
    if (feedback === 'wrong') setFeedback(null);
    const next = input.length >= 4 ? input : input === '0' ? d : input + d;
    setInput(next);
    if (next.length >= String(problem.answer).length) check(next);
  };
  const erase = () => {
    if (feedback === 'ok' || feedback === 'shown') return;
    setInput((v) => v.slice(0, -1));
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!problem || screen !== 'calc') return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') {
      if (feedback === 'shown') advance(series.length);
      else check(input);
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
  const pickMode = (mode: CalcMode) => {
    const next = setMode(readCalcul(), mode);
    saveCalcul(next);
    if (problem) show(next, null);
  };

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setProblem(null);
    setScreen('end');
  };

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <BackButton />
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <CalculIcon /> Le calcul
          </h1>
        </div>

        <section aria-label="Les calculs" className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5">
          <div className="h-2" style={{ backgroundColor: accent }} />

          {change === 'up' && (
            <p className="animate-rise mx-5 mt-4 rounded-2xl bg-[#E5F4EC] px-4 py-3 text-center font-display text-lg font-bold text-[#1F6B4C]" aria-live="polite">
              🎉 Niveau suivant : {levelById(state.level).label} !
            </p>
          )}
          {change === 'down' && (
            <p className="animate-rise mx-5 mt-4 rounded-2xl bg-[#FEF3E2] px-4 py-3 text-center text-sm font-bold text-morange-ink" aria-live="polite">
              On revoit un peu le niveau d’avant pour bien le consolider : {levelById(state.level).label}.
            </p>
          )}

          {screen === 'start' && (
            <div className="px-5 py-10 text-center sm:py-14">
              <p className="font-display text-5xl font-bold" aria-hidden="true" style={{ color: ACCENT[levelById(state.level).op] }}>
                {levelById(state.level).short}
              </p>
              <p className="mt-4 font-display text-xl font-bold text-ink">Une série de {SERIES} calculs</p>
              <p className="mt-1 text-sm text-ink-soft">
                {levelById(state.level).label}
                {state.mode === 'melange' ? ' · avec des calculs déjà vus' : ''}
              </p>
              <button
                type="button"
                onClick={startSeries}
                className="mt-8 min-h-16 w-full max-w-sm rounded-full px-6 text-xl font-extrabold text-cream shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: ACCENT[levelById(state.level).op] }}
              >
                ▶ C’est parti !
              </button>
            </div>
          )}

          {screen === 'calc' && problem && (
            <div className="p-4 sm:p-6">
              <SeriesDots series={series} current={feedback === 'ok' || feedback === 'shown' ? -1 : series.length} accent={accent} />

              <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:items-start">
                <div>
                  <ProblemView problem={problem} input={input} feedback={feedback} accent={accent} />
                  <div className="flex min-h-12 items-center justify-center gap-3" aria-live="polite">
                    {feedback === 'ok' && <p className="animate-pop font-display text-2xl font-bold text-[#2D9B6F]">Bravo ! ✓</p>}
                    {feedback === 'wrong' && <p className="font-bold text-morange-ink">Presque ! Essaie encore.</p>}
                    {feedback === 'shown' && (
                      <button type="button" onClick={() => advance(series.length)} className="min-h-12 rounded-full bg-ink px-6 font-extrabold text-cream active:scale-95">
                        Suivant →
                      </button>
                    )}
                    {!feedback && canSpeak && (
                      <button
                        type="button"
                        onClick={() => speak(problemSaid(problem), 0.8)}
                        aria-label={`Écouter : ${problemSaid(problem)}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl ring-1 ring-ink/15"
                      >
                        🔈
                      </button>
                    )}
                  </div>
                  <NumberTokens onDigit={press} onErase={erase} onCheck={() => check(input)} canCheck={Boolean(input) && !feedback} />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setScratchOpen((o) => !o)}
                    aria-expanded={scratchOpen}
                    className="mx-auto flex min-h-11 items-center gap-2 rounded-full bg-sand px-5 font-bold text-ink sm:hidden"
                  >
                    ✏️ {scratchOpen ? 'Fermer le brouillon' : 'Mon brouillon'}
                  </button>
                  <div className={`${scratchOpen ? 'block' : 'hidden'} mt-3 sm:mt-0 sm:block`}>
                    <p className="mb-2 hidden text-center text-sm font-extrabold text-ink-soft sm:block">✏️ Mon brouillon</p>
                    <div className="overflow-hidden rounded-3xl bg-cream ring-1 ring-ink/10">
                      <DrawingCanvas ref={scratch} height={260} paper="blanc" size={6} color="#1A1A1A" />
                    </div>
                    <p className="mt-2 text-center text-xs text-ink-soft">
                      Pour faire des ronds, des bâtons… Il s’efface tout seul au calcul suivant.{' '}
                      <button type="button" onClick={() => scratch.current?.clear()} className="font-bold text-ink underline underline-offset-4">
                        Effacer
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              <button type="button" onClick={stop} className="mx-auto mt-6 flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-ink-soft ring-1 ring-ink/10 hover:bg-sand">
                J’ai fini pour aujourd’hui
              </button>
            </div>
          )}

          {screen === 'page' && <PageDone series={series} onMore={startSeries} onStop={stop} />}
          {screen === 'end' && <Summary session={session} onMore={startSeries} />}
        </section>

        <ParentArea state={state} onPick={pickLevel} onMode={pickMode} />
      </div>
    </main>
  );
}

/** Ten dots, like the calculations of a Kumon page: green right, orange missed. */
function SeriesDots({ series, current, accent }: { series: boolean[]; current: number; accent: string }) {
  return (
    <ol className="flex justify-center gap-1.5" aria-label={`Calcul ${Math.min(series.length + 1, SERIES)} sur ${SERIES}`}>
      {Array.from({ length: SERIES }, (_, i) => (
        <li
          key={i}
          className={`h-3 w-3 rounded-full transition-colors ${i === current ? 'scale-125' : ''}`}
          style={{ backgroundColor: i < series.length ? (series[i] ? '#2D9B6F' : '#F4A340') : i === current ? accent : 'rgba(26,26,26,0.12)' }}
        />
      ))}
    </ol>
  );
}

/** The calculation, big: on one line, or in columns (as on paper) for two-digit additions and subtractions. */
function ProblemView({ problem: p, input, feedback, accent }: { problem: Problem; input: string; feedback: Feedback; accent: string }) {
  const symbol = opInfo(p.op).symbol;
  const columns = p.op !== 'multiplication' && (p.a >= 10 || p.b >= 10);
  const color = feedback === 'shown' ? '#C7600A' : feedback === 'ok' ? '#2D9B6F' : '#1A1A1A';
  const answer = (
    <span
      className={`inline-flex min-w-[1.6ch] justify-center border-b-[6px] border-dashed px-2 ${columns ? 'w-full justify-end' : ''} ${feedback === 'wrong' ? 'animate-shake' : ''} ${feedback === 'ok' ? 'animate-pop' : ''}`}
      style={{ color, borderColor: feedback === 'ok' ? '#2D9B6F' : accent }}
    >
      {input || ' '}
    </span>
  );
  return (
    <div className="flex justify-center py-6 font-display font-bold tabular-nums text-ink sm:py-10" aria-label={`${p.a} ${symbol} ${p.b} égale ?`}>
      {columns ? (
        <div className="text-right text-7xl leading-tight sm:text-8xl">
          <div>{p.a}</div>
          <div>
            <span className="mr-4" style={{ color: accent }}>{symbol}</span>
            {p.b}
          </div>
          <div className="mt-1 border-t-[6px] border-ink pt-1">{answer}</div>
        </div>
      ) : (
        <p className="flex flex-wrap items-baseline justify-center gap-x-4 text-7xl sm:text-8xl">
          <span>{p.a}</span>
          <span style={{ color: accent }}>{symbol}</span>
          <span>{p.b}</span>
          <span>=</span>
          {answer}
        </p>
      )}
    </div>
  );
}

/** Ten round number tokens on two rows, like number cards on the table: no calculator. */
function NumberTokens({ onDigit, onErase, onCheck, canCheck }: { onDigit: (d: string) => void; onErase: () => void; onCheck: () => void; canCheck: boolean }) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="grid grid-cols-5 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => onDigit(d)}
            className="aspect-square rounded-full font-display text-3xl font-bold text-ink shadow-[0_3px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 active:translate-y-0.5 active:shadow-none"
            style={{ backgroundColor: TOKEN_COLORS[i % TOKEN_COLORS.length] }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-3">
        <button type="button" onClick={onErase} className="min-h-11 rounded-full bg-white px-5 font-bold text-ink ring-1 ring-ink/15">
          ⌫ Effacer
        </button>
        {canCheck && (
          <button type="button" onClick={onCheck} className="min-h-11 rounded-full bg-ink px-5 font-bold text-cream">
            ✓ C’est ma réponse
          </button>
        )}
      </div>
    </div>
  );
}

/** End of a series of 10: a star, the result, and another series if she wants. */
function PageDone({ series, onMore, onStop }: { series: boolean[]; onMore: () => void; onStop: () => void }) {
  const ok = series.filter(Boolean).length;
  return (
    <div className="animate-rise px-5 py-10 text-center">
      <div className="animate-badge mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-mamber to-[#F7C26B] text-5xl shadow-[0_6px_0_#D98A22]" aria-hidden="true">
        ⭐
      </div>
      <h2 className="mt-5 font-display text-3xl font-bold text-ink">Série finie, bravo !</h2>
      <p className="mt-2 text-ink-soft">
        {ok} sur {series.length} justes du premier coup. Les calculs ratés reviendront pour s’entraîner.
      </p>
      <button type="button" onClick={onMore} className="mt-7 min-h-16 w-full max-w-sm rounded-full bg-ink px-6 text-xl font-extrabold text-cream shadow-lg active:scale-[0.98]">
        ▶ Une autre série
      </button>
      <button type="button" onClick={onStop} className="mx-auto mt-3 flex min-h-11 items-center rounded-full px-5 font-bold text-ink ring-1 ring-ink/15">
        J’ai fini pour aujourd’hui
      </button>
    </div>
  );
}

function Summary({ session, onMore }: { session: { done: number; ok: number }; onMore: () => void }) {
  return (
    <div className="animate-rise px-5 py-10 text-center">
      <p className="text-5xl" aria-hidden="true">🙌</p>
      <h2 className="mt-3 font-display text-2xl font-bold text-ink">
        {session.done === 0 ? 'À bientôt !' : `${session.done} ${session.done === 1 ? 'calcul' : 'calculs'} aujourd’hui, bravo pour ton effort !`}
      </h2>
      {session.done > 0 && (
        <p className="mt-2 text-ink-soft">
          {session.ok} juste{session.ok > 1 ? 's' : ''} du premier coup.
        </p>
      )}
      <button type="button" onClick={onMore} className="mt-6 min-h-14 w-full max-w-sm rounded-full bg-ink px-6 text-lg font-extrabold text-cream shadow-md active:scale-[0.98]">
        ▶ Encore une série
      </button>
    </div>
  );
}

const pct = (a: number, b: number) => (b === 0 ? '—' : `${Math.round((a / b) * 100)} %`);
const secs = (ms: number, n: number) => (n === 0 ? '—' : `${(ms / n / 1000).toFixed(1).replace('.', ',')} s`);

/** For the parent: the level (to match the book), where she stands, and what she did. */
function ParentArea({ state, onPick, onMode }: { state: CalculState; onPick: (id: string) => void; onMode: (mode: CalcMode) => void }) {
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
        <fieldset>
          <legend className="font-extrabold text-ink">Les séries</legend>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                ['melange', 'Mélange (conseillé)', 'Comme une page Kumon : surtout son niveau, avec des calculs déjà vus pour ne pas les oublier.'],
                ['niveau', 'Seulement son niveau', 'Uniquement les calculs du niveau choisi ci-dessous.'],
              ] as const
            ).map(([value, title, text]) => (
              <label key={value} className={`flex cursor-pointer gap-3 rounded-2xl p-3 ring-1 ${state.mode === value ? 'bg-cream ring-2 ring-ink' : 'ring-ink/10'}`}>
                <input type="radio" name="calcul-mode" value={value} checked={state.mode === value} onChange={() => onMode(value)} className="mt-1 h-4 w-4 accent-ink" />
                <span>
                  <span className="block font-bold text-ink">{title}</span>
                  <span className="block">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
