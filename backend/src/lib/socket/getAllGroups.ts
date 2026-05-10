import { GroupMetadata } from '@innovatorssoft/baileys';
import * as types from '../../types/BaileysTypes/index.js';

export async function getAllGroups(sock: types.MyWASocket): Promise<GroupMetadata[]> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Verifica se o socket ainda existe e está conectado
      if (!sock || (sock as any).ws?.readyState !== 1) {
        throw new Error('Socket não está pronto ou foi fechado.');
      }

      // Pequeno delay antes de tentar (especialmente importante na primeira vez logo após o 'open')
      if (attempts === 0) await new Promise(resolve => setTimeout(resolve, 2000));
      
      const groups = await sock.groupFetchAllParticipating();
      return Object.values(groups);
    } catch (err: any) {
      // Se a conexão foi fechada intencionalmente (como no erro 440), não adianta tentar de novo agora
      if (err.message.includes('Connection Closed') || err.message.includes('closed')) {
        console.log('[GROUPS] Conexão fechada, interrompendo busca de grupos.');
        return [];
      }

      attempts++;
      console.error(`[GROUPS] Erro ao buscar os grupos (Tentativa ${attempts}/${maxAttempts}):`, err.message || err);
      
      if (attempts >= maxAttempts) {
        return [];
      }
      
      // Aguarda 5 segundos antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return [];
}
