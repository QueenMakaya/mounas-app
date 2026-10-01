'use client';

/**
 * French text-to-speech for the kids' app, on top of the browser's built-in
 * Web Speech API (works offline on iPad/iPhone, Android and desktop Chrome).
 *
 * Voices load asynchronously on most browsers, so we pick the best French
 * voice lazily on every call rather than once at import time.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

function frenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  const fr = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  // Prefer France French, and the higher-quality "enhanced"/"premium"/Google voices.
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase() === 'fr-fr' ? 4 : 0) +
    (/premium|enhanced|amélioré|natural|google/i.test(v.name) ? 2 : 0) +
    (/amelie|amélie|audrey|marie|thomas|aurelie|aurélie/i.test(v.name) ? 1 : 0);
  cachedVoice = fr.sort((a, b) => score(b) - score(a))[0] ?? null;
  return cachedVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
  });
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  /** Called when this utterance finishes (or is cancelled). */
  onEnd?: () => void;
  /** Called on each word boundary with the character index in `text`. */
  onBoundary?: (charIndex: number) => void;
  /** Queue after what is already being said instead of interrupting it. */
  queue?: boolean;
};

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!canSpeak() || !text.trim()) {
    opts.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  if (!opts.queue) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  const voice = frenchVoice();
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 0.85; // a little slower than adult speech
  u.pitch = opts.pitch ?? 1.1;
  if (opts.onEnd) {
    u.onend = () => opts.onEnd?.();
    u.onerror = () => opts.onEnd?.();
  }
  if (opts.onBoundary) {
    u.onboundary = (e) => opts.onBoundary?.(e.charIndex);
  }
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Speak several chunks in a row, calling onStep(i) as each one starts. */
export function speakSequence(
  parts: string[],
  { rate, gapMs = 250, onStep, onDone }: { rate?: number; gapMs?: number; onStep?: (i: number) => void; onDone?: () => void } = {},
): () => void {
  let cancelled = false;
  stopSpeaking();
  const next = (i: number) => {
    if (cancelled) return;
    if (i >= parts.length) {
      onDone?.();
      return;
    }
    onStep?.(i);
    speak(parts[i], {
      rate,
      queue: true,
      onEnd: () => setTimeout(() => next(i + 1), gapMs),
    });
  };
  next(0);
  return () => {
    cancelled = true;
    stopSpeaking();
  };
}

/** How a letter is *named* in French (what a child says when spelling). */
const LETTER_NAMES: Record<string, string> = {
  a: 'a', b: 'bé', c: 'cé', d: 'dé', e: 'e', f: 'èf', g: 'gé', h: 'ache', i: 'i',
  j: 'ji', k: 'ka', l: 'èl', m: 'èm', n: 'èn', o: 'o', p: 'pé', q: 'ku', r: 'èr',
  s: 'èss', t: 'té', u: 'u', v: 'vé', w: 'double vé', x: 'iks', y: 'i grec', z: 'zèd',
  é: 'e accent aigu', è: 'e accent grave', ê: 'e accent circonflexe', à: 'a accent grave',
  ç: 'cé cédille', ô: 'o accent circonflexe', î: 'i accent circonflexe', û: 'u accent circonflexe',
  ï: 'i tréma', ë: 'e tréma',
};

export function letterName(letter: string): string {
  return LETTER_NAMES[letter.toLowerCase()] ?? letter;
}

/* ── Little sound effects (Web Audio, no files to download) ── */

let audioCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  audioCtx ??= new AC();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  pop: () => tone(660, 0, 0.12, 'triangle'),
  clap: () => {
    tone(1800, 0, 0.05, 'square', 0.06);
    tone(1200, 0.01, 0.06, 'square', 0.05);
  },
  good: () => {
    tone(523, 0, 0.15, 'triangle');
    tone(659, 0.1, 0.15, 'triangle');
    tone(784, 0.2, 0.25, 'triangle');
  },
  oops: () => {
    tone(300, 0, 0.15, 'sawtooth', 0.06);
    tone(220, 0.12, 0.2, 'sawtooth', 0.06);
  },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.18));
    tone(1047, 0.5, 0.6, 'triangle', 0.18);
  },
  boing: () => {
    const c = ctx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(520, c.currentTime + 0.15);
    o.frequency.exponentialRampToValueAtTime(260, c.currentTime + 0.35);
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.45);
  },
};
