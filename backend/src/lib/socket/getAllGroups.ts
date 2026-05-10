import { GroupMetadata } from '@innovatorssoft/baileys';
import * as types from '../../types/BaileysTypes/index.js';

export async function getAllGroups(sock: types.MyWASocket): Promise<GroupMetadata[]> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Pequeno delay antes de tentar (especialmente importante na primeira vez logo após o 'open')
      if (attempts === 0) await new Promise(resolve => setTimeout(resolve, 2000));
      
      const groups = await sock.groupFetchAllParticipating();
      return Object.values(groups);
    } catch (err: any) {
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
