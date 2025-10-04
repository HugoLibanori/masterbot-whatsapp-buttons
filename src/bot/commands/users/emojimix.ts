import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { mixEmojis, createNameSticker } from '../../../bot/api/sticker.js';
import * as userController from '../../../bot/controllers/UserController.js';
import * as types from '../../../types/BaileysTypes/index.js';

const command: Command = {
  name: '',
  description: '',
  category: '',
  aliases: ['emojimix'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, textReceived, command, sender } = messageContent;
    const { author_sticker, pack_sticker } = dataBot;

    const pack: string | null = await userController.getPack(sender!);
    const author: string | null = await userController.getAuthor(sender!);

    try {
      if (!args.length) {
        await sock.sendText(id_chat!, commandErrorMsg(command));
        return;
      }

      const [emoji1, emoji2] = textReceived.split('+');

      if (!emoji1 || !emoji2) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }
      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.sendText(id_chat, textMessage.figurinhas.emojimix.msgs.espera);

      const bufferMixEmiji = await mixEmojis(emoji1, emoji2);
      const bufferSticker = await createNameSticker(bufferMixEmiji.resultado!, {
        pack: pack ? (pack ? pack?.trim() : pack_sticker?.trim()) : pack_sticker?.trim(),
        autor: author ? (author ? author?.trim() : author_sticker?.trim()) : author_sticker?.trim(),
      });

      await sock.sendSticker(id_chat, bufferSticker.resultado!);
      await sock.sendReact(message.key, '✅', id_chat!);
    } catch (err: any) {
      if (!err.erro) throw err;
      await sock.sendText(
        id_chat,
        createText(textMessage?.outros.erro_api || '', command, err.erro),
      );
    }
  },
};

export default command;
