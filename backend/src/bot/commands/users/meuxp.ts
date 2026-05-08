import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { XPService } from '../../../services/XPService.js';
import * as userController from '../../controllers/UserController.js';
import { xpRules } from '../../../configs/xp/xpRules.js';
import { ensureXpConfigLoaded } from '../../../services/XPConfigService.js';

const command: Command = {
  name: 'meuxp',
  description: 'Mostra seu XP total, XP dos últimos 30 dias e seu tier atual.',
  category: 'users',
  aliases: ['meuxp', 'perfil', 'rank'],
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

    await XPService.init(sock.session_name); // garante tabela

    const user = await userController.getUser(sender);
    const currentTier = user?.tipo || 'comum';

    if (currentTier === 'dono') {
      await sock.sendText(
        id_chat,
        `👑 ${pushName || 'Você'} é o DONO do bot.\nSeu tier é: DONO\nXP não é necessário para você.`,
      );
      return;
    }

    await ensureXpConfigLoaded();

    const total = await XPService.getTotalXP(sock.session_name, sender);
    const last30 = await XPService.getLast30DaysXP(sock.session_name, sender);

    const tiers = [...xpRules.tiers].sort((a, b) => a.minTotal - b.minTotal);
    const currentIndex = tiers.findIndex((t) => t.name === currentTier);
    const next = tiers[Math.min(currentIndex + 1, tiers.length - 1)];

    let progressMsg = '';
    if (next && next.name !== currentTier) {
      const needTotal = Math.max(0, next.minTotal - total);
      const needMaintain = Math.max(0, next.maintainLast30 - last30);
      progressMsg = `\nPróximo tier: ${next.name.toUpperCase()}\n- Falta ${needTotal} XP total\n- Precisará de ${needMaintain} XP nos últimos 30 dias`;
    } else {
      progressMsg = '\nVocê já está no maior tier!';
    }

    await sock.sendText(
      id_chat,
      `👤 ${pushName || 'Você'}\nTier atual: ${currentTier.toUpperCase()}\nXP total: ${total}\nXP (30 dias): ${last30}${progressMsg}`,
    );

    return;
  },
};

export default command;
