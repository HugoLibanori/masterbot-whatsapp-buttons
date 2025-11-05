import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'viadometro',
  description: 'Modo diversão.',
  category: 'users',
  aliases: ['viadometro'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
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
    const {
      id_chat,
      isGroup,
      quotedMsg,
      contentQuotedMsg,
      grupo: { mentionedJid },
      command,
    } = messageContent;
    const botInfo = dataBot;
    const numberOwner = await userController.getOwner();

    try {
      if (!isGroup)
        return await sock.replyText(id_chat, textMessage.outros.permissao.grupo, message);
      if (!quotedMsg && mentionedJid.length == 0)
        return await sock.replyText(id_chat, commandErrorMsg(command), message);
      if (mentionedJid.length > 1)
        return await sock.replyText(
          id_chat,
          textMessage.diversao.viadometro.msgs.apenas_um,
          message,
        );
      let respostas = textMessage.diversao.viadometro.msgs.respostas;
      let indexAleatorio = Math.floor(Math.random() * respostas.length),
        idResposta = null,
        alvo = null;
      if (mentionedJid.length == 1) {
        idResposta = message;
        alvo = mentionedJid[0];
      } else {
        idResposta = contentQuotedMsg.message;
        alvo = contentQuotedMsg.sender;
      }
      if (numberOwner === alvo) indexAleatorio = 0;
      let respostaTexto = createText(
        textMessage.diversao.viadometro.msgs.resposta,
        respostas[indexAleatorio],
      );
      await sock.replyText(id_chat, respostaTexto, idResposta!);
    } catch (err) {
      console.log(err);
    }
  },
};

export default command;
