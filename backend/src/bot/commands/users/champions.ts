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
  getChampionsLeague,
  formatResumoChampions,
  formatTabelaChampions,
  formatJogosChampions,
  formatClubeChampions,
  findClub,
  findClubMatch,
} from '../../../utils/utils.js';

const command: Command = {
  name: 'Champions League',
  description:
    'Tabela, jogos e consulta de clubes da UEFA Champions League. Use: !champions, !champions tabela, !champions jogos ou !champions <time>',
  category: 'users',
  aliases: ['champions', 'championsleague', 'ucl', 'uefa'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[] = [],
    dataBot?: Partial<Bot>,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    const prefix = dataBot?.prefix?.trim() || '!';

    const subCmd = args?.[0]?.toLowerCase();

    try {
      await sock.sendReact(message.key, '⏳', id_chat);

      const resultado: ResultadoBrasileirao = await getChampionsLeague(true);
      const { tabela, rodadas } = resultado;

      if (!tabela || !tabela.length) {
        await sock.sendReact(message.key, '❌', id_chat);
        return await sock.replyText(
          id_chat,
          '❌ Não foi possível obter os dados da UEFA Champions League no momento. Tente novamente mais tarde.',
          message,
        );
      }

      let response = '';

      if (!subCmd || subCmd === 'resumo') {
        // Modo 1: Resumo Dinâmico (Top 8 + Playoffs + Jogos da Rodada Atual)
        response = formatResumoChampions(resultado);
      } else if (subCmd === 'tabela' || subCmd === 'completa') {
        // Modo 2: Tabela Completa (1º ao 36º)
        response = formatTabelaChampions(resultado);
      } else if (subCmd === 'jogos' || subCmd === 'rodada') {
        // Modo 3: Apenas os Jogos da Rodada Atual
        response = formatJogosChampions(resultado);
      } else {
        // Modo 4: Busca por Clube específico (ex: !champions real madrid, !champions barcelona, !champions city)
        const buscaTime = args.join(' ');
        const clube = findClub(tabela, buscaTime);

        if (clube) {
          const matchInfo = findClubMatch(rodadas, clube.nome);
          response = formatClubeChampions(clube, matchInfo);
        } else {
          // Se não encontrou clube, mostra resumo avisando que o time não foi localizado
          response =
            `⚠️ O clube *"${buscaTime}"* não foi localizado na tabela da Champions League.\n\n` +
            formatResumoChampions(resultado);
        }
      }

      // Botões interativos
      const buttons: types.IButton[] = [];

      if (subCmd !== 'tabela' && subCmd !== 'completa') {
        buttons.push({
          buttonId: `${prefix}champions tabela`,
          buttonText: { displayText: '📊 Tabela Completa' },
        });
      }

      if (subCmd !== 'jogos' && subCmd !== 'rodada') {
        buttons.push({
          buttonId: `${prefix}champions jogos`,
          buttonText: { displayText: '⚽ Jogos da Rodada' },
        });
      }

      if (subCmd) {
        buttons.push({
          buttonId: `${prefix}champions resumo`,
          buttonText: { displayText: '🏆 Resumo' },
        });
      }

      try {
        await sock.sendButtons(id_chat, {
          text: response,
          footer: 'Master Bot • UEFA Champions League',
          buttons: buttons.slice(0, 3),
        });
      } catch {
        await sock.replyText(id_chat, response, message);
      }

      await sock.sendReact(message.key, '🏆', id_chat);
      return { status: true };
    } catch (err: any) {
      console.error('Erro no comando champions:', err);
      await sock.sendReact(message.key, '❌', id_chat);
      return await sock.replyText(
        id_chat,
        '❌ Ocorreu um erro ao consultar a Champions League. Tente novamente mais tarde.',
        message,
      );
    }
  },
};

export default command;
