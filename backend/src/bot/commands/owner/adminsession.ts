import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, Command, Bot } from '../../../interfaces/index.js';
import * as userSessionController from '../../controllers/UserController.js';

const command: Command = {
  name: 'adminsession',
  description: 'Define o dono de uma sessão específica.',
  category: 'owner',
  aliases: ['adminsession', 'donosessao'],
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

      // ✅ FORMATO CORRETO:
      // !adminsession cliente1 5512999999999
      const sessionName = args[0];
      const number = args[1];

      if (!sessionName || !number) {
        await sock.replyText(
          id_chat,
          `❌ Uso correto:\n\n!adminsession cliente1 5512999999999`,
          message,
        );
        return;
      }

      const jid = number.replace(/\D/g, '') + '@s.whatsapp.net';

      // ✅ VERIFICA DONO DESSA SESSÃO
      const donoAtual = await userSessionController.getOwnerBySession(sessionName);

      if (donoAtual) {
        await sock.replyText(
          id_chat,
          `⚠️ *A sessão ${sessionName} já possui dono!*\n\n👑 Atual: @${donoAtual.replace('@s.whatsapp.net', '')}`,
          message,
        );
        return;
      }

      // ✅ REGISTRA DONO NO BD_DADOS_cliente
      await userSessionController.registerOwnerBySession(sessionName, jid);

      await sock.replyText(
        id_chat,
        `✅ *Dono definido com sucesso!*\n\n📌 Sessão: *${sessionName}*\n👑 Dono: @${jid.replace('@s.whatsapp.net', '')}`,
        message,
      );
    } catch (err) {
      console.error('Erro no comando adminsession:', err);
      if (id_chat) {
        await sock.replyText(id_chat, '❌ Erro ao definir o dono da sessão.', message);
      }
    }
  },
};

export default command;
