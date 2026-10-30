'use client';

import { useCallback, useEffect, useState } from 'react';
import { clipsFor, coreClipUrls } from './voice-clips';

/**
 * Read French aloud: with Pam's recording when there is one
 * (`voice-clips.ts`), otherwise with the browser's built-in voices
 * (Web Speech API), so every word in Airtable can still be heard.
 * `supported` stays false on the server and in browsers without speech, so
 * callers simply hide their speaker buttons.
 */

/** Bumped by every cut: whatever was playing for an older value stops. */
let generation = 0;
/** What `speakQueued` waits for: everything said so far. */
let chain: Promise<void> = Promise.resolve();

/*
 * Tablets (Safari on iPad above all) start a new <audio> slowly, fetch the
 * file only when it is asked for, and won't let a new element play outside
 * a tap. So: one player, reused for every clip (unlocked by the first tap),
 * and the clips fetched ahead of time into memory.
 */
let player: HTMLAudioElement | null = null;
/** Ends the clip being played (its promise), so a series never hangs. */
let finish: (() => void) | null = null;
/** src → in-memory copy (object URL), filled by `preloadClips`. */
const loaded = new Map<string, string>();
const loading = new Map<string, Promise<void>>();

function cut() {
  generation++;
  player?.pause();
  finish?.();
  // Cancelling when nothing is said delays the next utterance on iPad.
  if ('speechSynthesis' in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) window.speechSynthesis.cancel();
  chain = Promise.resolve();
}

/** Fetch these clips into memory (once each), so they play without waiting for the network. */
export function preloadClips(srcs: string[]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return Promise.all(
    srcs.map((src) => {
      if (loaded.has(src)) return undefined;
      let p = loading.get(src);
      if (!p) {
        p = fetch(src)
          .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
          .then((b) => void loaded.set(src, URL.createObjectURL(b)))
          .catch(() => undefined) // played from the network then
          .finally(() => loading.delete(src));
        loading.set(src, p);
      }
      return p;
    }),
  ).then(() => undefined);
}

/** Preload what `text` (or the sound `sound`) will play, if it is recorded. */
export function preloadSpeech(items: (string | { text: string; sound?: string })[]): void {
  const srcs = items.flatMap((it) => (typeof it === 'string' ? clipsFor(it) : clipsFor(it.text, it.sound)) ?? []);
  void preloadClips(srcs);
}

function playClip(src: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    finish?.();
    const a = (player ??= new Audio());
    // No `pause` listener: the pause from a cut arrives late and would end the next clip.
    // A cut ends the clip through `finish` instead.
    const done = () => {
      if (finish === done) {
        finish = null;
        a.onended = a.onerror = null;
      }
      resolve();
    };
    finish = done;
    a.onended = a.onerror = done;
    a.src = loaded.get(src) ?? src;
    // Recordings are already said slowly: only the slowest calls slow them a little.
    // (Changing src resets playbackRate to the default: set both.)
    a.defaultPlaybackRate = a.playbackRate = Math.min(1, Math.max(0.7, rate / 0.8));
    a.preservesPitch = true;
    a.play().catch(done);
  });
}

function sayTts(text: string, rate: number, voice: SpeechSynthesisVoice | null): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.1;
    // Some browsers never fire `end`: don't let the rest of a series wait forever.
    const timer = setTimeout(resolve, 2500 + (text.length * 120) / rate);
    u.onend = u.onerror = () => {
      clearTimeout(timer);
      resolve();
    };
    window.speechSynthesis.speak(u);
  });
}

/** Say `text` once, unless a newer cut happens first. */
async function say(text: string, rate: number, voice: SpeechSynthesisVoice | null, gen: number, sound?: string) {
  const clips = clipsFor(text, sound);
  if (!clips) return gen === generation ? sayTts(text, rate, voice) : undefined;
  for (const src of clips) {
    if (gen !== generation) return;
    await playClip(src, rate);
  }
}

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    const pickVoice = () => {
      const voices = synth.getVoices();
      // Prefer France French, then any French voice.
      const fr =
        voices.find((v) => v.lang === 'fr-FR' && v.localService) ||
        voices.find((v) => v.lang === 'fr-FR') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('fr')) ||
        null;
      setVoice(fr);
      setSupported(true);
    };

    pickVoice();
    synth.addEventListener('voiceschanged', pickVoice);
    // The sounds and consignes, fetched while the screen settles.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    idle(() => void preloadClips(coreClipUrls()));
    return () => {
      synth.removeEventListener('voiceschanged', pickVoice);
      cut();
    };
  }, []);

  /**
   * Speak `text`. `rate` < 1 slows down — children need slower speech.
   * For a sound, pass its key in `SOUNDS` as `sound` (and its `say` as `text`).
   */
  const speak = useCallback(
    (text: string, rate = 0.8, sound?: string) => {
      if (!supported || !text) return;
      cut();
      const gen = generation;
      setSpeaking(text);
      chain = say(text, rate, voice, gen, sound).then(() => setSpeaking((s) => (s === text ? null : s)));
    },
    [supported, voice],
  );

  /**
   * Speak several pieces one after the other (sound by sound, then the whole
   * word). `onStep(i)` fires as piece i starts, and `onStep(null)` at the end,
   * so the screen can highlight exactly what is being heard.
   */
  const speakSeries = useCallback(
    (pieces: { text: string; rate?: number; sound?: string }[], onStep: (i: number | null) => void) => {
      if (!supported || pieces.length === 0) return;
      cut();
      const gen = generation;
      chain = (async () => {
        for (const [i, p] of pieces.entries()) {
          if (gen !== generation) break;
          onStep(i);
          await say(p.text, p.rate ?? 0.7, voice, gen, p.sound);
        }
        onStep(null);
      })();
    },
    [supported, voice],
  );

  /**
   * Like `speak`, but waits for what is being said to finish instead of
   * cutting it: the praise comes after the word, not over it.
   */
  const speakQueued = useCallback(
    (text: string, rate = 0.85) => {
      if (!supported || !text) return;
      const gen = generation;
      chain = chain.then(() => say(text, rate, voice, gen));
    },
    [supported, voice],
  );

  return { supported, speak, speakSeries, speakQueued, speaking };
}
