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

function precoLotofacil(dezenas: number): number {
  // Tabela básica (valores aproximados, ajustar se quiser precisão oficial)
  const tabela: Record<number, number> = {
    15: 3.0,
    16: 48.0,
    17: 408.0,
    18: 2448.0,
    19: 11628.0,
    20: 46512.0,
  };
  return tabela[dezenas] ?? 0;
}

const command: Command = {
  name: 'Lotofácil',
  description: 'Gera jogos aleatórios da Lotofácil (15 a 20 dezenas, 1 a 25).',
  category: 'users',
  aliases: ['lotofacil', 'lf'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
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
    let dezenas = 15;
    let sorte: number | null = null;

    if (args[0]) {
      const n = parseInt(args[0], 10);
      if (!Number.isFinite(n) || n <= 0) {
        return await sock.replyText(
          id_chat,
          `[❗] Quantidade inválida. Use: ${dataBot.prefix}lotofacil qtd [dezenas 15-20] [sorte N]`,
          message,
        );
      }
      qtd = Math.min(n, 20);
    }

    if (args[1]) {
      const d = parseInt(args[1], 10);
      if (!Number.isFinite(d) || d < 15 || d > 20) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (15 a 20). Ex: ${dataBot.prefix}lotofacil 3 17`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2] && args[2].toLowerCase() === 'sorte' && args[3]) {
      const s = parseInt(args[3], 10);
      if (Number.isFinite(s) && s >= 1 && s <= 25) sorte = s;
    }

    const jogos: string[] = [];
    for (let i = 0; i < qtd; i++) {
      const jogo = sorte ? gerarJogoComSorte(dezenas, 25, sorte) : gerarJogo(dezenas, 25);
      jogos.push(`${i + 1}. ${formatar(jogo, sorte)}`);
    }

    const custo = precoLotofacil(dezenas);
    const cab = `🎲 Lotofácil — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n');
    const bloco = `\n\`\`\`\n${corpo}\n\`\`\``;
    const rod = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}`;

    return await sock.replyText(id_chat, cab + bloco + rod, message);
  },
};

export default command;
