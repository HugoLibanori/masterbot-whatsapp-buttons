import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'tester',
  description: 'Gerencia a lista de números autorizados para testar o bot no PV (Whitelist).',
  category: 'owner',
  aliases: ['tester', 'testador'],
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
    const { id_chat, sender } = messageContent;

    if (!args.length || args[0].toLowerCase() === 'list') {
      const testers = await botController.getTesters();
      if (!testers.length) {
        await sock.replyText(id_chat, '📝 A lista de testadores está vazia.', message);
        return;
      }
      let msg = '📝 *Lista de Testadores:* \n\n';
      testers.forEach((t, i) => {
        msg += `${i + 1}. @${t.split('@')[0]}\n`;
      });
      await sock.sendTextWithMentions(id_chat, msg, testers);
      return;
    }

    const action = args[0].toLowerCase();
    let target = args[1];

    if (!target && message.message?.extendedTextMessage?.contextInfo?.participant) {
        target = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!target) {
      await sock.replyText(id_chat, '❌ Você precisa informar um número ou marcar a mensagem de alguém.', message);
      return;
    }

    // Limpa o número
    const cleanNumber = target.replace(/\D/g, '');
    const jid = cleanNumber.includes('@s.whatsapp.net') ? cleanNumber : `${cleanNumber}@s.whatsapp.net`;

    if (action === 'add') {
      const added = await botController.addTester(jid);
      if (added) {
        await sock.replyText(id_chat, `✅ Usuário @${cleanNumber} adicionado à lista de testadores!`, message);
      } else {
        await sock.replyText(id_chat, `⚠️ Este usuário já está na lista ou ocorreu um erro.`, message);
      }
    } else if (action === 'remove' || action === 'del') {
      const removed = await botController.removeTester(jid);
      if (removed) {
        await sock.replyText(id_chat, `🗑️ Usuário @${cleanNumber} removido da lista de testadores.`, message);
      } else {
        await sock.replyText(id_chat, `⚠️ Este usuário não está na lista.`, message);
      }
    } else {
        await sock.replyText(id_chat, '❌ Ação inválida. Use `add`, `remove` ou `list`.', message);
    }
  },
};

export default command;
