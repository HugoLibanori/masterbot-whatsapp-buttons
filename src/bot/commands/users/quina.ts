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
    5: 2.5,
    6: 15.0,
    7: 52.5,
    8: 140.0,
    9: 315.0,
    10: 630.0,
    11: 1155.0,
    12: 1980.0,
    13: 3217.5,
    14: 5005.0,
    15: 7507.5,
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
      const n = parseInt(args[0], 10);
      if (!Number.isFinite(n) || n <= 0) {
        return await sock.replyText(
          id_chat,
          `[❗] Quantidade inválida. Use: ${dataBot.prefix}quina qtd [dezenas 5-15] [sorte N]`,
          message,
        );
      }
      qtd = Math.min(n, 20);
    }

    if (args[1]) {
      const d = parseInt(args[1], 10);
      if (!Number.isFinite(d) || d < 5 || d > 15) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (5 a 15). Ex: ${dataBot.prefix}quina 3 7`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2] && args[2].toLowerCase() === 'sorte' && args[3]) {
      const s = parseInt(args[3], 10);
      if (Number.isFinite(s) && s >= 1 && s <= 80) sorte = s;
    }

    const jogos: string[] = [];
    for (let i = 0; i < qtd; i++) {
      const jogo = sorte ? gerarJogoComSorte(dezenas, 80, sorte) : gerarJogo(dezenas, 80);
      jogos.push(`${i + 1}. ${formatar(jogo, sorte)}`);
    }

    const custo = precoQuina(dezenas);
    const cab = `🎲 Quina — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n');
    const bloco = `\n\`\`\`\n${corpo}\n\`\`\``;
    const rod = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}`;

    return await sock.replyText(id_chat, cab + bloco + rod, message);
  },
};

export default command;
