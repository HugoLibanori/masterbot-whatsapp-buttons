import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandInfo } from '../../messages/messagesObj.js';

function gerarJogo(qtdDezenas: number, max: number): number[] {
  const numeros = new Set<number>();
  while (numeros.size < qtdDezenas) {
    const n = Math.floor(Math.random() * max) + 1; // 1..max
    numeros.add(n);
  }
  return Array.from(numeros).sort((a, b) => a - b);
}

function gerarJogoComSorte(qtdDezenas: number, max: number, sorte: number): number[] {
  const numeros = new Set<number>();
  numeros.add(sorte);
  while (numeros.size < qtdDezenas) {
    const n = Math.floor(Math.random() * max) + 1;
    if (n === sorte) continue;
    numeros.add(n);
  }
  return Array.from(numeros).sort((a, b) => a - b);
}

function formatarJogo(nums: number[], sorte?: number | null): string {
  return nums
    .map((n) => {
      const s = String(n).padStart(2, '0');
      return sorte && n === sorte ? `(${s})` : s;
    })
    .join(' - ');
}

function precoMega(dezenas: number): number {
  // Tabela aproximada (pode ajustar conforme a Caixa)
  const tabela: Record<number, number> = {
    6: 6.0,
    7: 42.0,
    8: 168.0,
    9: 504.0,
    10: 1260.0,
    11: 2772.0,
    12: 5544.0,
    13: 10296.0,
    14: 18018.0,
    15: 30030.0,
    16: 48048.0,
    17: 74256.0,
    18: 111384.0,
    19: 162792.0,
    20: 232560.0,
  };
  return tabela[dezenas] ?? 0;
}

const command: Command = {
  name: 'Mega-Sena',
  description: 'Gera jogos aleatórios da Mega-Sena (6 a 15 dezenas, 1 a 60).',
  category: 'users',
  aliases: ['megasena', 'mega'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  minType: 'premium',
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    // args: qtd [dezenas] [sorte N]
    let qtd = 1;
    let dezenas = 6;
    let sorte: number | null = null;

    if (args[0]) {
      const n = Number(args[0]);
      if (!Number.isInteger(n) || n <= 0) {
        return await sock.replyText(
          id_chat,
          `[❗] Quantidade inválida, por favor envie um valor real.`,
          message,
        );
      }
      if (n > 20) {
        await sock.replyText(id_chat, 'ℹ️ O limite máximo é 20 jogos. Gerando 20 jogos.', message);
      }
      qtd = Math.min(n, 20);
    }

    if (args[1]) {
      const d = Number(args[1]);
      if (!Number.isInteger(d) || d < 6 || d > 15) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (6 a 15). Ex: ${dataBot.prefix}megasena 3 8`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2]) {
      const s = Number(args[2]);
      if (!Number.isInteger(s) && s < 1 && s > 60) {
        await sock.replyText(id_chat, '⚠️ Número da sorte ignorado (fora do intervalo).', message);
      } else {
        sorte = s;
      }
    }

    // gerar jogos
    const jogos: string[] = [];
    const jogosSet = new Set<string>();

    let tentativas = 0;
    const MAX_TENTATIVAS = qtd * 50;

    while (jogos.length < qtd && tentativas < MAX_TENTATIVAS) {
      tentativas++;
      const jogo = sorte ? gerarJogoComSorte(dezenas, 60, sorte) : gerarJogo(dezenas, 60);

      const chave = jogo.join(',');

      if (!jogosSet.has(chave)) {
        jogosSet.add(chave);
        jogos.push(`*${jogos.length + 1}* - ${formatarJogo(jogo, sorte)}`);
      }
    }

    if (jogos.length < qtd) {
      return await sock.replyText(
        id_chat,
        '[⚠️] Não foi possível gerar todos os jogos únicos solicitados.',
        message,
      );
    }

    const custo = precoMega(dezenas);
    const cabecalho = `🎲 Mega-Sena — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n\n----------------\n\n');
    const bloco = `\n\n${corpo}\n\n`;
    const rodape = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}\nBoa sorte! 🍀`;

    return await sock.replyText(id_chat, cabecalho + bloco + rodape, message);
  },
};

export default command;
