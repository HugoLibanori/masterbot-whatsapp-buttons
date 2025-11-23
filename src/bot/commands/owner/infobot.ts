import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText, timestampForData } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'infobot',
  description: 'Mostra informações do bot',
  category: 'owner',
  aliases: ['infobot'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, numberBot } = messageContent;
    const { name_admin: nome_adm, name: nome_bot, started, prefix } = dataBot;

    const expirationDailyLimit = timestampForData(dataBot.limite_diario!.expiracao * 1000);
    const botInitializationData = timestampForData(started!);
    const usersBlocked = await sock.getBlockedContacts();
    const numberOwner = await userController.getOwner();

    let resposta = createText(
      textMessage.admin.infobot.msgs.resposta_superior,
      nome_adm!.trim(),
      nome_bot!.trim(),
      botInitializationData!.toString(),
    );
    // AUTO-STICKER
    resposta += dataBot.autosticker
      ? textMessage.admin.infobot.msgs.resposta_variavel.autosticker.on
      : textMessage.admin.infobot.msgs.resposta_variavel.autosticker.off;
    // PV LIBERADO
    resposta += dataBot.commands_pv
      ? textMessage.admin.infobot.msgs.resposta_variavel.pvliberado.on
      : textMessage.admin.infobot.msgs.resposta_variavel.pvliberado.off;
    // XP LIBERADO
    resposta += dataBot.xp?.status
      ? textMessage.admin.infobot.msgs.resposta_variavel.xp.on
      : textMessage.admin.infobot.msgs.resposta_variavel.xp.off;
    // LIMITE COMANDOS DIARIO
    resposta += dataBot.limite_diario?.status
      ? createText(
          textMessage.admin.infobot.msgs.resposta_variavel.limite_diario.on,
          expirationDailyLimit,
        )
      : textMessage.admin.infobot.msgs.resposta_variavel.limite_diario.off;
    // LIMITE COMANDOS POR MINUTO
    resposta += dataBot.command_rate?.status
      ? createText(
          textMessage.admin.infobot.msgs.resposta_variavel.taxa_comandos.on,
          dataBot.command_rate.max_cmds_minute.toString(),
          dataBot.command_rate.block_time.toString(),
        )
      : textMessage.admin.infobot.msgs.resposta_variavel.taxa_comandos.off;
    // BLOQUEIO DE COMANDOS
    const comandosBloqueados = [];
    for (const comandoBloqueado of dataBot.block_cmds!) {
      comandosBloqueados.push(comandoBloqueado);
    }
    resposta +=
      dataBot.block_cmds!.length != 0
        ? createText(
            textMessage.admin.infobot.msgs.resposta_variavel.bloqueiocmds.on,
            comandosBloqueados.toString(),
          )
        : textMessage.admin.infobot.msgs.resposta_variavel.bloqueiocmds.off;
    if (!numberOwner) return;
    resposta += createText(
      textMessage.admin.infobot.msgs.resposta_inferior,
      usersBlocked.length.toString(),
      dataBot.executed_cmds!.toString(),
      typeof numberOwner === 'string' ? numberOwner.replace('@s.whatsapp.net', '') : '',
    );

    await sock
      .getImagePerfil(numberBot)
      .then(async (fotoBot) => {
        await sock.replyFileUrl(typeMessages.IMAGE, id_chat, fotoBot!, resposta, message);
      })
      .catch(async () => {
        await sock.replyText(id_chat, resposta, message);
      });
  },
};

export default command;
