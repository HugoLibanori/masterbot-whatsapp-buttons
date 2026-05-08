import { fetchLatestBaileysVersion, makeWASocket } from '@innovatorssoft/baileys';
import { Sequelize } from 'sequelize';
import * as types from '../types/BaileysTypes/index.js';

import configWaSocket from '../configs/ConfigBaileys/configWASocket.js';
import { promptLoginMethod, promptPairingPhone } from '../utils/promptLoginMethod.js';
import { handleMessageUpsert } from '../events/handleMessageUpsert.js';
import { handleConnectionUpdate } from '../events/handleConnectionUpdate.js';
import { processUniqueMessage } from '../middleware/processUniqueMessage.js';
import { Socket } from '../class/Socket.js';
import { converterDataISOParaTimestampEmSegundos } from '../utils/utils.js';
import { Event } from '../class/Event.js';
import { BotData } from '../configs/configBot/BotData.js';
import { retryCache, groupCache, messageStoreCache } from '../utils/caches.js';
import { ensureSessionContext } from '../utils/sessionContext.js';
import { useSequelizeAuthState } from '../utils/authDB.js';
import { setSocket } from '../api/sessionRuntime.js';

let fullBoot = false;
let botInfo: Partial<any> | null = null;

export const connectWhatsapp = async (
  session_name: string,
  sessionSequelize: Sequelize,
  options?: { loginMethod?: 1 | 2; phoneNumber?: string },
) => {
  ensureSessionContext(session_name);
  const { state, saveCreds } = await useSequelizeAuthState(session_name);
  const { version } = await fetchLatestBaileysVersion();

  const sock: types.MyWASocket = makeWASocket(
    configWaSocket(state, retryCache, version, messageStoreCache, groupCache),
  );
  setSocket(session_name, sock as any);

  const socket = new Socket(sock, session_name);

  let connectionType: number | null = null;
  let pairingNumberCache: string | undefined;

  async function getConnectType(): Promise<number | null> {
    if (options?.loginMethod) return options.loginMethod;
    if (connectionType === null) {
      connectionType = await promptLoginMethod();
    }
    return connectionType;
  }

  async function getPairingNumber(): Promise<string | undefined> {
    if (options?.phoneNumber) return options.phoneNumber.replace(/\D/g, '');
    if (pairingNumberCache) return pairingNumberCache;
    pairingNumberCache = await promptPairingPhone();
    return pairingNumberCache;
  }

  sock.ev.process(async (events) => {
    // ✅ Eventos de conexões
    if (events['connection.update']) {
      ensureSessionContext(session_name);
      const update = events['connection.update'];
      fullBoot = await handleConnectionUpdate(
        update,
        sock,
        socket,
        groupCache,
        () => connectWhatsapp(session_name, sessionSequelize),
        getConnectType,
        session_name,
        fullBoot,
        getPairingNumber,
      );
      if (fullBoot) botInfo = BotData.get();
    }

    // ✅ Atualização de credenciais
    if (events['creds.update']) {
      ensureSessionContext(session_name);
      await saveCreds();
    }

    // ✅ Mensagens recebidas
    if (events['messages.upsert']) {
      ensureSessionContext(session_name);
      if (!fullBoot || !botInfo?.started) {
        return;
      }
      const { messages } = events['messages.upsert'];
      const startBot = converterDataISOParaTimestampEmSegundos(String(botInfo.started));
      for (const message of messages) {
        if (!message.key.fromMe) continue;
        const ts = Number(message?.messageTimestamp ?? 0);
        if (Number.isFinite(ts) && ts < startBot) continue;

        try {
          messageStoreCache.set(message.key.remoteJid, message);

          await processUniqueMessage(message, async () => {
            await handleMessageUpsert(socket, message);
          });
        } catch (err) {
          console.error('Erro ao processar mensagem:', err);
        }
      }
    }

    // ✅ Novo grupo adicionado
    if (events['groups.upsert']) {
      ensureSessionContext(session_name);
      const groupsUpsert = events['groups.upsert'];
      for (const group of groupsUpsert) {
        groupCache.set(group.id, group);
      }
      if (fullBoot && botInfo) {
        const eventHandler = new Event(socket, [], botInfo);
        await eventHandler.adicionadoEmGrupo(socket, groupsUpsert);
      }
    }

    // ✅ Atualização de grupo
    if (events['groups.update']) {
      ensureSessionContext(session_name);
      const groupUpdates = events['groups.update'];

      if (fullBoot && botInfo) {
        const eventHandler = new Event(socket, [], botInfo);

        for (const update of groupUpdates) {
          try {
            if (!update.id) continue;
            const metadata = groupCache.get(update.id) as types.MyGroupMetadata | undefined;
            if (metadata) {
              await eventHandler.updateDataGroups([metadata]);
            }
          } catch (err) {
            console.error(`Erro ao buscar metadata do grupo ${update.id}`, err);
          }
        }
      }
    }

    if (events['group-participants.update']) {
      ensureSessionContext(session_name);
      const event = events['group-participants.update'];
      if (!fullBoot || !botInfo) return;

      const groupMetadata = groupCache.get(event.id) as types.MyGroupMetadata | undefined;
      const groupInfo = groupMetadata ? [groupMetadata] : [];

      const eventsData = new Event(socket, groupInfo, botInfo);
      await eventsData.updateParticipants(event);
    }
  });
};
