import { downloadMediaMessage } from '@innovatorssoft/baileys';
import * as types from '../../../types/BaileysTypes/index.js';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, verificarSeWebpEhAnimado } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { stickerFroGif } from '../../api/sticker.js'; // Função que converte para GIF

const command: Command = {
  name: 'sgif',
  description: 'Converte uma figurinha animada em GIF.',
  category: 'users',
  aliases: ['sgif'],
  group: false,
  admin: false,
  owner: false,
  minType: 'vip',
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command, quotedMsg, contentQuotedMsg } = messageContent;
    try {
      if (!quotedMsg || contentQuotedMsg?.type !== typeMessages.STICKER) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }

      if (contentQuotedMsg?.message?.message?.stickerMessage?.url === 'https://web.whatsapp.net')
        contentQuotedMsg.message.message.stickerMessage.url = `https://mmg.whatsapp.net${contentQuotedMsg?.message?.message?.stickerMessage?.directPath}&mms3=true`;

      const bufferSticker = await downloadMediaMessage(
        contentQuotedMsg?.message as types.MyWAMessage,
        'buffer',
        {},
      );

      const isAnimated = await verificarSeWebpEhAnimado(bufferSticker);

      if (isAnimated !== 'animado') {
        await sock.sendText(id_chat, '[❌] - A figurinha precisa ser animada.');
        return;
      }

      const bufferGif = await stickerFroGif(bufferSticker);

      if (bufferGif.erro || !bufferGif.resultado) {
        await sock.sendText(id_chat, '❌ Erro ao converter o sticker para GIF.');
        return;
      }

      await sock.sendVideoWithGif(id_chat, 'Aqui está seu GIF 🎉', bufferGif.resultado);
    } catch (error) {
      console.error('Erro no comando sgif:', error);
      await sock.sendText(id_chat, '❌ Erro inesperado ao converter a figurinha.');
    }
  },
};

export default command;
