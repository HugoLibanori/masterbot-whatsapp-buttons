import * as types from '../../../types/BaileysTypes/index.js';
import {
  MessageContent,
  Command,
  Bot,
  CommandReturn,
  ResultadoBrasileirao,
} from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { getBrasileiraoA } from '../../../utils/utils.js';

const command: Command = {
  name: 'Brasileirão',
  description: 'Mostra a tabela do Campeonato Brasileiro.',
  category: 'users',
  aliases: ['brasileirao'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  minType: 'vip',
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    const statusEmojis = {
      g4: '🟢',
      neutro: '⚫',
      z4: '🔴',
    };

    await sock.sendReact(message.key, '⌛', id_chat);

    let resultado: ResultadoBrasileirao = await getBrasileiraoA();

    const { tabela, rodadas } = resultado;
    const [rodada] = rodadas!.filter((rodada) => rodada.rodada_atual === true);
    const { partidas } = rodada;

    let textoTabela = '',
      textoPartidas = '';
    tabela.forEach((time) => {
      const pos = parseInt(time.posicao);
      const status = pos < 5 ? statusEmojis.g4 : pos < 17 ? statusEmojis.neutro : statusEmojis.z4;
      textoTabela +=
        `${status} ${time.posicao}° ${time.nome} - ` +
        `P: ${time.pontos} J: ${time.jogos} V: ${time.vitorias}\n`;
    });

    partidas.forEach((partida) => {
      textoPartidas +=
        `- *Partida:* ${partida.time_casa} x ${partida.time_fora} \n` +
        `- *Data:* ${partida.data} \n` +
        `- *Local:* ${partida.local} \n` +
        `- *Resultado:* ${partida.gols_casa ? partida.resultado_texto : '---'}\n\n`;
    });

    const response =
      `⚽ *BRASILEIRÃO SERIE A* ⚽ \n\n` +
      '*Tabela:*\n' +
      `${textoTabela}\n` +
      '*Rodada Atual:*\n\n' +
      `${textoPartidas}`;

    await sock.sendReact(message.key, '⚽', id_chat);

    return await sock.replyText(id_chat, response, message);
  },
};

export default command;
