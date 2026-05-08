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
    if (n <= sorte) continue;
    if (!numeros.has(n)) {
      numeros.add(n);
    }
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

function precoLotofacil(dezenas: number): number {
  // Tabela básica (valores aproximados, ajustar se quiser precisão oficial)
  const tabela: Record<number, number> = {
    15: 3.5,
    16: 56.0,
    17: 476.0,
    18: 2856.0,
    19: 13566.0,
    20: 54264.0,
  };
  return tabela[dezenas] ?? 0;
}

// ... existing code ...

const command: Command = {
  name: 'Lotofácil',
  description: 'Gera jogos aleatórios da Lotofácil (15 a 20 dezenas, 1 a 25).',
  category: 'users',
  aliases: ['lotofacil', 'lf'],
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

    let qtd = 1;
    let dezenas = 15;
    let inicio: number | null = null;

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
      if (!Number.isInteger(d) || d < 15 || d > 20) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (15 a 20). Ex: ${dataBot.prefix}lotofacil 3 17`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2]) {
      const s = Number(args[2]);
      if (!Number.isInteger(s) && s < 1 && s > 10) {
        await sock.replyText(id_chat, '⚠️ Número de início ignorado (fora do intervalo).', message);
      } else {
        inicio = s;
      }
    }

    const jogos: string[] = [];
    const jogosSet = new Set<string>();

    let tentativas = 0;
    const MAX_TENTATIVAS = qtd * 50;

    while (jogos.length < qtd && tentativas < MAX_TENTATIVAS) {
      tentativas++;
      const jogo = inicio ? gerarJogoComSorte(dezenas, 25, inicio) : gerarJogo(dezenas, 25);

      // chave lógica do jogo
      const chave = jogo.join(',');

      if (!jogosSet.has(chave)) {
        jogosSet.add(chave);
        jogos.push(`*${jogos.length + 1}* - ${formatar(jogo, inicio)}`);
      }
    }

    if (jogos.length < qtd) {
      return await sock.replyText(
        id_chat,
        '[⚠️] Não foi possível gerar todos os jogos únicos solicitados.',
        message,
      );
    }

    const custo = precoLotofacil(dezenas);
    const cab = `🎲 Lotofácil — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n\n----------------\n\n');
    const bloco = `\n\n${corpo}\n\n`;
    const rod = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}\nBoa sorte! 🍀`;

    return await sock.replyText(id_chat, cab + bloco + rod, message);
  },
};

export default command;
