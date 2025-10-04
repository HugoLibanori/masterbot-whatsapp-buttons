import { downloadMediaMessage } from '@itsukichan/baileys';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { renameSticker } from '../../../bot/api/sticker.js';

const command: Command = {
  name: 'snome',
  description: 'Renomeia uma figurinha para o pack e autor enviado.',
  category: 'users',
  aliases: ['snome'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command, textReceived, quotedMsg, contentQuotedMsg } = messageContent;
    try {
      if (!quotedMsg || contentQuotedMsg?.type !== typeMessages.STICKER) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }
      const [pack, author] = textReceived.split(',');

      if (!pack || !author) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }

      const bufferSticker = await downloadMediaMessage(
        contentQuotedMsg?.message as types.MyWAMessage,
        'buffer',
        {},
      );
      const bufferRename = await renameSticker(bufferSticker, pack.trim(), author.trim());

      await sock.sendSticker(id_chat, bufferRename.resultado!);
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
