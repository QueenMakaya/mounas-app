'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Read French aloud with the browser's built-in voices (Web Speech API).
 * No audio files to record or host; every word in Airtable can be heard.
 * `supported` stays false on the server and in browsers without speech, so
 * callers simply hide their speaker buttons.
 */
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
      synth.cancel();
    };
  }, []);

  /** Speak `text`. `rate` < 1 slows down — children need slower speech. */
  const speak = useCallback(
    (text: string, rate = 0.8) => {
      if (!supported || !text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = 1.1;
      u.onend = () => setSpeaking((s) => (s === text ? null : s));
      u.onerror = () => setSpeaking((s) => (s === text ? null : s));
      setSpeaking(text);
      synth.speak(u);
    },
    [supported, voice],
  );

  return { supported, speak, speaking };
}
