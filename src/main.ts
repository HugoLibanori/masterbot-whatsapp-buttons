import { fetchLatestBaileysVersion, makeWASocket } from '@itsukichan/baileys';
import * as types from './types/BaileysTypes/index.js';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true, path: path.resolve('.env') });

import configWaSocket from './configs/ConfigBaileys/configWASocket.js';
import { promptLoginMethod } from './utils/promptLoginMethod.js';
import { handleJoinRequest } from './events/handleJoinRequest.js';
import { handleMessageUpsert } from './events/handleMessageUpsert.js';
import { handleConnectionUpdate } from './events/handleConnectionUpdate.js';
import { processUniqueMessage } from './middleware/processUniqueMessage.js';
import { Socket } from './class/Socket.js';
import { createDotEnv } from './utils/createDotEnv.js';
import { checkEnvironmentVariables } from './utils/utils.js';
import { Event } from './class/Event.js';
import { BotData } from './configs/configBot/BotData.js';
import { Bot } from 'interfaces/Bot.js';
import { retryCache, groupCache, messageStoreCache } from './utils/caches.js';
import { useSequelizeAuthState } from './utils/authDB.js';

let botInfo: Partial<Bot> | null = null;
let fullBoot = false;

const connectWhatsapp = async () => {
  const botId = (BotData.get() as Partial<Bot> & { id?: number })?.id ?? 1;

  const { state, saveCreds } = await useSequelizeAuthState(botId);
  const { version } = await fetchLatestBaileysVersion();

  const sock: types.MyWASocket = makeWASocket(
    configWaSocket(state, retryCache, version, messageStoreCache, groupCache),
  );

  const socket = new Socket(sock);

  let connectonType: number | null = null;
  async function getConnectType(): Promise<number | null> {
    if (connectonType === null) {
      connectonType = await promptLoginMethod();
    }
    return connectonType;
  }

  sock.ev.process(async (events) => {
    // ✅ Eventos de conexões
    if (events['connection.update']) {
      const update = events['connection.update'];
      fullBoot = await handleConnectionUpdate(
        update,
        sock,
        socket,
        groupCache,
        connectWhatsapp,
        getConnectType,
        botId,
      );
      if (fullBoot) botInfo = BotData.get();
    }

    // ✅ Atualização de credenciais
    if (events['creds.update']) {
      await saveCreds();
    }

    // ✅ Mensagens recebidas
    if (events['messages.upsert']) {
      const { messages } = events['messages.upsert'];
      for (const message of messages) {
        if (message.key.fromMe) continue;

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
      const groupUpdates = events['groups.update'];

      if (fullBoot && botInfo) {
        const eventHandler = new Event(socket, [], botInfo);

        for (const update of groupUpdates) {
          try {
            if (!update.id) continue;
            const metadata = await sock.groupMetadata(update.id);
            await eventHandler.updateDataGroups([metadata]);
          } catch (err) {
            console.error(`Erro ao buscar metadata do grupo ${update.id}`, err);
          }
        }
      }
    }

    // ✅ Solicitações de entrada em grupos
    // if (events['group.join-request']) {
    //   const event = events['group.join-request'];
    //   await handleJoinRequest(socket, event);
    // }

    // ✅ Participantes alterados (sem chamadas desnecessárias à API)
    if (events['group-participants.update']) {
      const event = events['group-participants.update'];
      if (!fullBoot || !botInfo) return;

      const groupInfo = groupCache
        .keys()
        .map((id) => groupCache.get(id))
        .filter((g): g is types.MyGroupMetadata => g !== undefined);

      const eventsData = new Event(socket, groupInfo, botInfo);
      await eventsData.updateParticipants(event);
    }
  });
};

async function connectBD() {
  await import('./database/index.js');
}

async function startBot() {
  try {
    const existDotEnv = fs.existsSync(path.resolve('.env'));
    if (!existDotEnv) await createDotEnv();

    checkEnvironmentVariables();
    await connectBD();
    await connectWhatsapp();
  } catch (err) {
    console.error('Erro durante a inicialização do bot:', err);
  }
}

startBot();
