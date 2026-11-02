'use client';

import { useCallback, useEffect, useState } from 'react';
import { clipsFor } from './voice-clips';

/**
 * Read French aloud: with Pam's recording when there is one
 * (`voice-clips.ts`), otherwise with the browser's built-in voices
 * (Web Speech API), so every word in Airtable can still be heard.
 * `supported` stays false on the server and in browsers without speech, so
 * callers simply hide their speaker buttons.
 */

/** Bumped by every cut: whatever was playing for an older value stops. */
let generation = 0;
let audio: HTMLAudioElement | null = null;
/** What `speakQueued` waits for: everything said so far. */
let chain: Promise<void> = Promise.resolve();

function cut() {
  generation++;
  audio?.pause();
  audio = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  chain = Promise.resolve();
}

function playClip(src: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const a = new Audio(src);
    // Recordings are already said slowly: only the slowest calls slow them a little.
    a.playbackRate = Math.min(1, Math.max(0.7, rate / 0.8));
    a.preservesPitch = true;
    a.onended = a.onerror = a.onpause = () => resolve();
    audio = a;
    a.play().catch(() => resolve());
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
