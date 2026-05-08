import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, Command, Bot } from '../../../interfaces/index.js';
import { addDaysToSession } from '../../controllers/BotLicenseController.js';

const command: Command = {
  name: 'adddias',
  description: 'Adiciona dias à validade de uma sessão.',
  category: 'owner',
  aliases: ['adddias', 'renovarsessao'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  onlyMaster: true,

  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent,
    args,
    dataBot: Partial<Bot>,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;

    try {
      if (!id_chat) return;

      // ✅ Uso correto:
      // !adddias cliente1 30
      const sessionName = args[0];
      const dias = Number(args[1]);

      if (!sessionName || !dias) {
        await sock.replyText(id_chat, `❌ Uso correto:\n\n!adddias cliente1 30`, message);
        return;
      }

      const novaData = await addDaysToSession(sessionName, dias);

      await sock.replyText(
        id_chat,
        `✅ *Sessão renovada com sucesso!*\n\n📌 Sessão: *${sessionName}*\n📆 Nova validade: *${novaData.toLocaleDateString('pt-BR')}*`,
        message,
      );
    } catch (err) {
      console.error('Erro no comando adddias:', err);
      if (id_chat) {
        await sock.replyText(id_chat, '❌ Erro ao renovar a sessão.', message);
      }
    }
  },
};

export default command;
