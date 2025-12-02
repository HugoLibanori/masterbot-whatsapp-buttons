import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText, ramdomDelay } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'bcusers',
  description: 'Manda uma mensagem broadcast para todos os contatos que o bot estiver.',
  category: 'owner',
  aliases: ['bcusers', 'bccontatos', 'bcu'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      currentUsers = await userController.getAllUsers();
    await sock.replyText(
      id_chat,
      createText(
        textMessage.admin.bcusers.msgs.espera,
        currentUsers.length.toString(),
        currentUsers.length.toString(),
      ),
      message,
    );

    // --- Broadcast (testing) : send individually to the first 8 recipients ---
    const recipients = currentUsers;

    let sent = 0;
    let failed = 0;

    for (const target of recipients) {
      try {
        // send DM to each target
        await sock.sendTextBroadcast(target, announcementMessage);
        sent++;
      } catch (err) {
        console.warn('[bcusers] falha ao enviar para', target, err);
        failed++;
      }
      // small random delay between sends to avoid burst/rate-limits
      await ramdomDelay(700, 3000);
    }

    // report summary
    await sock.replyText(id_chat, textMessage.admin.bcusers.msgs.bc_sucesso, message);
  },
};

export default command;
