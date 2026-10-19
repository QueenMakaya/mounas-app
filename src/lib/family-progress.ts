/**
 * Per-parent progress and usage, in two Airtable tables of the activities
 * base (written by the app only, never by hand):
 *
 *   - Familles (AIRTABLE_FAMILIES_TABLE): one row per parent email, with a
 *     summary Pam can read (last visit, active days, words, missions) and
 *     "Progression", the JSON snapshot that follows the parent from one
 *     device to another (src/lib/progress-snapshot.ts).
 *   - Journal (AIRTABLE_JOURNAL_TABLE): one row per word done on a day and
 *     per mission tried, linked to the family.
 *
 * Like src/lib/signups.ts, secrets are read at call-time so the app builds
 * and runs without them: progress then simply stays on the device.
 * The token needs data.records:write on the base.
 */

import { airtableToken } from '@/lib/airtable-token';
import { getMissions } from '@/lib/missions';
import { mergeSnapshots, parseSnapshot, streakOf, type ProgressEvent, type Snapshot } from '@/lib/progress-snapshot';

// Addressed by id, like the Signups table: survives a rename.
const DEFAULT_FAMILIES_TABLE = 'tblAh28wOZWpJgLjV';
const DEFAULT_JOURNAL_TABLE = 'tblhn12RHOb2iV2bC';

/** Older day-by-day entries are dropped from the snapshot (the Journal keeps them). */
const KEEP_COMPLETED_DAYS = 45;

type Config = { url: (table: string) => string; headers: Record<string, string>; families: string; journal: string };

let warned = false;

function config(): Config | null {
  const apiKey = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    if (!warned) {
      console.warn('[progress] Airtable key/base not set: progress stays on the device.');
      warned = true;
    }
    return null;
  }
  return {
    url: (table) => `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    families: process.env.AIRTABLE_FAMILIES_TABLE || DEFAULT_FAMILIES_TABLE,
    journal: process.env.AIRTABLE_JOURNAL_TABLE || DEFAULT_JOURNAL_TABLE,
  };
}

async function airtable<T>(url: string, init: RequestInit & { headers: Record<string, string> }): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

type FamilyRecord = { id: string; fields: Record<string, unknown> };

async function findFamily(cfg: Config, email: string): Promise<FamilyRecord | null> {
  const formula = `LOWER({Email}) = '${email.toLowerCase().replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const url = `${cfg.url(cfg.families)}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const { records } = await airtable<{ records: FamilyRecord[] }>(url, { headers: cfg.headers });
  return records[0] ?? null;
}

function storedSnapshot(record: FamilyRecord | null): Snapshot {
  const raw = record?.fields.Progression;
  if (typeof raw !== 'string' || !raw) return parseSnapshot(null);
  try {
    return parseSnapshot(JSON.parse(raw));
  } catch {
    console.error('[progress] unreadable Progression JSON on', record?.id);
    return parseSnapshot(null);
  }
}

const daysAgo = (today: string, n: number) => {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/** What `next` adds over what was stored: a word done on a new day, a mission tried again. */
function newEvents(prev: Snapshot, next: Snapshot, since: string): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  const known = new Set(prev.completed);
  const words = new Map(next.learned.map((w) => [w.id, w]));
  for (const key of next.completed) {
    const cut = key.lastIndexOf('_');
    const id = key.slice(0, cut);
    const date = key.slice(cut + 1);
    if (known.has(key) || date < since) continue;
    const w = words.get(id);
    events.push({ kind: 'mot', id, label: w?.word ?? id, date, readAlone: Boolean(w?.readAlone), spelledAlone: Boolean(w?.spelledAlone) });
  }
  for (const [id, m] of Object.entries(next.missions)) {
    const old = prev.missions[id];
    if (m.lastDate < since) continue;
    if (old && old.lastDate === m.lastDate && old.solved === m.solved && old.tries === m.tries && old.hints === m.hints) continue;
    events.push({ kind: 'mission', id, date: m.lastDate, solved: m.solved, tries: m.tries, hints: m.hints });
  }
  return events.slice(0, 50);
}

/** The progress saved for this parent; null when Airtable isn't set up or can't be reached. */
export async function loadProgress(email: string): Promise<Snapshot | null> {
  const cfg = config();
  if (!cfg) return null;
  try {
    return storedSnapshot(await findFamily(cfg, email));
  } catch (error) {
    console.error('[progress] load failed:', error);
    return null;
  }
}

/**
 * Merges what the device sends into what is saved, saves it, logs what's new
 * in the Journal, and returns the merged progress (null on failure).
 */
export async function saveProgress(email: string, customerId: string, incoming: Snapshot, today: string): Promise<Snapshot | null> {
  const cfg = config();
  if (!cfg) return null;
  try {
    const record = await findFamily(cfg, email);
    const stored = storedSnapshot(record);
    const keepFrom = daysAgo(today, KEEP_COMPLETED_DAYS);
    const merged = mergeSnapshots(stored, incoming);
    merged.completed = merged.completed.filter((k) => k.slice(k.lastIndexOf('_') + 1) >= keepFrom);
    const events = newEvents(stored, merged, daysAgo(today, KEEP_COMPLETED_DAYS - 5));

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = {
      Email: email,
      'Client Stripe': customerId,
      'Dernière visite': now,
      'Jours actifs': merged.days.length,
      Série: streakOf(merged.days, today),
      'Mots appris': merged.learned.length,
      'Lus seul': merged.learned.filter((w) => w.readAlone).length,
      'Missions réussies': Object.values(merged.missions).filter((m) => m.solved).length,
      'Derniers mots': [...merged.learned]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
        .map((w) => `${w.word} (${w.date})`)
        .join('\n'),
      Progression: JSON.stringify(merged),
    };
    if (!record) fields['Première visite'] = now;

    const saved = record
      ? await airtable<FamilyRecord>(`${cfg.url(cfg.families)}/${record.id}`, {
          method: 'PATCH',
          headers: cfg.headers,
          body: JSON.stringify({ fields, typecast: true }),
        })
      : (
          await airtable<{ records: FamilyRecord[] }>(cfg.url(cfg.families), {
            method: 'POST',
            headers: cfg.headers,
            body: JSON.stringify({ records: [{ fields }], typecast: true }),
          })
        ).records[0];

    if (events.length) await logEvents(cfg, saved.id, email, events);
    return merged;
  } catch (error) {
    console.error('[progress] save failed:', error);
    return null;
  }
}

async function logEvents(cfg: Config, familyId: string, email: string, events: ProgressEvent[]): Promise<void> {
  const titles = events.some((e) => e.kind === 'mission')
    ? new Map((await getMissions()).map((m) => [m.id, m.title]))
    : new Map<string, string>();
  const rows = events.map((e) => ({
    fields: {
      Quoi: e.kind === 'mot' ? e.label : titles.get(e.id) || 'Mission',
      Famille: [familyId],
      Email: email,
      Type: e.kind === 'mot' ? 'Mot' : 'Mission',
      ...(e.date ? { Jour: e.date } : {}),
      ID: e.id,
      ...(e.kind === 'mot'
        ? { 'Lu seul': e.readAlone, 'Écrit seul': e.spelledAlone }
        : { Réussie: e.solved, Essais: e.tries, Indices: e.hints }),
    },
  }));
  // Airtable takes 10 records per request.
  for (let i = 0; i < rows.length; i += 10) {
    await airtable(cfg.url(cfg.journal), {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify({ records: rows.slice(i, i + 10), typecast: true }),
    });
  }
}
