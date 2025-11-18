import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'dcmd',
  description: 'Desbloqueia um ou vários comandos no grupo.',
  category: 'admins',
  aliases: ['dcmd'],
  group: true,
  admin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, grupo, command, textReceived } = messageContent;
    const { id_group: id_grupo, dataBd } = { ...grupo };

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);

    const comandosParaDesbloquear = textReceived.split(' ').map((x) => x.trim());
    const respostaDesbloqueio = await grupoController.unblockCommands(
      id_grupo,
      comandosParaDesbloquear,
      dataBot,
    );

    if (respostaDesbloqueio) {
      await sock.replyText(id_chat, respostaDesbloqueio, message);
    }
  },
};

export default command;
