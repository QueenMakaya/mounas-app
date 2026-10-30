'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/app/BackButton';
import { LEVELS } from '@/lib/levels';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { readPref, writePref } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import { playChime } from '@/lib/chime';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/app/DrawingCanvas';
import WritingModePicker, { useWritingMode, type WritingMode } from '@/components/app/WritingModePicker';
import KidIcon from '@/components/app/kid/KidIcon';

/*
 * The dictation notebook, in series like the calcul: the parent picks the
 * words (a level or their own list) and how many, then the app dictates one
 * word at a time and says it again every few seconds until « Suivant ». The
 * child writes with a finger/stylus on Seyès paper, or types.
 *
 * What the child wrote is kept, word by word: corrected as we go (the
 * correction under each word already written) or all together at the end.
 * Words marked « à revoir » come back first in the next series.
 */

export type DicteeWord = { word: string; level: string };

const INKS = [
  { name: 'Bleu', value: '#1D3F9E' },
  { name: 'Noir', value: '#1A1A1A' },
  { name: 'Rouge', value: '#E63946' },
  { name: 'Vert', value: '#2D9B6F' },
  { name: 'Violet', value: '#5B1F8C' },
];
const SIZES = [
  { name: 'Fin', value: 4 },
  { name: 'Moyen', value: 7 },
  { name: 'Gros', value: 12 },
];

const COUNTS = [5, 10, 20] as const;
const REPEATS = [0, 10, 20, 30] as const;

const LS_OWN = 'mounas_dictee_words';
const LS_LEVEL = 'mounas_last_difficulty';
const LS_SETTINGS = 'mounas_dictee_reglages';
/** { [level]: words already dictated } — the next series takes new ones first. */
const LS_SEEN = 'mounas_dictee_vus';
/** { [level]: words marked « à revoir » } — they come back first. */
const LS_REVIEW = 'mounas_dictee_revoir';
const OWN = 'mine';

type Mode = 'doigt' | 'clavier';
type CorrectWhen = 'direct' | 'fin';
type Settings = { count: number; repeat: number; correct: CorrectWhen };
const DEFAULTS: Settings = { count: 5, repeat: 20, correct: 'direct' };

/** One word of the series as the child wrote it. */
type Trace = { word: string; img?: string; typed?: string; right: boolean | null };

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(readPref(key) || 'null');
    return v && typeof v === 'object' ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The series for a level: words to review first, then words not dictated yet, then the others. */
function pickSeries(level: string, all: string[], count: number): string[] {
  const review = (readJson<Record<string, string[]>>(LS_REVIEW, {})[level] ?? []).filter((w) => all.includes(w));
  const seen = new Set(readJson<Record<string, string[]>>(LS_SEEN, {})[level] ?? []);
  const rest = all.filter((w) => !review.includes(w));
  const fresh = shuffle(rest.filter((w) => !seen.has(w)));
  const old = shuffle(rest.filter((w) => seen.has(w)));
  return [...shuffle(review), ...fresh, ...old].slice(0, count);
}

function remember(level: string, traces: Trace[]) {
  const seen = readJson<Record<string, string[]>>(LS_SEEN, {});
  const all = new Set([...(seen[level] ?? []), ...traces.map((t) => t.word)]);
  writePref(LS_SEEN, JSON.stringify({ ...seen, [level]: [...all] }));
  const review = readJson<Record<string, string[]>>(LS_REVIEW, {});
  const keep = (review[level] ?? []).filter((w) => !traces.some((t) => t.word === w && t.right === true));
  const add = traces.filter((t) => t.right === false).map((t) => t.word);
  writePref(LS_REVIEW, JSON.stringify({ ...review, [level]: [...new Set([...keep, ...add])] }));
}

/** The right spelling, in the writing the child uses (capitals or school cursive). */
function Correction({ word, writing, small = false }: { word: string; writing: WritingMode; small?: boolean }) {
  return writing === 'capitales' ? (
    <span className={`font-bold text-[#1D3F9E] ${small ? 'text-2xl leading-snug' : 'text-4xl leading-[1.6] sm:text-5xl'}`} style={{ fontFamily: 'var(--font-read)' }}>
      {word.toLocaleUpperCase('fr')}
    </span>
  ) : (
    // The school cursive is ~2.4em tall from the top of the "l" to the tail of the "g".
    <span className={`text-[#1D3F9E] ${small ? 'text-2xl leading-[2.4]' : 'text-4xl leading-[2.5] sm:text-5xl'}`} style={{ fontFamily: 'var(--font-cursive)' }}>
      {word}
    </span>
  );
}

/** Typed answer, letter by letter: green when right, red with the expected letter under it. */
function TypedDiff({ word, typed }: { word: string; typed: string }) {
  const target = Array.from(word.trim());
  const got = Array.from(typed.trim());
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {Array.from({ length: Math.max(target.length, got.length) }, (_, i) => {
        const want = target[i] ?? '';
        const g = got[i] ?? '';
        const ok = want.toLocaleLowerCase('fr') === g.toLocaleLowerCase('fr');
        return (
          <span
            key={i}
            className={`flex h-14 w-10 flex-col items-center justify-center rounded-xl text-2xl font-bold text-cream ${ok ? 'bg-[#2D9B6F]' : 'bg-mred'}`}
            title={ok ? 'juste' : `attendu : ${want || '(rien)'}`}
          >
            {g === ' ' ? '␣' : g || '_'}
            {!ok && <span className="text-xs font-normal opacity-90">{want === ' ' ? '␣' : want || '–'}</span>}
          </span>
        );
      })}
    </div>
  );
}

export default function DicteeClient({ words }: { words: DicteeWord[] }) {
  const { supported: canSpeak, speakSeries } = useSpeech();
  const [source, setSource] = useState('');
  const [own, setOwn] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // The series: null before it starts.
  const [series, setSeries] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [finished, setFinished] = useState(false);

  const [mode, setMode] = useState<Mode>('doigt');
  const [showWord, setShowWord] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [ink, setInk] = useState(INKS[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [eraser, setEraser] = useState(false);
  const [bigLines, setBigLines] = useState(true);
  // Same choice as the "Écrire" step: it sets the paper and how the correction is shown.
  const [writing, setWriting] = useWritingMode();
  const [canvasH, setCanvasH] = useState(420);
  const canvas = useRef<DrawingCanvasHandle>(null);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);

  // Restore the parent's own list, last level and settings; size the page to the screen.
  useEffect(() => {
    const fit = () => setCanvasH(Math.max(260, Math.min(560, window.innerHeight - 380)));
    const first = requestAnimationFrame(() => {
      const saved = readJson<unknown>(LS_OWN, null);
      if (Array.isArray(saved)) setOwn(saved.filter((w): w is string => typeof w === 'string'));
      const lastLevel = readPref(LS_LEVEL) ?? '';
      if (LEVELS.some((l) => l.value === lastLevel)) setSource(lastLevel);
      const s = readJson<Partial<Settings>>(LS_SETTINGS, {});
      setSettings({
        count: COUNTS.includes(s.count as (typeof COUNTS)[number]) ? (s.count as number) : DEFAULTS.count,
        repeat: REPEATS.includes(s.repeat as (typeof REPEATS)[number]) ? (s.repeat as number) : DEFAULTS.repeat,
        correct: s.correct === 'fin' ? 'fin' : 'direct',
      });
      fit();
    });
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener('resize', fit);
    };
  }, []);

  const list = useMemo(
    () => (source === OWN ? own : [...new Set(words.filter((w) => w.level === source).map((w) => w.word.toLocaleLowerCase('fr')))]),
    [source, own, words],
  );
  const word = series?.[index] ?? '';
  const isLast = !!series && index === series.length - 1;
  const asWeGo = settings.correct === 'direct';

  const changeSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writePref(LS_SETTINGS, JSON.stringify(next));
  };

  const saveOwn = (next: string[]) => {
    setOwn(next);
    writePref(LS_OWN, JSON.stringify(next));
  };

  // Like a teacher: the word in a sentence, then once more slowly.
  const dictate = (w: string) => w && speakSeries([{ text: `Écris : ${w}.`, rate: 0.8 }, { text: w, rate: 0.55 }], () => {});
  // Sound by sound, then the whole word — never letter names.
  const dictateSounds = () => {
    if (!word) return;
    const heard = wordSounds(word).filter((s) => s.kind !== 'silent' && s.kind !== 'separator' && s.key);
    speakSeries([...heard.map((s) => ({ text: SOUNDS[s.key].say, rate: 0.6, sound: s.key })), { text: word, rate: 0.7 }], () => {});
  };

  // Said again every few seconds until « Suivant » (or the correction is open).
  useEffect(() => {
    if (!series || finished || !word || !settings.repeat || !canSpeak || showCorrection || checked) return;
    const id = window.setInterval(() => dictate(word), settings.repeat * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `dictate` only depends on `word`
  }, [series, finished, word, settings.repeat, canSpeak, showCorrection, checked]);

  const resetPage = () => {
    canvas.current?.clear();
    setTyped('');
    setChecked(false);
    setShowCorrection(false);
    setShowWord(false);
    setEraser(false);
  };

  const pick = (next: string) => {
    setSource(next);
    if (next !== OWN) writePref(LS_LEVEL, next);
  };

  const start = () => {
    const chosen = source === OWN ? own.slice(0, settings.count) : pickSeries(source, list, settings.count);
    if (chosen.length === 0) return;
    resetPage();
    setSeries(chosen);
    setIndex(0);
    setTraces([]);
    setFinished(false);
    dictate(chosen[0]); // inside the tap: tablets only let sound start from one
  };

  const stop = () => {
    resetPage();
    setSeries(null);
    setFinished(false);
    setTraces([]);
  };

  /** Keep what was written for this word, then the next word (or the end). */
  const next = () => {
    if (!series) return;
    const empty = mode === 'doigt' ? (canvas.current?.isEmpty() ?? true) : !typed.trim();
    const trace: Trace = {
      word,
      img: mode === 'doigt' && !empty ? canvas.current?.toDataURL({ crop: true }) : undefined,
      typed: mode === 'clavier' && !empty ? typed : undefined,
      // Typed: the app knows. Handwritten: the parent says, when correcting.
      right: mode === 'clavier' && !empty ? normalize(typed) === normalize(word) : null,
    };
    const all = [...traces, trace];
    setTraces(all);
    resetPage();
    if (isLast) {
      setFinished(true);
      playChime();
      if (source !== OWN) remember(source, all);
    } else {
      setIndex(index + 1);
      dictate(series[index + 1]);
    }
  };

  const mark = (i: number, right: boolean) => {
    const all = traces.map((t, j) => (j === i ? { ...t, right: t.right === right ? null : right } : t));
    setTraces(all);
    if (finished && source !== OWN) remember(source, all);
  };

  const savePng = () => {
    const url = canvas.current?.toDataURL();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictee-${word || 'page'}.png`;
    link.click();
  };

  const isRight = normalize(typed) === normalize(word);
  const rightCount = traces.filter((t) => t.right === true).length;

  const chip = (on: boolean) =>
    `min-h-11 rounded-full px-4 text-sm font-extrabold transition-colors ${on ? 'bg-ink text-cream shadow-md' : 'bg-cream text-ink ring-1 ring-ink/10 hover:bg-sand'}`;
  const big = 'min-h-12 whitespace-nowrap rounded-full px-4 font-extrabold active:scale-95';
  const tool = 'min-h-10 rounded-full bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/10 active:scale-95 disabled:opacity-40';
  const label = 'mb-2 mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft';

  /** One word already written: the child's trace, and (when correcting) the right spelling and the parent's mark. */
  const traceCard = (t: Trace, i: number, correcting: boolean) => (
    <li key={i} className="rounded-2xl bg-white p-3 ring-1 ring-ink/10">
      <p className="mb-1 text-xs font-extrabold text-ink-soft">Mot {i + 1}</p>
      {t.img ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data: URL drawn on the device
        <img src={t.img} alt={`Le mot ${i + 1} écrit par l’enfant`} className="mx-auto max-h-28 w-auto max-w-full rounded-lg" />
      ) : t.typed ? (
        correcting ? <TypedDiff word={t.word} typed={t.typed} /> : <p className="text-center text-2xl font-bold text-[#1D3F9E]" style={{ fontFamily: 'var(--font-read)' }}>{t.typed}</p>
      ) : (
        <p className="py-4 text-center text-sm text-ink-soft">(rien d’écrit)</p>
      )}
      {correcting && (
        <>
          <div className="mt-2 rounded-xl bg-[#E8F8F1] px-2 pb-2 text-center">
            <Correction word={t.word} writing={writing} small />
          </div>
          <div className="mt-2 flex justify-center gap-2" role="group" aria-label={`Correction du mot ${i + 1}`}>
            <button
              type="button"
              onClick={() => mark(i, true)}
              aria-pressed={t.right === true}
              className={`min-h-10 rounded-full px-3 text-sm font-extrabold ring-1 ${t.right === true ? 'bg-[#2D9B6F] text-cream ring-[#2D9B6F]' : 'bg-white text-ink ring-ink/15'}`}
            >
              ✓ Juste
            </button>
            <button
              type="button"
              onClick={() => mark(i, false)}
              aria-pressed={t.right === false}
              className={`min-h-10 rounded-full px-3 text-sm font-extrabold ring-1 ${t.right === false ? 'bg-morange-ink text-cream ring-morange-ink' : 'bg-white text-ink ring-ink/15'}`}
            >
              🔁 À revoir
            </button>
          </div>
        </>
      )}
    </li>
  );

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <BackButton />
          {series && !finished && (
            <button type="button" onClick={stop} className="text-sm font-bold text-ink-soft underline underline-offset-4">
              Arrêter la dictée
            </button>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">📒 Mon cahier de dictée</h1>

        {/* ── Before: the parent chooses ── */}
        {!series && (
          <>
            <p className="mt-1 text-ink-soft">Une série de quelques mots, comme une page de calcul. L’app dicte, l’enfant écrit.</p>
            <section className="mt-5 rounded-[28px] border-2 border-dashed border-mamber/70 bg-white p-4 sm:p-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Pour le parent · les mots</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button key={l.value} type="button" onClick={() => pick(l.value)} aria-pressed={source === l.value} className={chip(source === l.value)}>
                    <span aria-hidden="true">{l.emoji}</span> {l.short}
                  </button>
                ))}
                <button type="button" onClick={() => pick(OWN)} aria-pressed={source === OWN} className={chip(source === OWN)}>
                  ✏️ Ma liste
                </button>
              </div>

              {source === OWN && (
                <div className="mt-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {own.map((w, i) => (
                      <span key={`${w}-${i}`} className="flex items-center gap-1 rounded-full bg-sand py-1 pl-3 pr-1 text-sm font-bold text-ink">
                        {w}
                        <button
                          type="button"
                          onClick={() => saveOwn(own.filter((_, j) => j !== i))}
                          className="rounded-full px-2 opacity-60 hover:opacity-100"
                          aria-label={`Retirer ${w}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const w = newWord.trim();
                      if (!w) return;
                      saveOwn([...own, w]);
                      setNewWord('');
                    }}
                  >
                    <input
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="Ajouter un mot ou une petite phrase…"
                      className="min-h-11 flex-1 rounded-full bg-cream px-4 text-base ring-1 ring-ink/15 outline-none focus:ring-2 focus:ring-mpurple"
                    />
                    <button className="min-h-11 rounded-full bg-mpurple px-4 font-bold text-cream">+ Ajouter</button>
                  </form>
                </div>
              )}

              {source && (
                <>
                  <p className={label}>Combien de mots</p>
                  <div className="flex flex-wrap gap-2">
                    {COUNTS.map((n) => (
                      <button key={n} type="button" onClick={() => changeSettings({ count: n })} aria-pressed={settings.count === n} className={chip(settings.count === n)}>
                        {n} mots
                      </button>
                    ))}
                  </div>
                  {canSpeak && (
                    <>
                      <p className={label}>Redire le mot tant qu’on n’a pas touché « Suivant »</p>
                      <div className="flex flex-wrap gap-2">
                        {REPEATS.map((n) => (
                          <button key={n} type="button" onClick={() => changeSettings({ repeat: n })} aria-pressed={settings.repeat === n} className={chip(settings.repeat === n)}>
                            {n ? `Toutes les ${n} s` : 'Non'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className={label}>La correction</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => changeSettings({ correct: 'direct' })} aria-pressed={asWeGo} className={chip(asWeGo)}>
                      Au fur et à mesure
                    </button>
                    <button type="button" onClick={() => changeSettings({ correct: 'fin' })} aria-pressed={!asWeGo} className={chip(!asWeGo)}>
                      À la fin
                    </button>
                  </div>
                </>
              )}
            </section>

            {!source && (
              <p className="mt-5 rounded-2xl bg-white p-5 text-center font-bold text-ink-soft ring-1 ring-ink/5">
                <span aria-hidden="true">👆 </span>Choisis un niveau ou ta propre liste pour commencer.
              </p>
            )}
            {source === OWN && own.length === 0 && (
              <p className="mt-5 rounded-2xl bg-white p-5 text-center font-bold text-ink-soft ring-1 ring-ink/5">Ajoute un premier mot à ta liste.</p>
            )}
            {list.length > 0 && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={start}
                  className="min-h-16 w-full max-w-sm rounded-full bg-mred px-6 text-xl font-extrabold text-cream shadow-lg active:scale-[0.98]"
                >
                  ▶️ Commencer · {Math.min(settings.count, list.length)} mots
                </button>
                {source !== OWN && (
                  <p className="mt-2 text-sm text-ink-soft">
                    {list.length} mots dans ce niveau : les mots « à revoir » d’abord, puis ceux pas encore dictés.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── During the series ── */}
        {series && !finished && (
          <>
            <section className="mt-4 rounded-[28px] border-2 border-dashed border-mamber/70 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-mteal-light px-3 py-1.5 text-sm font-bold text-[#115E59]">
                  Mot {index + 1} / {series.length}
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  {series.map((_, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < index ? 'bg-[#2D9B6F]' : i === index ? 'bg-mamber' : 'bg-ink/15'}`} />
                  ))}
                </span>
                {canSpeak && settings.repeat > 0 && !showCorrection && !checked && (
                  <span className="text-xs font-bold text-ink-soft">🔁 redit toutes les {settings.repeat} s</span>
                )}
                <button type="button" onClick={() => setShowWord((v) => !v)} className={`${tool} ml-auto`} title="Voir le mot sans que l’enfant le voie">
                  {showWord ? word : '👁️ Voir le mot'}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {canSpeak && (
                  <>
                    <button type="button" onClick={() => dictate(word)} className={`${big} bg-mred text-cream shadow-md`}>
                      🔊 Redire
                    </button>
                    <button type="button" onClick={dictateSounds} className={`${big} bg-mpurple text-cream shadow-md`}>
                      🔈 Son par son
                    </button>
                  </>
                )}
                {asWeGo && (
                  <button type="button" onClick={() => setShowCorrection((v) => !v)} className={`${big} bg-mteal text-ink`}>
                    {showCorrection ? '🙈 Cacher' : '✅ Correction'}
                  </button>
                )}
                <button type="button" onClick={next} className={`${big} bg-mamber text-ink sm:ml-auto`}>
                  {isLast ? 'Terminer ✓' : 'Suivant ⏭'}
                </button>
              </div>
            </section>

            {showCorrection && (
              <div className="animate-rise mt-4 rounded-3xl border-2 border-[#2D9B6F] bg-[#E8F8F1] px-5 py-3 text-center">
                <span className="block text-xs font-extrabold uppercase tracking-widest text-[#2D9B6F]">La correction</span>
                <Correction word={word} writing={writing} />
              </div>
            )}

            {/* ── Writing ── */}
            <div className="mt-5 flex w-fit rounded-full bg-sand p-1">
              {(['doigt', 'clavier'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`min-h-10 rounded-full px-4 text-sm font-extrabold ${mode === m ? 'bg-mpurple text-cream' : 'text-ink'}`}
                >
                  {m === 'doigt' ? '✍️ Avec le doigt' : '⌨️ Au clavier'}
                </button>
              ))}
            </div>

            {mode === 'doigt' ? (
              <section className="mt-3">
                <WritingModePicker mode={writing} onChange={setWriting} accent="#5B1F8C" />
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {INKS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setInk(c.value);
                        setEraser(false);
                      }}
                      aria-label={`Encre ${c.name}`}
                      className="h-9 w-9 rounded-full active:scale-90"
                      style={{ backgroundColor: c.value, outline: !eraser && ink === c.value ? '3px solid #F4A340' : 'none', outlineOffset: 2 }}
                    />
                  ))}
                  <span className="mx-1 h-6 w-px bg-ink/15" />
                  {SIZES.map((sz) => (
                    <button
                      key={sz.value}
                      type="button"
                      onClick={() => setSize(sz.value)}
                      aria-label={`Trait ${sz.name}`}
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${size === sz.value ? 'bg-mamber' : 'bg-white'}`}
                    >
                      <span className="rounded-full bg-ink" style={{ width: sz.value + 2, height: sz.value + 2 }} />
                    </button>
                  ))}
                  <span className="mx-1 h-6 w-px bg-ink/15" />
                  <button type="button" onClick={() => setEraser((v) => !v)} className={`${tool} inline-flex items-center gap-1.5 ${eraser ? '!bg-mamber' : ''}`}><KidIcon name="gomme" className="h-5 w-5" /> Gomme</button>
                  <button type="button" onClick={() => canvas.current?.undo()} className={tool}>↶ Annuler</button>
                  <button type="button" onClick={() => canvas.current?.clear()} className={tool}>🗑️ Page blanche</button>
                  {writing !== 'blanc' && (
                    <button type="button" onClick={() => setBigLines((v) => !v)} className={tool}>{bigLines ? '🔎 Grandes lignes' : '📏 Lignes normales'}</button>
                  )}
                  <button type="button" onClick={savePng} className={tool}>💾 Garder</button>
                </div>
                <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-ink/10">
                  <DrawingCanvas ref={canvas} height={canvasH} paper={writing === 'blanc' ? 'blanc' : 'seyes'} lineGap={bigLines ? 18 : 11} color={ink} size={size} eraser={eraser} />
                </div>
                <p className="mt-2 text-center text-xs text-ink-soft">Écris avec ton doigt ou un stylet. Le mot écrit est gardé quand tu touches « Suivant ».</p>
              </section>
            ) : (
              <section className="mt-3">
                <textarea
                  value={typed}
                  onChange={(e) => {
                    setTyped(e.target.value);
                    setChecked(false);
                  }}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  placeholder="Écris ici…"
                  aria-label="Écris le mot dicté"
                  className="w-full resize-none rounded-2xl bg-[#FFFEFA] p-5 text-[#1D3F9E] shadow-md outline-none ring-1 ring-ink/10"
                  style={{
                    minHeight: 200,
                    fontFamily: 'var(--font-read)',
                    fontSize: 52,
                    lineHeight: '80px',
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, transparent 0, transparent 79px, rgba(91,31,140,0.35) 79px, rgba(91,31,140,0.35) 80px)',
                    backgroundPositionY: 20,
                  }}
                />
                {asWeGo && (
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setChecked(true)}
                      disabled={!typed.trim()}
                      className="min-h-14 rounded-full bg-[#2D9B6F] px-8 text-lg font-extrabold text-cream shadow-md active:scale-95 disabled:opacity-40"
                    >
                      ✓ Vérifier
                    </button>
                  </div>
                )}
                {checked && (
                  <div className={`animate-rise mt-4 rounded-3xl p-5 text-center ${isRight ? 'bg-[#E8F8F1]' : 'bg-[#FFF1E6]'}`} aria-live="polite">
                    <p className="mb-3 font-display text-2xl font-bold">{isRight ? '🎉 Bravo, c’est parfait !' : '💪 Presque ! On regarde ensemble :'}</p>
                    <TypedDiff word={word} typed={typed} />
                  </div>
                )}
              </section>
            )}

            {/* ── The words already written ── */}
            {traces.length > 0 && (
              <section className="mt-6">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">
                  {asWeGo ? 'Mes mots écrits · on corrige au fur et à mesure' : 'Mes mots écrits · on corrigera à la fin'}
                </p>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{traces.map((t, i) => traceCard(t, i, asWeGo))}</ul>
              </section>
            )}
          </>
        )}

        {/* ── After: everything written, corrected together ── */}
        {series && finished && (
          <section className="animate-rise mt-4">
            <div className="text-center">
              <div className="animate-badge mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-mamber to-[#F7C26B] text-4xl shadow-[0_6px_0_#D98A22]" aria-hidden="true">
                ⭐
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-ink">Dictée finie, bravo !</h2>
              <p className="mt-1 text-ink-soft">
                On regarde chaque mot ensemble : touche « ✓ Juste » ou « 🔁 À revoir ».
                {rightCount > 0 && ` ${rightCount} sur ${traces.length} justes.`}
                {source !== OWN && ' Les mots à revoir reviendront dans la prochaine dictée.'}
              </p>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{traces.map((t, i) => traceCard(t, i, true))}</ul>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button type="button" onClick={start} className="min-h-16 w-full max-w-sm rounded-full bg-mred px-6 text-xl font-extrabold text-cream shadow-lg active:scale-[0.98]">
                ▶️ Une autre dictée
              </button>
              <button type="button" onClick={stop} className="min-h-12 rounded-full px-5 font-bold text-ink-soft underline underline-offset-4">
                Changer les mots ou les réglages
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
