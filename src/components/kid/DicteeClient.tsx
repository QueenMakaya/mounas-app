'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/kid/DrawingCanvas';
import { sfx, speak } from '@/lib/speech';

const FALLBACK_WORDS = ['maman', 'papa', 'lune', 'ami', 'école', 'soleil', 'livre', 'chat'];

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

const LS_WORDS = 'mounas_dictee_words';

type Mode = 'doigt' | 'clavier';

function normalize(s: string) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function DicteeClient({ words }: { words: string[] }) {
  const [mode, setMode] = useState<Mode>('doigt');
  const [list, setList] = useState<string[]>(words.length ? words.slice(0, 12) : FALLBACK_WORDS);
  const [index, setIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [parentOpen, setParentOpen] = useState(true);
  const [newWord, setNewWord] = useState('');

  const [ink, setInk] = useState(INKS[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [eraser, setEraser] = useState(false);
  const [bigLines, setBigLines] = useState(true);
  const [canvasH, setCanvasH] = useState(460);
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [typed, setTyped] = useState('');
  const [cursiveKeyboard, setCursiveKeyboard] = useState(false);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const word = list[index] ?? '';

  // Restore the parent's own list (if they edited it last time).
  useEffect(() => {
    const restore = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(LS_WORDS) || 'null');
        if (Array.isArray(saved) && saved.length) setList(saved.filter((w): w is string => typeof w === 'string'));
      } catch {
        /* ignore */
      }
    };
    const fit = () => setCanvasH(Math.max(320, Math.min(720, window.innerHeight - 300)));
    const first = requestAnimationFrame(() => {
      restore();
      fit();
    });
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener('resize', fit);
    };
  }, []);

  const saveList = (next: string[]) => {
    setList(next);
    try {
      localStorage.setItem(LS_WORDS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const dictate = () => {
    if (!word) return;
    // Say it naturally, then once more slowly — like a teacher does.
    speak(`Écris : ${word}.`, { rate: 0.8 });
    speak(word, { rate: 0.55, queue: true });
  };

  const resetPage = () => {
    canvasRef.current?.clear();
    setTyped('');
    setChecked(false);
    setShowCorrection(false);
    setShowWord(false);
  };

  const nextWord = () => {
    resetPage();
    setIndex((i) => (i + 1) % Math.max(list.length, 1));
  };

  const prevWord = () => {
    resetPage();
    setIndex((i) => (i - 1 + list.length) % Math.max(list.length, 1));
  };

  const addWord = () => {
    const w = newWord.trim();
    if (!w) return;
    saveList([...list, w]);
    setNewWord('');
  };

  const removeWord = (i: number) => {
    const next = list.filter((_, j) => j !== i);
    saveList(next.length ? next : FALLBACK_WORDS);
    setIndex(0);
  };

  const savePng = () => {
    const url = canvasRef.current?.toDataURL();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictee-${word || 'page'}.png`;
    a.click();
  };

  const diff = useMemo(() => {
    const target = Array.from(word.trim());
    const got = Array.from(typed.trim());
    const n = Math.max(target.length, got.length);
    return Array.from({ length: n }, (_, i) => ({
      want: target[i] ?? '',
      got: got[i] ?? '',
      ok: (target[i] ?? '').toLowerCase() === (got[i] ?? '').toLowerCase(),
    }));
  }, [word, typed]);

  const isRight = normalize(typed) === normalize(word);

  const check = () => {
    setChecked(true);
    if (isRight) {
      sfx.good();
      setScore((s) => s + 1);
      speak('Bravo ! C’est parfait !');
    } else {
      sfx.oops();
      speak('Presque ! Regarde les lettres en rouge.');
    }
  };

  const btn =
    'rounded-full px-4 py-2 text-sm font-bold shadow-sm transition active:scale-95 disabled:opacity-40';

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-4 sm:px-6" style={{ fontFamily: 'var(--font-read)', backgroundColor: '#FDF6EC' }}>
      {/* HEADER */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-sm font-bold" style={{ color: '#5B1F8C' }}>
            ← Accueil
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}>
            📒 Mon cahier de dictée
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {score > 0 && (
            <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: '#F4A340' }}>
              ⭐ {score}
            </span>
          )}
          <div className="flex rounded-full p-1" style={{ backgroundColor: '#EDE3D3' }}>
            {(['doigt', 'clavier'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="rounded-full px-4 py-2 text-sm font-bold transition"
                style={mode === m ? { backgroundColor: '#5B1F8C', color: '#FDF6EC' } : { color: '#1A1A1A' }}
              >
                {m === 'doigt' ? '✍️ Avec le doigt' : '⌨️ Au clavier'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PARENT PANEL */}
      <section className="mb-3 rounded-3xl p-4" style={{ backgroundColor: '#FFFFFF', border: '2px dashed #F4A340' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(26,26,26,0.55)' }}>
              Pour le parent
            </span>
            <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: '#CCFBF1', color: '#115E59' }}>
              Mot {list.length ? index + 1 : 0} / {list.length}
            </span>
            <button
              onClick={() => setShowWord((v) => !v)}
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: '#F6EFE3', color: '#1A1A1A', minWidth: 110 }}
              title="Voir le mot (sans que l’enfant le voie)"
            >
              {showWord ? word : '👁️ voir le mot'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={prevWord} className={btn} style={{ backgroundColor: '#F6EFE3' }} aria-label="Mot précédent">
              ⏮
            </button>
            <button onClick={dictate} className={`${btn} text-base`} style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}>
              🔊 Dicter le mot
            </button>
            <button onClick={() => setShowCorrection((v) => !v)} className={btn} style={{ backgroundColor: '#2EC4B6', color: '#1A1A1A' }}>
              {showCorrection ? '🙈 Cacher' : '✅ Correction'}
            </button>
            <button onClick={nextWord} className={btn} style={{ backgroundColor: '#F4A340', color: '#1A1A1A' }}>
              Mot suivant ⏭
            </button>
            <button onClick={() => setParentOpen((v) => !v)} className={btn} style={{ backgroundColor: '#F6EFE3' }}>
              {parentOpen ? 'Réduire ▲' : 'Liste ▼'}
            </button>
          </div>
        </div>

        {parentOpen && (
          <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(26,26,26,0.08)' }}>
            <p className="mb-2 text-xs" style={{ color: 'rgba(26,26,26,0.6)' }}>
              Tape les mots ou petites phrases de ta dictée. Tu peux dicter toi-même, ou appuyer sur 🔊 pour que l’app
              le dise.
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {list.map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm"
                  style={{
                    backgroundColor: i === index ? '#5B1F8C' : '#F6EFE3',
                    color: i === index ? '#FDF6EC' : '#1A1A1A',
                  }}
                >
                  <button onClick={() => { resetPage(); setIndex(i); }} className="font-bold">
                    {showWord || i !== index ? w : '•••'}
                  </button>
                  <button onClick={() => removeWord(i)} className="rounded-full px-2 opacity-60 hover:opacity-100" aria-label={`Retirer ${w}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addWord();
              }}
            >
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Ajouter un mot ou une phrase…"
                className="flex-1 rounded-full border px-4 py-2 text-base"
                style={{ borderColor: 'rgba(26,26,26,0.2)', backgroundColor: '#FFFEFA' }}
              />
              <button className={btn} style={{ backgroundColor: '#5B1F8C', color: '#FDF6EC' }}>
                + Ajouter
              </button>
            </form>
          </div>
        )}
      </section>

      {/* CORRECTION */}
      {showCorrection && (
        <div className="mb-3 rounded-3xl px-5 py-3 text-center" style={{ backgroundColor: '#E8F8F1', border: '2px solid #2D9B6F' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2D9B6F' }}>
            La correction
          </span>
          <p className="text-4xl sm:text-5xl" style={{ fontFamily: 'var(--font-cursive)', color: '#1D3F9E', lineHeight: 1.8 }}>
            {word}
          </p>
        </div>
      )}

      {/* WRITING AREA */}
      {mode === 'doigt' ? (
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {INKS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setInk(c.value);
                  setEraser(false);
                }}
                aria-label={c.name}
                className="h-9 w-9 rounded-full transition active:scale-90"
                style={{
                  backgroundColor: c.value,
                  outline: !eraser && ink === c.value ? '3px solid #F4A340' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
            <span className="mx-1 h-6 w-px" style={{ backgroundColor: 'rgba(26,26,26,0.15)' }} />
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: size === s.value ? '#F4A340' : '#FFFFFF' }}
                aria-label={s.name}
              >
                <span className="rounded-full" style={{ width: s.value + 2, height: s.value + 2, backgroundColor: '#1A1A1A' }} />
              </button>
            ))}
            <span className="mx-1 h-6 w-px" style={{ backgroundColor: 'rgba(26,26,26,0.15)' }} />
            <button onClick={() => setEraser((v) => !v)} className={btn} style={{ backgroundColor: eraser ? '#F4A340' : '#FFFFFF' }}>
              🧽 Gomme
            </button>
            <button onClick={() => canvasRef.current?.undo()} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              ↶ Annuler
            </button>
            <button onClick={resetPage} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              🗑️ Page blanche
            </button>
            <button onClick={() => setBigLines((v) => !v)} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              {bigLines ? '🔎 Grandes lignes' : '📏 Lignes normales'}
            </button>
            <button onClick={savePng} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              💾 Garder
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-md" style={{ border: '1px solid rgba(26,26,26,0.12)' }}>
            <DrawingCanvas
              ref={canvasRef}
              height={canvasH}
              paper="seyes"
              lineGap={bigLines ? 18 : 11}
              color={ink}
              size={size}
              eraser={eraser}
            />
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: 'rgba(26,26,26,0.5)' }}>
            Écris avec ton doigt ou un stylet. Avec un Apple Pencil, la paume peut se poser sur l’écran.
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button onClick={() => setCursiveKeyboard((v) => !v)} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              {cursiveKeyboard ? '𝒜 Attaché' : 'A Script'}
            </button>
            <button onClick={resetPage} className={btn} style={{ backgroundColor: '#FFFFFF' }}>
              🗑️ Effacer
            </button>
          </div>
          <textarea
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setChecked(false);
            }}
            autoFocus
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            placeholder="Écris ici…"
            className="w-full resize-none rounded-2xl p-5 shadow-md outline-none"
            style={{
              minHeight: 220,
              fontFamily: cursiveKeyboard ? 'var(--font-cursive)' : 'var(--font-read)',
              fontSize: cursiveKeyboard ? 40 : 56,
              lineHeight: cursiveKeyboard ? '96px' : '80px',
              color: '#1D3F9E',
              backgroundColor: '#FFFEFA',
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${cursiveKeyboard ? 95 : 79}px, rgba(91,31,140,0.35) ${cursiveKeyboard ? 95 : 79}px, rgba(91,31,140,0.35) ${cursiveKeyboard ? 96 : 80}px)`,
              backgroundPositionY: 20,
              border: '1px solid rgba(26,26,26,0.12)',
            }}
          />
          <div className="mt-3 flex justify-center">
            <button
              onClick={check}
              disabled={!typed.trim()}
              className="rounded-full px-8 py-4 text-lg font-bold shadow-md transition active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: '#2D9B6F', color: '#FDF6EC' }}
            >
              ✓ Vérifier
            </button>
          </div>

          {checked && (
            <div className="mt-4 rounded-3xl p-5 text-center" style={{ backgroundColor: isRight ? '#E8F8F1' : '#FFF1E6' }}>
              <p className="mb-3 text-2xl font-bold">{isRight ? '🎉 Bravo, c’est parfait !' : '💪 Presque ! On regarde ensemble :'}</p>
              <div className="flex flex-wrap justify-center gap-1">
                {diff.map((d, i) => (
                  <span
                    key={i}
                    className="flex h-16 w-12 flex-col items-center justify-center rounded-xl text-3xl font-bold"
                    style={{
                      backgroundColor: d.ok ? '#2D9B6F' : '#E63946',
                      color: '#FDF6EC',
                    }}
                    title={d.ok ? 'juste' : `attendu : ${d.want || '(rien)'}`}
                  >
                    {d.got === ' ' ? '␣' : d.got || '_'}
                    {!d.ok && <span className="text-xs font-normal opacity-90">{d.want === ' ' ? '␣' : d.want || '–'}</span>}
                  </span>
                ))}
              </div>
              {isRight && (
                <button onClick={nextWord} className="mt-4 rounded-full px-6 py-3 font-bold" style={{ backgroundColor: '#F4A340' }}>
                  Mot suivant ⏭
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
