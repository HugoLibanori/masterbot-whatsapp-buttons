import * as types from '../types/BaileysTypes/index.js';
import { handleResponseButtonsJoinRequest } from './handleJoinRequest.js';
import { ISocket } from '../types/MyTypes/index.js';
import { checkingMessage } from '../bot/messages/checkingMessage.js';
import contentMessage from '../bot/messages/contentMessage.js';
import * as grupoController from '../bot/controllers/GrupoController.js';
import { BotData } from '../configs/configBot/BotData.js';
import { checkingSendMessage } from '../bot/messages/checkingSendMessage.js';
import { openaiMentionMiddleware } from '../middleware/openaiMentionMiddleware.js';
import { handleAllButtons } from './handleAllButtons.js';
import { isSessionActive } from '../services/LicenseService.js';
import { verificarCooldown } from '../utils/cooldownUtils.js';

export const handleMessageUpsert = async (sock: ISocket, messages: types.MyWAMessage) => {
  const msg = messages;
  // if (msg.key.remoteJid !== '120363159850634529@g.us') return;

  const sessionName = sock.session_name;

  const active = await isSessionActive(sessionName);

  if (!active) {
    const permitido = await verificarCooldown(
      sock,
      sessionName,
      'licenca',
      'Sistema',
      msg.key.remoteJid!,
    );

    if (permitido) {
      await sock.sendText(
        msg.key.remoteJid!,
        `🚫 *Licença expirada!*\n\n✅ Para renovar o acesso, fale com o administrador.`,
      );
    }

    return;
  }

  const dataBot = BotData.get() || {};
  const messageContent = await contentMessage(await sock.getInstance(), msg);
  const isButtons = msg.message?.buttonsResponseMessage;

  if (isButtons) {
    await handleResponseButtonsJoinRequest(sock, msg);
    await handleAllButtons(sock, msg, messageContent);
  }

  if (!(await grupoController.filterAntiLink(sock, messageContent, dataBot, msg))) return;
  if (!(await grupoController.filterAntiPorno(sock, messageContent, dataBot, msg))) return;
  if (!(await grupoController.filtroAntiFlood(sock, messageContent, dataBot))) return;
  if (!(await checkingSendMessage(sock, msg, messageContent, dataBot))) return;
  if (!(await grupoController.jogoDaVelhaFunction(sock, messageContent, dataBot))) return;
  if (!(await openaiMentionMiddleware(sock, msg, messageContent, dataBot))) return;

  await checkingMessage(sock, msg, messageContent);
};
