import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { commandErrorMsg, downloadMediaSafe, unwrapMessage } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { PlayerInfo, resolvePlayerInfo, matchesPlayer } from '../../controllers/GrupoController.js';

export interface PendingReveal {
  id: string;
  id_chat: string;
  groupName: string;
  requester: PlayerInfo;
  bufferMedia: Buffer;
  caption: string;
  mediaType: string;
  mimetype: string;
  createdAt: number;
}

export const pendingReveals = new Map<string, PendingReveal>();

export async function deliverReveal(
  sock: ISocket,
  pending: PendingReveal,
  destination: 'pv' | 'grupo',
  originMessage?: types.MyWAMessage,
): Promise<boolean> {
  pendingReveals.delete(pending.id);

  const isPv = destination === 'pv';
  const targetChat = isPv
    ? pending.requester.jid ||
      (pending.requester.phone ? `${pending.requester.phone}@s.whatsapp.net` : '')
    : pending.id_chat;

  if (!targetChat) {
    await sock.replyText(
      pending.id_chat,
      '❌ Não foi possível identificar o destino da mensagem.',
      originMessage,
    );
    return false;
  }

  const userTag = pending.requester.phone
    ? `@${pending.requester.phone}`
    : `@${pending.requester.cleanId}`;
  const mentions = [
    pending.requester.jid,
    pending.requester.lid,
    `${pending.requester.phone}@s.whatsapp.net`,
  ].filter(Boolean);

  try {
    const captionToSend = isPv
      ? `🔓 *Mídia de visualização única revelada!*\n_Enviada a partir do grupo: *${pending.groupName || 'Grupo'}*_\n\n${pending.caption || ''}`.trim()
      : pending.caption;

    // Se estiver enviando para o PV, não cita a mensagem do grupo para evitar erro de chat cruzado
    const quoted = isPv ? undefined : originMessage;

    if (pending.mediaType === typeMessages.VIDEO) {
      await sock.replyFileBuffer(
        typeMessages.VIDEO,
        targetChat,
        pending.bufferMedia,
        captionToSend,
        quoted as any,
        pending.mimetype || 'video/mp4',
      );
    } else if (pending.mediaType === typeMessages.AUDIO) {
      await sock.replyFileBuffer(
        typeMessages.AUDIO,
        targetChat,
        pending.bufferMedia,
        '',
        quoted as any,
        pending.mimetype || 'audio/ogg; codecs=opus',
      );
    } else {
      await sock.replyFileBuffer(
        typeMessages.IMAGE,
        targetChat,
        pending.bufferMedia,
        captionToSend,
        quoted as any,
        pending.mimetype || 'image/jpeg',
      );
    }

    if (isPv) {
      await sock.sendTextWithMentions(
        pending.id_chat,
        `✅ ${userTag}, a mídia de visualização única foi revelada e enviada no seu *privado* com sucesso! 🔒`,
        mentions,
      );
    }

    if (originMessage?.key) {
      await sock.sendReact(originMessage.key, '✅', pending.id_chat);
    }
    return true;
  } catch (error: any) {
    console.error('Erro ao entregar revelação:', error?.message || error);
    if (isPv) {
      await sock.sendTextWithMentions(
        pending.id_chat,
        `❌ ${userTag}, não consegui enviar no seu privado (seu PV pode ter restrições ou privacidade para contatos). Enviando aqui no grupo:`,
        mentions,
      );
      try {
        await sock.replyFileBuffer(
          pending.mediaType,
          pending.id_chat,
          pending.bufferMedia,
          pending.caption,
          originMessage,
          pending.mimetype,
        );
      } catch (groupFallbackErr) {
        console.error('Erro ao enviar fallback no grupo:', groupFallbackErr);
      }
    } else {
      await sock.replyText(
        pending.id_chat,
        '❌ Ocorreu um erro ao enviar a mídia no grupo.',
        originMessage,
      );
    }
    return false;
  }
}

export const handlePendingReveal = async (
  sock: ISocket,
  messageContent: MessageContent,
  msg: types.MyWAMessage,
): Promise<boolean> => {
  const { id_chat } = messageContent;
  if (!id_chat || !id_chat.endsWith('@g.us')) return true;
  if (pendingReveals.size === 0) return true;

  // 1. Checa se é clique em botão
  const buttonId = msg.message?.buttonsResponseMessage?.selectedButtonId?.trim();
  let destination: 'pv' | 'grupo' | null = null;
  let targetId: string | null = null;

  if (buttonId) {
    const match = buttonId.match(/revelar\s+(pv|grupo)(?:\s+(\w+))?/i);
    if (match) {
      destination = match[1].toLowerCase() as 'pv' | 'grupo';
      targetId = match[2] || null;
    }
  }

  // 2. Se não for botão, checa se é texto simples (1, 2, pv, grupo)
  if (!destination) {
    const text = (messageContent.textFull || messageContent.textReceived || '').trim().toLowerCase();
    if (text === '1' || text === 'pv' || text === 'privado' || text === 'particular') {
      destination = 'pv';
    } else if (text === '2' || text === 'grupo') {
      destination = 'grupo';
    }
  }

  if (!destination) return true;

  // Localiza a solicitação pendente correspondente
  let pending: PendingReveal | undefined;
  if (targetId && pendingReveals.has(targetId)) {
    pending = pendingReveals.get(targetId);
  } else {
    for (const [, item] of pendingReveals.entries()) {
      if (item.id_chat === id_chat && matchesPlayer(item.requester, messageContent)) {
        pending = item;
        break;
      }
    }
  }

  if (!pending) return true;

  // Valida permissão: apenas o solicitante, dono do bot ou admin
  const isRequester = matchesPlayer(pending.requester, messageContent);
  const isOwner = messageContent.isOwnerBot;
  if (!isRequester && !isOwner) {
    await sock.replyText(
      id_chat,
      `⚠️ Apenas quem solicitou a revelação (@${pending.requester.phone || pending.requester.cleanId}) pode escolher onde receber a mídia.`,
      msg,
    );
    return false; // Intercepta para não processar outros comandos
  }

  await sock.sendReact(msg.key, '🕒', id_chat);
  await deliverReveal(sock, pending, destination, msg);
  return false;
};

const command: Command = {
  name: 'revelar',
  description: 'Revela mensagem de visualização única.',
  category: 'admins',
  aliases: ['revelar'],
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[] = [],
    dataBot?: Partial<Bot>,
  ): Promise<CommandReturn> => {
    const { id_chat, quotedMsg, contentQuotedMsg, command, isGroup } = messageContent;

    // Checa se o comando veio como seleção de destino (ex: !revelar pv [token])
    const rawAction = args[0]?.toLowerCase().trim();
    if (
      rawAction === 'pv' ||
      rawAction === 'particular' ||
      rawAction === 'privado' ||
      rawAction === 'grupo'
    ) {
      const destination = (rawAction === 'grupo' ? 'grupo' : 'pv') as 'pv' | 'grupo';
      const reqId = args[1]?.trim();

      let pending: PendingReveal | undefined;
      if (reqId && pendingReveals.has(reqId)) {
        pending = pendingReveals.get(reqId);
      } else {
        for (const [, item] of pendingReveals.entries()) {
          if (item.id_chat === id_chat && matchesPlayer(item.requester, messageContent)) {
            pending = item;
            break;
          }
        }
      }

      if (!pending) {
        return await sock.replyText(
          id_chat,
          '⚠️ Nenhuma solicitação de revelação pendente encontrada ou o tempo limite expirou.',
          message,
        );
      }

      const isOwner = messageContent.isOwnerBot;
      const isRequester = matchesPlayer(pending.requester, messageContent);

      if (!isRequester && !isOwner) {
        return await sock.replyText(
          id_chat,
          `⚠️ Apenas quem solicitou a revelação (@${pending.requester.phone || pending.requester.cleanId}) pode escolher onde receber a mídia.`,
          message,
        );
      }

      await sock.sendReact(message.key, '🕒', id_chat);
      await deliverReveal(sock, pending, destination, message);
      return { status: true };
    }

    // Se for uma nova solicitação, exige citação de mensagem única
    if (!quotedMsg || !contentQuotedMsg) {
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    }

    const typeQuoted = contentQuotedMsg.type || messageContent.typeQuetedMessage;
    let isImage = typeQuoted === typeMessages.IMAGE || typeQuoted === 'imageMessage';
    let isVideo = typeQuoted === typeMessages.VIDEO || typeQuoted === 'videoMessage';
    let isAudio = typeQuoted === typeMessages.AUDIO || typeQuoted === 'audioMessage';

    const targetMedia = contentQuotedMsg.message || contentQuotedMsg.contentVunica;

    if (!isImage && !isVideo && !isAudio) {
      const inner = unwrapMessage(targetMedia?.message || targetMedia);
      if (inner?.imageMessage) {
        isImage = true;
      } else if (inner?.videoMessage) {
        isVideo = true;
      } else if (inner?.audioMessage) {
        isAudio = true;
      }
    }

    if (!isImage && !isVideo && !isAudio) {
      return await sock.replyText(
        id_chat,
        '[❗] - Responda a uma mensagem de visualização única (foto, vídeo ou áudio) para revelar.',
        message,
      );
    }

    await sock.sendReact(message.key, '🕒', id_chat);

    let bufferMedia: Buffer;
    try {
      bufferMedia = await downloadMediaSafe(
        targetMedia,
        isVideo ? 'video' : isAudio ? 'audio' : 'image',
      );
    } catch (error: any) {
      console.error('Erro no comando revelar ao baixar mídia:', error?.message || error);
      await sock.sendReact(message.key, '❌', id_chat);

      // Fallback para relayMessage se o download direto falhar
      try {
        const content = contentQuotedMsg.contentVunica;
        const messageKey = messageContent.typeQuetedMessage as keyof types.MyWAMessageContent;
        if (content && messageKey && messageKey in content) {
          const mediaMessage = content[messageKey] as any;
          if (mediaMessage && typeof mediaMessage === 'object') {
            mediaMessage.viewOnce = false;
            await sock.relayMessage(id_chat, content);
            return;
          }
        }
      } catch {}

      return await sock.replyText(
        id_chat,
        '❌ Não foi possível baixar nem revelar a mídia de visualização única. Ela pode já ter sido apagada ou expirada pelo WhatsApp.',
        message,
      );
    }

    const caption = contentQuotedMsg.caption
      ? `🔓 *Mídia revelada:*\n${contentQuotedMsg.caption}`
      : '🔓 *Mídia de visualização única revelada!*';

    const mediaType = isVideo
      ? typeMessages.VIDEO
      : isAudio
        ? typeMessages.AUDIO
        : typeMessages.IMAGE;
    const mimetype =
      contentQuotedMsg.mimetype ||
      (isVideo ? 'video/mp4' : isAudio ? 'audio/ogg; codecs=opus' : 'image/jpeg');

    // Se NÃO for grupo (ex: chamado no PV), entrega diretamente
    if (!isGroup) {
      await sock.replyFileBuffer(mediaType, id_chat, bufferMedia, caption, message, mimetype);
      await sock.sendReact(message.key, '✅', id_chat);
      return { status: true };
    }

    // Se for em GRUPO, pergunta onde deseja receber através de botões interativos
    const requestId = Math.random().toString(36).substring(2, 8);
    const requester = resolvePlayerInfo(id_chat, messageContent.sender!, messageContent.pushName);
    const groupName = messageContent.grupo?.name || 'Grupo';

    const pendingItem: PendingReveal = {
      id: requestId,
      id_chat,
      groupName,
      requester,
      bufferMedia,
      caption,
      mediaType,
      mimetype,
      createdAt: Date.now(),
    };

    pendingReveals.set(requestId, pendingItem);

    // Timeout de 2 minutos para liberar a memória
    setTimeout(() => {
      if (pendingReveals.has(requestId)) {
        pendingReveals.delete(requestId);
      }
    }, 2 * 60 * 1000);

    const prefix = dataBot?.prefix?.trim() || '!';
    const tagUser = requester.phone ? `@${requester.phone}` : `@${requester.cleanId}`;
    const mentions = [
      requester.jid,
      requester.lid,
      `${requester.phone}@s.whatsapp.net`,
    ].filter(Boolean);

    const textPrompt =
      `👁️ *REVELAR MENSAGEM*\n\n` +
      `Olá ${tagUser}, onde você gostaria de receber a mídia revelada?\n\n` +
      `1️⃣ *No Privado (PV)* — Enviarei direto no seu particular\n` +
      `2️⃣ *No Grupo* — Enviarei aqui no grupo para todos\n\n` +
      `_Clique em um dos botões abaixo ou responda com *1* (PV) ou *2* (Grupo)._`;

    const buttons = [
      {
        buttonId: `${prefix}revelar pv ${requestId}`,
        buttonText: { displayText: '🔒 No Privado (PV)' },
      },
      {
        buttonId: `${prefix}revelar grupo ${requestId}`,
        buttonText: { displayText: '👥 No Grupo' },
      },
    ];

    try {
      await sock.sendButtons(id_chat, {
        text: textPrompt,
        footer: 'Master Bot • Escolha onde revelar',
        buttons,
        mentions,
      });
    } catch {
      await sock.sendTextWithMentions(id_chat, textPrompt, mentions);
    }

    return { status: true };
  },
};

export default command;
