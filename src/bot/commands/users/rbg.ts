import { downloadMediaMessage } from '@itsukichan/baileys';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import * as api from '../../../bot/api/sticker.js';
import { createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'rbg',
  description: 'Remove fundo de imagem',
  category: 'users',
  minType: 'premium',
  aliases: ['rbg'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, quotedMsg, type, contentQuotedMsg, media, command } = messageContent;
    try {
      const { seconds } = { ...media };

      const dataMsg = {
        type: quotedMsg ? contentQuotedMsg?.type : type,
        message: quotedMsg ? contentQuotedMsg?.message : message,
        seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
      };
      if (dataMsg.type !== typeMessages.IMAGE) {
        await sock.sendText(id_chat, textMessage.figurinhas.ssf.msgs.erro_imagem);
        return;
      }

      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.sendText(id_chat, textMessage.utilidades.rbg.msgs.espera);

      if (!dataMsg.message) throw { erro: 'Nenhuma imagem foi enviada!' };

      const bufferMidia = await downloadMediaMessage(dataMsg.message, 'buffer', {});
      const bufferBg = await api.removeBackground(bufferMidia);
      await sock.replyFileBuffer(
        typeMessages.IMAGE,
        id_chat,
        bufferBg,
        'Sua imagem sem fundo!',
        message,
      );
      await sock.sendReact(message.key, '✅', id_chat);
    } catch (err: any) {
      if (!err.erro) throw err;
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, err.erro),
        message,
      );
    }
  },
};

export default command;
