import { ConnectionState, DisconnectReason } from '@itsukichan/baileys';
import NodeCache from 'node-cache';
import { Boom } from '@hapi/boom';

import { connectionPairingCode, connectionQr, createText } from '../utils/utils.js';
import * as botController from '../bot/controllers/BotController.js';
import { Socket } from '../class/Socket.js';
import { BotData } from '../configs/configBot/BotData.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import * as types from '../types/BaileysTypes/index.js';
import { Event } from '../class/Event.js';
import BaileysSession from '../database/models/BaileysSession.js';

export const handleConnectionUpdate = async (
  cs: Partial<ConnectionState>,
  sock: types.MyWASocket,
  socket: Socket,
  groupCache: NodeCache,
  reconnectFunc: () => Promise<void>,
  getConnectType: () => Promise<number | null>,
  id: number,
): Promise<boolean> => {
  const { connection, lastDisconnect, qr } = cs;

  if (qr) {
    const connectonType = await getConnectType();

    if (connectonType === 1) {
      connectionPairingCode(sock);
    } else if (connectonType === 2) {
      connectionQr(qr);
    } else {
      console.log('Nenhuma opção selecionada');
    }
  }

  if (connection === 'close') {
    const shouldReconnect = await handleConnectionClose(cs, id);
    if (shouldReconnect) {
      try {
        await reconnectFunc();
      } catch (err) {
        console.error('Erro ao tentar reconectar:', err);
      }

      return false;
    }
    return true;
  }

  if (connection === 'open') {
    try {
      const botData = await botController.getBotData();

      if (!botData) {
        await botController.registerBotData(socket);
        console.log('BOT REGISTRADO COM SUCESSO. REINICIANDO CONEXÃO...');
        await socket.restartBot();
        return false;
      }

      const groupInfo = await socket.getAllGroups();
      groupInfo.forEach((group) => {
        groupCache.set(group.id, group);
      });
      const events = new Event(socket, groupInfo, botData);
      const fullBoot = await events.updateDataStart();

      BotData.set(botData);

      return fullBoot;
    } catch (err) {
      console.warn('⚠️ Erro ao carregar os grupos no cache:', err);
    }
  }

  if (lastDisconnect) {
    console.log('Última desconexão:', lastDisconnect.error);
  }
  return true;
};

const handleConnectionClose = async (
  cs: Partial<ConnectionState>,
  id: number,
): Promise<boolean> => {
  const textCommands = commandInfo();
  try {
    const { lastDisconnect } = cs;
    let reconectar = false;
    if (!lastDisconnect) {
      return reconectar;
    }
    const erroCode = new Boom(lastDisconnect.error)?.output?.statusCode;
    if (erroCode === DisconnectReason?.loggedOut) {
      console.log(textCommands.outros.desconectado.deslogado);
      await BaileysSession.destroy({ where: { botId: id } });
    } else if (erroCode === DisconnectReason?.restartRequired) {
      console.log(textCommands.outros.desconectado.reiniciar);
    } else {
      console.log(
        createText(
          textCommands.outros.desconectado.conexao,
          erroCode.toString(),
          lastDisconnect.error?.message || 'Erro desconhecido.',
        ),
      );
    }
    reconectar = true;
    return reconectar;
  } catch (error) {
    console.error('Erro ao tratar a conexão:', error);
    return false;
  }
};
