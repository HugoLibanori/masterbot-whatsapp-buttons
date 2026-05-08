import { ISocket } from '../types/MyTypes/index.js';
import { Bot, MessageContent } from '../interfaces/index.js';
import { ConversationController } from '../bot/controllers/ConversationController.js';
import { createText, checkCommandExists } from '../utils/utils.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import * as types from '../types/BaileysTypes/index.js';

import * as grupoController from '../bot/controllers/GrupoController.js';
import * as userController from '../bot/controllers/UserController.js';

const textMessage = commandInfo();

const conversationController = new ConversationController();

export async function openaiMentionMiddleware(
  sock: ISocket,
  message: types.MyWAMessage,
  messageContent: MessageContent,
  dataBot: Partial<Bot>,
): Promise<boolean> {
  const {
    textFull,
    id_chat,
    grupo: { id_group },
    isGroup,
    command,
    contentQuotedMsg,
    textReceived,
    sender,
    grupo: { mentionedJid },
  } = messageContent;

  const numberOwner = await userController.getOwner();
  const dataGroup = id_group ? await grupoController.getGroup(id_group) : null;

  if (isGroup && id_group) {
    const comandoExiste = (await checkCommandExists(dataBot, command)).exists;
    if (comandoExiste) return true;

    if (!dataGroup?.openai?.status || !textFull) return true;

    if (dataBot.apis?.openai?.api_key === '') {
      await sock.replyText(id_chat, textMessage.admin.apis.msgs.sem_api, message);
      return false;
    }

    const botJid = `240072045686979@lid`;

    const nomesBot = ['master', 'm@ste®', 'm@ster', 'mestre'];

    const foiMencionadoPorNome = nomesBot.some((nome) =>
      textFull.toLowerCase().includes(nome.toLowerCase()),
    );

    const isReplyToBot = contentQuotedMsg?.sender === '240072045686979@lid';
    const isMentionedByAt = mentionedJid?.includes(botJid);

    const textUser = isMentionedByAt ? textReceived : textFull;

    if (!(isMentionedByAt || isReplyToBot || foiMencionadoPorNome)) return true;

    await sock.sendReact(message.key, '💬', id_chat);

    const resposta = await conversationController.conversationOpenAI(id_group!, textUser, dataBot);

    if (resposta) {
      await sock.replyText(
        id_chat,
        createText(textMessage.utilidades.master.msgs.resposta, resposta),
        message,
      );
      await sock.sendReact(message.key, '✅', id_chat);
      return false;
    }
  }

  return true;
}
