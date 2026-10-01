'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { PROGRESS_KEY, parseProgress, streak } from '@/lib/progress';

const noopSubscribe = () => () => {};
const readRaw = () => {
  try {
    return localStorage.getItem(PROGRESS_KEY) ?? '';
  } catch {
    return '';
  }
};

/** Stars · words learned · streak, read from this device. */
export default function ProgressBadge() {
  const raw = useSyncExternalStore(noopSubscribe, readRaw, () => null);
  const p = useMemo(() => (raw === null ? null : parseProgress(raw)), [raw]);
  if (!p) return <div className="h-12" />;
  const words = Object.keys(p.words).length;
  const days = streak(p);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span className="rounded-full px-4 py-2 text-base font-bold shadow-sm" style={{ backgroundColor: '#FFD23F' }}>
        ⭐ {p.stars} étoile{p.stars > 1 ? 's' : ''}
      </span>
      <span className="rounded-full px-4 py-2 text-base font-bold shadow-sm" style={{ backgroundColor: '#CCFBF1', color: '#115E59' }}>
        📚 {words} mot{words > 1 ? 's' : ''} appris
      </span>
      {days > 0 && (
        <span className="rounded-full px-4 py-2 text-base font-bold shadow-sm" style={{ backgroundColor: '#FFE1E4', color: '#B3261E' }}>
          🔥 {days} jour{days > 1 ? 's' : ''} de suite
        </span>
      )}
    </div>
  );
}
