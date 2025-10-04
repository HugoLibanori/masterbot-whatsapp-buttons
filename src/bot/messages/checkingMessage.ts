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

    const msgGuide = !args?.length ? false : args[0].toLocaleLowerCase() === 'guia';

    if (msgGuide) {
      const guide = await commandGuide(sock, dataBot, commandName, cmd);
      await sock.sendText(id_chat, guide);
      return;
    }

    logCommand(command, pushName ?? 'Desconhecido', group_name, isGroup!);

    return await runCommand(cmd, sock, message, messageContent, args ?? [], dataBot);
  } else {
    if (autostickerpv || autostickergp) {
      return await autoSticker(sock, message, messageContent, dataBot);
    }
  }
};
