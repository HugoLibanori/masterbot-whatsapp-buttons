import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'novotipo',
  description: 'Cria um novo tipo de usuário.',
  category: 'owner',
  aliases: ['novotipo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, textReceived } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let [userType, titleType, commandsType] = command.split(',').map((arg) => {
      return arg.trim();
    });
    if (!userType || !titleType || !commandsType)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    if (Number(commandsType) !== -1 && (isNaN(Number(commandsType)) || Number(commandsType) < 10))
      return await sock.replyText(id_chat, textMessage.admin.novotipo.msgs.erro_comandos, message);
    const sucesso = await botController.addUserType(
      dataBot,
      userType,
      titleType,
      Number(commandsType),
    );
    if (sucesso)
      await sock.replyText(
        id_chat,
        createText(
          textMessage.admin.novotipo.msgs.sucesso_criacao,
          userType.toLowerCase().replaceAll(' ', ''),
          titleType,
          Number(commandsType) == -1 ? 'Sem limite' : commandsType,
        ),
        message,
      );
    else await sock.replyText(id_chat, textMessage.admin.novotipo.msgs.erro_criacao, message);
  },
};

export default command;
