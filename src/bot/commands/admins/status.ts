import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'status',
  description: 'Mostra o status do grupo.',
  category: 'admins',
  aliases: ['status', 'stt'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { grupo, id_chat } = messageContent;
    const { dataBd, id_group } = { ...grupo };

    let expiracao = await grupoController.getGroupExpiration(id_group);
    let resposta = textMessage.grupo.status.msgs.resposta_titulo;

    // Expiração
    resposta += createText(
      textMessage.grupo.status.msgs.resposta_variavel.expiracao,
      expiracao?.expiracao ? expiracao?.expiracao : 'Sem Limite',
    );
    //Bem-vindo
    resposta += dataBd.bemvindo?.status
      ? textMessage.grupo.status.msgs.resposta_variavel.bemvindo.on
      : textMessage.grupo.status.msgs.resposta_variavel.bemvindo.off;
    //Mutar
    resposta += dataBd.mutar
      ? textMessage.grupo.status.msgs.resposta_variavel.mutar.on
      : textMessage.grupo.status.msgs.resposta_variavel.mutar.off;
    //Auto-Sticker
    resposta += dataBd.autosticker
      ? textMessage.grupo.status.msgs.resposta_variavel.autosticker.on
      : textMessage.grupo.status.msgs.resposta_variavel.autosticker.off;
    //Anti-Link
    let al_filtros = '';
    if (dataBd.antilink?.filtros?.instagram)
      al_filtros += textMessage.grupo.status.msgs.resposta_variavel.antilink.filtros.instagram;
    if (dataBd.antilink?.filtros?.facebook)
      al_filtros += textMessage.grupo.status.msgs.resposta_variavel.antilink.filtros.facebook;
    if (dataBd.antilink?.filtros?.youtube)
      al_filtros += textMessage.grupo.status.msgs.resposta_variavel.antilink.filtros.youtube;
    if (dataBd.antilink?.filtros?.tiktok)
      al_filtros += textMessage.grupo.status.msgs.resposta_variavel.antilink.filtros.tiktok;

    resposta += dataBd.antilink?.status
      ? createText(textMessage.grupo.status.msgs.resposta_variavel.antilink.on, al_filtros)
      : textMessage.grupo.status.msgs.resposta_variavel.antilink.off;
    //Anti-Porno
    resposta += dataBd.antiporno.status
      ? createText(
          textMessage.grupo.status.msgs.resposta_variavel.antiporno.on,
          dataBd.antiporno.time?.start || 'Sem Limite',
          dataBd.antiporno.time?.end || 'Sem Limite',
        )
      : textMessage.grupo.status.msgs.resposta_variavel.antiporno.off;
    //Anti-fake
    resposta += dataBd.antifake?.status
      ? createText(
          textMessage.grupo.status.msgs.resposta_variavel.antifake.on,
          String(dataBd.antifake?.ddi_liberados),
        )
      : textMessage.grupo.status.msgs.resposta_variavel.antifake.off;
    //Anti-flood
    resposta += dataBd.antiflood?.status
      ? createText(
          textMessage.grupo.status.msgs.resposta_variavel.antiflood.on,
          String(dataBd.antiflood.max),
          String(dataBd.antiflood.intervalo),
        )
      : textMessage.grupo.status.msgs.resposta_variavel.antiflood.off;
    //OpenAi
    resposta += dataBd.openai?.status
      ? textMessage.grupo.status.msgs.resposta_variavel.openai.on
      : textMessage.grupo.status.msgs.resposta_variavel.openai.off;
    //Contador
    resposta += dataBd.contador?.status
      ? createText(
          textMessage.grupo.status.msgs.resposta_variavel.contador.on,
          dataBd.contador?.inicio ?? '',
        )
      : textMessage.grupo.status.msgs.resposta_variavel.contador.off;
    //Bloqueio de CMDS
    const comandosBloqueados: string[] = [];
    for (const comandoBloqueado of dataBd.block_cmds ?? '') {
      comandosBloqueados.push(comandoBloqueado);
    }

    const comandosFormatados = comandosBloqueados.map((cmd) => `- *${cmd}*`).join('\n');
    resposta +=
      dataBd.block_cmds.length != 0
        ? createText(
            textMessage.grupo.status.msgs.resposta_variavel.bloqueiocmds.on,
            comandosFormatados,
          )
        : textMessage.grupo.status.msgs.resposta_variavel.bloqueiocmds.off;
    //Lista Negra
    resposta += createText(
      textMessage.grupo.status.msgs.resposta_variavel.listanegra,
      String(dataBd.lista_negra?.length),
    );
    await sock.sendText(id_chat!, resposta);
  },
};

export default command;
