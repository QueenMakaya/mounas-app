'use client';

import type { Prompt } from '@/lib/prompts';
import KidIcon from '@/components/app/kid/KidIcon';

/**
 * Top of each step in child mode: the big picture of what to do and the
 * instruction in words (for the parent). Touching the picture says it again.
 */
export default function KidPrompt({ prompt, accent, tint, onReplay }: { prompt: Prompt; accent: string; tint: string; onReplay?: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <button
        type="button"
        onClick={onReplay}
        disabled={!onReplay}
        aria-label={`Réécouter la consigne : ${prompt.say}`}
        className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full shadow-[0_4px_0_rgba(26,26,26,0.12)] transition-transform active:scale-95"
        style={{ backgroundColor: tint, color: accent }}
      >
        <KidIcon name={prompt.icon} className="h-12 w-12" strokeWidth={1.8} />
        {onReplay && (
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow ring-1 ring-ink/10">
            <KidIcon name="rejouer" className="h-5 w-5" strokeWidth={2.4} />
          </span>
        )}
      </button>
      <p className="font-display text-xl font-bold leading-snug text-ink">{prompt.say}</p>
    </div>
  );
}
