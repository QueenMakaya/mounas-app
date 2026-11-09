/*
 * Les échecs de Mounaville: the rules of chess, with an African cast.
 *
 *   Le Roi (Mansa)      → king      Le Rhinocéros → rook (charges straight)
 *   La Reine (Nzinga)   → queen     L'Éléphant    → bishop (as in the very first chess!)
 *   La Gazelle          → knight    Les Mounas    → pawns (the little ones)
 *
 * Two camps instead of « white » and « black »: Soleil (moves first, at the
 * bottom) and Lune. The board is 64 squares, index = row * 8 + col, row 0 at
 * the top (Lune's back row), so Soleil goes up (row - 1).
 *
 * The engine knows every rule (check, checkmate, stalemate, castling, en
 * passant, promotion) but also works on boards without kings, for the
 * learning games (a piece alone collecting mangoes, the race of the Mounas).
 */

export type Kind = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type Camp = 's' | 'l';
export type Piece = { kind: Kind; camp: Camp };
export type Board = (Piece | null)[];

export type Position = {
  board: Board;
  turn: Camp;
  /** Castling still allowed: Soleil king side / queen side, Lune king side / queen side. */
  castle: { sK: boolean; sQ: boolean; lK: boolean; lQ: boolean };
  /** The square a Mouna jumped over (two steps) on the last move, for « en passant ». */
  ep: number | null;
};

export type Move = {
  from: number;
  to: number;
  /** The square of the captured piece (differs from `to` only for en passant). */
  capture?: number;
  promo?: boolean;
  castle?: 'K' | 'Q';
};

export const other = (c: Camp): Camp => (c === 's' ? 'l' : 's');
export const rowOf = (sq: number) => sq >> 3;
export const colOf = (sq: number) => sq & 7;
export const sqAt = (row: number, col: number) => row * 8 + col;
const inside = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;
export const isDark = (sq: number) => (rowOf(sq) + colOf(sq)) % 2 === 1;

/** Square name as on a real chess board (a1 bottom left, Soleil's side). */
export const sqName = (sq: number) => `${'abcdefgh'[colOf(sq)]}${8 - rowOf(sq)}`;
export const parseSq = (name: string) => sqAt(8 - Number(name[1]), name.charCodeAt(0) - 97);

/* ------------------------------------------------------------------ cast */

export type PieceInfo = {
  kind: Kind;
  name: string;
  /** The usual chess name, for the parents. */
  classic: string;
  /** How it moves, said to the child. */
  moves: string;
  /** A little story from Africa. */
  story: string;
  value: number;
  tint: string;
};

export const PIECES: Record<Kind, PieceInfo> = {
  k: {
    kind: 'k',
    name: 'le Roi',
    classic: 'le roi',
    moves: 'Le Roi fait un seul pas, dans toutes les directions. Il est précieux : il faut toujours le protéger !',
    story: 'Il s’appelle Mansa, comme Mansa Moussa, le roi du Mali, qui était si riche qu’il a semé de l’or tout le long de son voyage.',
    value: 100,
    tint: '#FEF3E2',
  },
  q: {
    kind: 'q',
    name: 'la Reine',
    classic: 'la dame',
    moves: 'La Reine va où elle veut : tout droit ou en diagonale, aussi loin qu’elle le souhaite. C’est la plus forte !',
    story: 'Elle s’appelle Nzinga, comme la reine Nzinga d’Angola, une grande stratège qui a défendu son peuple pendant quarante ans.',
    value: 9,
    tint: '#FDECEE',
  },
  r: {
    kind: 'r',
    name: 'le Rhinocéros',
    classic: 'la tour',
    moves: 'Le Rhinocéros fonce tout droit : en avant, en arrière ou sur les côtés, aussi loin qu’il veut. Mais jamais en diagonale !',
    story: 'Le rhinocéros ne voit pas très bien, alors il fonce droit devant lui. Personne n’ose lui barrer la route !',
    value: 5,
    tint: '#E4F0F8',
  },
  b: {
    kind: 'b',
    name: 'l’Éléphant',
    classic: 'le fou',
    moves: 'L’Éléphant marche en diagonale, aussi loin qu’il veut. Il reste toujours sur les cases de la même couleur.',
    story: 'Le sais-tu ? Dans le tout premier jeu d’échecs, il y a très longtemps, cette pièce était déjà un éléphant !',
    value: 3,
    tint: '#F1E9F8',
  },
  n: {
    kind: 'n',
    name: 'la Gazelle',
    classic: 'le cavalier',
    moves: 'La Gazelle bondit en forme de L : deux cases tout droit, puis une sur le côté. C’est la seule qui saute par-dessus les autres !',
    story: 'La gazelle bondit si haut et si vite dans la savane que le lion lui-même a du mal à l’attraper.',
    value: 3,
    tint: '#E3F8F5',
  },
  p: {
    kind: 'p',
    name: 'le Mouna',
    classic: 'le pion',
    moves: 'Le Mouna avance d’un pas tout droit (deux pas la première fois). Pour attraper, il fait un pas en diagonale. S’il arrive tout au bout, il devient une Reine !',
    story: '« Mouna » veut dire « enfant » en lingala. Les petits avancent pas à pas… et celui qui traverse toute la savane devient une Reine !',
    value: 1,
    tint: '#FFF1E0',
  },
};

export const CAMPS: Record<Camp, { name: string; emoji: string }> = {
  s: { name: 'le Soleil', emoji: '☀️' },
  l: { name: 'la Lune', emoji: '🌙' },
};

/* ------------------------------------------------------------- positions */

export function emptyBoard(): Board {
  return Array.from({ length: 64 }, () => null);
}

export function startPosition(): Position {
  const board = emptyBoard();
  const back: Kind[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  back.forEach((kind, col) => {
    board[sqAt(0, col)] = { kind, camp: 'l' };
    board[sqAt(1, col)] = { kind: 'p', camp: 'l' };
    board[sqAt(6, col)] = { kind: 'p', camp: 's' };
    board[sqAt(7, col)] = { kind, camp: 's' };
  });
  return { board, turn: 's', castle: { sK: true, sQ: true, lK: true, lQ: true }, ep: null };
}

/** A position from a short list like `{ e1: 'sk', d8: 'lq' }`. */
export function fromList(list: Record<string, string>, turn: Camp = 's'): Position {
  const board = emptyBoard();
  for (const [name, code] of Object.entries(list)) board[parseSq(name)] = { camp: code[0] as Camp, kind: code[1] as Kind };
  return { board, turn, castle: { sK: false, sQ: false, lK: false, lQ: false }, ep: null };
}

/* ------------------------------------------------------------------ moves */

const ROOK_DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const BISHOP_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const KNIGHT_JUMPS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

/** Where a piece standing on `from` could go on this board, ignoring whose turn it is and check. */
export function pieceMoves(pos: Position, from: number): Move[] {
  const piece = pos.board[from];
  if (!piece) return [];
  const { board } = pos;
  const r0 = rowOf(from);
  const c0 = colOf(from);
  const out: Move[] = [];
  const add = (to: number) => {
    const target = board[to];
    if (target && target.camp === piece.camp) return false;
    out.push(target ? { from, to, capture: to } : { from, to });
    return !target;
  };
  const slide = (dirs: number[][]) => {
    for (const [dr, dc] of dirs) {
      let r = r0 + dr;
      let c = c0 + dc;
      while (inside(r, c) && add(sqAt(r, c))) {
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.kind) {
    case 'r':
      slide(ROOK_DIRS);
      break;
    case 'b':
      slide(BISHOP_DIRS);
      break;
    case 'q':
      slide([...ROOK_DIRS, ...BISHOP_DIRS]);
      break;
    case 'n':
      for (const [dr, dc] of KNIGHT_JUMPS) if (inside(r0 + dr, c0 + dc)) add(sqAt(r0 + dr, c0 + dc));
      break;
    case 'k': {
      for (const [dr, dc] of [...ROOK_DIRS, ...BISHOP_DIRS]) if (inside(r0 + dr, c0 + dc)) add(sqAt(r0 + dr, c0 + dc));
      // Castling: king and rook unmoved, nothing between, the king not in, through or into check.
      const home = piece.camp === 's' ? 7 : 0;
      if (r0 === home && c0 === 4) {
        const them = other(piece.camp);
        const rights = piece.camp === 's' ? [pos.castle.sK, pos.castle.sQ] : [pos.castle.lK, pos.castle.lQ];
        const rook = (col: number) => board[sqAt(home, col)]?.kind === 'r' && board[sqAt(home, col)]?.camp === piece.camp;
        const free = (cols: number[]) => cols.every((c) => !board[sqAt(home, c)]);
        const safe = (cols: number[]) => cols.every((c) => !attacked(board, sqAt(home, c), them));
        if (rights[0] && rook(7) && free([5, 6]) && safe([4, 5, 6])) out.push({ from, to: sqAt(home, 6), castle: 'K' });
        if (rights[1] && rook(0) && free([1, 2, 3]) && safe([4, 3, 2])) out.push({ from, to: sqAt(home, 2), castle: 'Q' });
      }
      break;
    }
    case 'p': {
      const dir = piece.camp === 's' ? -1 : 1;
      const start = piece.camp === 's' ? 6 : 1;
      const last = piece.camp === 's' ? 0 : 7;
      const r1 = r0 + dir;
      if (!inside(r1, c0)) break;
      if (!board[sqAt(r1, c0)]) {
        out.push({ from, to: sqAt(r1, c0), promo: r1 === last || undefined });
        if (r0 === start && !board[sqAt(r0 + 2 * dir, c0)]) out.push({ from, to: sqAt(r0 + 2 * dir, c0) });
      }
      for (const dc of [-1, 1]) {
        if (!inside(r1, c0 + dc)) continue;
        const to = sqAt(r1, c0 + dc);
        const target = board[to];
        if (target && target.camp !== piece.camp) out.push({ from, to, capture: to, promo: r1 === last || undefined });
        else if (pos.ep === to) out.push({ from, to, capture: sqAt(r0, c0 + dc) });
      }
      break;
    }
  }
  return out;
}

/** Is `sq` attacked by a piece of camp `by`? */
export function attacked(board: Board, sq: number, by: Camp): boolean {
  const r0 = rowOf(sq);
  const c0 = colOf(sq);
  const at = (r: number, c: number) => (inside(r, c) ? board[sqAt(r, c)] : null);
  const is = (p: Piece | null | undefined, kinds: Kind[]) => !!p && p.camp === by && kinds.includes(p.kind);

  for (const [dr, dc] of KNIGHT_JUMPS) if (is(at(r0 + dr, c0 + dc), ['n'])) return true;
  for (const [dr, dc] of [...ROOK_DIRS, ...BISHOP_DIRS]) if (is(at(r0 + dr, c0 + dc), ['k'])) return true;
  const pawnRow = by === 's' ? r0 + 1 : r0 - 1;
  if (is(at(pawnRow, c0 - 1), ['p']) || is(at(pawnRow, c0 + 1), ['p'])) return true;
  const ray = (dirs: number[][], kinds: Kind[]) =>
    dirs.some(([dr, dc]) => {
      let r = r0 + dr;
      let c = c0 + dc;
      while (inside(r, c)) {
        const p = board[sqAt(r, c)];
        if (p) return is(p, kinds);
        r += dr;
        c += dc;
      }
      return false;
    });
  return ray(ROOK_DIRS, ['r', 'q']) || ray(BISHOP_DIRS, ['b', 'q']);
}

export function kingSquare(board: Board, camp: Camp): number {
  return board.findIndex((p) => p?.kind === 'k' && p.camp === camp);
}

export function inCheck(pos: Position, camp: Camp = pos.turn): boolean {
  const k = kingSquare(pos.board, camp);
  return k >= 0 && attacked(pos.board, k, other(camp));
}

/** Play a move (no checks): Mounas reaching the end become Reines. */
export function play(pos: Position, move: Move): Position {
  const board = pos.board.slice();
  const piece = board[move.from]!;
  if (move.capture !== undefined) board[move.capture] = null;
  board[move.to] = move.promo ? { kind: 'q', camp: piece.camp } : piece;
  board[move.from] = null;
  if (move.castle) {
    const row = rowOf(move.from);
    const [rf, rt] = move.castle === 'K' ? [7, 5] : [0, 3];
    board[sqAt(row, rt)] = board[sqAt(row, rf)];
    board[sqAt(row, rf)] = null;
  }
  const castle = { ...pos.castle };
  const touch = (sq: number) => {
    if (sq === parseSq('e1')) castle.sK = castle.sQ = false;
    if (sq === parseSq('e8')) castle.lK = castle.lQ = false;
    if (sq === parseSq('h1')) castle.sK = false;
    if (sq === parseSq('a1')) castle.sQ = false;
    if (sq === parseSq('h8')) castle.lK = false;
    if (sq === parseSq('a8')) castle.lQ = false;
  };
  touch(move.from);
  touch(move.to);
  const ep = piece.kind === 'p' && Math.abs(rowOf(move.to) - rowOf(move.from)) === 2 ? (move.from + move.to) / 2 : null;
  return { board, turn: other(pos.turn), castle, ep };
}

/** The moves the camp to play may really make (never leaving its own Roi attacked). */
export function legalMoves(pos: Position, from?: number): Move[] {
  const squares = from === undefined ? pos.board.map((_, i) => i) : [from];
  const out: Move[] = [];
  for (const sq of squares) {
    if (pos.board[sq]?.camp !== pos.turn) continue;
    for (const m of pieceMoves(pos, sq)) if (!inCheck(play(pos, m), pos.turn)) out.push(m);
  }
  return out;
}

export type Status = 'play' | 'check' | 'mate' | 'pat';

export function status(pos: Position): Status {
  const check = inCheck(pos);
  if (legalMoves(pos).length > 0) return check ? 'check' : 'play';
  return check ? 'mate' : 'pat';
}

/** Only kings left (or a king and one light piece each): nobody can win. */
export function notEnoughToWin(board: Board): boolean {
  const rest = board.filter((p): p is Piece => !!p && p.kind !== 'k');
  return rest.length === 0 || (rest.length === 1 && (rest[0].kind === 'b' || rest[0].kind === 'n'));
}

/* -------------------------------------------------------- Mounaville bot */

/**
 * The computer friend, for children: it sees one move ahead (mate if it can,
 * takes what's worth taking, avoids leaving a piece where it gets caught),
 * with a pinch of chance, so it plays « like a child who is learning ».
 * `level` 0 is very gentle (often random), 1 a bit more careful.
 */
export function botMove(pos: Position, level: 0 | 1 = 0): Move | null {
  const moves = legalMoves(pos);
  if (moves.length === 0) return null;
  if (level === 0 && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
  const me = pos.turn;
  let best: Move = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const next = play(pos, m);
    const st = status(next);
    let score = Math.random() * (level === 0 ? 2 : 0.8);
    if (st === 'mate') score += 1000;
    if (st === 'pat') score -= 50;
    if (m.capture !== undefined) score += PIECES[pos.board[m.capture]!.kind].value * 10;
    if (m.promo) score += 80;
    if (st === 'check') score += 1;
    const mover = next.board[m.to]!;
    if (attacked(next.board, m.to, other(me)) && !attacked(next.board, m.to, me)) score -= PIECES[mover.kind].value * (level === 0 ? 5 : 9);
    // Mounas like to walk forward.
    if (mover.kind === 'p') score += 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

/* -------------------------------------------- game 2: collect the mangoes */

/**
 * A piece alone on the board (Soleil) and mangoes to pick. Lune pieces can
 * stand in the way (as rocks: they can't be taken). The fewest jumps possible
 * is found by a search over (square, mangoes picked).
 */
export type MangoLevel = {
  kind: Kind;
  start: string;
  mangoes: string[];
  rocks?: string[];
};

export const MANGO_LEVELS: MangoLevel[] = [
  { kind: 'r', start: 'a1', mangoes: ['a6', 'f6'] },
  { kind: 'r', start: 'd4', mangoes: ['d8', 'h8', 'h1'], rocks: ['f8'] },
  { kind: 'b', start: 'c1', mangoes: ['g5', 'e7'] },
  { kind: 'b', start: 'f1', mangoes: ['b5', 'd7', 'h3'] },
  { kind: 'q', start: 'd1', mangoes: ['d6', 'h2', 'a5'] },
  { kind: 'q', start: 'e4', mangoes: ['a8', 'h7', 'b1', 'e2'], rocks: ['c6'] },
  { kind: 'k', start: 'e1', mangoes: ['e3', 'g3'] },
  { kind: 'k', start: 'd4', mangoes: ['b6', 'f6', 'd2'] },
  { kind: 'n', start: 'b1', mangoes: ['c3', 'e4'] },
  { kind: 'n', start: 'g1', mangoes: ['f3', 'g5', 'e6'] },
  { kind: 'n', start: 'd4', mangoes: ['d5', 'e5'] },
  { kind: 'p', start: 'e2', mangoes: ['e4', 'e6'] },
];

export function mangoPosition(level: MangoLevel): Position {
  const pos = fromList({ [level.start]: `s${level.kind}` });
  for (const r of level.rocks ?? []) pos.board[parseSq(r)] = { kind: 'p', camp: 'l' };
  return pos;
}

/** Where the lone piece may go (no turns, no taking rocks). */
export function soloMoves(pos: Position, from: number): number[] {
  return pieceMoves({ ...pos, turn: 's' }, from)
    .filter((m) => m.capture === undefined)
    .map((m) => m.to);
}

/** Fewest jumps to pick every mango (breadth-first search). */
export function mangoPar(level: MangoLevel): number {
  const base = mangoPosition(level);
  const targets = level.mangoes.map(parseSq);
  const all = (1 << targets.length) - 1;
  const start = parseSq(level.start);
  const seen = new Set<string>([`${start}:0`]);
  let frontier: [number, number][] = [[start, 0]];
  for (let depth = 0; depth < 40; depth++) {
    const next: [number, number][] = [];
    for (const [sq, got] of frontier) {
      if (got === all) return depth;
      const board = emptyBoard();
      for (let i = 0; i < 64; i++) board[i] = base.board[i]?.camp === 'l' ? base.board[i] : null;
      board[sq] = { kind: level.kind, camp: 's' };
      for (const to of soloMoves({ ...base, board }, sq)) {
        const idx = targets.indexOf(to);
        const nGot = idx >= 0 ? got | (1 << idx) : got;
        const key = `${to}:${nGot}`;
        if (seen.has(key)) continue;
        seen.add(key);
        next.push([to, nGot]);
      }
    }
    frontier = next;
  }
  return Infinity;
}

/* --------------------------------------------- game 4: catch the Roi (mate in one) */

export type MatePuzzle = { list: Record<string, string>; hint: string };

/** Soleil to play and win in one move (checked: each has at least one mating move and Lune isn't already in check). */
export const MATE_PUZZLES: MatePuzzle[] = [
  { list: { g1: 'sk', d1: 'sr', g8: 'lk', f7: 'lp', g7: 'lp', h7: 'lp' }, hint: 'Le Roi Lune est coincé derrière ses petits Mounas… Le Rhinocéros fonce tout droit !' },
  { list: { g1: 'sk', a1: 'sr', b7: 'sr', g8: 'lk' }, hint: 'Un Rhinocéros garde une ligne, l’autre fonce sur la ligne du Roi.' },
  { list: { g6: 'sk', a7: 'sq', h8: 'lk' }, hint: 'La Reine se place tout près du Roi Lune, protégée par son propre Roi.' },
  { list: { b6: 'sk', d1: 'sq', a8: 'lk' }, hint: 'La Reine fonce jusqu’à la ligne du haut. Le Roi Soleil garde les autres cases.' },
  { list: { g1: 'sk', a7: 'sr', e1: 'sr', h8: 'lk' }, hint: 'Un Rhinocéros garde déjà une ligne. Envoie l’autre sur la ligne du Roi !' },
  { list: { g1: 'sk', e5: 'sn', h8: 'lk', g8: 'lr', g7: 'lp', h7: 'lp' }, hint: 'Le Roi Lune est entouré par sa propre famille… La Gazelle peut sauter !' },
  { list: { g1: 'sk', b2: 'sb', g4: 'sq', h8: 'lk', g7: 'lp', h7: 'lp' }, hint: 'L’Éléphant vise la case g7 de loin. La Reine peut y aller sans crainte !' },
  {
    list: { g1: 'sk', c4: 'sb', h5: 'sq', e8: 'lk', d8: 'lq', f8: 'lb', g8: 'ln', d7: 'lp', e7: 'lp', f7: 'lp', g7: 'lp' },
    hint: 'Regarde la petite case f7 : la Reine et l’Éléphant la visent tous les deux.',
  },
];

export function matePosition(p: MatePuzzle): Position {
  return fromList(p.list, 's');
}

/* ------------------------------------------------ game 3: the Mounas race */

/** Only Mounas: the first to reach the other side wins. */
export function racePosition(): Position {
  const board = emptyBoard();
  for (let c = 0; c < 8; c++) {
    board[sqAt(1, c)] = { kind: 'p', camp: 'l' };
    board[sqAt(6, c)] = { kind: 'p', camp: 's' };
  }
  return { board, turn: 's', castle: { sK: false, sQ: false, lK: false, lQ: false }, ep: null };
}

/** The race's winner: a Mouna on the far row, the other camp has no Mouna left, or can't move. */
export function raceWinner(pos: Position): Camp | null {
  for (let c = 0; c < 8; c++) {
    if (pos.board[sqAt(0, c)]?.camp === 's') return 's';
    if (pos.board[sqAt(7, c)]?.camp === 'l') return 'l';
  }
  if (!pos.board.some((p) => p?.camp === 'l')) return 's';
  if (!pos.board.some((p) => p?.camp === 's')) return 'l';
  if (legalMoves(pos).length === 0) return other(pos.turn);
  return null;
}

/** In the race, the Mounas don't become Reines: reaching the end is the win. */
export function racePlay(pos: Position, move: Move): Position {
  const next = play(pos, { ...move, promo: undefined });
  return next;
}

/** The bot for the race: win if it can, take, avoid being taken, push forward. */
export function raceBotMove(pos: Position): Move | null {
  const moves = legalMoves(pos);
  if (moves.length === 0) return null;
  const me = pos.turn;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const next = racePlay(pos, m);
    let score = Math.random() * 1.5;
    if (raceWinner(next) === me) score += 1000;
    if (m.capture !== undefined) score += 6;
    if (attacked(next.board, m.to, other(me)) && !attacked(next.board, m.to, me)) score -= 5;
    // Don't let an opponent Mouna run free: any reply that wins for them is terrible.
    if (legalMoves(next).some((r) => raceWinner(racePlay(next, r)) === other(me))) score -= 500;
    score += (me === 's' ? 7 - rowOf(m.to) : rowOf(m.to)) * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
