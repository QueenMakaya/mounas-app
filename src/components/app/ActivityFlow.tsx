'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Activity } from '@/lib/airtable';
import { levelLabel } from '@/lib/levels';
import { currentStreak, isCompletedToday, markCompleted } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import { SOUNDS, wordSounds, type Sound } from '@/lib/phonics';
import SyllableWord, { SYLLABLE_COLORS, syllableParts } from '@/components/app/SyllableWord';
import SpeakButton from '@/components/app/SpeakButton';

/*
 * The daily activity as a guided flow: one step per screen, a progress bar,
 * and big Précédent / Suivant buttons in the thumb zone. A parent does this
 * with a toddler on their lap — one clear thing to do at a time beats a long
 * scroll of eight coloured blocks.
 */

type StepKey = 'decouvrir' | 'lire' | 'syllabes' | 'prononcer' | 'epeler' | 'ecrire' | 'activite' | 'chanson';

type StepDef = {
  key: StepKey;
  emoji: string;
  name: string;
  heading: string;
  minutes: number;
  accent: string;
  tint: string;
};

const DAY_NUMBER: Record<string, number> = {
  Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 7,
};

function buildSteps(a: Activity): StepDef[] {
  const spelling = parseInt(a.difficulty, 10) >= 4;
  const steps: (StepDef | false)[] = [
    { key: 'decouvrir', emoji: '✨', name: 'Découvrir', heading: 'On découvre un nouveau mot', minutes: 1, accent: '#E63946', tint: '#FDECEE' },
    { key: 'lire', emoji: '📖', name: 'Lire', heading: 'On lit les sons ensemble', minutes: 1, accent: '#E08A1E', tint: '#FEF3E2' },
    { key: 'syllabes', emoji: '👏', name: 'Syllabes', heading: 'On tape les syllabes', minutes: 1, accent: '#0E8C80', tint: '#E3F8F5' },
    { key: 'prononcer', emoji: '🗣️', name: 'Prononcer', heading: 'On le dit à voix haute', minutes: 1, accent: '#5B1F8C', tint: '#F1E9F8' },
    spelling && { key: 'epeler', emoji: '🔤', name: 'Sons → lettres', heading: 'Chaque son s’écrit avec des lettres', minutes: 1, accent: '#993556', tint: '#F8E8EE' },
    spelling && { key: 'ecrire', emoji: '✍️', name: 'Écrire', heading: 'On écrit le mot', minutes: 2, accent: '#2D9B6F', tint: '#E5F4EC' },
    Boolean(a.activityTitle || a.activitySteps) && { key: 'activite', emoji: '🎯', name: 'Activité', heading: a.activityTitle || 'L’activité', minutes: 5, accent: '#1D6FA4', tint: '#E4F0F8' },
    Boolean(a.songTitle || a.songLyrics) && { key: 'chanson', emoji: '🎵', name: 'Chanson', heading: a.songTitle || 'La chanson', minutes: 2, accent: '#D4530C', tint: '#FCEBDD' },
  ];
  return steps.filter((s): s is StepDef => Boolean(s));
}

export default function ActivityFlow({ activity }: { activity: Activity }) {
  const steps = buildSteps(activity);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const { supported: canSpeak, speak, speakSeries } = useSpeech();

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const minutesLeft = steps.slice(index).reduce((t, s) => t + s.minutes, 0);

  const go = (next: number) => {
    moved.current = true;
    if (next >= steps.length) {
      setFinished(true);
      return;
    }
    setFinished(false);
    setIndex(Math.max(0, next));
  };

  // After a step change, bring the new step into view and move focus to its
  // title so screen readers announce it. Skipped on first render.
  useEffect(() => {
    if (!moved.current) return;
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  }, [index, finished]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' && !finished) go(index + 1);
    if (e.key === 'ArrowLeft') go(finished ? steps.length - 1 : index - 1);
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dayNumber = DAY_NUMBER[activity.day];

  return (
    <div ref={containerRef} className="scroll-mt-24">
      {/* ── Top bar: context + progress ── */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5"
        >
          <span aria-hidden="true">←</span> Accueil
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold">
          {dayNumber && (
            <span className="rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-ink/10">
              Semaine {activity.week} · Jour {dayNumber}
            </span>
          )}
          {activity.difficulty && (
            <span className="rounded-full bg-mteal-light px-3 py-1.5 text-[#115E59]">
              {levelLabel(activity.difficulty)}
            </span>
          )}
        </div>
      </div>

      <nav aria-label="Étapes de l’activité" className="mb-2">
        <ol className="flex gap-1.5">
          {steps.map((s, i) => {
            const done = finished || i < index;
            const current = !finished && i === index;
            return (
              <li key={s.key} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Étape ${i + 1} : ${s.name}${done ? ' (faite)' : ''}`}
                  aria-current={current ? 'step' : undefined}
                  className="group flex w-full flex-col items-center gap-1 py-1"
                >
                  <span
                    className="h-2 w-full rounded-full transition-colors"
                    style={{ backgroundColor: done || current ? s.accent : 'rgba(26,26,26,0.1)', opacity: current ? 1 : done ? 0.55 : 1 }}
                  />
                  <span
                    aria-hidden="true"
                    className={`text-base transition-transform group-hover:scale-110 ${current ? 'scale-110' : done ? '' : 'opacity-40 grayscale'}`}
                  >
                    {s.emoji}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <p className="mb-5 flex justify-between text-xs font-semibold text-ink-soft" aria-live="polite">
        <span>{finished ? 'Toutes les étapes faites !' : `Étape ${index + 1} sur ${steps.length} · ${step.name}`}</span>
        {!finished && <span>≈ {minutesLeft} min</span>}
      </p>

      {/* ── Step card ── */}
      {finished ? (
        <FinishCard activity={activity} headingRef={headingRef} />
      ) : (
        <section
          key={step.key}
          aria-labelledby="step-heading"
          className="animate-rise overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5"
        >
          <div className="h-2" style={{ backgroundColor: step.accent }} />
          <div className="p-5 sm:p-8">
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: step.accent }}>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: step.tint }}
              >
                {step.emoji}
              </span>
              Étape {index + 1} · {step.name} · {step.minutes} min
            </p>
            <h2
              id="step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mb-6 font-display text-2xl font-bold leading-tight text-ink outline-none sm:text-3xl"
            >
              {step.heading}
            </h2>

            <StepBody
              step={step}
              activity={activity}
              canSpeak={canSpeak}
              speak={speak}
              speakSeries={speakSeries}
            />
          </div>
        </section>
      )}

      {/* ── Bottom nav, in the thumb zone ── */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-6 sm:-mx-6 sm:px-6">
        <div className="flex gap-3">
          {(index > 0 || finished) && (
            <button
              type="button"
              onClick={() => go(finished ? steps.length - 1 : index - 1)}
              className="min-h-14 rounded-full bg-white px-5 text-base font-bold text-ink shadow-sm ring-1 ring-ink/10 transition-transform hover:bg-sand active:scale-95"
            >
              <span aria-hidden="true">←</span>
              <span className="sr-only sm:not-sr-only sm:ml-1">Précédent</span>
            </button>
          )}
          {!finished && (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="min-h-14 flex-1 rounded-full px-6 text-lg font-extrabold text-cream shadow-lg transition-transform active:scale-[0.98]"
              style={{ backgroundColor: isLast ? '#E63946' : '#1A1A1A' }}
            >
              {isLast ? 'Terminer 🎉' : (
                <>Suivant · {steps[index + 1].emoji} {steps[index + 1].name} <span aria-hidden="true">→</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Step bodies ───────────────────────── */

type BodyProps = {
  step: StepDef;
  activity: Activity;
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  speakSeries: (pieces: { text: string; rate?: number }[], onStep: (i: number | null) => void) => void;
};

function StepBody({ step, activity: a, canSpeak, speak, speakSeries }: BodyProps) {
  switch (step.key) {
    case 'decouvrir':
      return (
        <>
          <Stage tint={step.tint}>
            <SyllableWord
              word={a.frenchWord}
              syllables={a.syllables}
              className="block break-words font-display text-6xl font-bold leading-none sm:text-8xl"
            />
            {a.pronunciation && <p className="mt-3 text-lg italic text-mpurple">{a.pronunciation}</p>}
            <div className="mt-5 flex justify-center">
              <SpeakButton text={a.frenchWord} label="Écouter le mot" />
            </div>
          </Stage>
          <ParentTip>Montre le mot à ton enfant. Pointe-le du doigt et dis-le avec joie, comme une surprise !</ParentTip>
          {a.culturalNote && (
            <aside className="mt-4 rounded-2xl border-2 border-dashed border-mamber/70 bg-[#FFF8EC] p-4">
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-morange-ink">🌍 Le savais-tu ?</p>
              <p className="leading-relaxed text-ink">{a.culturalNote}</p>
            </aside>
          )}
        </>
      );

    case 'lire':
      return <ReadAlong step={step} activity={a} canSpeak={canSpeak} speakSeries={speakSeries} />;

    case 'syllabes':
      return <SyllableClap step={step} activity={a} speak={speak} />;

    case 'prononcer':
      return <SayItThree step={step} activity={a} canSpeak={canSpeak} speak={speak} />;

    case 'epeler':
      return <SoundsToLetters step={step} activity={a} canSpeak={canSpeak} speak={speak} />;

    case 'ecrire':
      return (
        <>
          <Stage tint={step.tint}>
            <p className="trace-word break-words font-body text-6xl font-extrabold leading-tight sm:text-8xl">{a.frenchWord}</p>
            <p className="mt-2 text-sm text-ink-soft">Suis les lettres avec le doigt, puis au crayon.</p>
          </Stage>
          <Materials items={['Une feuille blanche', 'Un crayon ou un feutre']} />
          <ParentTip>Encourage chaque essai : une lettre bien faite mérite un bravo. Le but, c’est l’effort, pas la perfection.</ParentTip>
        </>
      );

    case 'activite':
      return <ActivitySteps activity={a} accent={step.accent} />;

    case 'chanson':
      return (
        <>
          {a.songLyrics && (
            <Stage tint={step.tint} align="left">
              <p className="whitespace-pre-line font-display text-lg italic leading-loose text-ink sm:text-xl">{a.songLyrics}</p>
            </Stage>
          )}
          {a.songLyrics && (
            <div className="mt-4 flex justify-center">
              <SpeakButton text={a.songLyrics} label="Écouter les paroles" rate={0.85} tone="soft" />
            </div>
          )}
          <ParentTip>Chantez ensemble en tapant dans les mains. Inventez des gestes pour chaque phrase !</ParentTip>
        </>
      );
  }
}

/* ───────────────────────── Building blocks ───────────────────────── */

function Stage({ tint, children, align = 'center' }: { tint: string; children: React.ReactNode; align?: 'center' | 'left' }) {
  return (
    <div className={`rounded-3xl px-4 py-8 sm:px-8 ${align === 'center' ? 'text-center' : ''}`} style={{ backgroundColor: tint }}>
      {children}
    </div>
  );
}

function ParentTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 flex gap-3 rounded-2xl bg-cream p-4 text-base leading-relaxed text-ink">
      <span aria-hidden="true" className="text-xl">💡</span>
      <span>
        <span className="font-extrabold">Astuce parent · </span>
        {children}
      </span>
    </p>
  );
}

function Materials({ items }: { items: string[] }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-ink-soft">📋 Matériel</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((m) => (
          <li key={m} className="rounded-full bg-sand px-3 py-1.5 text-sm font-semibold text-ink">{m}</li>
        ))}
      </ul>
    </div>
  );
}

function ReadAlong({ step, activity: a, canSpeak, speakSeries }: { step: StepDef; activity: Activity; canSpeak: boolean; speakSeries: BodyProps['speakSeries'] }) {
  const sounds = wordSounds(a.frenchWord, a.graphemes);
  const [lit, setLit] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const playOne = (i: number) => {
    const s = sounds[i];
    if (s.kind === 'silent' || !s.key) {
      setLit(i);
      return;
    }
    speakSeries([{ text: SOUNDS[s.key].say }], (step) => setLit(step === null ? null : i));
  };

  // Sound by sound, then the whole word: the child hears the sounds blend.
  const readWithMe = () => {
    const heard = sounds.map((s, i) => ({ s, i })).filter(({ s }) => s.kind !== 'silent' && s.kind !== 'separator' && s.key);
    if (canSpeak) {
      speakSeries(
        [...heard.map(({ s }) => ({ text: SOUNDS[s.key].say, rate: 0.6 })), { text: a.frenchWord, rate: 0.8 }],
        (step) => setLit(step === null ? null : step < heard.length ? heard[step].i : -1),
      );
      return;
    }
    // No voice: still walk through the sounds so the parent can say them.
    if (timer.current) clearInterval(timer.current);
    let k = 0;
    setLit(heard[0]?.i ?? null);
    timer.current = setInterval(() => {
      k += 1;
      if (k > heard.length) {
        if (timer.current) clearInterval(timer.current);
        setLit(null);
      } else {
        setLit(k === heard.length ? -1 : heard[k].i);
      }
    }, 900);
  };

  return (
    <>
      <Stage tint={step.tint}>
        <div className="flex flex-wrap items-end justify-center gap-1.5 sm:gap-2" aria-label={`Les sons du mot ${a.frenchWord}`}>
          {sounds.map((s, i) =>
            s.kind === 'separator' ? (
              <span key={i} className="w-3" aria-hidden="true" />
            ) : (
              <SoundTile key={i} sound={s} lit={lit === i || lit === -1} onTap={() => playOne(i)} />
            ),
          )}
        </div>
        <p className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
          <span><span className="text-mred">■</span> voyelle</span>
          <span><span className="text-ink">■</span> consonne</span>
          {sounds.some((s) => s.kind === 'silent') && <span><span className="text-ink/30">■</span> lettre muette, on ne la lit pas</span>}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={readWithMe}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-bold text-cream shadow-md active:scale-95"
          >
            <span aria-hidden="true">👉</span> Lire avec moi, son par son
          </button>
        </div>
      </Stage>
      <ParentTip>
        On lit les <strong>sons</strong>, pas le nom des lettres : on dit « mmm », pas « èm ». Glisse ton doigt sous chaque son,
        puis colle-les ensemble pour dire le mot.
        {canSpeak && ' Touche un son pour l’entendre.'}
      </ParentTip>
    </>
  );
}

/**
 * Level 4, before writing: for each sound the child hears, which letters
 * write it — and the silent letters we write but never hear.
 */
function SoundsToLetters({ step, activity: a, canSpeak, speak }: { step: StepDef; activity: Activity; canSpeak: boolean; speak: BodyProps['speak'] }) {
  const sounds = wordSounds(a.frenchWord, a.graphemes).filter((s) => s.kind !== 'separator');
  return (
    <>
      <Stage tint={step.tint}>
        <div className="flex flex-wrap justify-center gap-2">
          {sounds.map((s, i) => {
            const silent = s.kind === 'silent' || !s.key;
            return (
              <button
                key={i}
                type="button"
                onClick={() => !silent && speak(SOUNDS[s.key].say, 0.7)}
                aria-label={silent ? `${s.text} : lettre muette, on l'écrit mais on ne l'entend pas` : `On entend ${SOUNDS[s.key].hint}, on écrit ${s.text}`}
                className={`flex min-w-16 flex-col items-center rounded-2xl px-3 py-2 ring-1 transition-transform active:scale-95 ${silent ? 'bg-white/60 ring-ink/5' : 'bg-white shadow-[0_3px_0_rgba(26,26,26,0.12)] ring-ink/10'}`}
              >
                <span className={`text-sm font-extrabold ${silent ? 'text-ink/30' : 'text-mpurple'}`}>{silent ? 'chut' : `« ${SOUNDS[s.key].hint} »`}</span>
                <span aria-hidden="true" className="text-xs text-ink/30">↓</span>
                <span className={`font-display text-4xl font-bold leading-none ${silent ? 'text-ink/25' : s.kind === 'vowel' ? 'text-mred' : 'text-ink'}`}>
                  {s.text.toLocaleLowerCase('fr')}
                </span>
              </button>
            );
          })}
        </div>
      </Stage>
      <ParentTip>
        Dis un son (« mmm »), ton enfant montre les lettres qui l’écrivent. Les lettres grises sont muettes : on les écrit, mais on ne les entend pas.
        {canSpeak && ' Touche un son pour l’entendre.'}
      </ParentTip>
    </>
  );
}

/** One sound of the word: the letters on top, what to say underneath. */
function SoundTile({ sound, lit, onTap }: { sound: Sound; lit: boolean; onTap: () => void }) {
  const [pulse, setPulse] = useState(0);
  const silent = sound.kind === 'silent';
  const hint = !silent && sound.key ? SOUNDS[sound.key].hint : '';
  return (
    <button
      type="button"
      onClick={() => {
        setPulse((p) => p + 1);
        onTap();
      }}
      aria-label={silent ? `${sound.text} : lettre muette` : `Son ${hint}, écrit ${sound.text}`}
      className={`flex min-w-12 flex-col items-center rounded-2xl px-2.5 pb-1.5 pt-2 shadow-[0_3px_0_rgba(26,26,26,0.15)] ring-1 transition-all active:translate-y-0.5 active:shadow-none sm:min-w-14 sm:px-3 ${
        silent ? 'bg-white/60 ring-ink/5 shadow-none' : 'bg-white ring-ink/10'
      } ${lit ? '-translate-y-1 ring-4 ring-mamber' : ''}`}
    >
      <span
        key={pulse}
        className={`font-display text-3xl font-bold leading-none sm:text-4xl ${pulse ? 'animate-pop' : ''} ${
          silent ? 'text-ink/25' : sound.kind === 'vowel' ? 'text-mred' : 'text-ink'
        }`}
      >
        {sound.text.toLocaleLowerCase('fr')}
      </span>
      <span className={`mt-1 text-[11px] font-extrabold ${silent ? 'text-ink/30' : 'text-ink-soft'}`}>
        {silent ? 'muette' : hint}
      </span>
    </button>
  );
}

function SyllableClap({ step, activity: a, speak }: { step: StepDef; activity: Activity; speak: BodyProps['speak'] }) {
  // Clap the syllables as they are written in Airtable, even when they are
  // spelled differently from the word — never silently collapse to one.
  const written = syllableParts(a.syllables);
  const parts = written.length > 0 ? written : [a.frenchWord];
  const [claps, setClaps] = useState<number[]>([]);
  const count = claps.length;
  const total = parts.length;
  const done = count >= total;

  const clap = (i: number) => {
    speak(parts[i], 0.7);
    if (!claps.includes(i)) setClaps([...claps, i]);
  };

  return (
    <>
      <Stage tint={step.tint}>
        <div className="flex flex-wrap justify-center gap-3">
          {parts.map((syl, i) => {
            const on = claps.includes(i);
            const color = SYLLABLE_COLORS[i % SYLLABLE_COLORS.length];
            return (
              <button
                key={i}
                type="button"
                onClick={() => clap(i)}
                aria-pressed={on}
                aria-label={`Syllabe ${i + 1} : ${syl}`}
                className="flex min-w-24 flex-col items-center gap-1 rounded-3xl px-5 py-4 shadow-[0_4px_0_rgba(26,26,26,0.12)] transition-all active:translate-y-1 active:shadow-none"
                style={{ backgroundColor: on ? color : '#FFFFFF', color: on ? '#FDF6EC' : color }}
              >
                <span aria-hidden="true" className={`text-2xl ${on ? 'animate-pop' : 'opacity-60'}`}>{on ? '👏' : '✋'}</span>
                <span className="font-display text-4xl font-bold">{syl}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-6 font-display text-2xl font-bold text-ink" aria-live="polite">
          {done ? (
            <>Bravo ! {total} syllabe{total > 1 ? 's' : ''} 🎉</>
          ) : (
            <>👏 {count} / {total}</>
          )}
        </p>
        {done && (
          <button type="button" onClick={() => setClaps([])} className="mt-2 text-sm font-bold text-mteal-ink underline underline-offset-4">
            Recommencer
          </button>
        )}
      </Stage>
      <ParentTip>Tapez dans vos mains à chaque syllabe et comptez ensemble : un, deux… Touchez les bulles pour les entendre.</ParentTip>
    </>
  );
}

function SayItThree({ step, activity: a, canSpeak, speak }: Omit<BodyProps, 'speakSeries'>) {
  const [said, setSaid] = useState(0);
  return (
    <>
      <Stage tint={step.tint}>
        {a.pronunciation && (
          <p className="font-display text-4xl italic text-mpurple sm:text-5xl">{a.pronunciation}</p>
        )}
        {canSpeak && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <SpeakButton text={a.frenchWord} label="Normal" rate={0.9} />
            <SpeakButton text={a.frenchWord} label="Tout doucement" rate={0.5} tone="soft" />
          </div>
        )}
        <p className="mt-8 mb-3 font-bold text-ink">On le dit 3 fois ensemble :</p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((i) => {
            const on = i < said;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSaid(Math.max(said, i + 1));
                  speak(a.frenchWord);
                }}
                aria-label={`Fois ${i + 1}${on ? ' (dit)' : ''}`}
                aria-pressed={on}
                className="flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-bold transition-all active:scale-90"
                style={{ backgroundColor: on ? '#5B1F8C' : '#FFFFFF', color: on ? '#FDF6EC' : '#5B1F8C', boxShadow: '0 3px 0 rgba(26,26,26,0.12)' }}
              >
                {on ? <span className="animate-pop">★</span> : i + 1}
              </button>
            );
          })}
        </div>
        {said >= 3 && <p className="mt-4 font-bold text-mpurple" aria-live="polite">Super prononciation ! 🌟</p>}
      </Stage>
      {a.exampleSentence && (
        <div className="mt-5 rounded-2xl bg-cream p-4">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-ink-soft">Dans une phrase</p>
          <p className="font-display text-lg italic text-ink">« {a.exampleSentence} »</p>
          <SpeakButton text={a.exampleSentence} label="Écouter la phrase" tone="soft" className="mt-3" />
        </div>
      )}
    </>
  );
}

function ActivitySteps({ activity: a, accent }: { activity: Activity; accent: string }) {
  const steps = a.activitySteps
    ? a.activitySteps
        // Steps come one per line, or on one line separated by " | ".
        .split(/\n|\s\|\s/)
        .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
        .filter(Boolean)
    : [];
  const materials = a.materials
    ? a.materials.split(/\n|,|;|•/).map((m) => m.replace(/^[-–]\s*/, '').trim()).filter(Boolean)
    : [];
  const [checked, setChecked] = useState<number[]>([]);
  const toggle = (i: number) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  return (
    <>
      {materials.length > 0 && <Materials items={materials} />}
      {steps.length > 0 && (
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map((s, i) => {
            const on = checked.includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left ring-1 transition-colors ${on ? 'bg-[#E5F4EC] ring-[#2D9B6F]/30' : 'bg-cream ring-ink/5 hover:bg-sand'}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                    style={{ backgroundColor: on ? '#2D9B6F' : accent, color: '#FDF6EC' }}
                  >
                    {on ? '✓' : i + 1}
                  </span>
                  <span className={`pt-1 leading-relaxed text-ink ${on ? 'opacity-60 line-through decoration-ink/30' : ''}`}>{s}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {steps.length > 0 && (
        <p className="mt-3 text-center text-sm text-ink-soft">Touche une étape quand elle est faite.</p>
      )}
    </>
  );
}

/* ───────────────────────── Finish ───────────────────────── */

const CONFETTI_COLORS = ['#E63946', '#F4A340', '#2EC4B6', '#5B1F8C', '#E6197A'];

type Piece = { left: number; delay: number; duration: number; color: string; drift: number; size: number };

function FinishCard({ activity: a, headingRef }: { activity: Activity; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  // Read once when this card mounts (client only — it only renders after a click).
  const [done, setDone] = useState(() => isCompletedToday(a.id));
  const [streak, setStreak] = useState(() => currentStreak());
  const [confetti, setConfetti] = useState<Piece[]>([]);

  const complete = () => {
    markCompleted(a.id);
    setDone(true);
    setStreak(currentStreak());
    setConfetti(
      Array.from({ length: 48 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        drift: (Math.random() - 0.5) * 160,
        size: 6 + Math.random() * 8,
      })),
    );
  };

  return (
    <section aria-labelledby="finish-heading" className="animate-rise overflow-hidden rounded-[28px] bg-white text-center shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5">
      {confetti.length > 0 && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confetti.map((p, i) => (
            <span
              key={i}
              className="confetti-piece absolute top-0 rounded-sm"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                animation: `mounas-confetti ${p.duration}s ${p.delay}s ease-in forwards`,
                ['--drift' as string]: `${p.drift}px`,
              }}
            />
          ))}
        </div>
      )}
      <div className="h-2 bg-gradient-to-r from-mred via-mamber to-mteal" />
      <div className="p-6 sm:p-10">
        {!done ? (
          <>
            <p className="text-5xl" aria-hidden="true">🙌</p>
            <h2 id="finish-heading" ref={headingRef} tabIndex={-1} className="mt-3 font-display text-3xl font-bold text-ink outline-none">
              Vous avez fini !
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">
              Bravo à vous deux pour ces 10 minutes autour du mot{' '}
              <SyllableWord word={a.frenchWord} syllables={a.syllables} className="font-display font-bold" />.
            </p>
            <button
              type="button"
              onClick={complete}
              className="mt-7 min-h-14 w-full max-w-sm rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg transition-transform hover:bg-mred-dark active:scale-[0.98]"
            >
              ✓ On l’a fait ensemble !
            </button>
          </>
        ) : (
          <>
            <div className="animate-badge mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-mamber to-[#F7C26B] text-6xl shadow-[0_8px_0_#D98A22]" aria-hidden="true">
              ⭐
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-morange-ink">Badge gagné</p>
            <h2 id="finish-heading" ref={headingRef} tabIndex={-1} className="mt-1 font-display text-3xl font-bold text-ink outline-none">
              {a.badgeName || `Le mot « ${a.frenchWord} »`}
            </h2>
            {streak > 0 && (
              <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#FFF1E0] px-4 py-2 font-bold text-morange-ink">
                <span aria-hidden="true">🔥</span>
                {streak === 1 ? 'Premier jour ! Reviens demain pour continuer.' : `${streak} jours de suite — bravo !`}
              </p>
            )}
            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
              <Link
                href="/app/select"
                className="flex min-h-14 items-center justify-center rounded-full bg-ink px-6 text-lg font-extrabold text-cream shadow-md active:scale-[0.98]"
              >
                🎲 Encore un mot
              </Link>
              <Link
                href="/app"
                className="flex min-h-12 items-center justify-center rounded-full px-6 font-bold text-ink ring-1 ring-ink/15 hover:bg-sand"
              >
                Retour à l’accueil
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
