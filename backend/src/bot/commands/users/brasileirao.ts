import * as types from '../../../types/BaileysTypes/index.js';
import {
  MessageContent,
  Command,
  Bot,
  CommandReturn,
  ResultadoBrasileirao,
} from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import {
  getBrasileiraoA,
  formatResumo,
  formatTabelaCompleta,
  formatJogos,
  findClub,
  findClubMatch,
  formatClube,
} from '../../../utils/utils.js';

const command: Command = {
  name: 'Brasileirão',
  description:
    'Tabela, jogos e consulta de clubes do Campeonato Brasileiro (Série A e B). Use: !brasileirao, !brasileirao tabela, !brasileirao jogos ou !brasileirao <time>',
  category: 'users',
  aliases: ['brasileirao', 'brasileiraoa', 'brasileiraob', 'tabela'],
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

    // Detecta série
    const isExplicitB =
      args?.[0]?.toLowerCase() === 'b' ||
      messageContent.command?.toLowerCase().includes('brasileiraob');
    const serie: 'A' | 'B' = isExplicitB ? 'B' : 'A';

    // Remove 'b' dos argumentos se foi usado como seletor de série
    const cleanArgs = isExplicitB && args?.[0]?.toLowerCase() === 'b' ? args.slice(1) : args;
    const subCmd = cleanArgs?.[0]?.toLowerCase();

    try {
      await sock.sendReact(message.key, '⏳', id_chat);

      const resultado: ResultadoBrasileirao = await getBrasileiraoA(true, serie);
      const { tabela, rodadas } = resultado;

      if (!tabela || !tabela.length) {
        await sock.sendReact(message.key, '❌', id_chat);
        return await sock.replyText(
          id_chat,
          `❌ Não foi possível obter os dados da tabela do Brasileirão Série ${serie} no momento.`,
          message,
        );
      }

      let response = '';

      if (!subCmd || subCmd === 'resumo') {
        // Modo 1: Resumo Dinâmico (G4 + Z4 + Jogos da Rodada Atual)
        response = formatResumo(resultado, serie);
      } else if (subCmd === 'tabela' || subCmd === 'completa') {
        // Modo 2: Tabela Completa (1º ao 20º)
        response = formatTabelaCompleta(resultado, serie);
      } else if (subCmd === 'jogos' || subCmd === 'rodada') {
        // Modo 3: Apenas os Jogos da Rodada Atual
        response = formatJogos(resultado, serie);
      } else {
        // Modo 4: Busca por Clube específico (ex: !brasileirao flamengo, !brasileirao palmeiras)
        const buscaTime = cleanArgs.join(' ');
        const clube = findClub(tabela, buscaTime);

        if (clube) {
          const matchInfo = findClubMatch(rodadas, clube.nome);
          response = formatClube(clube, matchInfo, serie);
        } else {
          // Se não encontrou clube, mostra resumo avisando que o time não foi localizado
          response =
            `⚠️ O clube *"${buscaTime}"* não foi encontrado na Série ${serie}.\n\n` +
            formatResumo(resultado, serie);
        }
      }

      await sock.sendReact(message.key, '⚽', id_chat);
      return await sock.replyText(id_chat, response, message);
    } catch (err: any) {
      console.error('Erro no comando brasileirao:', err);
      await sock.sendReact(message.key, '❌', id_chat);
      return await sock.replyText(
        id_chat,
        '❌ Ocorreu um erro ao consultar o Brasileirão. Tente novamente mais tarde.',
        message,
      );
    }
  },
};

export default command;
