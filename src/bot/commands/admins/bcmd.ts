import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'bcmd',
  description: 'Bloqueia um ou varios comandos no grupo.',
  category: 'admins',
  aliases: ['bcmd'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const userCommands = textReceived.split(' ').map((x) => x.trim());
    const respostaBloqueio = await grupoController.blockCommands(id_grupo, userCommands, dataBot);

    if (respostaBloqueio) await sock.replyText(id_chat, respostaBloqueio, message);
  },
};

export default command;
