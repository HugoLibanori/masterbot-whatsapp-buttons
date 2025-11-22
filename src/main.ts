import { fetchLatestBaileysVersion, makeWASocket } from '@itsukichan/baileys';
import * as types from './types/BaileysTypes/index.js';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true, path: path.resolve('.env') });

import configWaSocket from './configs/ConfigBaileys/configWASocket.js';
import { promptLoginMethod } from './utils/promptLoginMethod.js';
import { handleMessageUpsert } from './events/handleMessageUpsert.js';
import { handleConnectionUpdate } from './events/handleConnectionUpdate.js';
import { processUniqueMessage } from './middleware/processUniqueMessage.js';
import { Socket } from './class/Socket.js';
import { createDotEnv } from './utils/createDotEnv.js';
import {
  checkEnvironmentVariables,
  converterDataISOParaTimestampEmSegundos,
} from './utils/utils.js';
import { Event } from './class/Event.js';
import { BotData } from './configs/configBot/BotData.js';
import { Bot } from './interfaces/index.js';
import { retryCache, groupCache, messageStoreCache } from './utils/caches.js';
import { useSequelizeAuthState } from './utils/authDB.js';
import { startConversationResetScheduler } from './schenduler/conversationResetScheduler.js';
import { XPService } from './services/XPService.js';
import { startXPRecalcScheduler } from './schenduler/xpRecalcScheduler.js';

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

  let connectionType: number | null = null;
  async function getConnectType(): Promise<number | null> {
    if (connectionType === null) {
      connectionType = await promptLoginMethod();
    }
    return connectionType;
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
      if (!fullBoot || !botInfo?.started) {
        return;
      }
      const { messages } = events['messages.upsert'];
      const startBot = converterDataISOParaTimestampEmSegundos(String(botInfo.started));
      for (const message of messages) {
        // console.log('Mensagem recebida:', message);
        // console.log('Processando mensagem:', message.message?.extendedTextMessage?.contextInfo);
        if (message.key.fromMe) continue;
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

    // ✅ Solicitações de entrada em grupos
    // if (events['group.join-request']) {
    //   const event = events['group.join-request'];
    //   await handleJoinRequest(socket, event);
    // }

    if (events['group-participants.update']) {
      const event = events['group-participants.update'];
      console.log('Atualização de participantes do grupo:', event);
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
    await XPService.init();
    startConversationResetScheduler();
    startXPRecalcScheduler();
    await connectWhatsapp();
  } catch (err) {
    console.error('Erro durante a inicialização do bot:', err);
  }
}

startBot();
