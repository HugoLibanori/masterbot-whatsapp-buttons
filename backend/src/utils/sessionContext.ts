import { setSession } from './caches.js';
import { getClientDB } from '../database/index.js';

export function ensureSessionContext(sessionName: string) {
  if (!sessionName) return;
  setSession(sessionName);
  try {
    getClientDB(sessionName);
  } catch (err) {
    console.error(`[SessionContext] Falha ao preparar conexão da sessão ${sessionName}:`, err);
  }
}
