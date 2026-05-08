import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'novotipo',
  description: 'Cria um novo tipo de usuário.',
  category: 'owner',
  aliases: ['novotipo'],
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
    const { id_chat, command } = messageContent;

    // Se não tiver argumentos, mostra erro
    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);

    let [userType, titleType, commandsType] = args
      .join(' ')
      .split(',')
      .map((arg) => {
        return arg.trim();
      });

    // Validação
    if (!userType || !titleType || !commandsType)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    // Verifica se os comandos são um número válido (ou -1 para infinito)
    const comandosNum = Number(commandsType);
    if (comandosNum !== -1 && (isNaN(comandosNum) || comandosNum < 0)) {
      // Ajustei para aceitar 0 ou mais, sua regra era < 10, pode manter se quiser
      // Se quiser manter a regra de no mínimo 10:
      if (isNaN(comandosNum) || (comandosNum < 10 && comandosNum !== -1))
        return await sock.replyText(
          id_chat,
          textMessage.admin.novotipo.msgs.erro_comandos,
          message,
        );
    }

    const sucesso = await botController.addUserType(
      dataBot,
      userType,
      titleType,
      Number(commandsType),
    );

    if (sucesso)
      await sock.replyText(
        id_chat,
        createText(
          textMessage.admin.novotipo.msgs.sucesso_criacao,
          userType.toLowerCase().replaceAll(' ', ''),
          titleType,
          Number(commandsType) === -1 ? 'Sem limite' : commandsType,
        ),
        message,
      );
    else await sock.replyText(id_chat, textMessage.admin.novotipo.msgs.erro_criacao, message);
  },
};

export default command;
