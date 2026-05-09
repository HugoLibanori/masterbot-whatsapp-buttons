import { ConnectionState, DisconnectReason } from '@innovatorssoft/baileys';
import { Boom } from '@hapi/boom';

import { connectionPairingCode, connectionQr, createText } from '../utils/utils.js';
import * as botController from '../bot/controllers/BotController.js';
import { Socket } from '../class/Socket.js';
import { BotData } from '../configs/configBot/BotData.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import * as types from '../types/BaileysTypes/index.js';
import { Event } from '../class/Event.js';
import BaileysSession from '../database/models/BaileysSession.js';
import { setSessionQr, setSessionStatus, setSessionPairingCode } from '../api/sessionState.js';

export const handleConnectionUpdate = async (
  cs: Partial<ConnectionState>,
  sock: types.MyWASocket,
  socket: Socket,
  groupCache: any,
  reconnectFunc: (session_name: string) => Promise<void>,
  getConnectType: () => Promise<number | null>,
  session_name: string,
  currentFullBoot: boolean,
  getPairingNumber?: () => Promise<string | undefined>,
): Promise<boolean> => {
  const { connection, lastDisconnect, qr } = cs;
  let isBooting = false;

  if (qr) {
    // armazena QR para leitura via API
    setSessionQr(session_name, qr);
    setSessionPairingCode(session_name, undefined);

    const connectonType = await getConnectType();

    if (connectonType === 1) {
      const pairingNumber = (await getPairingNumber?.()) ?? undefined;
      const code = await connectionPairingCode(sock, pairingNumber);
      if (code) {
        setSessionPairingCode(session_name, code);
      }
    } else if (connectonType === 2) {
      connectionQr(qr);
    } else {
      console.log('Nenhuma opção selecionada');
    }
    return false;
  }

  if (connection === 'close') {
    const reason = (lastDisconnect?.error as any)?.output?.statusCode;
    console.log(`[CONEXÃO FECHADA] Motivo: ${reason}`);
    setSessionStatus(session_name, 'closed');
    setSessionPairingCode(session_name, undefined);
    const shouldReconnect = await handleConnectionClose(cs, session_name);
    if (shouldReconnect) {
      try {
        console.log(`[CONEXÃO] Aguardando 5 segundos antes de reconectar...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await reconnectFunc(session_name);
      } catch (err) {
        console.error('Erro ao tentar reconectar:', err);
      }
    }
    return false;
  }

  if (connection === 'open') {
    if (isBooting) return true;
    isBooting = true;
    setSessionStatus(session_name, 'open');
    setSessionQr(session_name, undefined);
    setSessionPairingCode(session_name, undefined);
    try {
      const botData = await botController.getBotData();

      if (!botData) {
        await botController.registerBotData(socket);
        console.log('BOT REGISTRADO COM SUCESSO. REINICIANDO CONEXÃO...');
        await socket.restartBot();
        return false;
      }

      // ✅ Otimização: Só carrega tudo se o cache estiver vazio
      const cachedKeys = groupCache.keys();
      let uniqueGroups: types.MyGroupMetadata[] = [];

      if (cachedKeys.length > 0) {
        uniqueGroups = cachedKeys.map((id: string) => groupCache.get(id)).filter((g: any) => g !== undefined);
        console.log(`[BOOT] Usando ${uniqueGroups.length} grupos do cache.`);
      } else {
        const groupInfo = await socket.getAllGroups();
        uniqueGroups = Array.from(new Map(groupInfo.map((g) => [g.id, g])).values());
        uniqueGroups.forEach((group) => {
          groupCache.set(group.id, group);
        });
      }

      const events = new Event(socket, uniqueGroups, botData);
      const fullBoot = await events.updateDataStart();

      BotData.set(botData);

      return fullBoot;
    } catch (err) {
      console.warn('⚠️ Erro ao carregar os grupos no cache:', err);
      return false;
    } finally {
      isBooting = false;
    }
  }

  if (connection === 'connecting') {
    return false;
  }

  if (lastDisconnect) {
    console.log('Última desconexão:', lastDisconnect.error);
  }
  return currentFullBoot;
};

const handleConnectionClose = async (
  cs: Partial<ConnectionState>,
  session_name: string,
): Promise<boolean> => {
  const textCommands = commandInfo();
  try {
    const { lastDisconnect } = cs;
    if (!lastDisconnect) {
      return false;
    }
    const erroCode = Number((lastDisconnect?.error as Boom)?.output?.statusCode || new Boom(lastDisconnect?.error)?.output?.statusCode);
    
    if (erroCode === DisconnectReason?.loggedOut || erroCode === 440 || erroCode === 401) {
      console.log(`[CONEXÃO] ⚠️ Sessão "${session_name}" inválida (Erro ${erroCode}). Limpando dados para novo login...`);
      await BaileysSession.destroy({ where: { session_name } });
      setSessionStatus(session_name, 'closed');
      setSessionQr(session_name, undefined);
      return false;
    } 
    
    console.log(`[CONEXÃO] Tentando reconectar sessão "${session_name}"... (Motivo: ${erroCode})`);
    return true;
  } catch (error) {
    console.error('Erro ao tratar a conexão:', error);
    return false;
  }
};
