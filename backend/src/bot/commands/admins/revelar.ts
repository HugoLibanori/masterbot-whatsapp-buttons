import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, downloadMediaSafe, unwrapMessage } from '../../../utils/utils.js';
import { MessageContent, Command } from '../../../interfaces/index.js';
import { typeMessages } from '../../messages/contentMessage.js';

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
  ): Promise<CommandReturn> => {
    const { id_chat, quotedMsg, contentQuotedMsg, command } = messageContent;

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

    try {
      const bufferMedia = await downloadMediaSafe(
        targetMedia,
        isVideo ? 'video' : isAudio ? 'audio' : 'image',
      );

      const caption = contentQuotedMsg.caption
        ? `🔓 *Mídia revelada:*\n${contentQuotedMsg.caption}`
        : '🔓 *Mídia de visualização única revelada!*';

      if (isVideo) {
        await sock.replyFileBuffer(
          typeMessages.VIDEO,
          id_chat,
          bufferMedia,
          caption,
          message,
          contentQuotedMsg.mimetype || 'video/mp4',
        );
      } else if (isAudio) {
        await sock.replyFileBuffer(
          typeMessages.AUDIO,
          id_chat,
          bufferMedia,
          '',
          message,
          contentQuotedMsg.mimetype || 'audio/ogg; codecs=opus',
        );
      } else {
        await sock.replyFileBuffer(
          typeMessages.IMAGE,
          id_chat,
          bufferMedia,
          caption,
          message,
          contentQuotedMsg.mimetype || 'image/jpeg',
        );
      }

      await sock.sendReact(message.key, '✅', id_chat);
    } catch (error: any) {
      console.error('Erro no comando revelar:', error?.message || error);
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

      await sock.replyText(
        id_chat,
        '❌ Não foi possível baixar nem revelar a mídia de visualização única. Ela pode já ter sido apagada ou expirada pelo WhatsApp.',
        message,
      );
    }
  },
};

export default command;
