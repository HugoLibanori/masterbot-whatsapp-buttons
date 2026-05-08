import type { WASocket } from '@innovatorssoft/baileys';

const sockets = new Map<string, WASocket>();

export function setSocket(session: string, sock: WASocket) {
  sockets.set(session, sock);
}

export function getSocket(session: string): WASocket | undefined {
  return sockets.get(session);
}

export async function stopSession(session: string): Promise<boolean> {
  const sock = sockets.get(session);
  if (!sock) return false;
  try {
    // encerra conexão sem apagar credenciais
    if (sock?.ws?.close) {
      await sock.ws.close();
    } else if (typeof sock.end === 'function') {
      sock.end(undefined);
    } else if (typeof sock.logout === 'function') {
      // fallback: apenas se nenhuma outra forma existir
      await sock.logout();
    }
  } catch (e) {
    // ignora
  }
  sockets.delete(session);
  return true;
}
