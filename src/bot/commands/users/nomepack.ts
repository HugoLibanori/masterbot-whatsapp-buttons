import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'nomepack',
  description: 'Altera o nome do pacote de figurinhas. exclusivo para cada usuário.',
  category: 'users',
  aliases: ['nomepack'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command, textReceived, sender } = messageContent;
    try {
      if (!args.length) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }
      const usuarioTexto = textReceived.trim();
      if (usuarioTexto.length > 50) {
        await sock.sendText(id_chat, textMessage.figurinhas.nomepack.msgs.texto_longo);
        return;
      }
      await userController.updatePack(sender, usuarioTexto);
      await sock.sendText(id_chat, textMessage.figurinhas.nomepack.msgs.sucesso);
    } catch (err: any) {
      if (!err.erro) throw err;
      await sock.sendText(id_chat, createText(textMessage.outros.erro_api, command, err.erro));
    }
  },
};

export default command;
