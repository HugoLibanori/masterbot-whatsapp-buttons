import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';

function gerarJogo(qtdDezenas: number, max: number): number[] {
  const numeros = new Set<number>();
  while (numeros.size < qtdDezenas) {
    const n = Math.floor(Math.random() * max) + 1;
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

function formatar(nums: number[], sorte?: number | null): string {
  return nums
    .map((n) => {
      const s = String(n).padStart(2, '0');
      return sorte && n === sorte ? `(${s})` : s;
    })
    .join(' - ');
}

function precoQuina(dezenas: number): number {
  // Tabela básica (valores aproximados; ajustar conforme necessário)
  const tabela: Record<number, number> = {
    5: 3.0,
    6: 18.0,
    7: 63.0,
    8: 168.0,
    9: 378.0,
    10: 756.0,
    11: 1386.0,
    12: 2376.0,
    13: 3861.0,
    14: 6006.0,
    15: 9009.0,
  };
  return tabela[dezenas] ?? 0;
}

const command: Command = {
  name: 'Quina',
  description: 'Gera jogos aleatórios da Quina (5 a 15 dezenas, 1 a 80).',
  category: 'users',
  aliases: ['quina'],
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
    let dezenas = 5;
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
      if (!Number.isInteger(d) || d < 5 || d > 15) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (5 a 15). Ex: ${dataBot.prefix}quina 3 7`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2]) {
      const s = Number(args[2]);
      if (!Number.isInteger(s) && s < 1 && s > 80) {
        await sock.replyText(id_chat, '⚠️ Número da sorte ignorado (fora do intervalo).', message);
      } else {
        sorte = s;
      }
    }

    const jogos: string[] = [];
    const jogosSet = new Set<string>();

    let tentativas = 0;
    const MAX_TENTATIVAS = qtd * 50;

    while (jogos.length < qtd && tentativas < MAX_TENTATIVAS) {
      tentativas++;
      const jogo = sorte ? gerarJogoComSorte(dezenas, 80, sorte) : gerarJogo(dezenas, 80);

      const chave = jogo.join(',');

      if (!jogosSet.has(chave)) {
        jogosSet.add(chave);
        jogos.push(`*${jogos.length + 1}* - ${formatar(jogo, sorte)}`);
      }
    }

    if (jogos.length < qtd) {
      return await sock.replyText(
        id_chat,
        '[⚠️] Não foi possível gerar todos os jogos únicos solicitados.',
        message,
      );
    }

    const custo = precoQuina(dezenas);
    const cab = `🎲 Quina — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n\n----------------\n\n');
    const bloco = `\n\n${corpo}\n\n`;
    const rod = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}\nBoa sorte! 🍀`;

    return await sock.replyText(id_chat, cab + bloco + rod, message);
  },
};

export default command;
