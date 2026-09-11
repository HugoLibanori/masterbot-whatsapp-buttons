import * as types from '../../types/BaileysTypes/index.js';

let cachedBlocklist: string[] | null = null;
let lastBlocklistFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export async function getBlockedContacts(
  sock: types.MyWASocket,
  forceRefresh = false,
): Promise<string[]> {
  const now = Date.now();
  if (!forceRefresh && cachedBlocklist && now - lastBlocklistFetch < CACHE_TTL_MS) {
    return cachedBlocklist;
  }

  try {
    const list = await sock.fetchBlocklist();
    cachedBlocklist = Array.isArray(list) ? list : [];
    lastBlocklistFetch = now;
    return cachedBlocklist;
  } catch (err) {
    return cachedBlocklist || [];
  }
}

export function invalidateBlocklistCache() {
  cachedBlocklist = null;
  lastBlocklistFetch = 0;
}

