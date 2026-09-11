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
    grupo,
    isGroup,
    command,
    contentQuotedMsg,
    textReceived,
    sender,
    numberBot,
  } = messageContent;

  const id_group = grupo?.id_group;
  const mentionedJid = grupo?.mentionedJid || [];

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

    // Identificadores dinâmicos do BOT (número, LID, etc.)
    let botNumber = '';
    try {
      botNumber = await sock.getNumberBot();
    } catch {}

    const rawBotSock = (sock as any).sock;
    const botRawCandidates = [
      botNumber,
      numberBot,
      rawBotSock?.user?.id,
      rawBotSock?.user?.lid,
      rawBotSock?.authState?.creds?.me?.id,
      rawBotSock?.authState?.creds?.me?.lid,
    ].filter(Boolean) as string[];

    const botJids = botRawCandidates.map((s) => s.replace(/:\d+@/, '@').replace(/:\d+$/, ''));
    const botDigits = botRawCandidates.map((s) => s.replace(/\D+/g, '')).filter(Boolean);

    // 1. Verifica se o bot foi marcado com @ (pelo WhatsApp)
    const allMentions = [
      ...(mentionedJid || []),
      ...(message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
    ];

    const isMentionedByAt = allMentions.some((m) => {
      const cleanM = m.replace(/:\d+@/, '@').replace(/:\d+$/, '');
      const mDigits = m.replace(/\D+/g, '');
      return (
        botJids.some(
          (b) =>
            b === cleanM ||
            (b.includes('@') && cleanM.includes('@') && b.split('@')[0] === cleanM.split('@')[0]),
        ) ||
        (Boolean(mDigits) && botDigits.includes(mDigits))
      );
    });

    // 2. Verifica se é resposta citando uma mensagem do próprio bot
    const quotedSender = contentQuotedMsg?.sender || '';
    const cleanQuoted = quotedSender.replace(/:\d+@/, '@').replace(/:\d+$/, '');
    const quotedDigits = quotedSender.replace(/\D+/g, '');

    const isReplyToBot =
      Boolean(quotedSender) &&
      (botJids.some(
        (b) =>
          b === cleanQuoted ||
          (b.includes('@') && cleanQuoted.includes('@') && b.split('@')[0] === cleanQuoted.split('@')[0]),
      ) ||
        (Boolean(quotedDigits) && botDigits.includes(quotedDigits)));

    // 3. Verifica se foi chamado pelo nome no texto
    const botName = dataBot?.name || '';
    const nomesBot = [
      'master',
      'm@ste®',
      'm@ster',
      'mestre',
      'masterbot',
      botName,
    ].filter(Boolean);

    const foiMencionadoPorNome = nomesBot.some((nome) =>
      textFull.toLowerCase().includes(nome.toLowerCase()),
    );

    if (!(isMentionedByAt || isReplyToBot || foiMencionadoPorNome)) return true;

    // Prepara o texto limpo para enviar à IA
    let textUser = textFull;
    for (const d of botDigits) {
      textUser = textUser.replace(new RegExp(`@${d}`, 'g'), '');
    }
    for (const nome of ['@masterbot', '@master', '@m@ste®', '@m@ster']) {
      textUser = textUser.replace(new RegExp(nome, 'gi'), '');
    }
    textUser = textUser.trim();

    if (!textUser) {
      textUser = 'Olá!';
    }

    await sock.sendReact(message.key, '💬', id_chat);

    const groupName = grupo?.name || dataGroup?.nome || '';
    const resposta = await conversationController.conversationOpenAI(
      id_group!,
      textUser,
      dataBot,
      groupName,
    );

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
