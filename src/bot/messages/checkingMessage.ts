import * as types from '../../types/BaileysTypes/index.js';
import { checkPermission } from '../messages/checkPermission.js';
import commands from '../commands/index.js';
import { MessageContent, Bot } from '../../interfaces/index.js';
import {
  escapeRegex,
  runCommand,
  commandGuide,
  autoSticker,
  logCommand,
  checkCommandExists,
} from '../../utils/utils.js';
import { ISocket } from '../../types/MyTypes/index.js';
import { typeMessages } from './contentMessage.js';
import { BotData } from '../../configs/configBot/BotData.js';
import * as userController from '../controllers/UserController.js';
import { verificarCooldown } from '../../utils/cooldownUtils.js';
// XP adicionado de forma assíncrona e dinâmica para não travar o fluxo

export const checkingMessage = async (
  sock: ISocket,
  message: types.MyWAMessage,
  messageContent: MessageContent,
) => {
  const {
    id_chat,
    command,
    args,
    type,
    grupo: {
      dataBd: { autosticker },
      name: group_name,
    },
    isGroup,
    pushName,
    sender,
  } = messageContent;

  const dataBot: Partial<Bot> = BotData.get() || {};

  if (!dataBot.prefix) return;

  const prefix = dataBot.prefix;
  const commandExists = await checkCommandExists(dataBot, command);

  const autostickerpv =
    !isGroup && (type === typeMessages.IMAGE || type === typeMessages.VIDEO) && dataBot.autosticker;

  const autostickergp =
    isGroup && (type === typeMessages.IMAGE || type === typeMessages.VIDEO) && autosticker;

  if (commandExists || commandExists === 'protegido') {
    if (!command.startsWith(prefix)) return;

    const commandName = command.toLowerCase().replace(new RegExp('^' + escapeRegex(prefix)), '');
    const cmd = Array.from(commands.values()).find((c) => c.aliases.includes(commandName));
    if (!cmd) return;

    const permission = await checkPermission(sock, message, cmd, messageContent, dataBot);
    if (!permission) return;

    // Se pediu "guia"
    const msgGuide = !args?.length ? false : args[0].toLocaleLowerCase() === 'guia';
    if (msgGuide) {
      const guide = await commandGuide(sock, dataBot, commandName, cmd);
      await sock.sendText(id_chat, guide);
      return;
    }

    if (sender) {
      const userData = await userController.getUser(sender);
      const tipo = userData?.tipo || 'comum';

      const permitido = await verificarCooldown(sock, sender, tipo, pushName!, id_chat);

      if (!permitido) return;
    }

    logCommand(command, pushName ?? 'Desconhecido', group_name, isGroup!);

    await runCommand(cmd, sock, message, messageContent, args ?? [], dataBot);

    if (sender) {
      setImmediate(async () => {
        try {
          const { XPService } = await import('../../services/XPService.js');
          const res: any = await XPService.addEvent(sender, 'interaction');
          if (res?.changed && id_chat) {
            const { xpRules } = await import('../../configs/xp/xpRules.js');
            const order = xpRules.tiers.map((t) => t.name);
            const idxOld = order.indexOf(res.oldTier);
            const idxNew = order.indexOf(res.newTier);
            const up = idxNew > idxOld;
            const arrow = up ? '⬆️' : '⬇️';
            const msg = up
              ? `Parabéns @${sender.replace('@s.whatsapp.net', '')}! Você subiu para ${String(res.newTier).toUpperCase()}!`
              : `Atenção @${sender.replace('@s.whatsapp.net', '')}, seu tier mudou para ${String(res.newTier).toUpperCase()}.`;
            await sock.sendTextWithMentions(id_chat, `${arrow} ${msg}`, [sender]);
          }
        } catch {}
      });
    }
    return;
  } else {
    if (autostickerpv || autostickergp) {
      return await autoSticker(sock, message, messageContent, dataBot);
    }
  }
};
