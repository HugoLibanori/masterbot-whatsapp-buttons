import {
  initAuthCreds,
  BufferJSON,
  proto,
  AuthenticationState,
  SignalDataTypeMap,
  SignalDataSet,
} from '@itsukichan/baileys';
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
    get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [key: string]: SignalDataTypeMap[T] }> => {
      const data: { [key: string]: SignalDataTypeMap[T] } = {};
      for (const id of ids) {
        let value = saved.keys?.[type]?.[id];
        if (type === 'app-state-sync-key' && value) {
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        data[id] = value;
      }
      return data;
    },

    set: async (data: SignalDataSet) => {
      for (const _key in data) {
        const key = _key as keyof SignalDataTypeMap;
        saved.keys[key] = saved.keys[key] || {};
        Object.assign(saved.keys[key], data[key]);
      }
      await writeSession();
    },
  };
  const state: AuthenticationState = { creds: saved.creds, keys };
  const saveCreds = async () => {
    await writeSession();
  };
  return { state, saveCreds };
}
