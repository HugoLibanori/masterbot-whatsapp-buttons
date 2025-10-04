import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'r',
  description: 'Reseta os comandos diarios de um usuario.',
  category: 'owner',
  aliases: ['r'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const {
      id_chat,
      textReceived,
      quotedMsg,
      contentQuotedMsg,
      grupo: { mentionedJid },
      command,
    } = messageContent;

    if (!dataBot.limite_diario?.status)
      return await sock.replyText(id_chat, textMessage.admin.r.msgs.erro_limite_diario, message);
    let usuarioResetado;
    if (quotedMsg) usuarioResetado = contentQuotedMsg.sender;
    else if (mentionedJid.length) usuarioResetado = mentionedJid[0];
    else if (args.length) usuarioResetado = textReceived.replace(/\W+/g, '') + '@s.whatsapp.net';
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let usuarioRegistrado = await userController.getUser(usuarioResetado);
    if (usuarioRegistrado) {
      await userController.resetUserDayCommands(usuarioResetado);
      await sock.replyText(id_chat, textMessage.admin.r.msgs.sucesso, message);
    } else {
      await sock.replyText(id_chat, textMessage.admin.r.msgs.nao_registrado, message);
    }
  },
};

export default command;
