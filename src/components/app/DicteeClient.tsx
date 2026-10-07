'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from '@/lib/levels';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { readPref, writePref } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/app/DrawingCanvas';

/*
 * The dictation notebook: the parent dictates (or lets the app dictate),
 * the child writes with a finger/stylus on Seyès paper — or types, with a
 * letter-by-letter correction. Words come from the level the parent picks,
 * or from the parent's own list.
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

const LS_OWN = 'mounas_dictee_words';
const LS_LEVEL = 'mounas_last_difficulty';
const OWN = 'mine';

type Mode = 'doigt' | 'clavier';

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');

export default function DicteeClient({ words }: { words: DicteeWord[] }) {
  const { supported: canSpeak, speakSeries } = useSpeech();
  const [source, setSource] = useState('');
  const [own, setOwn] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('doigt');
  const [showWord, setShowWord] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [newWord, setNewWord] = useState('');

  const [ink, setInk] = useState(INKS[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [eraser, setEraser] = useState(false);
  const [bigLines, setBigLines] = useState(true);
  const [canvasH, setCanvasH] = useState(420);
  const canvas = useRef<DrawingCanvasHandle>(null);

  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  // Restore the parent's own list and last level; size the page to the screen.
  useEffect(() => {
    const fit = () => setCanvasH(Math.max(300, Math.min(640, window.innerHeight - 340)));
    const first = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(readPref(LS_OWN) || 'null');
        if (Array.isArray(saved)) setOwn(saved.filter((w): w is string => typeof w === 'string'));
      } catch {
        /* ignore */
      }
      const lastLevel = readPref(LS_LEVEL) ?? '';
      if (LEVELS.some((l) => l.value === lastLevel)) setSource(lastLevel);
      fit();
    });
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener('resize', fit);
    };
  }, []);

  const list = useMemo(
    () => (source === OWN ? own : words.filter((w) => w.level === source).map((w) => w.word.toLocaleLowerCase('fr'))),
    [source, own, words],
  );
  const word = list[index] ?? '';

  const resetPage = () => {
    canvas.current?.clear();
    setTyped('');
    setChecked(false);
    setShowCorrection(false);
    setShowWord(false);
  };

  const pick = (next: string) => {
    resetPage();
    setSource(next);
    setIndex(0);
    if (next !== OWN) writePref(LS_LEVEL, next);
  };

  const go = (delta: number) => {
    if (list.length === 0) return;
    resetPage();
    setIndex((i) => (i + delta + list.length) % list.length);
  };

  const saveOwn = (next: string[]) => {
    setOwn(next);
    writePref(LS_OWN, JSON.stringify(next));
  };

  // Like a teacher: the word in a sentence, then once more slowly.
  const dictate = () => word && speakSeries([{ text: `Écris : ${word}.`, rate: 0.8 }, { text: word, rate: 0.55 }], () => {});
  // Sound by sound, then the whole word — never letter names.
  const dictateSounds = () => {
    if (!word) return;
    const heard = wordSounds(word).filter((s) => s.kind !== 'silent' && s.kind !== 'separator' && s.key);
    speakSeries([...heard.map((s) => ({ text: SOUNDS[s.key].say, rate: 0.6 })), { text: word, rate: 0.7 }], () => {});
  };

  const savePng = () => {
    const url = canvas.current?.toDataURL();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictee-${word || 'page'}.png`;
    link.click();
  };

  const diff = useMemo(() => {
    const target = Array.from(word.trim());
    const got = Array.from(typed.trim());
    return Array.from({ length: Math.max(target.length, got.length) }, (_, i) => ({
      want: target[i] ?? '',
      got: got[i] ?? '',
      ok: (target[i] ?? '').toLocaleLowerCase('fr') === (got[i] ?? '').toLocaleLowerCase('fr'),
    }));
  }, [word, typed]);
  const isRight = normalize(typed) === normalize(word);

  const check = () => {
    setChecked(true);
    if (isRight) setScore((n) => n + 1);
  };

  const chip = (on: boolean) =>
    `min-h-11 rounded-full px-4 text-sm font-extrabold transition-colors ${on ? 'bg-ink text-cream shadow-md' : 'bg-cream text-ink ring-1 ring-ink/10 hover:bg-sand'}`;
  const big = 'min-h-12 whitespace-nowrap rounded-full px-4 font-extrabold active:scale-95';
  const tool = 'min-h-10 rounded-full bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/10 active:scale-95 disabled:opacity-40';

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/app" className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5">
            <span aria-hidden="true">←</span> Accueil
          </Link>
          {score > 0 && <span className="rounded-full bg-mamber px-3 py-1.5 text-sm font-extrabold text-ink">⭐ {score}</span>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">📒 Mon cahier de dictée</h1>
        <p className="mt-1 text-ink-soft">Le parent dicte, l’enfant écrit. Choisis d’abord les mots.</p>

        {/* ── Parent panel ── */}
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
                      onClick={() => {
                        saveOwn(own.filter((_, j) => j !== i));
                        setIndex(0);
                      }}
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

          {list.length > 0 && (
            <div className="mt-4 border-t border-ink/5 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-mteal-light px-3 py-1.5 text-sm font-bold text-[#115E59]">
                  Mot {index + 1} / {list.length}
                </span>
                <button type="button" onClick={() => setShowWord((v) => !v)} className={tool} title="Voir le mot sans que l’enfant le voie">
                  {showWord ? word : '👁️ Voir le mot'}
                </button>
                <button type="button" onClick={() => go(-1)} className={`${tool} ml-auto`} aria-label="Mot précédent">
                  ⏮
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {canSpeak && (
                  <>
                    <button type="button" onClick={dictate} className={`${big} bg-mred text-cream shadow-md`}>
                      🔊 Dicter
                    </button>
                    <button type="button" onClick={dictateSounds} className={`${big} bg-mpurple text-cream shadow-md`}>
                      🔈 Son par son
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setShowCorrection((v) => !v)} className={`${big} bg-mteal text-ink`}>
                  {showCorrection ? '🙈 Cacher' : '✅ Correction'}
                </button>
                <button type="button" onClick={() => go(1)} className={`${big} bg-mamber text-ink`}>
                  Suivant ⏭
                </button>
              </div>
            </div>
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
          <>
            {showCorrection && (
              <div className="animate-rise mt-4 rounded-3xl border-2 border-[#2D9B6F] bg-[#E8F8F1] px-5 py-3 text-center">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#2D9B6F]">La correction</span>
                <p className="text-4xl leading-[1.8] text-[#1D3F9E] sm:text-5xl" style={{ fontFamily: 'var(--font-cursive)' }}>
                  {word}
                </p>
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
                  <button type="button" onClick={() => setEraser((v) => !v)} className={`${tool} ${eraser ? '!bg-mamber' : ''}`}>🧽 Gomme</button>
                  <button type="button" onClick={() => canvas.current?.undo()} className={tool}>↶ Annuler</button>
                  <button type="button" onClick={resetPage} className={tool}>🗑️ Page blanche</button>
                  <button type="button" onClick={() => setBigLines((v) => !v)} className={tool}>{bigLines ? '🔎 Grandes lignes' : '📏 Lignes normales'}</button>
                  <button type="button" onClick={savePng} className={tool}>💾 Garder</button>
                </div>
                <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-ink/10">
                  <DrawingCanvas ref={canvas} height={canvasH} paper="seyes" lineGap={bigLines ? 18 : 11} color={ink} size={size} eraser={eraser} />
                </div>
                <p className="mt-2 text-center text-xs text-ink-soft">Écris avec ton doigt ou un stylet. Avec un stylet, la paume peut se poser sur l’écran.</p>
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
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={check}
                    disabled={!typed.trim()}
                    className="min-h-14 rounded-full bg-[#2D9B6F] px-8 text-lg font-extrabold text-cream shadow-md active:scale-95 disabled:opacity-40"
                  >
                    ✓ Vérifier
                  </button>
                </div>
                {checked && (
                  <div className={`animate-rise mt-4 rounded-3xl p-5 text-center ${isRight ? 'bg-[#E8F8F1]' : 'bg-[#FFF1E6]'}`} aria-live="polite">
                    <p className="mb-3 font-display text-2xl font-bold">{isRight ? '🎉 Bravo, c’est parfait !' : '💪 Presque ! On regarde ensemble :'}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {diff.map((d, i) => (
                        <span
                          key={i}
                          className={`flex h-16 w-12 flex-col items-center justify-center rounded-xl text-3xl font-bold text-cream ${d.ok ? 'bg-[#2D9B6F]' : 'bg-mred'}`}
                          title={d.ok ? 'juste' : `attendu : ${d.want || '(rien)'}`}
                        >
                          {d.got === ' ' ? '␣' : d.got || '_'}
                          {!d.ok && <span className="text-xs font-normal opacity-90">{d.want === ' ' ? '␣' : d.want || '–'}</span>}
                        </span>
                      ))}
                    </div>
                    {isRight && (
                      <button type="button" onClick={() => go(1)} className="mt-4 min-h-12 rounded-full bg-mamber px-6 font-extrabold text-ink">
                        Mot suivant ⏭
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
