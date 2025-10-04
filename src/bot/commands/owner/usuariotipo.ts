import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'usuariotipo',
  description: 'Converte um usuário para o tipo enviado.',
  category: 'owner',
  aliases: ['usuariotipo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      command,
      textReceived,
      quotedMsg,
      contentQuotedMsg,
      grupo: { mentionedJid },
    } = messageContent;

    let botInfo = dataBot;
    const numberOwner = await userController.getOwner();

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let [userType, changedUser] = args;
    if (quotedMsg) changedUser = contentQuotedMsg.sender;
    else if (mentionedJid.length === 1) changedUser = mentionedJid[0];
    else if (args.length === 2) changedUser = changedUser.replace(/\W+/g, '') + '@s.whatsapp.net';
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);
    if (numberOwner === changedUser)
      return await sock.replyText(id_chat, textMessage.admin.usuariotipo.msgs.tipo_dono, message);
    let c_registrado = await userController.getUser(changedUser);
    if (c_registrado) {
      let alterou = await userController.alterarTipoUsuario(
        changedUser,
        userType.toLowerCase(),
        botInfo,
      );
      if (!alterou)
        return await sock.replyText(
          id_chat,
          textMessage.admin.usuariotipo.msgs.tipo_invalido,
          message,
        );
      await sock.replyText(
        id_chat,
        createText(textMessage.admin.usuariotipo.msgs.sucesso, userType.toUpperCase()),
        message,
      );
    } else {
      await sock.replyText(id_chat, textMessage.admin.usuariotipo.msgs.nao_registrado, message);
    }
  },
};

export default command;
