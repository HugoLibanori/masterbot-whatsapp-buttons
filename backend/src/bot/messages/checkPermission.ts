import * as types from '../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../interfaces/index.js';
import { ISocket } from 'types/MyTypes/MySocket.js';
import { commandInfo } from './messagesObj.js';
import * as userController from '../controllers/UserController.js';

export const checkPermission = async (
  sock: ISocket,
  message: types.MyWAMessage,
  cmd: Command,
  messageContent: MessageContent,
  dataBot: Partial<Bot>,
) => {
  const text = commandInfo();
  const { grupo, isGroup, isOwnerBot, sender, id_chat } = messageContent;
  const owner = await userController.getOwner();
  // ✅ ONLY MASTER (DONO DO SISTEMA)
  if (cmd.onlyMaster) {
    const isMaster = owner === sender;

    if (!isMaster) {
      if (id_chat) {
        await sock.sendText(id_chat, `🚫 Este comando é exclusivo do *DONO DO SISTEMA*.`);
      }
      return false;
    }
  }

  const { isAdmin, isBotAdmin } = grupo || {};

  const dataUser = await userController.getUser(sender);
  const tipo = (dataUser?.tipo ?? 'comum') as 'comum' | 'premium' | 'vip' | 'dono' | 'donosession';

  const ordem: Record<'comum' | 'premium' | 'vip' | 'dono' | 'donosession', number> = {
    comum: 1,
    premium: 2,
    vip: 3,
    donosession: 4,
    dono: 999,
  };

  const tipoUsuario = ordem[tipo];
  const tipoMinimo = cmd.minType ? ordem[cmd.minType] : 0;

  if (cmd.owner && !isOwnerBot) {
    if (id_chat) await sock.sendText(id_chat, text.outros.permissao.apenas_dono_bot);
    return false;
  }

  if (isGroup) {
    if (cmd.admin && !isAdmin) {
      if (id_chat) await sock.sendText(id_chat, text.outros.permissao.apenas_admin);
      return false;
    }
    if (cmd.isBotAdmin && !isBotAdmin) {
      if (id_chat) await sock.sendText(id_chat, text.outros.permissao.bot_admin);
      return false;
    }
  } else if (!isGroup) {
    if (cmd.group || cmd.admin) {
      if (id_chat) await sock.sendText(id_chat, text.outros.permissao.grupo);
      return false;
    }
  }

  // if (cmd.minType) {
  //   if (tipoUsuario < tipoMinimo) {
  //     if (id_chat) {
  //       await sock.sendText(
  //         id_chat,
  //         `❌ Este comando exige nível *${cmd.minType.toUpperCase()}*.\n` +
  //           `Seu nível atual: *${tipo.toUpperCase()}*.\n\nDigite ${dataBot.prefix}vantagens para saber mais.`,
  //       );
  //     }
  //     return false;
  //   }
  // }

  return true;
};
