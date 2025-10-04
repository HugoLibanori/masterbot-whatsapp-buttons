import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'tipocomandos',
  description: 'Altera a quantidade de comandos por cada tipo',
  category: 'owner',
  aliases: ['tipocomandos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command } = messageContent;

    const botInfo = dataBot;
    if (!botInfo.limite_diario?.status)
      return await sock.replyText(
        id_chat,
        textMessage.admin.tipocomandos.msgs.erro_limite_diario,
        message,
      );
    if (args.length < 2) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let [tipo, qtd] = args;
    if (Number(qtd) != -1)
      if (isNaN(Number(qtd)) || Number(qtd) < 5)
        return await sock.replyText(id_chat, textMessage.admin.tipocomandos.msgs.invalido, message);
    let alterou = await botController.changeUserTypeCommands(
      tipo.toLowerCase(),
      parseInt(qtd),
      botInfo,
    );
    if (!alterou)
      return await sock.replyText(
        id_chat,
        textMessage.admin.tipocomandos.msgs.tipo_invalido,
        message,
      );
    await sock.replyText(
      id_chat,
      createText(
        textMessage.admin.tipocomandos.msgs.sucesso,
        tipo.toUpperCase(),
        Number(qtd) == -1 ? '∞' : qtd,
      ),
      message,
    );
  },
};

export default command;
