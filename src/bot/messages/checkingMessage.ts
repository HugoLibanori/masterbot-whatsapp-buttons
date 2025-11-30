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
import { verificarCooldown, verificarAutoReplyCooldown } from '../../utils/cooldownUtils.js';
import { XPEventType } from '../../configs/xp/xpRules.js';

export const checkingMessage = async (
  sock: ISocket,
  message: types.MyWAMessage,
  messageContent: MessageContent,
) => {
  // ------------------------------
  // 1. Desestruturação inicial
  // ------------------------------
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

  // ------------------------------
  // 2. Carrega dados do bot
  // ------------------------------
  const dataBot: Partial<Bot> = BotData.get() || {};
  if (!dataBot.prefix) return;

  const prefix = dataBot.prefix;

  // ------------------------------
  // 3. Checa existência do comando
  // ------------------------------
  const commandExists = await checkCommandExists(dataBot, command);

  // ------------------------------
  // 4. Pré-validação de autosticker
  // ------------------------------
  const isMedia = type === typeMessages.IMAGE || type === typeMessages.VIDEO;

  const autostickerpv = !isGroup && isMedia && dataBot.autosticker;

  const autostickergp = isGroup && isMedia && autosticker;

  // ======================================================
  // =============== 5. SE O COMANDO EXISTE ===============
  // ======================================================
  if (commandExists.exists) {
    // Prefixo errado → sai
    if (!command.startsWith(prefix)) return;

    // Normaliza comando removendo prefixo
    const commandName = command.toLowerCase().replace(new RegExp('^' + escapeRegex(prefix)), '');

    // Procura comando nos aliases
    const cmd = Array.from(commands.values()).find((c) => c.aliases.includes(commandName));
    if (!cmd) return;

    const permission = await checkPermission(sock, message, cmd, messageContent, dataBot);
    if (!permission) return;

    const msgGuide = args?.[0]?.toLowerCase() === 'guia';
    if (msgGuide) {
      const guide = await commandGuide(sock, dataBot, commandName, cmd);
      await sock.sendText(id_chat, guide);
      return;
    }

    if (sender) {
      const userData = await userController.getUser(sender);
      const tipo = userData?.tipo || 'comum';

      const permitido = await verificarCooldown(sock, sender, tipo, pushName ?? '', id_chat!);
      if (!permitido) return;
    }

    logCommand(command, pushName ?? 'Desconhecido', group_name, isGroup!);

    await runCommand(cmd, sock, message, messageContent, args ?? [], dataBot);

    if (sender && dataBot.xp?.status && commandName !== 's') {
      await addXpForInteraction(sender, id_chat, sock);
    }

    return;
  }

  // Autosticker fora de comandos
  if (autostickerpv || autostickergp) {
    if (sender && dataBot.xp?.status) {
      await addXpForInteraction(sender, id_chat, sock, 'sticker_create');
    }
    return await autoSticker(sock, message, messageContent, dataBot);
  }

  // Auto-responder no PV: se não for comando e PV estiver liberado, enviar menu
  if (!isGroup && dataBot.commands_pv) {
    // se a mensagem começa com o prefixo e não é um comando existente, ignore (não auto-responder)
    if (!command.startsWith(dataBot.prefix ?? '')) {
      const menuCmd = Array.from(commands.values()).find((c) => c.name === 'menu');
      if (menuCmd) {
        // checa cooldown específico para auto-reply (configurável via dataBot.autoReplyCooldownSeconds em segundos)
        if (sender) {
          const autoReplySeconds = Number(dataBot.auto_reply_cooldown_seconds ?? 86400);

          // consulta último auto-reply persistido no BD para não perder o estado entre reinícios
          const last = await userController.getLastAutoReplyAt(sender);
          if (last) {
            const elapsed = Date.now() - new Date(last).getTime();
            if (elapsed < autoReplySeconds * 1000) return;
          }

          // checa cache em memória para evitar I/O de DB para cada mensagem
          const permitidoAutoReply = verificarAutoReplyCooldown(sender, autoReplySeconds);
          if (!permitidoAutoReply) return;
        }

        await runCommand(menuCmd, sock, message, messageContent, [], dataBot);
        if (sender && dataBot.xp?.status) await addXpForInteraction(sender, id_chat, sock);

        // persiste o instante do auto-reply no BD para sobreviver a reinícios
        if (sender) {
          try {
            await userController.setLastAutoReplyAt(sender, new Date());
          } catch {}
        }
      }
    }
  }
};

async function addXpForInteraction(
  sender: string,
  id_chat: string | undefined,
  sock: ISocket,
  event: string = 'interaction',
) {
  setImmediate(async () => {
    try {
      const { XPService } = await import('../../services/XPService.js');
      const res: any = await XPService.addEvent(sender, event as XPEventType);

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
