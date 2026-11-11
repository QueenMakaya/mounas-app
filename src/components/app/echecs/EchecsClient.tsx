'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import BackButton from '@/components/app/BackButton';
import SpeakButton from '@/components/app/SpeakButton';
import { playChime } from '@/lib/chime';
import { readPref, writePref } from '@/lib/progress';
import { useSpeech } from '@/lib/useSpeech';
import {
  CAMPS,
  MANGO_LEVELS,
  MATE_PUZZLES,
  PIECES,
  botMove,
  emptyBoard,
  fromList,
  inCheck,
  kingSquare,
  legalMoves,
  mangoPar,
  mangoPosition,
  matePosition,
  notEnoughToWin,
  parseSq,
  play,
  raceBotMove,
  racePlay,
  racePosition,
  raceWinner,
  soloMoves,
  startPosition,
  status,
  type Camp,
  type Kind,
  type Move,
  type Position,
} from '@/lib/echecs';
import ChessBoard, { TurnBadge } from './ChessBoard';
import PieceIcon from './PieceIcon';

/*
 * Les échecs de Mounaville: chess for 4-8 year olds, step by step, never a
 * wall of rules. Five chapters, each a game on its own:
 *   1. La famille        meet the six pieces, move each one freely
 *   2. Les mangues       a piece alone picks mangoes: learn how it moves
 *   3. La course         only Mounas (pawns): first to cross the savanna
 *   4. Attrape le Roi    checkmate in one move
 *   5. La grande partie  the real game, against Mounaville or a friend
 * The possible moves always light up: the child never has to remember
 * everything, the board shows it. Progress (stars) stays on the device.
 */

type Screen = 'hub' | 'famille' | 'mangues' | 'course' | 'roi' | 'partie';

type Saved = { met: Kind[]; mangoes: Record<number, number>; mates: number[]; race: number; games: number };
const LS = 'mounas_echecs';
const EMPTY: Saved = { met: [], mangoes: {}, mates: [], race: 0, games: 0 };

let listeners: (() => void)[] = [];
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function readSaved(): Saved {
  try {
    return { ...EMPTY, ...JSON.parse(readPref(LS) ?? '{}') };
  } catch {
    return EMPTY;
  }
}
function save(update: (s: Saved) => Saved) {
  writePref(LS, JSON.stringify(update(readSaved())));
  listeners.forEach((l) => l());
}
function useSaved(): Saved {
  const raw = useSyncExternalStore(subscribe, () => readPref(LS) ?? '', () => '');
  return useMemo(() => {
    try {
      return { ...EMPTY, ...JSON.parse(raw || '{}') };
    } catch {
      return EMPTY;
    }
  }, [raw]);
}

const ORDER: Kind[] = ['p', 'r', 'b', 'n', 'q', 'k'];

export default function EchecsClient() {
  const [screen, setScreen] = useState<Screen>('hub');
  const saved = useSaved();
  const back = () => setScreen('hub');

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          {screen === 'hub' ? (
            <BackButton />
          ) : (
            <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5">
              ← Les chapitres
            </button>
          )}
          <h1 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
            <PieceIcon kind="k" camp="s" className="h-8 w-8" /> Les échecs
          </h1>
        </div>

        {screen === 'hub' && <Hub saved={saved} open={setScreen} />}
        {screen === 'famille' && <Famille saved={saved} onDone={back} />}
        {screen === 'mangues' && <Mangues saved={saved} />}
        {screen === 'course' && <Course />}
        {screen === 'roi' && <Roi saved={saved} />}
        {screen === 'partie' && <Partie />}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------- hub */

function Hub({ saved, open }: { saved: Saved; open: (s: Screen) => void }) {
  const mangoStars = Object.values(saved.mangoes).reduce((a, b) => a + b, 0);
  const chapters: { id: Screen; n: number; title: string; text: string; icon: React.ReactNode; tint: string; done: string }[] = [
    {
      id: 'famille',
      n: 1,
      title: 'La famille royale',
      text: 'Rencontre le Roi, la Reine, la Gazelle, l’Éléphant, le Rhinocéros et les Mounas.',
      icon: <PieceIcon kind="q" camp="l" className="h-12 w-12" />,
      tint: '#FDECEE',
      done: `${saved.met.length}/6 rencontrés`,
    },
    {
      id: 'mangues',
      n: 2,
      title: 'La cueillette des mangues',
      text: 'Une pièce toute seule doit ramasser toutes les mangues.',
      icon: <span className="text-4xl">🥭</span>,
      tint: '#FEF3E2',
      done: `${mangoStars}/${MANGO_LEVELS.length * 3} ⭐`,
    },
    {
      id: 'course',
      n: 3,
      title: 'La course des Mounas',
      text: 'Seulement les petits ! Le premier qui traverse la savane gagne.',
      icon: <PieceIcon kind="p" camp="s" className="h-12 w-12" />,
      tint: '#E3F8F5',
      done: saved.race ? `${saved.race} victoire${saved.race > 1 ? 's' : ''}` : 'À essayer',
    },
    {
      id: 'roi',
      n: 4,
      title: 'Attrape le Roi !',
      text: 'Trouve le coup qui coince le Roi de la Lune : échec et mat !',
      icon: <PieceIcon kind="k" camp="l" className="h-12 w-12" />,
      tint: '#F1E9F8',
      done: `${saved.mates.length}/${MATE_PUZZLES.length} trouvés`,
    },
    {
      id: 'partie',
      n: 5,
      title: 'La grande partie',
      text: 'Le vrai jeu d’échecs, contre Mounaville ou contre un ami.',
      icon: <span className="text-4xl">🏆</span>,
      tint: '#E4F0F8',
      done: saved.games ? `${saved.games} partie${saved.games > 1 ? 's' : ''} gagnée${saved.games > 1 ? 's' : ''}` : 'Le grand défi',
    },
  ];

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-[0_14px_44px_-14px_rgba(91,31,140,0.35)] ring-1 ring-ink/5">
        <div className="h-2 bg-gradient-to-r from-mamber via-mred to-mpurple" />
        <div className="p-6 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mpurple">☀️ Le Soleil contre la Lune 🌙</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            Les échecs de Mounaville
            <span className="ml-2 inline-block rounded-full bg-mamber px-2 py-0.5 align-middle font-body text-[11px] font-extrabold uppercase tracking-wider text-ink">Bêta</span>
          </h2>
          <div className="mx-auto mt-4 flex max-w-sm justify-center gap-1">
            {ORDER.map((k) => (
              <PieceIcon key={k} kind={k} camp={k === 'k' || k === 'q' ? 'l' : 's'} className="h-12 w-12" />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Le plus beau jeu de stratégie du monde, avec une gazelle, un éléphant, un rhinocéros… et des petits Mounas qui rêvent de devenir Reine.
          </p>
          <SpeakButton
            className="mt-4"
            tone="soft"
            text="Bienvenue à Mounaville ! Ici, le camp du Soleil affronte le camp de la Lune. Chaque chapitre est un petit jeu. Commence par rencontrer la famille royale !"
          />
        </div>
      </section>

      <ol className="mt-5 grid gap-3">
        {chapters.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => open(c.id)}
              className="group flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left ring-1 ring-ink/5 transition-colors hover:bg-sand active:scale-[0.99]"
            >
              <span className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: c.tint }} aria-hidden="true">
                {c.icon}
                <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-cream">{c.n}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold text-ink">{c.title}</span>
                <span className="block text-sm text-ink-soft">{c.text}</span>
                <span className="mt-1 inline-block rounded-full bg-sand px-2.5 py-0.5 text-xs font-bold text-ink">{c.done}</span>
              </span>
              <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </li>
        ))}
      </ol>

      <details className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-ink/5">
        <summary className="cursor-pointer font-extrabold text-ink">Pour les parents : qui est qui ?</summary>
        <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
          {(['k', 'q', 'r', 'b', 'n', 'p'] as Kind[]).map((k) => (
            <li key={k} className="flex items-center gap-3">
              <PieceIcon kind={k} camp="s" className="h-9 w-9 flex-shrink-0" />
              <span>
                <strong className="capitalize text-ink">{PIECES[k].name}</strong> = {PIECES[k].classic}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-soft">
          Toutes les vraies règles sont là (échec, mat, pat, roque, prise en passant, promotion), mais les coups possibles s’allument
          toujours : l’enfant apprend en jouant, sans rien devoir retenir par cœur. Le Soleil commence, comme les Blancs.
        </p>
      </details>
    </>
  );
}

function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span aria-label={`${n} étoile${n > 1 ? 's' : ''} sur ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? '' : 'opacity-25 grayscale'} aria-hidden="true">
          ⭐
        </span>
      ))}
    </span>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mt-4 rounded-[28px] bg-white p-4 shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5 sm:p-6 ${className}`}>{children}</section>;
}

function Celebrate({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="animate-rise mt-4 rounded-3xl bg-[#E5F4EC] p-5 text-center" aria-live="polite">
      <p className="text-4xl" aria-hidden="true">
        🎉
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-[#1F6B4C]">{title}</p>
      {text && <p className="mt-1 text-[#1F6B4C]">{text}</p>}
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

const btn = 'min-h-12 rounded-full px-5 font-extrabold active:scale-[0.98]';
const btnMain = `${btn} bg-mred text-cream shadow-md hover:bg-mred-dark`;
const btnSoft = `${btn} bg-white text-ink ring-1 ring-ink/15 hover:bg-sand`;

/* --------------------------------------------------- 1. la famille royale */

function Famille({ saved, onDone }: { saved: Saved; onDone: () => void }) {
  const [i, setI] = useState(0);
  const kind = ORDER[i];
  const info = PIECES[kind];
  const home = parseSq(kind === 'p' ? 'd2' : 'd4');
  const [at, setAt] = useState(home);
  const [hops, setHops] = useState(0);
  const { speak, supported } = useSpeech();

  const pos = useMemo(() => fromList({ [nameOf(at)]: `s${kind}` }), [at, kind]);
  const targets = soloMoves(pos, at);

  useEffect(() => {
    if (!saved.met.includes(kind)) save((s) => ({ ...s, met: [...s.met, kind] }));
  }, [kind, saved.met]);

  const go = (n: number) => {
    const k = ORDER[n];
    setI(n);
    setAt(parseSq(k === 'p' ? 'd2' : 'd4'));
    setHops(0);
    if (supported) speak(`Voici ${PIECES[k].name} !`, 0.85);
  };

  const onSquare = (sq: number) => {
    if (!targets.includes(sq)) return;
    setAt(sq);
    setHops((h) => h + 1);
  };

  return (
    <Panel>
      <ol className="flex justify-center gap-1.5" aria-label="Les six pièces">
        {ORDER.map((k, n) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => go(n)}
              aria-label={PIECES[k].name}
              aria-current={n === i || undefined}
              className={`rounded-full p-0.5 transition-transform ${n === i ? 'scale-110 ring-4 ring-mpurple' : 'opacity-70 hover:opacity-100'}`}
            >
              <PieceIcon kind={k} camp="s" className="h-10 w-10 sm:h-12 sm:w-12" />
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <span className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-[28px]" style={{ backgroundColor: info.tint }}>
          <PieceIcon key={kind} kind={kind} camp="s" className="animate-badge h-24 w-24" />
        </span>
        <div>
          <h2 className="font-display text-3xl font-bold capitalize text-ink">{info.name}</h2>
          <p className="text-sm text-ink-soft">Aux échecs classiques : {info.classic}</p>
          <p className="mt-2 text-ink">{info.story}</p>
          <SpeakButton className="mt-2" tone="soft" label="L’histoire" text={info.story} />
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-sand/60 p-4">
        <p className="font-bold text-ink">
          <span aria-hidden="true">🐾 </span>
          {info.moves}
        </p>
        <SpeakButton className="mt-2" text={info.moves} label="Comment ça bouge" />
        <p className="mt-3 text-sm font-bold text-mteal-ink">
          {hops === 0 ? '👆 Touche un point vert pour la faire bouger !' : `Bravo ! ${hops} déplacement${hops > 1 ? 's' : ''}. Continue !`}
        </p>
      </div>

      <ChessBoard className="mt-4" board={pos.board} selected={at} targets={targets} onSquare={onSquare} hint={hops === 0 ? targets[0] : null} />

      <div className="mt-5 flex items-center justify-between gap-2 whitespace-nowrap">
        <button type="button" className={btnSoft} disabled={i === 0} onClick={() => go(i - 1)} style={{ opacity: i === 0 ? 0.4 : 1 }}>
          ← Avant
        </button>
        {i < ORDER.length - 1 ? (
          <button type="button" className={btnMain} onClick={() => go(i + 1)}>
            Suivant <PieceIcon kind={ORDER[i + 1]} camp="s" className="ml-1 inline h-7 w-7 align-middle" /> →
          </button>
        ) : (
          <button type="button" className={btnMain} onClick={onDone}>
            Toute la famille ✓
          </button>
        )}
      </div>
    </Panel>
  );
}

const nameOf = (sq: number) => `${'abcdefgh'[sq & 7]}${8 - (sq >> 3)}`;

/* ------------------------------------------------ 2. la cueillette des mangues */

function Mangues({ saved }: { saved: Saved }) {
  const [level, setLevel] = useState<number | null>(null);
  if (level === null) {
    return (
      <Panel>
        <h2 className="text-center font-display text-2xl font-bold text-ink">🥭 La cueillette des mangues</h2>
        <p className="mt-1 text-center text-ink-soft">Choisis une pièce et ramasse toutes les mangues, en le moins de coups possible.</p>
        <div className="mt-2 flex justify-center">
          <SpeakButton tone="soft" text="Choisis une pièce. Elle doit ramasser toutes les mangues, en faisant le moins de déplacements possible. Fais attention aux cailloux : on ne peut pas passer dessus !" />
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MANGO_LEVELS.map((l, n) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => setLevel(n)}
                className="flex w-full flex-col items-center gap-1 rounded-3xl p-3 ring-1 ring-ink/10 transition-colors hover:bg-sand"
                style={{ backgroundColor: PIECES[l.kind].tint }}
              >
                <PieceIcon kind={l.kind} camp="s" className="h-12 w-12" />
                <span className="text-sm font-extrabold capitalize text-ink">
                  {PIECES[l.kind].name} · {l.mangoes.length} 🥭
                </span>
                <Stars n={saved.mangoes[n] ?? 0} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }
  return <MangoGame key={level} n={level} onNext={() => setLevel(level + 1 < MANGO_LEVELS.length ? level + 1 : null)} onList={() => setLevel(null)} />;
}

function MangoGame({ n, onNext, onList }: { n: number; onNext: () => void; onList: () => void }) {
  const lvl = MANGO_LEVELS[n];
  const par = useMemo(() => mangoPar(lvl), [lvl]);
  const base = useMemo(() => mangoPosition(lvl), [lvl]);
  const [at, setAt] = useState(parseSq(lvl.start));
  const [left, setLeft] = useState(() => lvl.mangoes.map(parseSq));
  const [moves, setMoves] = useState(0);
  const { speak, supported } = useSpeech();

  const board = useMemo(() => {
    // The rocks are drawn as decor (🪨), the board itself only holds the piece.
    const b = emptyBoard();
    b[at] = { kind: lvl.kind, camp: 's' };
    return b;
  }, [at, lvl.kind]);
  const rocks = (lvl.rocks ?? []).map(parseSq);
  const withRocks = useMemo(() => ({ ...base, board: board.map((p, i) => p ?? base.board[i]) }), [base, board]);
  const targets = left.length ? soloMoves(withRocks, at) : [];
  const done = left.length === 0;
  const stars = done ? (moves <= par ? 3 : moves <= par + 2 ? 2 : 1) : 0;

  const decor: Record<number, React.ReactNode> = {};
  for (const m of left) decor[m] = '🥭';
  for (const r of rocks) decor[r] = '🪨';

  const onSquare = (sq: number) => {
    if (!targets.includes(sq)) return;
    setAt(sq);
    const m = moves + 1;
    setMoves(m);
    if (left.includes(sq)) {
      const rest = left.filter((x) => x !== sq);
      setLeft(rest);
      if (rest.length === 0) {
        playChime();
        const s = m <= par ? 3 : m <= par + 2 ? 2 : 1;
        save((st) => ({ ...st, mangoes: { ...st.mangoes, [n]: Math.max(st.mangoes[n] ?? 0, s) } }));
        if (supported) speak(s === 3 ? 'Parfait ! Trois étoiles !' : 'Bravo, toutes les mangues sont ramassées !', 0.9);
      }
    }
  };

  const restart = () => {
    setAt(parseSq(lvl.start));
    setLeft(lvl.mangoes.map(parseSq));
    setMoves(0);
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold capitalize text-ink">
          <PieceIcon kind={lvl.kind} camp="s" className="h-9 w-9" /> {PIECES[lvl.kind].name}
        </h2>
        <p className="rounded-full bg-sand px-3 py-1 text-sm font-bold text-ink">
          🥭 {lvl.mangoes.length - left.length}/{lvl.mangoes.length} · {moves} coup{moves > 1 ? 's' : ''} · objectif {par}
        </p>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{PIECES[lvl.kind].moves}</p>
      {!done && (
        <div className="mt-1">
          <SpeakButton tone="soft" label="Rappel" text={PIECES[lvl.kind].moves} />
        </div>
      )}

      <ChessBoard className="mt-4" board={board} selected={at} targets={targets} decor={decor} onSquare={onSquare} hint={moves === 0 ? targets.find((t) => left.includes(t)) ?? null : null} />

      {done ? (
        <Celebrate title="Toutes les mangues !" text={`En ${moves} coup${moves > 1 ? 's' : ''} (le meilleur possible : ${par}).`}>
          <p className="w-full text-3xl">
            <Stars n={stars} />
          </p>
          {stars < 3 && (
            <button type="button" className={btnSoft} onClick={restart}>
              ↺ Pour 3 étoiles
            </button>
          )}
          <button type="button" className={btnMain} onClick={onNext}>
            Défi suivant →
          </button>
        </Celebrate>
      ) : (
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" className={btnSoft} onClick={restart}>
            ↺ Recommencer
          </button>
          <button type="button" className={btnSoft} onClick={onList}>
            Tous les défis
          </button>
        </div>
      )}
    </Panel>
  );
}

/* ----------------------------------------------- shared: a game being played */

type Opponent = 'bot' | 'ami';

/**
 * Tap-to-move for the camp whose turn it is; the Mounaville bot answers by
 * itself after a short pause. `rules` chooses between the race and real chess.
 */
function usePlay(initial: () => Position, opts: { opponent: Opponent; race?: boolean; level?: 0 | 1 }) {
  const [history, setHistory] = useState<Position[]>(() => [initial()]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const pos = history[history.length - 1];
  const last = moves[moves.length - 1] ?? null;
  const st = opts.race ? null : status(pos);
  const winner: Camp | 'nul' | null = opts.race
    ? raceWinner(pos)
    : st === 'mate'
      ? pos.turn === 's'
        ? 'l'
        : 's'
      : st === 'pat' || notEnoughToWin(pos.board)
        ? 'nul'
        : null;
  const botTurn = opts.opponent === 'bot' && pos.turn === 'l' && !winner;
  const targets = selected !== null ? legalMoves(pos, selected).map((m) => m.to) : [];

  const doMove = (m: Move) => {
    const next = opts.race ? racePlay(pos, m) : play(pos, m);
    setHistory((h) => [...h, next]);
    setMoves((ms) => [...ms, m]);
    setSelected(null);
  };

  useEffect(() => {
    if (!botTurn) return;
    const t = window.setTimeout(() => {
      const m = opts.race ? raceBotMove(pos) : botMove(pos, opts.level ?? 0);
      if (m) doMove(m);
    }, 650);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botTurn, pos]);

  const onSquare = (sq: number) => {
    if (winner || botTurn) return;
    const piece = pos.board[sq];
    if (selected !== null) {
      const m = legalMoves(pos, selected).find((x) => x.to === sq);
      if (m) return doMove(m);
    }
    if (piece?.camp === pos.turn && legalMoves(pos, sq).length > 0) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  /** Back one move (two against the bot, so it's the child's turn again). */
  const undo = () => {
    const n = opts.opponent === 'bot' ? (pos.turn === 's' ? 2 : 1) : 1;
    if (history.length <= n) return;
    setHistory((h) => h.slice(0, -n));
    setMoves((ms) => ms.slice(0, -n));
    setSelected(null);
  };

  const reset = () => {
    setHistory([initial()]);
    setMoves([]);
    setSelected(null);
  };

  /** The pieces each camp has caught so far. */
  const caught = useMemo(() => {
    const out: Record<Camp, Kind[]> = { s: [], l: [] };
    history.forEach((p, i) => {
      const m = moves[i];
      if (m?.capture !== undefined) {
        const victim = p.board[m.capture];
        if (victim) out[p.turn].push(victim.kind);
      }
    });
    return out;
  }, [history, moves]);

  return { pos, last, selected, targets, onSquare, undo, reset, winner, botTurn, status: st, caught, canUndo: history.length > 1 };
}

function OpponentPicker({ onPick, withLevels }: { onPick: (o: Opponent, level?: 0 | 1) => void; withLevels?: boolean }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => onPick('bot', 0)} className="flex items-center gap-3 rounded-3xl bg-[#F1E9F8] p-4 text-left ring-1 ring-ink/10 hover:ring-mpurple">
        <PieceIcon kind="p" camp="l" className="h-12 w-12 flex-shrink-0" />
        <span>
          <span className="block font-extrabold text-ink">Contre Mounaville{withLevels ? ' · tout doux' : ''}</span>
          <span className="block text-sm text-ink-soft">L’ordinateur joue la Lune{withLevels ? ', comme un enfant qui apprend' : ''}.</span>
        </span>
      </button>
      {withLevels && (
        <button type="button" onClick={() => onPick('bot', 1)} className="flex items-center gap-3 rounded-3xl bg-[#E4F0F8] p-4 text-left ring-1 ring-ink/10 hover:ring-mpurple">
          <PieceIcon kind="q" camp="l" className="h-12 w-12 flex-shrink-0" />
          <span>
            <span className="block font-extrabold text-ink">Contre Mounaville · malin</span>
            <span className="block text-sm text-ink-soft">Il fait plus attention à ses pièces.</span>
          </span>
        </button>
      )}
      <button type="button" onClick={() => onPick('ami')} className="flex items-center gap-3 rounded-3xl bg-[#FEF3E2] p-4 text-left ring-1 ring-ink/10 hover:ring-mpurple">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center text-3xl" aria-hidden="true">
          👫
        </span>
        <span>
          <span className="block font-extrabold text-ink">Contre un ami ou un parent</span>
          <span className="block text-sm text-ink-soft">Sur le même écran, chacun son tour.</span>
        </span>
      </button>
    </div>
  );
}

function Caught({ kinds, camp }: { kinds: Kind[]; camp: Camp }) {
  if (!kinds.length) return <span className="text-xs text-ink-soft">Rien attrapé pour l’instant</span>;
  return (
    <span className="flex flex-wrap gap-0.5" aria-label={`Pièces attrapées : ${kinds.map((k) => PIECES[k].name).join(', ')}`}>
      {kinds.map((k, i) => (
        <PieceIcon key={i} kind={k} camp={camp} className="h-6 w-6" />
      ))}
    </span>
  );
}

/* --------------------------------------------------- 3. la course des Mounas */

function Course() {
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  return (
    <Panel>
      <h2 className="text-center font-display text-2xl font-bold text-ink">🏃🏾 La course des Mounas</h2>
      <p className="mt-1 text-center text-ink-soft">
        Chaque Mouna avance tout droit et attrape en diagonale. Le premier qui arrive de l’autre côté de la savane gagne !
      </p>
      <div className="mt-2 flex justify-center">
        <SpeakButton
          tone="soft"
          text="La course des Mounas ! Chaque Mouna avance d’un pas tout droit, ou de deux pas la première fois. Pour attraper un Mouna de la Lune, il fait un pas en diagonale. Le premier qui arrive tout au bout gagne !"
        />
      </div>
      {opponent ? <RaceGame key={opponent} opponent={opponent} onChange={() => setOpponent(null)} /> : <OpponentPicker onPick={setOpponent} />}
    </Panel>
  );
}

function RaceGame({ opponent, onChange }: { opponent: Opponent; onChange: () => void }) {
  const g = usePlay(racePosition, { opponent, race: true });
  const { speak, supported } = useSpeech();
  const counted = useRef(false);

  useEffect(() => {
    if (!g.winner || counted.current) return;
    counted.current = true;
    if (g.winner === 's') {
      playChime();
      if (opponent === 'bot') save((s) => ({ ...s, race: s.race + 1 }));
    }
    if (supported) speak(g.winner === 's' ? 'Le Soleil a gagné la course !' : 'La Lune a gagné la course !', 0.9);
  }, [g.winner, opponent, speak, supported]);

  return (
    <>
      <div className="mt-4 flex justify-center">
        {!g.winner && <TurnBadge camp={g.pos.turn} label={g.botTurn ? 'Mounaville réfléchit…' : opponent === 'bot' ? 'À toi de jouer !' : undefined} />}
      </div>
      <ChessBoard className="mt-3" board={g.pos.board} selected={g.selected} targets={g.targets} lastMove={g.last} onSquare={g.onSquare} disabled={!!g.winner} />
      {g.winner && g.winner !== 'nul' && (
        <Celebrate title={g.winner === 's' ? 'Le Soleil gagne la course ! ☀️' : 'La Lune gagne la course ! 🌙'} text={g.winner === 'l' && opponent === 'bot' ? 'Pas grave : on rejoue ?' : undefined}>
          <button
            type="button"
            className={btnMain}
            onClick={() => {
              counted.current = false;
              g.reset();
            }}
          >
            ↺ Une autre course
          </button>
        </Celebrate>
      )}
      <GameButtons g={g} onChange={onChange} />
    </>
  );
}

function GameButtons({ g, onChange }: { g: { undo: () => void; canUndo: boolean; winner: unknown }; onChange: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {!g.winner && (
        <button type="button" className={btnSoft} onClick={g.undo} disabled={!g.canUndo} style={{ opacity: g.canUndo ? 1 : 0.4 }}>
          ↶ Oups, je reviens
        </button>
      )}
      <button type="button" className={btnSoft} onClick={onChange}>
        Changer d’adversaire
      </button>
    </div>
  );
}

/* ------------------------------------------------------ 4. attrape le Roi */

function Roi({ saved }: { saved: Saved }) {
  const [n, setN] = useState<number | null>(null);
  if (n === null) {
    return (
      <Panel>
        <h2 className="text-center font-display text-2xl font-bold text-ink">👑 Attrape le Roi !</h2>
        <p className="mx-auto mt-1 max-w-md text-center text-ink-soft">
          Quand le Roi est attaqué, on dit « échec ». S’il ne peut plus s’échapper : <strong>échec et mat</strong>, la partie est gagnée ! Trouve le coup
          gagnant.
        </p>
        <div className="mt-2 flex justify-center">
          <SpeakButton
            tone="soft"
            text="Quand on attaque le Roi, on dit : échec ! Et si le Roi ne peut plus du tout s’échapper, c’est échec et mat : on a gagné ! Dans chaque défi, trouve le coup qui coince le Roi de la Lune."
          />
        </div>
        <ul className="mt-5 grid grid-cols-4 gap-3">
          {MATE_PUZZLES.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setN(i)}
                className={`flex aspect-square w-full flex-col items-center justify-center rounded-3xl font-display text-2xl font-bold ring-1 ring-ink/10 hover:ring-mpurple ${saved.mates.includes(i) ? 'bg-[#E5F4EC] text-[#1F6B4C]' : 'bg-[#F1E9F8] text-mpurple'}`}
              >
                {i + 1}
                <span className="text-sm">{saved.mates.includes(i) ? '✓' : '👑'}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }
  return <MatePuzzleGame key={n} n={n} onNext={() => setN(n + 1 < MATE_PUZZLES.length ? n + 1 : null)} onList={() => setN(null)} />;
}

function MatePuzzleGame({ n, onNext, onList }: { n: number; onNext: () => void; onList: () => void }) {
  const puzzle = MATE_PUZZLES[n];
  const start = useMemo(() => matePosition(puzzle), [puzzle]);
  const [pos, setPos] = useState(start);
  const [selected, setSelected] = useState<number | null>(null);
  const [last, setLast] = useState<Move | null>(null);
  const [result, setResult] = useState<'mate' | 'miss' | null>(null);
  const [misses, setMisses] = useState(0);
  const { speak, supported } = useSpeech();
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  const targets = selected !== null && result !== 'mate' ? legalMoves(pos, selected).map((m) => m.to) : [];
  const won = result === 'mate';

  const onSquare = (sq: number) => {
    if (result) return;
    if (selected !== null) {
      const m = legalMoves(pos, selected).find((x) => x.to === sq);
      if (m) {
        const next = play(pos, m);
        setPos(next);
        setLast(m);
        setSelected(null);
        if (status(next) === 'mate') {
          setResult('mate');
          playChime();
          save((s) => ({ ...s, mates: s.mates.includes(n) ? s.mates : [...s.mates, n] }));
          if (supported) speak('Échec et mat ! Bravo, tu as attrapé le Roi !', 0.9);
        } else {
          setResult('miss');
          setMisses((x) => x + 1);
          if (supported) speak(inCheck(next) ? 'Échec… mais le Roi peut encore s’échapper. Essaie autre chose !' : 'Pas encore. Essaie un autre coup !', 0.9);
          timer.current = window.setTimeout(() => {
            setPos(start);
            setLast(null);
            setResult(null);
          }, 1600);
        }
        return;
      }
    }
    if (pos.board[sq]?.camp === 's') setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  const kingLune = kingSquare(pos.board, 'l');

  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-ink">Défi {n + 1}</h2>
        <TurnBadge camp="s" label="Le Soleil joue et gagne" />
      </div>
      <p className="mt-2 text-sm text-ink-soft">En un seul coup, mets le Roi de la Lune échec et mat.</p>
      <ChessBoard
        className="mt-4"
        board={pos.board}
        selected={selected}
        targets={targets}
        lastMove={last}
        check={inCheck(pos, 'l') ? kingLune : null}
        onSquare={onSquare}
      />
      <div className="mt-3 min-h-12 text-center" aria-live="polite">
        {result === 'miss' && <p className="font-bold text-morange-ink">{inCheck(pos) ? 'Échec… mais le Roi peut encore s’échapper !' : 'Pas encore ! On réessaie…'}</p>}
        {!result && misses > 0 && (
          <p className="rounded-2xl bg-[#FEF3E2] px-4 py-2 text-sm font-bold text-morange-ink">
            💡 {puzzle.hint}
          </p>
        )}
      </div>
      {won ? (
        <Celebrate title="Échec et mat !" text="Le Roi de la Lune ne peut plus s’échapper.">
          <button type="button" className={btnMain} onClick={onNext}>
            Défi suivant →
          </button>
          <button type="button" className={btnSoft} onClick={onList}>
            Tous les défis
          </button>
        </Celebrate>
      ) : (
        <div className="flex justify-center">
          <button type="button" className={btnSoft} onClick={onList}>
            Tous les défis
          </button>
        </div>
      )}
    </Panel>
  );
}

/* --------------------------------------------------- 5. la grande partie */

function Partie() {
  const [choice, setChoice] = useState<{ opponent: Opponent; level: 0 | 1 } | null>(null);
  return (
    <Panel>
      <h2 className="text-center font-display text-2xl font-bold text-ink">🏆 La grande partie</h2>
      <p className="mx-auto mt-1 max-w-md text-center text-ink-soft">
        Toute la famille sur la savane ! Le Soleil commence. Touche une pièce : ses chemins s’allument.
      </p>
      {choice ? (
        <FullGame key={`${choice.opponent}${choice.level}`} {...choice} onChange={() => setChoice(null)} />
      ) : (
        <OpponentPicker withLevels onPick={(opponent, level = 0) => setChoice({ opponent, level })} />
      )}
    </Panel>
  );
}

function FullGame({ opponent, level, onChange }: { opponent: Opponent; level: 0 | 1; onChange: () => void }) {
  const g = usePlay(startPosition, { opponent, level });
  const { speak, supported } = useSpeech();
  const counted = useRef(false);
  const said = useRef('');

  useEffect(() => {
    const key = `${g.last?.from}-${g.last?.to}`;
    if (!g.last || said.current === key || !supported) return;
    said.current = key;
    if (g.status === 'check') speak('Échec ! Attention au Roi !', 0.95);
    else if (g.last.promo) speak('Le Mouna est arrivé au bout : il devient une Reine !', 0.9);
  }, [g.last, g.status, speak, supported]);

  useEffect(() => {
    if (!g.winner || counted.current) return;
    counted.current = true;
    if (g.winner === 's') {
      playChime();
      if (opponent === 'bot') save((s) => ({ ...s, games: s.games + 1 }));
    }
    if (supported)
      speak(g.winner === 'nul' ? 'Match nul ! Personne ne gagne.' : `Échec et mat ! ${g.winner === 's' ? 'Le Soleil' : 'La Lune'} a gagné !`, 0.9);
  }, [g.winner, opponent, speak, supported]);

  const checkSq = g.status === 'check' || g.status === 'mate' ? kingSquare(g.pos.board, g.pos.turn) : null;

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-bold text-mpurple">
          🌙 <Caught kinds={g.caught.l} camp="s" />
        </span>
      </div>
      <div className="mt-2 flex justify-center">
        {!g.winner && (
          <TurnBadge
            camp={g.pos.turn}
            label={g.botTurn ? 'Mounaville réfléchit…' : g.status === 'check' ? `Échec ! Protège ton Roi ${CAMPS[g.pos.turn].emoji}` : opponent === 'bot' ? 'À toi de jouer !' : undefined}
          />
        )}
      </div>
      <ChessBoard className="mt-3" board={g.pos.board} selected={g.selected} targets={g.targets} lastMove={g.last} check={checkSq} onSquare={g.onSquare} disabled={!!g.winner} />
      <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-morange-ink">
        ☀️ <Caught kinds={g.caught.s} camp="l" />
      </div>
      {g.last?.promo && !g.winner && (
        <p className="animate-rise mt-3 rounded-2xl bg-[#FDECEE] px-4 py-2 text-center font-bold text-mred-dark">👑 Un Mouna a traversé la savane : il devient une Reine !</p>
      )}
      {g.winner && (
        <Celebrate
          title={g.winner === 'nul' ? 'Match nul !' : `${g.winner === 's' ? 'Le Soleil' : 'La Lune'} gagne ! ${g.winner === 's' ? '☀️' : '🌙'}`}
          text={g.winner === 'nul' ? 'Personne ne peut plus gagner : bien joué à tous les deux.' : 'Échec et mat : le Roi ne peut plus s’échapper.'}
        >
          <button
            type="button"
            className={btnMain}
            onClick={() => {
              counted.current = false;
              g.reset();
            }}
          >
            ↺ Une nouvelle partie
          </button>
        </Celebrate>
      )}
      <GameButtons g={g} onChange={onChange} />
    </>
  );
}
