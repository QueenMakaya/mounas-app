'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ComponentProps } from 'react';
import { readPref, writePref } from '@/lib/progress';
import { DEFAULT_TEAMS, FABRICS, teamNames, teamsOf, type FabricId, type TeamIds, type Teams } from '@/lib/echecs-tissus';
import type { TeamNames } from '@/lib/echecs';
import PieceIcon from './PieceIcon';

/*
 * Which fabric each team wears, chosen by the child (kept on the device), and
 * shared with every board and piece of the chess pages through a context.
 */

const LS = 'mounas_echecs_tissus';

let listeners: (() => void)[] = [];
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function parse(raw: string): TeamIds {
  try {
    const v = JSON.parse(raw || '{}') as Partial<TeamIds>;
    const s = v.s && v.s in FABRICS ? v.s : DEFAULT_TEAMS.s;
    let l = v.l && v.l in FABRICS ? v.l : DEFAULT_TEAMS.l;
    if (l === s) l = s === DEFAULT_TEAMS.l ? DEFAULT_TEAMS.s : DEFAULT_TEAMS.l;
    return { s, l };
  } catch {
    return DEFAULT_TEAMS;
  }
}

/** The chosen fabrics, and a setter that keeps the two teams different. */
export function useTeamChoice() {
  const raw = useSyncExternalStore(subscribe, () => readPref(LS) ?? '', () => '');
  const ids = useMemo(() => parse(raw), [raw]);
  const choose = (camp: 's' | 'l', id: FabricId) => {
    const next = { ...ids, [camp]: id };
    // Same cloth for both teams: the other one takes the previous choice.
    if (next.s === next.l) next[camp === 's' ? 'l' : 's'] = ids[camp];
    writePref(LS, JSON.stringify(next));
    listeners.forEach((l) => l());
  };
  return { ids, choose };
}

type Ctx = { ids: TeamIds; teams: Teams; names: TeamNames };
const TeamsContext = createContext<Ctx>({ ids: DEFAULT_TEAMS, teams: teamsOf(DEFAULT_TEAMS), names: teamNames(teamsOf(DEFAULT_TEAMS)) });

export function TeamsProvider({ ids, children }: { ids: TeamIds; children: React.ReactNode }) {
  const value = useMemo(() => {
    const teams = teamsOf(ids);
    return { ids, teams, names: teamNames(teams) };
  }, [ids]);
  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}

export function useTeams(): Ctx {
  return useContext(TeamsContext);
}

/** A piece wearing its team's fabric. */
export function TeamPiece(props: Omit<ComponentProps<typeof PieceIcon>, 'fabric'>) {
  const { ids } = useTeams();
  return <PieceIcon {...props} fabric={ids[props.camp]} />;
}
