import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type HexRecord = {
  owner_id: string;
  depth_level: number;
  total_runs: number;
  last_run_timestamp: number;
};

export type HexStore = {
  [hexId: string]: HexRecord;
};

const STORAGE_KEY = 'runclaim_hexes';

export async function saveHexStore(store: HexStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function loadHexStore(): Promise<HexStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  return JSON.parse(raw) as HexStore;
}

export type RunResult = {
  newHexes: number;
  reinforced: number;
  maxDepth: number;
};

export async function processRunHexes(
  claimedHexIds: string[],
  ownerId: string
): Promise<RunResult> {
  const store = await loadHexStore();
  const now = Date.now();

  let newHexes = 0;
  let reinforced = 0;
  let maxDepth = 1;
  const upsertRows: {
    id: string;
    owner_id: string;
    depth_level: number;
    total_runs: number;
    last_run_timestamp: number;
  }[] = [];

  for (const hexId of claimedHexIds) {
    const existing = store[hexId];

    if (!existing) {
      store[hexId] = {
        owner_id: ownerId,
        depth_level: 1,
        total_runs: 1,
        last_run_timestamp: now,
      };
      newHexes++;
    } else {
      const newDepth = Math.min(existing.depth_level + 1, 7) as number;
      const didIncrease = newDepth > existing.depth_level;
      store[hexId] = {
        ...existing,
        depth_level: newDepth,
        total_runs: existing.total_runs + 1,
        last_run_timestamp: now,
      };
      if (didIncrease) reinforced++;
    }

    maxDepth = Math.max(maxDepth, store[hexId].depth_level);

    upsertRows.push({
      id: hexId,
      owner_id: ownerId,
      depth_level: store[hexId].depth_level,
      total_runs: store[hexId].total_runs,
      last_run_timestamp: now,
    });
  }

  // Save locally first
  await saveHexStore(store);

  // Sync to Supabase (fire and forget — don't block the UI)
  if (upsertRows.length > 0 && ownerId !== 'local_user') {
    supabase
      .from('hexes')
      .upsert(upsertRows, { onConflict: 'id,owner_id' })
      .then(({ error }) => {
        if (error) console.warn('Supabase hex sync error:', error.message);
      });
  }

  return { newHexes, reinforced, maxDepth };
}