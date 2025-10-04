import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'bcgrupos',
  description: 'Manda uma mensagem broadcast para todos os grupo que o bot estiver.',
  category: 'owner',
  aliases: ['bcgrupos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, textReceived, command } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let announcementMessage = textReceived,
      Currentgroups = await grupoController.getAllGroups();
    await sock.replyText(
      id_chat,
      createText(
        textMessage.admin.bcgrupos.msgs.espera,
        Currentgroups.length.toString(),
        Currentgroups.length.toString(),
      ),
      message,
    );
    for (let grupo of Currentgroups) {
      if (!grupo.restrito_msg) {
        await new Promise((resolve) => {
          setTimeout(async () => {
            await sock.sendText(
              grupo.id_grupo,
              createText(textMessage.admin.bcgrupos.msgs.anuncio, announcementMessage),
            );
            resolve({});
          }, 1000);
        });
      }
    }
    await sock.replyText(id_chat, textMessage.admin.bcgrupos.msgs.bc_sucesso, message);
  },
};

export default command;
