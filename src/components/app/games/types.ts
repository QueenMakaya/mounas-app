import type { Activity } from '@/lib/airtable';
import type { WordCard } from '@/lib/related';

/** What every mini-game gets from the flow. */
export type GameProps = {
  activity: Activity;
  library: WordCard[];
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  /** The game is won: the flow's "next" arrow glows. `chimed`: the game played the chime. */
  onSuccess: (chimed?: boolean) => void;
  accent: string;
};
