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
    6: 5.0,
    7: 35.0,
    8: 140.0,
    9: 420.0,
    10: 1050.0,
    11: 2310.0,
    12: 4620.0,
    13: 8580.0,
    14: 15015.0,
    15: 25025.0,
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
      const n = parseInt(args[0], 10);
      if (!Number.isFinite(n) || n <= 0) {
        return await sock.replyText(
          id_chat,
          `[❗] Quantidade inválida. Use: ${dataBot.prefix}megasena qtd [dezenas 6-15] [sorte N]`,
          message,
        );
      }
      qtd = Math.min(n, 20);
    }

    if (args[1]) {
      const d = parseInt(args[1], 10);
      if (!Number.isFinite(d) || d < 6 || d > 15) {
        return await sock.replyText(
          id_chat,
          `[❗] Dezenas inválidas (6 a 15). Ex: ${dataBot.prefix}megasena 3 8`,
          message,
        );
      }
      dezenas = d;
    }

    if (args[2] && args[2].toLowerCase() === 'sorte' && args[3]) {
      const s = parseInt(args[3], 10);
      if (Number.isFinite(s) && s >= 1 && s <= 60) sorte = s;
    }

    // gerar jogos
    const jogos: string[] = [];
    for (let i = 0; i < qtd; i++) {
      const jogo = sorte ? gerarJogoComSorte(dezenas, 60, sorte) : gerarJogo(dezenas, 60);
      jogos.push(`${i + 1}. ${formatarJogo(jogo, sorte)}`);
    }

    const custo = precoMega(dezenas);
    const cabecalho = `🎲 Mega-Sena — ${qtd} jogo(s) | ${dezenas} dezenas\n`;
    const corpo = jogos.join('\n');
    const bloco = `\n\`\`\`\n${corpo}\n\`\`\``;
    const rodape = `\n\nEstimativa custo/jogo: R$ ${custo.toFixed(2)}\nBoa sorte! 🍀`;

    return await sock.replyText(id_chat, cabecalho + bloco + rodape, message);
  },
};

export default command;
