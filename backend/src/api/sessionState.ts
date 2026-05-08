type SessionStatus = 'created' | 'starting' | 'open' | 'closed' | 'error' | 'stopped';

interface SessionInfo {
  status: SessionStatus;
  qr?: string;
  pairingCode?: string;
  updatedAt: number;
}

const store = new Map<string, SessionInfo>();

export function setSessionStatus(session: string, status: SessionStatus) {
  const prev = store.get(session) || { status: 'created', updatedAt: Date.now() };
  store.set(session, { ...prev, status, updatedAt: Date.now() });
}

export function setSessionQr(session: string, qr: string | undefined) {
  const prev = store.get(session) || { status: 'starting', updatedAt: Date.now() };
  store.set(session, { ...prev, qr, updatedAt: Date.now() });
}

export function setSessionPairingCode(session: string, code: string | undefined) {
  const prev = store.get(session) || { status: 'starting', updatedAt: Date.now() };
  store.set(session, { ...prev, pairingCode: code, updatedAt: Date.now() });
}

export function getSessionInfo(session: string): SessionInfo | undefined {
  return store.get(session);
}

export function resetSession(session: string) {
  store.delete(session);
}
