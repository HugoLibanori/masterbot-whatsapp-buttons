import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'taxacomandos',
  description: 'Ativa e desativa o modo de taxação de comandos.',
  category: 'owner',
  aliases: ['taxacomandos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    const novoEstado = !dataBot.command_rate?.status;
    if (novoEstado) {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let [qtd_max_minuto, tempo_bloqueio] = args;
      if (!tempo_bloqueio) tempo_bloqueio = String(60);
      if (isNaN(Number(qtd_max_minuto)) || Number(qtd_max_minuto) < 3)
        return await sock.replyText(
          id_chat,
          textMessage.admin.taxacomandos.msgs.qtd_invalida,
          message,
        );
      if (isNaN(Number(tempo_bloqueio)) || Number(tempo_bloqueio) < 10)
        return await sock.replyText(
          id_chat,
          textMessage.admin.taxacomandos.msgs.tempo_invalido,
          message,
        );
      await botController.changeLimiter(
        dataBot,
        true,
        parseInt(qtd_max_minuto),
        parseInt(tempo_bloqueio),
      );
      await sock.replyText(id_chat, textMessage.admin.taxacomandos.msgs.ativado, message);
    } else {
      await botController.changeLimiter(dataBot, false);
      await sock.replyText(id_chat, textMessage.admin.taxacomandos.msgs.desativado, message);
    }
  },
};

export default command;
