import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'meuref',
  description: 'Mostra seu código de convite (referral).',
  category: 'users',
  aliases: ['meuref', 'referral', 'convite'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, sender, pushName } = messageContent;
    if (!dataBot.xp?.status) {
      return await sock.sendText(
        id_chat,
        `❌ ${pushName || 'Você'}, o sistema de XP está desativado no momento.`,
      );
    }
    if (!sender) return;

    const code = Buffer.from(sender).toString('base64url');

    const texto = [
      `👤 ${pushName || 'Você'}`,
      `Seu código de convite: ${code}`,
      '',
      `Compartilhe com amigos. Quando eles usarem:`,
      `- Você ganha XP turbinado`,
      `- Eles entram já prontos para usar o bot`,
      '',
      `Para usar o código: ${dataBot.prefix || '!'}usaref ${code}`,
    ].join('\n');

    await sock.sendText(id_chat, texto);
    return;
  },
};

export default command;
