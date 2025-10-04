import { initAuthCreds, BufferJSON, proto } from '@itsukichan/baileys';
import BaileysSession from '../database/models/BaileysSession.js';
export async function useSequelizeAuthState(botId: number) {
  const row = await BaileysSession.findOne({ where: { botId } });
  const saved = row
    ? JSON.parse(JSON.stringify(row.get({ plain: true }).data), BufferJSON.reviver)
    : { creds: initAuthCreds(), keys: {} };

  const writeSession = async () => {
    await BaileysSession.upsert({
      botId,
      data: JSON.parse(JSON.stringify(saved, BufferJSON.replacer)),
    });
  };

  const keys = {
    get: async (type: string, ids: string[]) => {
      const data: Record<string, any> = {};
      await Promise.all(
        ids.map(async (id) => {
          let value = saved.keys?.[type]?.[id] || null;
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(data);
          }
          data[id] = value;
        }),
      );
      return data;
    },
    set: async (data: Record<string, Record<string, any>>) => {
      for (const category of Object.keys(data)) {
        saved.keys = saved.keys || {};
        saved.keys[category] = saved.keys[category] || {};
        for (const id of Object.keys(data[category])) {
          saved.keys[category][id] = data[category][id] || null;
        }
      }
      await writeSession();
    },
  };
  const state = { creds: saved.creds, keys };
  const saveCreds = async () => {
    await writeSession();
  };
  return { state, saveCreds };
}
