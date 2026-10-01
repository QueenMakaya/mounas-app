'use client';

/**
 * The child's gallery of living drawings, kept on the device in IndexedDB
 * (images are too big for localStorage). Nothing leaves the device except the
 * small JPEG sent once to the storyteller.
 */

export type Movement = 'sauter' | 'voler' | 'nager' | 'danser' | 'marcher';
export type Decor = 'prairie' | 'ciel' | 'mer' | 'espace' | 'savane';

export type Creature = {
  id: string;
  createdAt: number;
  nom: string;
  quoi: string;
  histoire: string;
  phrase: string;
  mouvement: Movement;
  decor: Decor;
  /** Transparent PNG data URL (or the framed one when the background was kept). */
  sprite: string;
  /** Original cropped picture, for the gallery thumbnail and "garder le fond". */
  framed: string;
  keepBackground: boolean;
};

const DB = 'mounas-dessins';
const STORE = 'creatures';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listCreatures(): Promise<Creature[]> {
  try {
    const all = await tx<Creature[]>('readonly', (s) => s.getAll() as IDBRequest<Creature[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveCreature(c: Creature): Promise<void> {
  await tx('readwrite', (s) => s.put(c));
}

export async function deleteCreature(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}
