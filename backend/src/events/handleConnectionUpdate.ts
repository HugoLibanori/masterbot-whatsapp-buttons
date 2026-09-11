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

const reconnectingSessions = new Map<string, { timeoutId?: NodeJS.Timeout; attempt: number }>();

export function stopReconnect(session_name: string) {
  const session = reconnectingSessions.get(session_name);
  if (session?.timeoutId) {
    clearTimeout(session.timeoutId);
  }
  reconnectingSessions.delete(session_name);
}

export function scheduleReconnect(
  session_name: string,
  reconnectFunc: (session_name: string) => Promise<void>,
) {
  let session = reconnectingSessions.get(session_name);
  if (!session) {
    session = { attempt: 0 };
    reconnectingSessions.set(session_name, session);
  }

  // Se já há um timeout agendado, aguarda a execução
  if (session.timeoutId) {
    return;
  }

  session.attempt += 1;
  // Intervalos suaves com limite máximo: 3s, 5s, 8s, 11s, máx 15s
  const delay = Math.min(3000 + (session.attempt - 1) * 2500, 15000);
  console.log(
    `[RECONEXÃO] Agendando tentativa #${session.attempt} para sessão "${session_name}" em ${Math.round(delay / 1000)}s...`,
  );

  session.timeoutId = setTimeout(async () => {
    if (!reconnectingSessions.has(session_name)) return;
    const current = reconnectingSessions.get(session_name);
    if (current) current.timeoutId = undefined;

    try {
      console.log(`[RECONEXÃO] Executando tentativa #${session!.attempt} para "${session_name}"...`);
      setSessionStatus(session_name, 'starting');
      await reconnectFunc(session_name);
    } catch (err: any) {
      console.warn(
        `[RECONEXÃO] Falha ao reconectar na tentativa #${session!.attempt} (troca de Wi-Fi ou rede instável): ${err?.message || err}`,
      );
      if (reconnectingSessions.has(session_name)) {
        scheduleReconnect(session_name, reconnectFunc);
      }
    }
  }, delay);
}

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
    const reason = (lastDisconnect?.error as any)?.output?.statusCode || (lastDisconnect?.error as any)?.statusCode;
    console.log(`[CONEXÃO FECHADA] Motivo: ${reason || 'Oscilação de rede / Troca de Wi-Fi'}`);
    setSessionStatus(session_name, 'closed');
    setSessionPairingCode(session_name, undefined);
    const shouldReconnect = await handleConnectionClose(cs, session_name);
    if (shouldReconnect) {
      scheduleReconnect(session_name, reconnectFunc);
    } else {
      stopReconnect(session_name);
    }
    return false;
  }

  if (connection === 'open') {
    stopReconnect(session_name);
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
  try {
    const { lastDisconnect } = cs;
    if (!lastDisconnect) {
      console.log(`[CONEXÃO] Desconexão sem detalhes recebida. Reconectando sessão "${session_name}"...`);
      return true;
    }
    const erroCode = Number(
      (lastDisconnect?.error as Boom)?.output?.statusCode ||
      (lastDisconnect?.error as any)?.statusCode ||
      new Boom(lastDisconnect?.error)?.output?.statusCode
    );
    
    // Apenas logout explícito pelo aparelho cancela a reconexão automática
    if (erroCode === DisconnectReason?.loggedOut || erroCode === 401 || erroCode === 440) {
      console.log(`[CONEXÃO] ⚠️ Sessão "${session_name}" deslogada pelo WhatsApp (Erro ${erroCode}). Limpando dados...`);
      await BaileysSession.destroy({ where: { session_name } });
      setSessionStatus(session_name, 'closed');
      setSessionQr(session_name, undefined);
      return false;
    } 
    
    console.log(`[CONEXÃO] Conexão caiu (código: ${erroCode || 'desconhecido'} - troca de Wi-Fi ou oscilação). Reconectando sessão "${session_name}"...`);
    return true;
  } catch (error) {
    console.error('[CONEXÃO] Erro ao analisar fechamento da conexão:', error);
    // Em caso de dúvida durante oscilação de rede, reconectar sempre
    return true;
  }
};
