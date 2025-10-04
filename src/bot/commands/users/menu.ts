import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import * as menu from '../../../utils/menu.js';
import { createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'menu',
  description: 'Mostra o menu do bot.',
  category: 'users',
  aliases: ['menu', 'help', 'ajuda'],
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, pushName, isGroup, textReceived, grupo, sender } = messageContent;
    const { isAdmin } = grupo ?? {};
    const dataUser = await userController.getUser(sender!);
    const tipo = dataUser?.tipo as 'comum' | 'premium' | 'vip' | 'dono' | undefined;
    const prefix = dataBot.prefix?.trim() ?? '';
    const nameUser = pushName;
    const totalCommands = String(dataUser?.comandos_total);
    const warning = String(dataUser?.advertencia ?? '');

    const limiteTipo = tipo && dataBot.limite_diario?.limite_tipos?.[tipo];
    const typeUser = limiteTipo?.titulo ?? '';
    const maxCommandsDay = limiteTipo?.comandos ?? 'Sem limite';

    let responseData = '';

    if (dataBot.limite_diario?.status) {
      responseData = createText(
        isGroup
          ? textMessage.info.menu.msgs.resposta_limite_diario_grupo
          : textMessage.info.menu.msgs.resposta_limite_diario,
        nameUser!,
        String(dataUser?.comandos_dia),
        String(maxCommandsDay),
        typeUser,
        totalCommands,
        ...(isGroup ? [warning] : []),
      );
    } else {
      responseData = createText(
        isGroup
          ? textMessage.info.menu.msgs.resposta_comum_grupo
          : textMessage.info.menu.msgs.resposta_comum,
        nameUser!,
        typeUser,
        totalCommands,
        ...(isGroup ? [warning] : []),
      );
    }

    responseData += '⧖───────────────⧗\n';

    const defaultButtons: types.MyButtons['buttons'] = Array.from({ length: 5 }, (_, i) => ({
      buttonId: `menu${i + 1}_${id_chat}`,
      buttonText: { displayText: `${prefix}menu ${i + 1}` },
    }));

    const baseOptions: types.MyButtons = {
      footer: 'Digite ou aperte o botão desejado.',
      buttons: defaultButtons,
    };

    const singleButton = {
      buttons: [
        {
          buttonId: `menu_${id_chat}`,
          buttonText: { displayText: `${prefix}menu` },
        },
      ],
      footer: 'Digite o comando desejado.',
    };

    const menus = {
      '1': menu.menuFigurinhas,
      '2': menu.menuUtilidades,
      '3': menu.menuDownload,
      '4': () => (isGroup ? menu.menuGrupo(isAdmin!) : null),
      '5': () => menu.menuDiversao(isGroup!),
    };

    if (!args.length) {
      baseOptions.text = responseData + menu.menuPrincipal();
      await sock.sendButtons(id_chat, baseOptions);
      return;
    }

    let submenu: (() => string | null) | undefined;

    if (textReceived in menus) {
      submenu = menus[textReceived as keyof typeof menus];
    }
    if (!submenu) {
      await sock.sendText(id_chat, '❌ Opção de menu inválida.');
      return;
    }

    if (textReceived === '4' && !isGroup) {
      await sock.sendText(id_chat, textMessage.outros.permissao.grupo);
      return;
    }

    const responseMenu = submenu();
    const finalOptions = {
      ...singleButton,
      text: responseData + responseMenu,
    };

    await sock.sendButtons(id_chat, finalOptions);
  },
};

export default command;
