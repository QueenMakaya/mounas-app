'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { track } from '@vercel/analytics';
import { startFirstWord } from '@/app/auth-actions';
import MounasLogo from '@/components/brand/MounasLogo';
import { GUARANTEE, MONTHLY_PRICE, STRIPE_PAYMENT_LINK, TRIAL_DAYS } from '@/lib/config';
import { DEMO_MINUTES } from '@/lib/demo';
import { LEVELS } from '@/lib/levels';
import { themeEmoji } from '@/lib/themes';
import {
  AGE_CHOICES,
  de,
  EMPTY_PROFILE,
  GOAL_CHOICES,
  INVOLVEMENT_CHOICES,
  MAX_GOALS,
  RHYTHM_CHOICES,
  saveProfile,
  STAGE_CHOICES,
  startingLevel,
  type Choice,
  type ChildProfile,
} from '@/lib/onboarding';

/*
 * /commencer: the getting-started questionnaire. One question per screen,
 * big buttons, a word of encouragement between questions, and at the end the
 * child's programme and a first word at the right level.
 *
 * A single-choice question moves on by itself once tapped; the others have a
 * « Continuer » button pinned at the bottom, under the thumb.
 */

const STEPS = [
  'welcome',
  'name',
  'age',
  'stage',
  'level',
  'goals',
  'themes',
  'inside',
  'involvement',
  'involved',
  'rhythm',
  'building',
  'plan',
] as const;
type Step = (typeof STEPS)[number];

/** How the visitor arrives: decides what the last button does and says. */
export type Access = 'member' | 'demo' | 'free';

const INSIDE = [
  { emoji: '✨', tint: '#FDECEE', text: 'Un mot mystère à retourner, carte par carte' },
  { emoji: '👏', tint: '#E3F8F5', text: 'Les syllabes dans les mains, les sons à voix haute' },
  { emoji: '🎮', tint: '#FEF3E2', text: 'Des jeux autour du mot, puis on chante et on bouge' },
];

const BUILD_MS = 750;

export default function OnboardingFlow({ themes, access }: { themes: string[]; access: Access }) {
  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<ChildProfile>(EMPTY_PROFILE);
  // The raw answer to « où en est ton enfant ? » ('' = « je ne sais pas »).
  const [stage, setStage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const step: Step = STEPS[index];
  const name = profile.name.trim();
  const who = name || 'ton enfant';
  const Who = name || 'Ton enfant';
  const whose = name ? de(name) : 'de ton enfant';
  const levelValue = startingLevel(stage ?? '', profile.age);
  const level = LEVELS.find((l) => l.value === levelValue) ?? LEVELS[0];
  const involvement = INVOLVEMENT_CHOICES.find((c) => c.value === profile.involvement);
  const rhythm = RHYTHM_CHOICES.find((c) => c.value === profile.rhythm);
  // « Je ne sais pas encore » is an answer, but not a rhythm to announce.
  const setRhythm = rhythm && rhythm.value !== 'libre' ? rhythm : null;
  const finalProfile: ChildProfile = { ...profile, name, level: levelValue };

  const go = (to: number) => {
    if (timer.current) clearTimeout(timer.current);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, to)));
    top.current?.scrollIntoView({ block: 'start' });
  };
  const next = () => go(index + 1);
  // The « on prépare » screen is a one-way animation: going back skips it.
  const back = () => go(STEPS[index - 1] === 'building' ? index - 2 : index - 1);

  /** A tap on a single-choice answer: show it selected for a beat, then move on. */
  const pick = (patch: Partial<ChildProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(next, 260);
  };

  const toggle = (key: 'goals' | 'themes', value: string, max = Infinity) =>
    setProfile((p) => {
      const list = p[key];
      if (list.includes(value)) return { ...p, [key]: list.filter((v) => v !== value) };
      return list.length >= max ? p : { ...p, [key]: [...list, value] };
    });

  const finish = () => {
    saveProfile(finalProfile);
    track('Questionnaire terminé');
  };

  return (
    <main ref={top} className="flex min-h-dvh flex-1 flex-col bg-cream font-body text-ink">
      {/* ── Top bar: back, progress, leave ── */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          {index > 0 && step !== 'building' ? (
            <button
              type="button"
              onClick={back}
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
            aria-valuemax={STEPS.length - 1}
            aria-valuenow={index}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-mred via-mamber to-mteal transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(6, (index / (STEPS.length - 1)) * 100)}%` }}
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
        {step === 'welcome' && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MounasLogo href={null} variant="lockup" height={84} />
              <h1 className="mt-8 font-display text-3xl font-bold leading-tight sm:text-4xl">
                On prépare le premier mot de ton enfant
              </h1>
              <p className="mt-4 text-lg text-ink-soft">
                Quelques questions toutes simples, et son programme est prêt : le bon niveau, ses thèmes préférés, votre
                rythme.
              </p>
              <ul className="mt-7 flex flex-wrap justify-center gap-2 text-sm font-bold">
                <li className="rounded-full bg-mteal-light px-3 py-1.5 text-[#115E59]">⏱ 2 minutes</li>
                <li className="rounded-full bg-sand px-3 py-1.5">🙌 Pas de compte, pas de carte</li>
                <li className="rounded-full bg-sand px-3 py-1.5">🔒 Tes réponses restent sur cet appareil</li>
              </ul>
            </div>
            <Footer>
              <Primary
                onClick={() => {
                  track('Questionnaire commencé');
                  next();
                }}
              >
                C’est parti
              </Primary>
            </Footer>
          </>
        )}

        {step === 'name' && (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <Question title="Comment s’appelle ton enfant ?" sub="Juste son prénom, pour lui dire bonjour dans l’app." />
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
            <p className="mt-4 text-center text-sm text-ink-soft">
              Plusieurs enfants ? Commence par celui ou celle qui est à côté de toi.
            </p>
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
            <Question
              title={`Où en est ${who} avec les mots ?`}
              sub="Il n’y a pas de mauvaise réponse : tu pourras changer de niveau quand tu veux."
            />
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

        {step === 'level' && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="animate-badge flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl shadow-[0_14px_44px_-14px_rgba(91,31,140,0.35)]" aria-hidden="true">
                {level.emoji}
              </p>
              <h1 className="mt-7 font-display text-3xl font-bold leading-tight">
                Parfait ! {Who} commence au {level.short}
              </h1>
              <p className="mt-2 text-lg font-bold text-mpurple">{level.label}</p>
              <LevelPath current={level.value} />
              <p className="mt-6 text-ink-soft">
                Nos niveaux racontent ce que l’enfant sait faire, pas son âge. De la graine au baobab, chacun pousse à son
                rythme.
              </p>
            </div>
            <Footer>
              <Primary onClick={next}>Continuer</Primary>
            </Footer>
          </>
        )}

        {step === 'goals' && (
          <>
            <Question title={`Qu’aimerais-tu pour ${who} ?`} sub={`Choisis jusqu’à ${MAX_GOALS} envies.`} />
            <ul className="mt-7 grid gap-3">
              {GOAL_CHOICES.map((c) => {
                const on = profile.goals.includes(c.value);
                const full = !on && profile.goals.length >= MAX_GOALS;
                return (
                  <li key={c.value}>
                    <Check on={on} dim={full} onClick={() => toggle('goals', c.value, MAX_GOALS)}>
                      <span aria-hidden="true" className="mr-2">{c.emoji}</span>
                      {c.label}
                    </Check>
                  </li>
                );
              })}
            </ul>
            <Footer>
              <Primary onClick={next} disabled={profile.goals.length === 0}>
                Continuer
              </Primary>
            </Footer>
          </>
        )}

        {step === 'themes' && (
          <>
            <Question
              title="Qu’est-ce qui fait briller ses yeux ?"
              sub="Son premier mot viendra d’un de ses thèmes préférés."
            />
            <ul className="mt-7 grid grid-cols-2 gap-3">
              {themes.map((t) => {
                const on = profile.themes.includes(t);
                return (
                  <li key={t}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle('themes', t)}
                      className={`flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl px-2 py-3 text-center font-extrabold transition-all active:scale-[0.97] ${
                        on ? 'bg-ink text-cream shadow-md' : 'bg-white text-ink ring-1 ring-ink/10 hover:bg-sand'
                      }`}
                    >
                      <span className="text-3xl" aria-hidden="true">{themeEmoji(t)}</span>
                      {t}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Footer>
              <Primary onClick={next}>{profile.themes.length === 0 ? 'Un peu de tout !' : 'Continuer'}</Primary>
            </Footer>
          </>
        )}

        {step === 'inside' && (
          <>
            <Question title="Beaux choix ! Voici ce qui vous attend" sub="Chaque jour dans l’app, autour d’un seul mot :" />
            <ol className="mt-7 grid gap-3">
              {INSIDE.map((item, i) => (
                <li
                  key={item.text}
                  className="animate-rise flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5"
                  style={{ animationDelay: `${0.15 + i * 0.15}s` }}
                >
                  <span
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
                    style={{ backgroundColor: item.tint }}
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  <span className="text-lg font-bold leading-snug">{item.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center font-display text-xl font-bold text-mpurple">10 minutes, pas plus.</p>
            <Footer>
              <Primary onClick={next}>Continuer</Primary>
            </Footer>
          </>
        )}

        {step === 'involvement' && (
          <>
            <Question title="Et toi, comment aimes-tu l’accompagner ?" />
            <Options choices={INVOLVEMENT_CHOICES} selected={profile.involvement} onPick={(v) => pick({ involvement: v })} />
          </>
        )}

        {step === 'involved' && involvement && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="animate-badge flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl shadow-[0_14px_44px_-14px_rgba(91,31,140,0.35)]" aria-hidden="true">
                {involvement.emoji}
              </p>
              <h1 className="mt-7 font-display text-3xl font-bold leading-tight">{involvement.title}</h1>
              <p className="mt-4 text-lg text-ink-soft">{involvement.text}</p>
            </div>
            <Footer>
              <Primary onClick={next}>Continuer</Primary>
            </Footer>
          </>
        )}

        {step === 'rhythm' && (
          <>
            <Question title="À quel rythme, à ton avis ?" />
            <Options choices={RHYTHM_CHOICES} selected={profile.rhythm || null} onPick={(v) => pick({ rhythm: v })} />
            <p className="mt-6 flex items-center gap-3 rounded-3xl bg-[#F1E9F8] p-4 text-ink">
              <span className="text-3xl" aria-hidden="true">💡</span>
              <span>
                <strong>Le petit conseil :</strong> un mot chaque jour vaut mieux qu’une longue séance le dimanche.
              </span>
            </p>
          </>
        )}

        {step === 'building' && (
          <Building
            whose={whose}
            lines={[
              { title: 'Ses envies', detail: `${profile.goals.length} envie${profile.goals.length > 1 ? 's' : ''} choisie${profile.goals.length > 1 ? 's' : ''}`, color: '#2EC4B6' },
              { title: 'Ses thèmes préférés', detail: profile.themes.length > 0 ? profile.themes.join(', ') : 'Un peu de tout', color: '#F4A340' },
              { title: 'Son niveau', detail: `${level.short} · ${level.label}`, color: '#E63946' },
              { title: 'Votre rythme', detail: setRhythm ? setRhythm.label : 'À votre rythme', color: '#5B1F8C' },
            ]}
            onDone={next}
          />
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
                  <Row emoji={level.emoji} term="Son niveau de départ" value={`${level.short} · ${level.label}`} />
                  <Row
                    emoji={profile.themes[0] ? themeEmoji(profile.themes[0]) : '🎲'}
                    term="Ses thèmes"
                    value={profile.themes.length > 0 ? profile.themes.join(', ') : 'Un peu de tout'}
                  />
                  <Row emoji={setRhythm?.emoji ?? '☀️'} term="Votre rythme" value={setRhythm ? setRhythm.label : '10 minutes, quand vous voulez'} />
                  {involvement && <Row emoji={involvement.emoji} term="À la maison" value={involvement.label} />}
                </dl>
              </div>
            </section>

            {profile.goals.length > 0 && (
              <section className="mt-4 rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
                <h2 className="font-display text-lg font-bold">Pour ses envies, dans l’app</h2>
                <ul className="mt-3 grid gap-2.5">
                  {GOAL_CHOICES.filter((g) => profile.goals.includes(g.value)).map((g) => (
                    <li key={g.value} className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden="true">{g.emoji}</span>
                      <span>
                        <span className="block text-sm text-ink-soft">{g.label}</span>
                        <span className="block font-extrabold">{g.section}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {access !== 'member' && (
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
                <input type="hidden" name="themes" value={profile.themes.join('|')} />
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

/** A multi-choice answer with its tick box. */
function Check({ on, dim, onClick, children }: { on: boolean; dim: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={dim}
      onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-4 rounded-3xl px-4 py-3 text-left text-lg font-extrabold transition-all active:scale-[0.98] ${
        on ? 'bg-white text-mpurple shadow-md ring-2 ring-mpurple' : 'bg-white text-ink ring-1 ring-ink/10 hover:bg-sand'
      } ${dim ? 'opacity-45' : ''}`}
    >
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-base ${on ? 'bg-mpurple text-cream' : 'bg-sand text-transparent'}`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="flex-1 leading-snug">{children}</span>
    </button>
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

type BuildLine = { title: string; detail: string; color: string };

/** The answers come together one line at a time, then « Continuer » appears. */
function Building({ whose, lines, onDone }: { whose: string; lines: BuildLine[]; onDone: () => void }) {
  // How many lines are on screen; a line is ticked once the next one shows.
  const [shown, setShown] = useState(1);
  const done = shown > lines.length;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setShown((n) => n + 1), BUILD_MS);
    return () => clearTimeout(id);
  }, [shown, done]);

  return (
    <>
      <Question title={`On prépare le programme ${whose}`} sub="D’après tes réponses. Tu pourras tout changer ensuite." />
      <ul className="mt-8 grid gap-6" aria-live="polite">
        {lines.slice(0, shown).map((line, i) => {
          const ticked = i < shown - 1;
          return (
            <li key={line.title} className="animate-rise">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold">{line.title}</p>
                  <p className="truncate text-ink-soft">{line.detail}</p>
                </div>
                <span
                  className={`text-2xl font-black transition-opacity duration-300 ${ticked ? 'opacity-100' : 'opacity-0'}`}
                  style={{ color: line.color }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full ease-out"
                  style={{
                    backgroundColor: line.color,
                    width: ticked ? '100%' : '8%',
                    transition: `width ${BUILD_MS}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {done && (
        <div className="animate-rise mt-auto">
          <Footer>
            <Primary onClick={onDone}>Voir son programme</Primary>
          </Footer>
        </div>
      )}
    </>
  );
}
