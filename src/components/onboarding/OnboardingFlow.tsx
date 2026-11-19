'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { track } from '@vercel/analytics';
import { startFirstWord } from '@/app/auth-actions';
import MounasLogo from '@/components/brand/MounasLogo';
import { GUARANTEE, MONTHLY_PRICE, STRIPE_PAYMENT_LINK, TRIAL_DAYS } from '@/lib/config';
import ExpoOffer from '@/components/expo/ExpoOffer';
import { useExpoVisit } from '@/lib/expo-client';
import { DEMO_MINUTES } from '@/lib/demo';
import { sendFunnelStep } from '@/lib/funnel-client';
import { LEVELS } from '@/lib/levels';
import {
  AGE_CHOICES,
  asksNumbers,
  CHESS_CHOICES,
  de,
  EMPTY_PROFILE,
  INTEREST_CHOICES,
  MATH_CHOICES,
  saveProfile,
  STAGE_CHOICES,
  startingLevel,
  themesFor,
  type Choice,
  type ChildProfile,
} from '@/lib/onboarding';

/*
 * /commencer: the getting-started questionnaire. Straight to the questions,
 * one per screen with big buttons, then the child's programme and a first
 * word at the right level. No screen in between that isn't a question.
 *
 * A single-choice question moves on by itself once tapped; the others have a
 * « Continuer » button pinned at the bottom, under the thumb.
 */

type Step = 'name' | 'age' | 'stage' | 'math' | 'chess' | 'themes' | 'plan';

/** Calculation and chess are only asked from 3 years old. */
const stepsFor = (age: string): Step[] =>
  asksNumbers(age) ? ['name', 'age', 'stage', 'math', 'chess', 'themes', 'plan'] : ['name', 'age', 'stage', 'themes', 'plan'];

/** How the visitor arrives: decides what is offered next to the last button. */
export type Access = 'member' | 'demo' | 'free';

export default function OnboardingFlow({ access }: { access: Access }) {
  const [index, setIndex] = useState(0);
  const expo = useExpoVisit();
  const [profile, setProfile] = useState<ChildProfile>(EMPTY_PROFILE);
  // The raw answer to « où en est ton enfant ? » ('' = « je ne sais pas »).
  const [stage, setStage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // « Questionnaire commencé » in Airtable once the first question is answered
  // (src/lib/funnel-log.ts). Opening the page alone doesn't count.
  const started = useRef(false);
  useEffect(() => {
    if (index < 1 || started.current) return;
    started.current = true;
    sendFunnelStep({ event: 'start', access });
  }, [index, access]);

  const steps = stepsFor(profile.age);
  const step: Step = steps[Math.min(index, steps.length - 1)];
  const name = profile.name.trim();
  const who = name || 'ton enfant';
  const whose = name ? de(name) : 'de ton enfant';
  const levelValue = startingLevel(stage ?? '', profile.age);
  const level = LEVELS.find((l) => l.value === levelValue) ?? LEVELS[0];
  const numbers = asksNumbers(profile.age);
  const math = numbers ? MATH_CHOICES.find((c) => c.value === profile.math) : undefined;
  const chess = numbers ? CHESS_CHOICES.find((c) => c.value === profile.chess) : undefined;
  const finalProfile: ChildProfile = { ...profile, name, level: levelValue, math: math?.value ?? '', chess: chess?.value ?? '' };

  const go = (to: number) => {
    if (timer.current) clearTimeout(timer.current);
    setIndex(Math.max(0, to));
    top.current?.scrollIntoView({ block: 'start' });
  };
  const next = () => go(index + 1);

  /** A tap on a single-choice answer: show it selected for a beat, then move on. */
  const pick = (patch: Partial<ChildProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(next, 260);
  };

  const toggleInterest = (value: string) =>
    setProfile((p) => ({ ...p, interests: p.interests.includes(value) ? p.interests.filter((v) => v !== value) : [...p.interests, value] }));
  const liked = INTEREST_CHOICES.filter((c) => profile.interests.includes(c.value));

  const finished = useRef(false);
  const finish = () => {
    saveProfile(finalProfile);
    track('Questionnaire terminé');
    // The answers, never the first name (src/lib/funnel-log.ts keeps only known choices).
    if (finished.current) return;
    finished.current = true;
    sendFunnelStep({
      event: 'finish',
      access,
      age: finalProfile.age,
      level: finalProfile.level,
      math: finalProfile.math,
      chess: finalProfile.chess,
      interests: finalProfile.interests,
    });
  };

  return (
    <main ref={top} className="flex min-h-dvh flex-1 flex-col bg-cream font-body text-ink">
      {/* ── Top bar: back, progress, leave ── */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Question précédente"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink hover:bg-sand"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
          ) : (
            <span className="h-10 w-10 flex-shrink-0" />
          )}
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand"
            role="progressbar"
            aria-label="Avancement"
            aria-valuemin={0}
            aria-valuemax={steps.length - 1}
            aria-valuenow={index}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-mred via-mamber to-mteal transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(6, (index / (steps.length - 1)) * 100)}%` }}
            />
          </div>
          <Link
            href="/"
            aria-label="Quitter"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-ink-soft hover:bg-sand"
          >
            <span aria-hidden="true">✕</span>
          </Link>
        </div>
      </div>

      {/* ── One screen at a time ── */}
      <div key={step} className="animate-rise mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-6">
        {step === 'name' && (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              track('Questionnaire commencé');
              next();
            }}
          >
            <div className="flex justify-center">
              <MounasLogo href={null} variant="wordmark" height={34} />
            </div>
            <Question title="Comment s’appelle ton enfant ?" sub="Quelques questions, et son premier mot est prêt, à son niveau. Rien à télécharger." />
            <label htmlFor="child-name" className="sr-only">
              Prénom de l’enfant
            </label>
            <input
              id="child-name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value.slice(0, 20) }))}
              placeholder="Son prénom"
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              className="mt-7 min-h-16 w-full rounded-3xl bg-white px-6 text-center font-display text-2xl font-bold text-ink shadow-sm outline-none ring-2 ring-ink/10 placeholder:font-body placeholder:text-lg placeholder:font-semibold placeholder:text-ink-soft/60 focus:ring-mpurple"
            />
            <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-bold">
              <li className="rounded-full bg-mteal-light px-3 py-1.5 text-[#115E59]">⏱ 1 minute</li>
              <li className="rounded-full bg-sand px-3 py-1.5">🙌 Pas de compte, pas de carte</li>
            </ul>
            <Footer>
              <Primary submit>{name ? 'Continuer' : 'Continuer sans prénom'}</Primary>
            </Footer>
          </form>
        )}

        {step === 'age' && (
          <>
            <Question title={`Quel âge a ${who} ?`} />
            <Options choices={AGE_CHOICES} selected={profile.age} onPick={(v) => pick({ age: v })} />
          </>
        )}

        {step === 'stage' && (
          <>
            <Question title={`Où en est ${who} avec les mots ?`} sub="Tu pourras changer de niveau quand tu veux." />
            <Options
              choices={STAGE_CHOICES}
              selected={stage}
              onPick={(v) => {
                setStage(v);
                pick({});
              }}
            />
          </>
        )}

        {step === 'math' && (
          <>
            <Question title="Et avec les chiffres ?" sub="Le calcul commencera là, puis suivra son rythme." />
            <Options choices={MATH_CHOICES} selected={profile.math || null} onPick={(v) => pick({ math: v })} />
          </>
        )}

        {step === 'chess' && (
          <>
            <Question title="Et les échecs ?" sub="À Mounaville, on les apprend en jouant, chapitre par chapitre." />
            <Options choices={CHESS_CHOICES} selected={profile.chess || null} onPick={(v) => pick({ chess: v })} />
          </>
        )}

        {step === 'themes' && (
          <>
            <Question title="Qu’est-ce qui fait briller ses yeux ?" sub="Choisis tout ce que ton enfant adore." />
            <ul className="mt-7 grid grid-cols-2 gap-3">
              {INTEREST_CHOICES.map((c) => {
                const on = profile.interests.includes(c.value);
                return (
                  <li key={c.value}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleInterest(c.value)}
                      className={`flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl px-2 py-3 text-center font-extrabold transition-all active:scale-[0.97] ${
                        on ? 'bg-ink text-cream shadow-md' : 'bg-white text-ink ring-1 ring-ink/10 hover:bg-sand'
                      }`}
                    >
                      <span className="text-3xl" aria-hidden="true">{c.emoji}</span>
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Footer>
              <Primary onClick={next}>{liked.length === 0 ? 'Un peu de tout !' : 'Continuer'}</Primary>
            </Footer>
          </>
        )}

        {step === 'plan' && (
          <>
            <p className="text-center text-sm font-extrabold uppercase tracking-[0.18em] text-mpurple">✨ C’est prêt</p>
            <h1 className="mt-2 text-center font-display text-3xl font-bold leading-tight">Le programme {whose}</h1>

            <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[0_14px_44px_-14px_rgba(91,31,140,0.35)] ring-1 ring-ink/5">
              <div className="h-2 bg-gradient-to-r from-mred via-mamber to-mteal" />
              <div className="p-5">
                <LevelPath current={level.value} />
                <dl className="mt-5 grid gap-3">
                  <Row emoji={level.emoji} term="Les mots" value={`${level.short} · ${level.label}`} />
                  <Row
                    emoji={liked[0]?.emoji ?? '🎲'}
                    term="Ses passions"
                    value={liked.length > 0 ? liked.map((c) => c.label).join(', ') : 'Un peu de tout'}
                  />
                  {math && <Row emoji="🔢" term="Le calcul" value={math.start} />}
                  {chess?.chapter && <Row emoji="♟️" term="Les échecs" value={chess.start} />}
                </dl>
              </div>
            </section>

            {access !== 'member' && expo && <ExpoOffer className="mt-4" />}
            {access !== 'member' && !expo && (
              <section className="mt-4 rounded-[28px] bg-[#F1E9F8] p-5 text-center">
                <h2 className="font-display text-lg font-bold">Envie de continuer après la démo ?</h2>
                <a
                  href={STRIPE_PAYMENT_LINK}
                  onClick={finish}
                  className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-extrabold text-mpurple ring-2 ring-mpurple"
                >
                  Essai gratuit de {TRIAL_DAYS} jours
                </a>
                <p className="mt-2 text-sm text-ink-soft">
                  Puis {MONTHLY_PRICE}/mois, sans engagement. 🛡️ {GUARANTEE}.
                </p>
              </section>
            )}

            <Footer>
              <form action={startFirstWord} onSubmit={finish}>
                <input type="hidden" name="level" value={levelValue} />
                <input type="hidden" name="themes" value={themesFor(profile.interests).join('|')} />
                <Submit>Découvrir son premier mot</Submit>
              </form>
              {access === 'free' && (
                <p className="mt-2 text-center text-sm text-ink-soft">
                  La démo s’ouvre tout de suite, {DEMO_MINUTES} minutes : pas de compte, pas de carte.
                </p>
              )}
            </Footer>
          </>
        )}
      </div>
    </main>
  );
}

function Question({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="pt-4 text-center">
      {/* French punctuation never starts a line on its own. */}
      <h1 className="font-display text-3xl font-bold leading-tight">{title.replace(/ ([?!])/g, '\u00a0$1')}</h1>
      {sub && <p className="mt-3 text-lg text-ink-soft">{sub}</p>}
    </header>
  );
}

/** The button area, pushed to the bottom of the screen and pinned there. */
function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-cream from-80% to-cream/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
      {children}
    </div>
  );
}

const PRIMARY =
  'flex min-h-14 w-full items-center justify-center rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg transition-transform hover:bg-mred-dark active:scale-[0.98] disabled:opacity-40';

function Primary({
  children,
  onClick,
  disabled,
  submit,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  submit?: boolean;
}) {
  return (
    <button type={submit ? 'submit' : 'button'} onClick={onClick} disabled={disabled} className={PRIMARY}>
      {children} <span aria-hidden="true" className="ml-2">→</span>
    </button>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={PRIMARY}>
      {pending ? 'On ouvre son mot…' : children}
      {!pending && <span aria-hidden="true" className="ml-2">→</span>}
    </button>
  );
}

/** Single-choice answers: one tap picks and moves on. */
function Options({ choices, selected, onPick }: { choices: Choice[]; selected: string | null; onPick: (value: string) => void }) {
  return (
    <ul className="mt-7 grid gap-3">
      {choices.map((c) => {
        const on = selected === c.value;
        return (
          <li key={c.value || 'unsure'}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onPick(c.value)}
              className={`flex min-h-[4.5rem] w-full items-center gap-4 rounded-3xl px-4 py-3 text-left text-lg font-extrabold transition-all active:scale-[0.98] ${
                on ? 'bg-ink text-cream shadow-md' : 'bg-white text-ink ring-1 ring-ink/10 hover:bg-sand'
              }`}
            >
              <span
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${on ? 'bg-cream/15' : 'bg-cream'}`}
                aria-hidden="true"
              >
                {c.emoji}
              </span>
              <span className="flex-1 leading-snug">
                {c.label}
                {c.hint && <span className={`block text-sm font-semibold ${on ? 'text-cream/70' : 'text-ink-soft'}`}>{c.hint}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Graine → pousse → arbre → baobab, with the child's starting point lit up. */
function LevelPath({ current }: { current: string }) {
  const at = LEVELS.findIndex((l) => l.value === current);
  return (
    <ol className="mt-6 flex w-full items-start" aria-label="Les quatre niveaux">
      {LEVELS.map((l, i) => (
        <li key={l.value} className="relative flex flex-1 flex-col items-center">
          {i > 0 && (
            <span
              className={`absolute right-1/2 top-6 h-1 w-full -translate-y-1/2 ${i <= at ? 'bg-mteal' : 'bg-sand'}`}
              aria-hidden="true"
            />
          )}
          <span
            className={`relative flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
              i === at ? 'bg-mamber shadow-md ring-4 ring-mamber/30' : i < at ? 'bg-mteal-light' : 'bg-sand opacity-70'
            }`}
            aria-hidden="true"
          >
            {l.emoji}
          </span>
          <span className={`mt-2 text-xs ${i === at ? 'font-extrabold text-ink' : 'font-bold text-ink-soft'}`}>
            {i === at ? 'Départ' : l.short}
            {i === at && <span className="sr-only"> : {l.short}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Row({ emoji, term, value }: { emoji: string; term: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-cream text-xl" aria-hidden="true">
        {emoji}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink-soft">{term}</dt>
        <dd className="font-extrabold leading-snug">{value}</dd>
      </div>
    </div>
  );
}
