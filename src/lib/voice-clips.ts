/**
 * Pam's recorded voice. Each entry maps what the app says to a file in
 * `public/voix/`. Whatever has no recording here is still read by the
 * browser's voice, so a clip can be added one at a time.
 *
 * Keys go through `clipKey`: case, accents' Unicode form, apostrophes and
 * punctuation don't matter, so « Un autre mot ? » matches "un autre mot".
 */
const CLIPS: Record<string, string> = {};

export function clipKey(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[!?.,;:…«»" ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const byKey = new Map(Object.entries(CLIPS).map(([text, file]) => [clipKey(text), `/voix/${file}`]));

/** URL of Pam's recording of `text`, if there is one. */
export const clipFor = (text: string): string | undefined => byKey.get(clipKey(text));

/**
 * The clips to play for `text`: its own recording, or, for a calculation
 * such as "7 plus 5", one clip per word when every word is recorded.
 * Undefined means the browser's voice reads it.
 */
export function clipsFor(text: string): string[] | undefined {
  const whole = clipFor(text);
  if (whole) return [whole];
  if (!/^\d+ (plus|moins|fois) \d+$/.test(clipKey(text))) return undefined;
  const parts = clipKey(text).split(' ').map(clipFor);
  return parts.every(Boolean) ? (parts as string[]) : undefined;
}
