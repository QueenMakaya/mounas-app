'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/kid/DrawingCanvas';
import { letterName, sfx, speak, speakSequence, stopSpeaking } from '@/lib/speech';
import { recordLesson } from '@/lib/progress';

export type LessonWord = {
  id: string;
  word: string;
  syllables: string[];
  pronunciation: string;
  theme: string;
  difficulty: string;
  exampleSentence: string;
  culturalNote: string;
  activityTitle: string;
  materials: string;
  activitySteps: string[];
  songTitle: string;
  songLyrics: string;
  badgeName: string;
};

/* French school convention: alternate syllables in red and blue. */
const SYL_COLORS = ['#E63946', '#1D6FA4'];
const STEP_BG = ['#FDF6EC', '#FFF4E0', '#E6F7F5', '#F3ECFA', '#FFF0F3', '#EAF4FB', '#EEF8EF', '#FFF1E6', '#FDF6EC'];

type StepId = 'intro' | 'listen' | 'syllables' | 'letters' | 'puzzle' | 'find' | 'write' | 'song' | 'bravo';
const STEPS: StepId[] = ['intro', 'listen', 'syllables', 'letters', 'puzzle', 'find', 'write', 'song', 'bravo'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle until the order actually changed (when that's possible). */
function scramble<T>(arr: T[]): T[] {
  if (arr.length < 2) return arr;
  for (let k = 0; k < 10; k++) {
    const s = shuffle(arr);
    if (s.some((x, i) => x !== arr[i])) return s;
  }
  return [...arr].reverse();
}

function Confetti({ show }: { show: boolean }) {
  const [bits] = useState(() =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.4,
        char: ['🎉', '⭐', '✨', '💛', '🎈', '🌟'][i % 6],
        size: 18 + Math.random() * 18,
      })),
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${b.left}%`,
            fontSize: b.size,
            animation: `mounas-confetti ${b.dur}s ${b.delay}s ease-in forwards`,
          }}
        >
          {b.char}
        </span>
      ))}
    </div>
  );
}

function SpeakerButton({ text, label = 'Écouter', rate, big }: { text: string; label?: string; rate?: number; big?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => {
        setOn(true);
        speak(text, { rate, onEnd: () => setOn(false) });
      }}
      className={`inline-flex items-center gap-2 rounded-full font-bold shadow-md transition active:scale-95 ${big ? 'px-7 py-4 text-xl' : 'px-5 py-2 text-base'}`}
      style={{ backgroundColor: on ? '#F4A340' : '#5B1F8C', color: on ? '#1A1A1A' : '#FDF6EC' }}
    >
      <span className={on ? 'mounas-bounce' : ''}>🔊</span> {label}
    </button>
  );
}

export default function LessonClient({ lesson, distractors }: { lesson: LessonWord; distractors: string[] }) {
  const [step, setStep] = useState(0);
  const [stars, setStars] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const stepId = STEPS[step];
  const word = lesson.word;
  const syllables = lesson.syllables.length ? lesson.syllables : [word];
  const letters = Array.from(word);
  const young = (parseInt(lesson.difficulty, 10) || 2) <= 2;

  // per-step "done" flags unlock the big Next button
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true });
  const markDone = (s = step) => setDone((d) => ({ ...d, [s]: true }));

  const celebrate = (n = 1) => {
    setStars((s) => s + n);
    setConfetti(true);
    sfx.good();
    setTimeout(() => setConfetti(false), 2600);
  };

  /* ── step 1: listen ── */
  const [litLetter, setLitLetter] = useState(-1);
  const sayWordSlowly = () => {
    // letters light up one after another while the word is read slowly
    let i = 0;
    setLitLetter(0);
    const id = setInterval(() => {
      i++;
      if (i >= letters.length) {
        clearInterval(id);
        setTimeout(() => setLitLetter(-1), 400);
      } else setLitLetter(i);
    }, Math.max(140, 900 / letters.length));
    speak(word, { rate: 0.6 });
    markDone(1);
  };

  /* ── step 2: syllables ── */
  const [tappedSyl, setTappedSyl] = useState<Set<number>>(new Set());
  const [bounceSyl, setBounceSyl] = useState(-1);
  const [claps, setClaps] = useState(0);
  const [countAnswer, setCountAnswer] = useState<number | null>(null);
  const tapSyllable = (i: number) => {
    sfx.clap();
    speak(syllables[i], { rate: 0.7 });
    setBounceSyl(i);
    setTimeout(() => setBounceSyl(-1), 500);
    setTappedSyl((s) => new Set(s).add(i));
  };
  const answerCount = (n: number) => {
    setCountAnswer(n);
    if (n === syllables.length) {
      celebrate();
      speak(`Oui ! ${word}, ça fait ${n} syllabe${n > 1 ? 's' : ''} !`);
      markDone(2);
    } else {
      sfx.oops();
      speak('Essaie encore ! Tape dans tes mains pour compter.');
    }
  };

  /* ── step 3: letters ── */
  const [seenLetters, setSeenLetters] = useState<Set<number>>(new Set());
  const [bounceLetter, setBounceLetter] = useState(-1);
  const tapLetter = (i: number) => {
    sfx.pop();
    speak(letterName(letters[i]), { rate: 0.8 });
    setBounceLetter(i);
    setTimeout(() => setBounceLetter(-1), 500);
    setSeenLetters((s) => {
      const n = new Set(s).add(i);
      if (n.size >= new Set(letters.map((l) => l.toLowerCase())).size || n.size === letters.length) markDone(3);
      return n;
    });
  };

  /* ── step 4: puzzle (syllables for little ones, letters for bigger) ── */
  const pieces = useMemo(() => {
    const usesSyl = (young && syllables.length > 1) || letters.length > 8;
    const parts = usesSyl ? syllables : letters;
    return { usesSyl, parts, order: scramble(parts.map((p, i) => ({ p, i }))) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);
  const [placed, setPlaced] = useState<number[]>([]); // indexes into pieces.order
  const [shakePiece, setShakePiece] = useState(-1);
  const tapPiece = (k: number) => {
    if (placed.includes(k)) return;
    const expected = pieces.parts[placed.length];
    const piece = pieces.order[k];
    // accept any identical piece (e.g. the two "a" in "maman")
    if (piece.p.toLowerCase() === expected.toLowerCase()) {
      sfx.pop();
      speak(pieces.usesSyl ? piece.p : letterName(piece.p), { rate: 0.8 });
      const next = [...placed, k];
      setPlaced(next);
      if (next.length === pieces.parts.length) {
        setTimeout(() => {
          celebrate();
          speak(`Bravo ! Tu as écrit ${word} !`);
        }, 500);
        markDone(4);
      }
    } else {
      sfx.oops();
      setShakePiece(k);
      setTimeout(() => setShakePiece(-1), 450);
    }
  };

  /* ── step 5: find the word ── */
  const choices = useMemo(() => {
    const pool = shuffle(distractors).sort(
      (a, b) => Math.abs(a.length - word.length) - Math.abs(b.length - word.length),
    );
    return shuffle([word, ...pool.slice(0, 2)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [rightChoice, setRightChoice] = useState(false);
  const pick = (w: string) => {
    if (rightChoice) return;
    if (w === word) {
      setRightChoice(true);
      celebrate();
      speak(`Oui ! C’est écrit ${word} !`);
      markDone(5);
    } else {
      setWrongChoice(w);
      sfx.oops();
      speak(`Non, là c’est écrit ${w}. Cherche ${word} !`);
      setTimeout(() => setWrongChoice(null), 600);
    }
  };

  /* ── step 6: write ── */
  const writeRef = useRef<DrawingCanvasHandle>(null);
  const [writeH, setWriteH] = useState(300);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWriteH(Math.max(240, Math.min(380, Math.round(window.innerHeight * 0.4)))));
    return () => cancelAnimationFrame(id);
  }, []);

  /* ── step 7: song ── */
  const songLines = lesson.songLyrics.split('\n').map((l) => l.trim()).filter(Boolean);
  const [songLine, setSongLine] = useState(-1);
  const stopSong = useRef<(() => void) | null>(null);
  const playSong = () => {
    stopSong.current?.();
    stopSong.current = speakSequence(songLines, { rate: 0.95, gapMs: 350, onStep: setSongLine, onDone: () => setSongLine(-1) });
    markDone(7);
  };

  /* ── navigation + step intros (spoken) ── */
  const intro: Partial<Record<StepId, string>> = {
    listen: `Écoute bien. Le mot du jour, c’est : ${word}.`,
    syllables: `Touche chaque morceau du mot, et tape dans tes mains !`,
    letters: `Voici les lettres de ${word}. Touche-les pour entendre leur nom.`,
    puzzle: pieces.usesSyl ? `Remets les morceaux dans l’ordre pour écrire ${word}.` : `Remets les lettres dans l’ordre pour écrire ${word}.`,
    find: `Où est écrit ${word} ?`,
    write: `À toi d’écrire ${word} ! Suis les pointillés avec ton doigt.`,
    song: lesson.songTitle ? `On chante : ${lesson.songTitle} !` : undefined,
  };

  const go = (to: number) => {
    stopSpeaking();
    stopSong.current?.();
    const id = STEPS[to];
    setStep(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'bravo') {
      const earned = stars + 1;
      setStars(earned);
      recordLesson(lesson.id, word, Math.min(3, Math.max(1, Math.round(earned / 2))));
      setConfetti(true);
      sfx.fanfare();
      setTimeout(() => setConfetti(false), 3000);
      speak(`Bravo ! Tu as appris le mot ${word} ! ${lesson.badgeName ? `Tu gagnes le badge ${lesson.badgeName} !` : ''}`);
      return;
    }
    const line = intro[id];
    if (line) speak(line, { rate: 0.9 });
    if (id === 'song') markDone(to);
    if (id === 'write') markDone(to);
  };

  useEffect(() => () => stopSpeaking(), []);

  const canNext = !!done[step];
  const finalStars = Math.min(3, Math.max(1, Math.round(stars / 2)));

  return (
    <main className="flex flex-1 flex-col transition-colors duration-500" style={{ backgroundColor: STEP_BG[step], fontFamily: 'var(--font-read)' }}>
      <Confetti show={confetti} />

      {/* TOP BAR: close + progress + stars */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pt-4">
        <Link href="/app" aria-label="Quitter la leçon" className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold" style={{ backgroundColor: 'rgba(26,26,26,0.07)' }}>
          ✕
        </Link>
        <div className="flex h-4 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(26,26,26,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%`, background: 'linear-gradient(90deg,#F4A340,#E63946)' }} />
        </div>
        <span className="rounded-full px-3 py-1 text-base font-bold" style={{ backgroundColor: '#FFD23F' }}>⭐ {stars}</span>
      </div>

      <div key={step} className="mounas-pop mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pb-32 pt-6 text-center">
        {stepId === 'intro' && (
          <>
            <Image src="/logo-mounas.png" alt="Les Mounas" width={220} height={220} className="mounas-float h-auto w-[160px]" style={{ mixBlendMode: 'multiply' }} priority />
            <div className="relative mt-4 rounded-3xl px-6 py-5 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
              <p className="text-2xl font-bold sm:text-3xl">Coucou ! Aujourd’hui, on apprend un nouveau mot.</p>
              <p className="mt-2 text-base" style={{ color: 'rgba(26,26,26,0.6)' }}>
                {lesson.theme && <>Thème : {lesson.theme} · </>}≈ 10 minutes, avec maman ou papa 💛
              </p>
            </div>
            <button
              onClick={() => {
                speak('C’est parti !');
                go(1);
              }}
              className="mt-10 rounded-full px-12 py-5 text-2xl font-bold shadow-lg transition active:scale-95"
              style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}
            >
              ▶ C’est parti !
            </button>
            <Link href={`/app/activity${lesson.id !== 'demo' ? `?id=${lesson.id}` : ''}`} className="mt-6 text-sm underline" style={{ color: '#5B1F8C' }}>
              📋 Voir le guide pour le parent
            </Link>
          </>
        )}

        {stepId === 'listen' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#D4530C' }}>Le mot du jour</p>
            <button onClick={sayWordSlowly} className="my-6 flex flex-wrap justify-center rounded-3xl px-8 py-6 shadow-md transition active:scale-95" style={{ backgroundColor: '#FFFFFF' }} aria-label={`Écouter ${word}`}>
              {letters.map((l, i) => (
                <span
                  key={i}
                  className="inline-block text-7xl font-bold transition-all duration-150 sm:text-8xl"
                  style={{
                    color: litLetter === i ? '#E63946' : '#1A1A1A',
                    transform: litLetter === i ? 'translateY(-10px) scale(1.15)' : 'none',
                  }}
                >
                  {l}
                </span>
              ))}
            </button>
            <SpeakerButton text={word} label="Écouter le mot" rate={0.7} big />
            {lesson.pronunciation && <p className="mt-3 text-xl italic" style={{ color: '#5B1F8C' }}>{lesson.pronunciation}</p>}
            {lesson.exampleSentence && (
              <div className="mt-8 w-full rounded-3xl p-5 text-left shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(26,26,26,0.5)' }}>Dans une phrase</p>
                <p className="mb-3 text-2xl">{lesson.exampleSentence}</p>
                <SpeakerButton text={lesson.exampleSentence} label="Écouter la phrase" />
              </div>
            )}
            {lesson.culturalNote && (
              <div className="mt-4 w-full rounded-3xl p-5 text-left" style={{ backgroundColor: '#FFF4E0', border: '2px dashed #F4A340' }}>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: '#D4530C' }}>🌍 Le savais-tu ?</p>
                <p className="text-lg">{lesson.culturalNote}</p>
              </div>
            )}
          </>
        )}

        {stepId === 'syllables' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#1A8C83' }}>Les syllabes</p>
            <h2 className="mb-6 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Touche chaque morceau 👏</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {syllables.map((s, i) => (
                <button
                  key={i}
                  onClick={() => tapSyllable(i)}
                  className={`flex min-w-[110px] flex-col items-center rounded-[2rem] px-6 py-5 shadow-lg transition active:scale-90 ${bounceSyl === i ? 'mounas-bounce' : ''}`}
                  style={{ backgroundColor: SYL_COLORS[i % 2], color: '#FFFFFF' }}
                >
                  <span className="text-6xl font-bold">{s}</span>
                  <span className="mt-1 text-2xl">{tappedSyl.has(i) ? '👏' : '·'}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => {
                  sfx.clap();
                  setClaps((c) => c + 1);
                }}
                className="rounded-full px-6 py-4 text-3xl shadow-md active:scale-90"
                style={{ backgroundColor: '#FFFFFF' }}
                aria-label="Taper dans les mains"
              >
                👏
              </button>
              <span className="text-xl font-bold">{claps > 0 ? `${claps} clap${claps > 1 ? 's' : ''}` : 'Tape dans tes mains !'}</span>
              {claps > 0 && (
                <button onClick={() => setClaps(0)} className="text-sm underline opacity-60">recommencer</button>
              )}
            </div>
            {tappedSyl.size >= syllables.length && (
              <div className="mounas-pop mt-8 w-full rounded-3xl p-5 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                <p className="mb-4 text-2xl font-bold">Combien de syllabes dans « {word} » ?</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => answerCount(n)}
                      className={`h-16 w-16 rounded-2xl text-3xl font-bold shadow-md transition active:scale-90 ${countAnswer === n && n !== syllables.length ? 'mounas-shake' : ''}`}
                      style={{
                        backgroundColor: countAnswer === n ? (n === syllables.length ? '#2D9B6F' : '#E63946') : '#F6EFE3',
                        color: countAnswer === n ? '#FFFFFF' : '#1A1A1A',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {stepId === 'letters' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5B1F8C' }}>Les lettres</p>
            <h2 className="mb-6 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Touche chaque lettre 🔤</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {letters.map((l, i) => (
                <button
                  key={i}
                  onClick={() => tapLetter(i)}
                  className={`flex h-24 w-20 flex-col items-center justify-center rounded-2xl shadow-md transition active:scale-90 ${bounceLetter === i ? 'mounas-bounce' : ''}`}
                  style={{ backgroundColor: seenLetters.has(i) ? '#5B1F8C' : '#FFFFFF', color: seenLetters.has(i) ? '#FDF6EC' : '#1A1A1A' }}
                >
                  <span className="text-5xl font-bold">{l.toUpperCase()}</span>
                  <span className="text-lg">{l}</span>
                </button>
              ))}
            </div>
            <p className="mt-6 text-base" style={{ color: 'rgba(26,26,26,0.6)' }}>
              En majuscule et en minuscule. Le parent peut demander : « Trouve le {letters[0]} ! »
            </p>
          </>
        )}

        {stepId === 'puzzle' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#C2185B' }}>Petit jeu</p>
            <h2 className="mb-6 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>
              {pieces.usesSyl ? 'Remets les morceaux dans l’ordre' : 'Remets les lettres dans l’ordre'}
            </h2>
            {/* answer slots */}
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {pieces.parts.map((_, i) => {
                const k = placed[i];
                const val = k !== undefined ? pieces.order[k].p : '';
                return (
                  <span
                    key={i}
                    className={`flex h-20 min-w-[64px] items-center justify-center rounded-2xl px-3 text-5xl font-bold ${val ? 'mounas-pop' : ''}`}
                    style={{
                      backgroundColor: val ? (pieces.usesSyl ? SYL_COLORS[i % 2] : '#2D9B6F') : 'rgba(26,26,26,0.06)',
                      color: '#FFFFFF',
                      border: val ? 'none' : '3px dashed rgba(26,26,26,0.2)',
                    }}
                  >
                    {val}
                  </span>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {pieces.order.map((piece, k) => (
                <button
                  key={k}
                  onClick={() => tapPiece(k)}
                  disabled={placed.includes(k)}
                  className={`h-20 min-w-[72px] rounded-2xl px-4 text-5xl font-bold shadow-md transition active:scale-90 disabled:opacity-0 ${shakePiece === k ? 'mounas-shake' : ''}`}
                  style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                >
                  {piece.p}
                </button>
              ))}
            </div>
            {placed.length > 0 && placed.length < pieces.parts.length && (
              <button onClick={() => setPlaced([])} className="mt-6 text-sm underline opacity-60">recommencer</button>
            )}
            <div className="mt-6">
              <SpeakerButton text={word} label="Réécouter le mot" rate={0.6} />
            </div>
          </>
        )}

        {stepId === 'find' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#1D6FA4' }}>Cherche et trouve</p>
            <h2 className="mb-2 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Où est écrit « {word} » ?</h2>
            <div className="mb-6">
              <SpeakerButton text={`Où est écrit ${word} ?`} label="Réécouter" />
            </div>
            <div className="grid w-full gap-4 sm:grid-cols-3">
              {choices.map((c) => (
                <button
                  key={c}
                  onClick={() => pick(c)}
                  className={`rounded-3xl px-4 py-8 text-5xl font-bold shadow-md transition active:scale-95 ${wrongChoice === c ? 'mounas-shake' : ''}`}
                  style={{
                    backgroundColor: rightChoice && c === word ? '#2D9B6F' : wrongChoice === c ? '#FCD5D8' : '#FFFFFF',
                    color: rightChoice && c === word ? '#FFFFFF' : '#1A1A1A',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {stepId === 'write' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#2D9B6F' }}>J’écris</p>
            <h2 className="mb-4 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Suis les pointillés avec ton doigt ✍️</h2>
            <div className="w-full overflow-hidden rounded-3xl shadow-md" style={{ border: '1px solid rgba(26,26,26,0.1)' }}>
              <DrawingCanvas ref={writeRef} height={writeH} paper="seyes" lineGap={Math.round(writeH / 16)} guideText={word} size={9} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button onClick={() => writeRef.current?.undo()} className="rounded-full px-5 py-2 font-bold shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>↶ Annuler</button>
              <button onClick={() => writeRef.current?.clear()} className="rounded-full px-5 py-2 font-bold shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>🗑️ Recommencer</button>
              <button
                onClick={() => {
                  if (writeRef.current?.isEmpty()) {
                    speak('Écris avec ton doigt sur les pointillés !');
                    return;
                  }
                  celebrate();
                  speak('Magnifique ! Quelle belle écriture !');
                }}
                className="rounded-full px-6 py-2 font-bold shadow-md"
                style={{ backgroundColor: '#2D9B6F', color: '#FFFFFF' }}
              >
                ✓ J’ai fini !
              </button>
            </div>
            <Link href="/app/dictee" className="mt-5 text-sm underline" style={{ color: '#5B1F8C' }}>
              Ouvrir le cahier de dictée 📒
            </Link>
          </>
        )}

        {stepId === 'song' && (
          <>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#D4530C' }}>La chanson</p>
            <h2 className="mb-4 mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>🎵 {lesson.songTitle || 'On chante !'}</h2>
            {songLines.length > 0 && (
              <>
                <button onClick={playSong} className="mb-5 rounded-full px-7 py-4 text-xl font-bold shadow-md active:scale-95" style={{ backgroundColor: '#D4530C', color: '#FDF6EC' }}>
                  🔊 Écouter les paroles
                </button>
                <div className="w-full rounded-3xl p-6 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                  {songLines.map((l, i) => (
                    <p
                      key={i}
                      className="rounded-xl px-2 py-1 text-2xl leading-relaxed transition-all"
                      style={{ backgroundColor: songLine === i ? '#FFE8B0' : 'transparent', transform: songLine === i ? 'scale(1.04)' : 'none' }}
                    >
                      {l}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-sm" style={{ color: 'rgba(26,26,26,0.55)' }}>Puis chantez-la ensemble, en tapant le rythme 🥁</p>
              </>
            )}
            {lesson.activityTitle && (
              <details className="mt-6 w-full rounded-3xl p-5 text-left" style={{ backgroundColor: '#EAF4FB' }}>
                <summary className="cursor-pointer text-lg font-bold">🎯 Activité à faire ensemble : {lesson.activityTitle}</summary>
                {lesson.materials && <p className="mt-3 text-sm"><strong>Matériel :</strong> {lesson.materials}</p>}
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-base">
                  {lesson.activitySteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </details>
            )}
          </>
        )}

        {stepId === 'bravo' && (
          <>
            <div className="mounas-float text-8xl">🏆</div>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-fraunces)' }}>Bravo !</h2>
            <p className="mt-2 text-2xl">Tu sais lire <strong>{word}</strong> !</p>
            <div className="my-6 flex gap-3 text-6xl">
              {[0, 1, 2].map((i) => (
                <span key={i} className="mounas-pop" style={{ animationDelay: `${0.2 + i * 0.25}s`, opacity: i < finalStars ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
            {lesson.badgeName && (
              <div className="rounded-3xl px-8 py-5 shadow-md" style={{ backgroundColor: '#F4A340' }}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Badge gagné</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>🏅 {lesson.badgeName}</p>
              </div>
            )}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={() => window.location.reload()} className="rounded-full px-6 py-3 font-bold shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>🔁 Rejouer</button>
              <Link href="/app/select" className="rounded-full px-6 py-3 font-bold shadow-sm" style={{ backgroundColor: '#F4A340' }}>🎲 Un autre mot</Link>
              <Link href="/app/dessins" className="rounded-full px-6 py-3 font-bold shadow-sm" style={{ backgroundColor: '#E6197A', color: '#FDF6EC' }}>🎨 Dessine {word} !</Link>
              <Link href="/app" className="rounded-full px-6 py-3 font-bold shadow-sm" style={{ backgroundColor: '#5B1F8C', color: '#FDF6EC' }}>🏠 Accueil</Link>
            </div>
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      {stepId !== 'intro' && stepId !== 'bravo' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3" style={{ backgroundColor: 'rgba(253,246,236,0.95)', borderColor: 'rgba(26,26,26,0.08)' }}>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button onClick={() => go(step - 1)} className="rounded-full px-5 py-3 font-bold" style={{ backgroundColor: 'rgba(26,26,26,0.07)' }}>
              ←
            </button>
            {!canNext && (
              <button onClick={() => markDone()} className="text-sm underline opacity-50">passer</button>
            )}
            <button
              onClick={() => go(step + 1)}
              disabled={!canNext}
              className={`flex-1 rounded-full px-8 py-4 text-xl font-bold shadow-lg transition active:scale-95 disabled:opacity-40 sm:flex-none ${canNext ? 'mounas-pop' : ''}`}
              style={{ backgroundColor: canNext ? '#2D9B6F' : '#BDB5A8', color: '#FFFFFF' }}
            >
              {step === STEPS.length - 2 ? 'Terminer 🏁' : 'Suivant →'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
