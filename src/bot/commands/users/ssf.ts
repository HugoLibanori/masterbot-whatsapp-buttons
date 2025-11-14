import { downloadMediaMessage } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { createNameSticker } from '../../../bot/api/sticker.js';
import * as userController from '../../../bot/controllers/UserController.js';
import * as api from '../../../bot/api/sticker.js';

const command: Command = {
  name: 'ssf',
  description: 'Cria figurinha sem fundo.',
  category: 'users',
  minType: 'premium',
  aliases: ['ssf'],
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    try {
      const { id_chat, quotedMsg, type, contentQuotedMsg, media, sender } = messageContent;

      const pack: string | null = await userController.getPack(sender!);
      const author: string | null = await userController.getAuthor(sender!);

      const { seconds } = { ...media };

      const { author_sticker, pack_sticker } = dataBot;

      const dataMsg = {
        type: quotedMsg ? contentQuotedMsg?.type : type,
        message: quotedMsg ? (contentQuotedMsg?.message ?? message) : message,
        seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
      };

      if (dataMsg.type !== typeMessages.IMAGE) {
        await sock.sendText(id_chat, textMessage.figurinhas.ssf.msgs.erro_imagem);
        return;
      }

      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.sendText(id_chat, textMessage.figurinhas.ssf.msgs.espera);

      const bufferMidia = await downloadMediaMessage(dataMsg.message, 'buffer', {});
      const bufferBg = await api.removeBackground(bufferMidia);

      const { resultado: resultadoSticker } = await createNameSticker(bufferBg, {
        pack: pack ? (pack ? pack?.trim() : pack_sticker?.trim()) : pack_sticker?.trim(),
        autor: author ? (author ? author?.trim() : author_sticker?.trim()) : author_sticker?.trim(),
      });

      await sock.sendSticker(id_chat, resultadoSticker);
      await sock.sendReact(message.key, '✅', id_chat);
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
