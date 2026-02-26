import { openDB, type IDBPDatabase } from 'idb';
import type { OcvWorkspace } from './types.js';

const DB_NAME = 'onecv';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'current';

interface StoredWorkspace {
  manifest: object;
  cv: object;
  attachments: { hash: string; data: Uint8Array }[];
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
}

export async function saveWorkspace(workspace: OcvWorkspace): Promise<void> {
  const db = await getDb();
  const attachments = Array.from(workspace.attachmentData.entries()).map(
    ([hash, data]) => ({ hash, data }),
  );
  const stored: StoredWorkspace = {
    manifest: workspace.manifest,
    cv: workspace.cv,
    attachments,
  };
  await db.put(STORE, stored, KEY);
}

export async function loadWorkspace(): Promise<OcvWorkspace | null> {
  const db = await getDb();
  const stored: StoredWorkspace | undefined = await db.get(STORE, KEY);
  if (!stored) return null;

  const attachmentData = new Map<string, Uint8Array>(
    stored.attachments.map(a => [a.hash, a.data]),
  );

  return {
    manifest: stored.manifest as OcvWorkspace['manifest'],
    cv: stored.cv as OcvWorkspace['cv'],
    attachmentData,
  };
}

export async function clearWorkspace(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, KEY);
}
