import { GroupMetadata } from '@itsukichan/baileys';
import * as types from '../../types/BaileysTypes/index.js';

export async function getAllGroups(sock: types.MyWASocket): Promise<GroupMetadata[]> {
  try {
    const groups = await sock.groupFetchAllParticipating();
    return Object.values(groups);
  } catch (err) {
    console.error('Erro ao buscar os grupos:', err);
    return [];
  }
}
