import type { Camp } from './echecs';

/*
 * The teams of Mounaville wear African fabrics instead of « white » and
 * « black ». Each child picks a fabric for their team and one for the other
 * side: nobody plays « against » a people, each team simply wears a cloth
 * with its story. The colours and patterns are drawn in PieceIcon.tsx.
 *
 * Facts kept short and checked: where the cloth comes from, who makes it,
 * one thing that makes it special.
 */

export type FabricId = 'kente' | 'bogolan' | 'kuba' | 'ndop' | 'kanga';

export type Fabric = {
  id: FabricId;
  /** Used after a piece name: « la Gazelle Kente ». */
  name: string;
  /** « l’équipe Kente » */
  team: string;
  /** Where it comes from, for the picker. */
  origin: string;
  /** One sentence for the child (also read aloud). */
  story: string;
  /** Main colour, for small swatches. */
  swatch: string;
};

export const FABRICS: Record<FabricId, Fabric> = {
  kente: {
    id: 'kente',
    name: 'Kente',
    team: 'l’équipe Kente',
    origin: 'Ghana',
    story: 'Le kente vient du Ghana. Les Ashanti et les Ewe le tissent en longues bandes étroites, cousues ensemble. Chaque motif a un nom et un sens.',
    swatch: '#F2B705',
  },
  bogolan: {
    id: 'bogolan',
    name: 'Bogolan',
    team: 'l’équipe Bogolan',
    origin: 'Mali',
    story: 'Le bogolan vient du Mali. On peint ses motifs avec de la boue : en bambara, « bogo » veut dire « terre ».',
    swatch: '#3B2416',
  },
  kuba: {
    id: 'kuba',
    name: 'Kuba',
    team: 'l’équipe Kuba',
    origin: 'RD Congo',
    story: 'Le tissu kuba vient du royaume Kuba, au Congo. Il est fait en fibres de raphia, avec des motifs géométriques qu’on invente en brodant.',
    swatch: '#C9A66B',
  },
  ndop: {
    id: 'ndop',
    name: 'Ndop',
    team: 'l’équipe Ndop',
    origin: 'Cameroun',
    story: 'Le ndop vient de l’Ouest du Cameroun. Ce tissu bleu indigo aux motifs blancs se porte pour les grandes fêtes et les cérémonies des rois.',
    swatch: '#1B2A6B',
  },
  kanga: {
    id: 'kanga',
    name: 'Kanga',
    team: 'l’équipe Kanga',
    origin: 'Kenya, Tanzanie',
    story: 'Le kanga vient du Kenya et de la Tanzanie. Ce tissu aux couleurs vives porte souvent un proverbe écrit en swahili.',
    swatch: '#D81B60',
  },
};

export const FABRIC_IDS = Object.keys(FABRICS) as FabricId[];

export type Teams = Record<Camp, Fabric>;
export type TeamIds = Record<Camp, FabricId>;

/** Your team (at the bottom, moves first) and the other side, until the child picks. */
export const DEFAULT_TEAMS: TeamIds = { s: 'kente', l: 'bogolan' };

export function teamsOf(ids: TeamIds): Teams {
  return { s: FABRICS[ids.s], l: FABRICS[ids.l] };
}

/** The names used in sentences: « la Gazelle Kente ». */
export function teamNames(teams: Teams): Record<Camp, string> {
  return { s: teams.s.name, l: teams.l.name };
}
