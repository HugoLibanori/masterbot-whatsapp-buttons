import {
  initAuthCreds,
  BufferJSON,
  proto,
  AuthenticationState,
  SignalDataTypeMap,
  SignalDataSet,
} from '@innovatorssoft/baileys';
import BaileysSession from '../database/models/BaileysSession.js';

export async function useSequelizeAuthState(session_name: string) {
  const row = await BaileysSession.findOne({
    where: { session_name },
    raw: true,
  });

  // Estrutura base do que vamos manter em memória
  let saved: any;

  if (row?.data) {
    try {
      // CORRETO: usar JSON.parse com BufferJSON.reviver
      const restoredData = JSON.parse(row.data, BufferJSON.reviver);

      if (restoredData && typeof restoredData === 'object' && restoredData.creds) {
        saved = restoredData;
      } else {
        console.error('⚠️ Formato inválido após restaurar sessão. Recriando...');
        saved = { creds: initAuthCreds(), keys: {} };
      }
    } catch (err) {
      console.error('⚠️ Erro ao restaurar sessão. Recriando...', err);
      saved = { creds: initAuthCreds(), keys: {} };
    }
  } else {
    console.log('Nenhum dado encontrado, criando nova sessão...');
    saved = { creds: initAuthCreds(), keys: {} };
  }

  // Não zere/sobrescreva creds quando registered=false.
  // Não recrie creds só porque "me" está ausente — é normal antes da conexão abrir.
  if (!saved.creds) {
    saved.creds = initAuthCreds();
  }
  if (!saved.keys) {
    saved.keys = {};
  }

  const writeSession = async () => {
    // CORRETO: passar o replacer no JSON.stringify
    const payload = JSON.stringify(saved, BufferJSON.replacer);
    await BaileysSession.upsert({
      session_name,
      data: payload,
    });
  };

  const keys = {
    get: async <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ): Promise<{ [key: string]: SignalDataTypeMap[T] }> => {
      const data: { [key: string]: SignalDataTypeMap[T] } = {};
      const stored = saved.keys?.[type] || {};

      for (const id of ids) {
        let value = stored[id];
        if (type === 'app-state-sync-key' && value) {
          // Mantém compatibilidade: garante objeto AppStateSyncKeyData
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        if (value) {
          data[id] = value;
        }
      }

      return data;
    },

    set: async (data: SignalDataSet) => {
      for (const key in data) {
        const k = key as keyof SignalDataTypeMap;
        saved.keys[k] = saved.keys[k] || {};
        Object.assign(saved.keys[k], data[k]);
      }
      await writeSession();
    },
  };

  const state: AuthenticationState = {
    creds: saved.creds,
    keys,
  };

  const saveCreds = async () => {
    await writeSession();
  };

  return { state, saveCreds };
}
