import { downloadMediaMessage } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { commandErrorMsg, addLGBTQOverlay } from '../../../utils/utils.js';

const command: Command = {
  name: 'lgbt',
  description: 'Coloca as cores do lgbt em uma imagem',
  category: 'users',
  aliases: ['lgbt'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    try {
      const { id_chat, quotedMsg, type, contentQuotedMsg, media, command, sender } = messageContent;

      const { seconds } = { ...media };

      const dataMsg = {
        type: quotedMsg ? contentQuotedMsg?.type : type,
        message: quotedMsg ? contentQuotedMsg?.message : message,
        seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
      };

      if (dataMsg.type !== typeMessages.IMAGE)
        return await sock.sendText(id_chat, commandErrorMsg(command));

      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.sendText(id_chat, textMessage.diversao.lgbt.msgs.espera);

      const bufferImg = await downloadMediaMessage(
        dataMsg.message as types.MyWAMessage,
        'buffer',
        {},
      );

      const bufferLGBTQ = await addLGBTQOverlay(bufferImg);

      await sock.replyFileBuffer(
        typeMessages.IMAGE,
        id_chat,
        bufferLGBTQ,
        '🏳️‍🌈 - Aqui sua imagem LGBT',
        message,
      );
      await sock.sendReact(message.key, '✅', id_chat);
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
