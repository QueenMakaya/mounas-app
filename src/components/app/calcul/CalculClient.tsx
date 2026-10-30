'use client';

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import BackButton from '@/components/app/BackButton';
import { CalculIcon } from '@/components/app/AppSections';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/app/DrawingCanvas';
import KidIcon from '@/components/app/kid/KidIcon';
import { playChime } from '@/lib/chime';
import { localDate, readPref, writePref } from '@/lib/progress';
import { preloadSpeech, useSpeech } from '@/lib/useSpeech';
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
type Entry = 'jetons' | 'clavier';

const LS_ENTRY = 'mounas_calcul_saisie';

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
  // Each calculation is said number by number: fetch the one on screen ahead of the tap.
  useEffect(() => {
    if (problem) preloadSpeech(problemSaid(problem).split(' '));
  }, [problem]);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  /** The current series: one entry per calculation answered (right the first time or not). */
  const [series, setSeries] = useState<boolean[]>([]);
  const [session, setSession] = useState({ done: 0, ok: 0 });
  const [change, setChange] = useState<Change>(null);
  const [screen, setScreen] = useState<'start' | 'calc' | 'page' | 'end'>('start');
  const [scratchOpen, setScratchOpen] = useState(false);
  /** How the child answers: big number tokens, or the device's keyboard (its own choice, kept on the device). */
  const [entry, setEntry] = useState<Entry>('jetons');
  const answerRef = useRef<HTMLInputElement>(null);
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
    setEntry(readPref(LS_ENTRY) === 'clavier' ? 'clavier' : 'jetons');
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
  // The device keyboard (« Clavier »): same rules as the tokens.
  const typed = (value: string) => {
    if (!problem || feedback === 'ok' || feedback === 'shown') return;
    if (feedback === 'wrong') setFeedback(null);
    const next = value.replace(/\D/g, '').slice(0, 4);
    setInput(next);
    if (next.length >= String(problem.answer).length) check(next);
  };
  const chooseEntry = (e: Entry) => {
    setEntry(e);
    writePref(LS_ENTRY, e);
    if (e === 'clavier') answerRef.current?.focus();
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
            <CalcStage
              problem={problem}
              input={input}
              feedback={feedback}
              accent={accent}
              series={series}
              entry={entry}
              onEntry={chooseEntry}
              onType={typed}
              onDigit={press}
              onErase={erase}
              onCheck={() => check(input)}
              onNext={() => advance(series.length)}
              onStop={stop}
              canSpeak={canSpeak}
              speak={speak}
              scratch={scratch}
              scratchOpen={scratchOpen}
              onScratch={() => setScratchOpen((o) => !o)}
              inputRef={answerRef}
            />
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

/** The visible part of the screen (it shrinks when the device keyboard opens). */
function useVisualViewport() {
  const [vp, setVp] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    const update = () => setVp(v ? { height: v.height, top: v.offsetTop } : { height: window.innerHeight, top: 0 });
    update();
    v?.addEventListener('resize', update);
    v?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      v?.removeEventListener('resize', update);
      v?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return vp;
}

/** The height of an element, for the scratch pad's canvas. */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(Math.floor(el.clientHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

/*
 * A series in progress takes the whole screen, sized to it: the calculation
 * grows or shrinks with the space left (CSS container units), so whether it is
 * on one line or in columns, with the tokens, the device keyboard or the
 * scratch pad open, nothing ever needs scrolling.
 */
function CalcStage({
  problem,
  input,
  feedback,
  accent,
  series,
  entry,
  onEntry,
  onType,
  onDigit,
  onErase,
  onCheck,
  onNext,
  onStop,
  canSpeak,
  speak,
  scratch,
  scratchOpen,
  onScratch,
  inputRef,
}: {
  problem: Problem;
  input: string;
  feedback: Feedback;
  accent: string;
  series: boolean[];
  entry: Entry;
  onEntry: (e: Entry) => void;
  onType: (value: string) => void;
  onDigit: (d: string) => void;
  onErase: () => void;
  onCheck: () => void;
  onNext: () => void;
  onStop: () => void;
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  scratch: React.RefObject<DrawingCanvasHandle | null>;
  scratchOpen: boolean;
  onScratch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const vp = useVisualViewport();
  const [padRef, padHeight] = useHeight<HTMLDivElement>();
  const done = feedback === 'ok' || feedback === 'shown';

  // No page scroll behind the series.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard mode: keep the (invisible) answer field focused, so the device keyboard stays open.
  useEffect(() => {
    if (entry === 'clavier') inputRef.current?.focus({ preventScroll: true });
  }, [entry, problem, inputRef]);

  return (
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-cream font-body"
      style={{ top: vp?.top ?? 0, height: vp ? vp.height : '100dvh' }}
      role="dialog"
      aria-label="Série de calculs"
    >
      {/* Top bar: stop, the ten dots, how to answer, listen. */}
      <div className="flex items-center gap-2 px-3 pb-1 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <button type="button" onClick={onStop} className="h-10 flex-shrink-0 rounded-full bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/15">
          ✕ <span className="hidden sm:inline">J’ai fini</span>
        </button>
        <div className="min-w-0 flex-1">
          <SeriesDots series={series} current={done ? -1 : series.length} accent={accent} />
        </div>
        <div role="radiogroup" aria-label="Répondre avec" className="flex flex-shrink-0 rounded-full bg-white p-0.5 ring-1 ring-ink/15">
          {(
            [
              ['jetons', '🔢', 'Jetons'],
              ['clavier', '⌨️', 'Clavier'],
            ] as const
          ).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={entry === value}
              aria-label={label}
              onClick={() => onEntry(value)}
              className={`h-9 rounded-full px-2.5 text-sm font-bold sm:px-3 ${entry === value ? 'bg-ink text-cream' : 'text-ink-soft'}`}
            >
              {icon}
              <span className="hidden sm:inline"> {label}</span>
            </button>
          ))}
        </div>
        {canSpeak && (
          <button
            type="button"
            onClick={() => speak(problemSaid(problem), 0.8)}
            aria-label={`Écouter : ${problemSaid(problem)}`}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-lg ring-1 ring-ink/15"
          >
            🔈
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:flex-row sm:gap-4">
        {/* The calculation and the answer. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <label htmlFor="calcul-reponse" className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
            <ProblemView problem={problem} input={input} feedback={feedback} accent={accent} caret={entry === 'clavier' && !done} />
          </label>
          {/* Invisible field that receives the device keyboard (16px so iOS doesn't zoom). */}
          <input
            ref={inputRef}
            id="calcul-reponse"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            enterKeyHint="done"
            autoComplete="off"
            aria-label="Ta réponse"
            value={input}
            readOnly={done || entry !== 'clavier'}
            tabIndex={entry === 'clavier' ? 0 : -1}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (feedback === 'shown') onNext();
              else onCheck();
            }}
            className="pointer-events-none absolute h-px w-px opacity-0"
            style={{ fontSize: 16 }}
          />
          <div className="flex h-12 flex-shrink-0 items-center justify-center gap-3" aria-live="polite">
            {feedback === 'ok' && <p className="animate-pop font-display text-2xl font-bold text-[#2D9B6F]">Bravo ! ✓</p>}
            {feedback === 'wrong' && <p className="font-bold text-morange-ink">Presque ! Essaie encore.</p>}
            {feedback === 'shown' && (
              <button type="button" onClick={onNext} className="min-h-11 rounded-full bg-ink px-6 font-extrabold text-cream active:scale-95">
                Suivant →
              </button>
            )}
            {!feedback && input && (
              <>
                <button type="button" onClick={onErase} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-ink ring-1 ring-ink/15">
                  <KidIcon name="gomme" className="h-5 w-5" /> Effacer
                </button>
                <button type="button" onClick={onCheck} className="min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-cream">
                  ✓ C’est ma réponse
                </button>
              </>
            )}
            {!feedback && !input && entry === 'clavier' && (
              <button type="button" onClick={() => inputRef.current?.focus()} className="text-sm font-bold text-ink-soft underline underline-offset-4">
                Touche ici pour écrire
              </button>
            )}
          </div>
          {entry === 'jetons' && <NumberTokens onDigit={onDigit} />}
          <button
            type="button"
            onClick={onScratch}
            aria-expanded={scratchOpen}
            className="mx-auto mt-2 flex min-h-10 flex-shrink-0 items-center gap-2 rounded-full bg-sand px-4 text-sm font-bold text-ink sm:hidden"
          >
            ✏️ {scratchOpen ? 'Fermer le brouillon' : 'Mon brouillon'}
          </button>
        </div>

        {/* The scratch pad: beside the calculation on a tablet, under it (when opened) on a phone. */}
        <div className={`${scratchOpen ? 'flex' : 'hidden'} min-h-0 flex-col sm:flex sm:flex-1 ${scratchOpen ? 'basis-[38%] sm:basis-auto' : ''}`}>
          <div className="mb-1 flex flex-shrink-0 items-center justify-between px-1 text-xs font-bold text-ink-soft">
            <span>✏️ Mon brouillon</span>
            <button type="button" onClick={() => scratch.current?.clear()} className="inline-flex items-center gap-1 underline underline-offset-4">
              <KidIcon name="gomme" className="h-4 w-4" /> Effacer
            </button>
          </div>
          <div ref={padRef} className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/10">
            {padHeight > 0 && <DrawingCanvas ref={scratch} height={padHeight} paper="blanc" size={6} color="#1A1A1A" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The calculation, as big as its box allows: on one line, or in columns (as
 * on paper) for two-digit additions and subtractions. Sized with container
 * units so it always fits without scrolling.
 */
function ProblemView({ problem: p, input, feedback, accent, caret }: { problem: Problem; input: string; feedback: Feedback; accent: string; caret: boolean }) {
  const symbol = opInfo(p.op).symbol;
  const columns = p.op !== 'multiplication' && (p.a >= 10 || p.b >= 10);
  const color = feedback === 'shown' ? '#C7600A' : feedback === 'ok' ? '#2D9B6F' : '#1A1A1A';
  const answer = (
    <span
      className={`inline-flex min-w-[1.6ch] items-baseline justify-center border-b-[0.08em] border-dashed px-[0.1em] ${columns ? 'w-full justify-end' : ''} ${feedback === 'wrong' ? 'animate-shake' : ''} ${feedback === 'ok' ? 'animate-pop' : ''}`}
      style={{ color, borderColor: feedback === 'ok' ? '#2D9B6F' : accent }}
    >
      {input || (caret ? '' : '\u00a0')}
      {caret && <span className="ml-[0.05em] inline-block h-[0.8em] w-[0.06em] animate-pulse self-center" style={{ backgroundColor: accent }} />}
    </span>
  );
  // Columns: 3 rows (≈ 3.6 line heights) and ~4 characters wide. One line: its width in em, measured
  // (≈ 2.1em of signs and gaps + 0.62em per digit, the answer counted at its real length).
  const digits = String(p.a).length + String(p.b).length + Math.max(1.6, String(p.answer).length);
  const fontSize = columns ? 'min(24cqh, 26cqw, 8rem)' : `min(55cqh, ${(92 / (2.1 + 0.62 * digits)).toFixed(1)}cqw, 8rem)`;
  return (
    <div className="font-display font-bold tabular-nums leading-tight text-ink" style={{ fontSize }} aria-label={`${p.a} ${symbol} ${p.b} égale ?`}>
      {columns ? (
        <div className="text-right">
          <div>{p.a}</div>
          <div>
            <span className="mr-[0.3em]" style={{ color: accent }}>{symbol}</span>
            {p.b}
          </div>
          <div className="mt-[0.05em] border-t-[0.08em] border-ink">{answer}</div>
        </div>
      ) : (
        <p className="flex items-baseline justify-center gap-x-[0.25em] whitespace-nowrap">
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
function NumberTokens({ onDigit }: { onDigit: (d: string) => void }) {
  return (
    <div className="mx-auto grid w-full max-w-sm flex-shrink-0 grid-cols-5 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d, i) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(d)}
          className="mx-auto flex aspect-square h-[min(3.75rem,8.5dvh)] items-center justify-center rounded-full font-display text-[min(1.9rem,4.5dvh)] font-bold text-ink shadow-[0_3px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 active:translate-y-0.5 active:shadow-none"
          style={{ backgroundColor: TOKEN_COLORS[i % TOKEN_COLORS.length] }}
        >
          {d}
        </button>
      ))}
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
