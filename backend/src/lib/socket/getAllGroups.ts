import { GroupMetadata } from '@innovatorssoft/baileys';
import * as types from '../../types/BaileysTypes/index.js';

export async function getAllGroups(rawSock: types.MyWASocket | any): Promise<GroupMetadata[]> {
  const actualSock = (rawSock as any)?.sock || rawSock;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      if (!actualSock || typeof actualSock.groupFetchAllParticipating !== 'function') {
        throw new Error('Socket não está pronto ou foi fechado.');
      }

      // Pequeno delay para garantir estabilidade do socket após 'open'
      if (attempts === 0) await new Promise((resolve) => setTimeout(resolve, 1500));

      const groups = await actualSock.groupFetchAllParticipating();
      return Object.values(groups || {});
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
