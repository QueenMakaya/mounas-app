'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import type { Mission } from '@/lib/missions';
import { missionSnapshot, subscribeMissions, type MissionRecord } from '@/lib/mission-progress';

/** Missions grouped by palier, with what the family has already done. */
export default function MissionList({ missions }: { missions: Mission[] }) {
  const raw = useSyncExternalStore(subscribeMissions, missionSnapshot, () => '{}');
  let done: Record<string, MissionRecord> = {};
  try {
    done = JSON.parse(raw);
  } catch {
    done = {};
  }

  const paliers = Array.from(new Set(missions.map((m) => m.palier))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {paliers.map((p) => {
        const list = missions.filter((m) => m.palier === p);
        const solved = list.filter((m) => done[m.id]?.solved).length;
        return (
          <section key={p} aria-labelledby={`palier-${p}`}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id={`palier-${p}`} className="font-display text-xl font-bold text-ink">
                Palier {p}
              </h2>
              <p className="text-sm font-bold text-ink-soft">
                {solved} / {list.length} réussie{solved > 1 ? 's' : ''}
              </p>
            </div>
            <ul className="grid gap-3">
              {list.map((m) => {
                const rec = done[m.id];
                return (
                  <li key={m.id}>
                    <Link
                      href={`/app/missions/${m.id}`}
                      className="group flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5 transition-colors hover:bg-sand"
                    >
                      <span
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${rec?.solved ? 'bg-mteal-light' : 'bg-[#FEF3E2]'}`}
                        aria-hidden="true"
                      >
                        {rec?.solved ? '✅' : '🧩'}
                      </span>
                      <span className="flex-1">
                        <span className="block font-extrabold text-ink">{m.title || m.statement}</span>
                        <span className="block text-sm text-ink-soft">
                          Niveau {m.niveau}
                          {m.type && ` · ${m.type}`}
                          {rec?.solved && ' · réussie'}
                          {rec?.harder && ' · défi relevé 🚀'}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
