import * as types from '../../types/BaileysTypes/index.js';

export async function getAdminsGroupMetadata(
  grupoMetadata: types.MyGroupMetadata,
) {
  const { participants } = grupoMetadata;
  const grupoAdmins = participants.filter((member) => member.admin != null);
  const admins: string[] = [];
  grupoAdmins.forEach((admin) => {
    admins.push(admin.id);
  });
  return admins;
}
