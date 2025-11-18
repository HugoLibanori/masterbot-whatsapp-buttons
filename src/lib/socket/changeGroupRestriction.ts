import * as types from '../../types/BaileysTypes/index.js';

export async function changeGroupRestriction(
  sock: types.MyWASocket,
  id_grupo: string,
  status: boolean,
) {
  const config = status ? 'announcement' : 'not_announcement';
  return await sock.groupSettingUpdate(id_grupo, config);
}
