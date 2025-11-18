import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'usuariotipo',
  description: 'Converte um usuário para o tipo enviado, podendo definir validade do plano.',
  category: 'owner',
  aliases: ['usuariotipo'],
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
    const { id_chat, command, quotedMsg, contentQuotedMsg, grupo } = messageContent;
    const mentioned = grupo?.mentionedJid ?? [];

    const numberOwner = await userController.getOwner();

    if (args.length < 1) {
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    }

    const userType = args[0].toLowerCase();
    const tiposValidos = ['comum', 'premium', 'vip'];

    if (!tiposValidos.includes(userType)) {
      return await sock.replyText(
        id_chat,
        textMessage.admin.usuariotipo.msgs.tipo_invalido,
        message,
      );
    }

    let diasPlano = 0;

    const numeros = args.slice(1).filter((v) => /^\d+$/.test(v));

    if (numeros.length > 0) {
      const ultimo = numeros[numeros.length - 1];
      const n = Number(ultimo);

      if (n > 0 && n <= 3650) {
        diasPlano = n;
      }
    }

    let changedUser: string | undefined;

    if (quotedMsg) {
      changedUser = contentQuotedMsg.sender;
    } else if (mentioned.length === 1) {
      changedUser = mentioned[0];
    } else {
      const rawNumber = args.slice(1).find((v) => v.length >= 8 && /^\d+$/.test(v));

      if (rawNumber) {
        changedUser = rawNumber.replace(/\D+/g, '') + '@s.whatsapp.net';
      }
    }

    if (!changedUser) {
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    }

    if (numberOwner === changedUser) {
      return await sock.replyText(id_chat, textMessage.admin.usuariotipo.msgs.tipo_dono, message);
    }

    const c_registrado = await userController.getUser(changedUser);
    if (!c_registrado) {
      return await sock.replyText(
        id_chat,
        textMessage.admin.usuariotipo.msgs.nao_registrado,
        message,
      );
    }

    try {
      if (userType === 'comum') {
        await userController.changeUserType(changedUser, 'comum');
      } else {
        await userController.setUserPlan(changedUser, userType as 'premium' | 'vip', diasPlano);
      }

      const msg =
        userType === 'comum'
          ? `✅ Usuário redefinido para *COMUM*.`
          : diasPlano > 0
            ? `✅ Usuário atualizado para *${userType.toUpperCase()}* com validade de ${diasPlano} dias.`
            : `✅ Usuário atualizado para *${userType.toUpperCase()}* sem validade definida.`;

      await sock.replyText(id_chat, createText(msg), message);
    } catch (err) {
      console.error(err);
      await sock.replyText(
        id_chat,
        '❌ Ocorreu um erro ao tentar alterar o tipo do usuário.',
        message,
      );
    }
  },
};

export default command;
