import { downloadMediaMessage } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, verificarSeWebpEhAnimado } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { stickerFroImage } from '../../../bot/api/sticker.js';

const command: Command = {
  name: 'simg',
  description: 'Converte uma figurinhas em imagem.',
  category: 'users',
  aliases: ['simg'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
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

      if (isAnimated !== 'estático') {
        await sock.sendText(id_chat, '[❌] - A figurinha precisa ser estática.');
        return;
      }

      const bufferImg = await stickerFroImage(bufferSticker);

      await sock.sendImage(id_chat, bufferImg.resultado!, 'Aqui sua imagem.');
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
