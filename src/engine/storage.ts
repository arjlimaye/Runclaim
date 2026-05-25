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

  // Sync to Supabase — await so MapScreen gets fresh data on next focus
  if (upsertRows.length > 0 && ownerId !== 'local_user') {
    const { error } = await supabase
      .from('hexes')
      .upsert(upsertRows, { onConflict: 'id' });
    if (error) console.warn('Supabase hex sync error:', error.message);
    // Brief delay to allow Supabase to propagate before MapScreen fetches
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { newHexes, reinforced, maxDepth };
}