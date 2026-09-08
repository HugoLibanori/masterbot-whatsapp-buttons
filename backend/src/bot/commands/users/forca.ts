import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { forcaWords, ForcaWord } from '../../../utils/forcaWords.js';

interface ForcaGame {
  word: ForcaWord;
  guessedLetters: Set<string>;
  wrongGuesses: Set<string>;
  maxErrors: number;
  timer: NodeJS.Timeout;
}

const activeForcas = new Map<string, ForcaGame>();
const lastWordIndices = new Map<string, number>();

const forcaStages = [
  `  +---+
  |   |
      |
      |
      |
      |
=========`,
  `  +---+
  |   |
  O   |
      |
      |
      |
=========`,
  `  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
  `  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
  `  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
  `  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
  `  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
];

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function renderMaskedWord(word: string, guessedLetters: Set<string>): string {
  const normGuessed = Array.from(guessedLetters).map((l) => normalize(l));
  return word
    .split('')
    .map((char) => {
      if (char === ' ') return '  ';
      if (char === '-') return '- ';
      const normChar = normalize(char);
      return normGuessed.includes(normChar) ? `${char} ` : '_ ';
    })
    .join('')
    .trim();
}

function isWordComplete(word: string, guessedLetters: Set<string>): boolean {
  const normGuessed = Array.from(guessedLetters).map((l) => normalize(l));
  for (const char of word) {
    if (char === ' ' || char === '-') continue;
    if (!normGuessed.includes(normalize(char))) {
      return false;
    }
  }
  return true;
}

const command: Command = {
  name: 'forca',
  description: 'Joga o clássico jogo da forca em grupo com dicas e premiação em XP.',
  category: 'users',
  aliases: ['forca', 'f'],
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
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, sender, senderLid, pushName } = messageContent;
    const prefix = dataBot.prefix || '!';
    const userId = sender || senderLid || '';

    if (!id_chat) return { status: false };

    const game = activeForcas.get(id_chat);

    // 1. AÇÃO: Desistir / Parar o jogo
    if (args && args.length > 0 && ['desistir', 'parar', 'cancelar', 'sair'].includes(args[0].toLowerCase())) {
      if (!game) {
        await sock.replyText(id_chat, `❌ Não há nenhum jogo da forca ativo no momento.`, message);
        return { status: false };
      }
      clearTimeout(game.timer);
      const palavraRevelada = game.word.palavra;
      activeForcas.delete(id_chat);
      await sock.replyText(
        id_chat,
        `🏳️ *JOGO DA FORCA ENCERRADO!*\n\n` +
          `A palavra secreta era: *${palavraRevelada}*\n` +
          `💡 Dica: _${game.word.dica}_\n\n` +
          `Para começar de novo, digite: *\`${prefix}forca\`*`,
        message,
      );
      return { status: true };
    }

    // 2. AÇÃO: Palpitar letra ou palavra completa
    if (args && args.length > 0) {
      if (!game) {
        await sock.replyText(
          id_chat,
          `❓ Não há nenhum jogo da forca em andamento!\n💡 Digite *\`${prefix}forca\`* para iniciar uma nova partida.`,
          message,
        );
        return { status: false };
      }

      const inputRaw = args.join(' ').trim();
      const input = normalize(inputRaw);

      // CASO A: Chutar a palavra inteira (mais de 1 letra)
      if (input.length > 1) {
        if (input === normalize(game.word.palavra)) {
          // ACERTOU A PALAVRA INTEIRA!
          clearTimeout(game.timer);
          activeForcas.delete(id_chat);

          if (dataBot.xp?.status && userId) {
            try {
              const { XPService } = await import('../../../services/XPService.js');
              await XPService.addEvent(sock.session_name, userId, 'interaction');
            } catch {}
          }

          const userTag = userId ? `@${userId.split('@')[0]}` : pushName || 'Você';
          const winMsg =
            `🎉 *PARABÉNS! VOCÊ ACERTOU A PALAVRA!* 🏆\n\n` +
            `👤 *Vencedor:* ${userTag}\n` +
            `🎯 *Palavra:* *${game.word.palavra}*\n` +
            `💡 *Dica:* _${game.word.dica}_\n\n` +
            `⚡ *Bônus:* +50 XP adicionados ao seu perfil!\n` +
            `🕹️ _Para jogar novamente, digite \`${prefix}forca\`_`;

          if (userId) {
            await sock.sendTextWithMentions(id_chat, winMsg, [userId]);
          } else {
            await sock.replyText(id_chat, winMsg, message);
          }
          return { status: true };
        } else {
          // ERROU O CHUTE DA PALAVRA: Perde 1 vida
          game.wrongGuesses.add(`[${input}]`);
          const erros = game.wrongGuesses.size;

          if (erros >= game.maxErrors) {
            clearTimeout(game.timer);
            const revelada = game.word.palavra;
            activeForcas.delete(id_chat);

            const gameOverMsg =
              `😵 *VOCÊS FORAM ENFORCADOS! FIM DE JOGO!* 💀\n\n` +
              `\`\`\`${forcaStages[6]}\`\`\`\n\n` +
              `❌ O chute *"${inputRaw}"* estava incorreto!\n` +
              `🎯 *A palavra secreta era:* *${revelada}*\n` +
              `💡 *Dica:* _${game.word.dica}_\n\n` +
              `🕹️ _Tente outra vez digitando \`${prefix}forca\`_`;

            await sock.replyText(id_chat, gameOverMsg, message);
            return { status: false };
          }

          const masked = renderMaskedWord(game.word.palavra, game.guessedLetters);
          const vidasRestantes = game.maxErrors - erros;
          const msg =
            `❌ *"${inputRaw}"* não é a palavra correta!\n\n` +
            `\`\`\`${forcaStages[erros]}\`\`\`\n\n` +
            `🎯 *Palavra:* \`${masked}\`\n` +
            `💡 *Dica:* _${game.word.dica}_\n` +
            `🚫 *Erros (${erros}/${game.maxErrors}):* ${Array.from(game.wrongGuesses).join(', ')}\n` +
            `❤️ *Vidas restantes:* ${vidasRestantes}`;

          await sock.replyText(id_chat, msg, message);
          return { status: false };
        }
      }

      // CASO B: Palpitar 1 letra
      const letter = input;
      if (!/^[A-Z0-9]$/.test(letter)) {
        await sock.replyText(
          id_chat,
          `⚠️ Por favor, envie uma letra válida de A a Z.\nExemplo: *\`${prefix}forca a\`*`,
          message,
        );
        return { status: false };
      }

      if (game.guessedLetters.has(letter) || game.wrongGuesses.has(letter)) {
        await sock.replyText(
          id_chat,
          `⚠️ A letra *"${letter}"* já foi tentada antes!\nEscolha outra letra.`,
          message,
        );
        return { status: false };
      }

      const normSecret = normalize(game.word.palavra);

      if (normSecret.includes(letter)) {
        // LETRA CORRETA!
        game.guessedLetters.add(letter);

        if (isWordComplete(game.word.palavra, game.guessedLetters)) {
          // COMPLETOU TODAS AS LETRAS!
          clearTimeout(game.timer);
          activeForcas.delete(id_chat);

          if (dataBot.xp?.status && userId) {
            try {
              const { XPService } = await import('../../../services/XPService.js');
              await XPService.addEvent(sock.session_name, userId, 'interaction');
            } catch {}
          }

          const userTag = userId ? `@${userId.split('@')[0]}` : pushName || 'Você';
          const winMsg =
            `🎉 *VITÓRIA! A PALAVRA FOI COMPLETADA!* 🏆\n\n` +
            `👤 *Quem finalizou:* ${userTag}\n` +
            `🎯 *Palavra:* *${game.word.palavra}*\n` +
            `💡 *Dica:* _${game.word.dica}_\n\n` +
            `⚡ *Bônus:* +50 XP adicionados ao seu perfil!\n` +
            `🕹️ _Para jogar novamente, digite \`${prefix}forca\`_`;

          if (userId) {
            await sock.sendTextWithMentions(id_chat, winMsg, [userId]);
          } else {
            await sock.replyText(id_chat, winMsg, message);
          }
          return { status: true };
        }

        const masked = renderMaskedWord(game.word.palavra, game.guessedLetters);
        const erros = game.wrongGuesses.size;
        const vidasRestantes = game.maxErrors - erros;

        const msg =
          `✅ *Boa! A letra "${letter}" está na palavra!* 🎯\n\n` +
          `\`\`\`${forcaStages[erros]}\`\`\`\n\n` +
          `🎯 *Palavra:* \`${masked}\`\n` +
          `💡 *Dica:* _${game.word.dica}_\n` +
          `❤️ *Vidas:* ${vidasRestantes} | 🚫 *Erros:* ${Array.from(game.wrongGuesses).join(', ') || 'Nenhum'}`;

        await sock.replyText(id_chat, msg, message);
        return { status: true };
      } else {
        // LETRA ERRADA!
        game.wrongGuesses.add(letter);
        const erros = game.wrongGuesses.size;

        if (erros >= game.maxErrors) {
          clearTimeout(game.timer);
          const revelada = game.word.palavra;
          activeForcas.delete(id_chat);

          const gameOverMsg =
            `😵 *ENFORCADO! O BONECO MORREU!* 💀\n\n` +
            `\`\`\`${forcaStages[6]}\`\`\`\n\n` +
            `🎯 *A palavra secreta era:* *${revelada}*\n` +
            `💡 *Dica:* _${game.word.dica}_\n\n` +
            `🕹️ _Não desanime! Digite \`${prefix}forca\` para tentar de novo._`;

          await sock.replyText(id_chat, gameOverMsg, message);
          return { status: false };
        }

        const masked = renderMaskedWord(game.word.palavra, game.guessedLetters);
        const vidasRestantes = game.maxErrors - erros;

        const msg =
          `❌ *A letra "${letter}" NÃO está na palavra!* 🩸\n\n` +
          `\`\`\`${forcaStages[erros]}\`\`\`\n\n` +
          `🎯 *Palavra:* \`${masked}\`\n` +
          `💡 *Dica:* _${game.word.dica}_\n` +
          `🚫 *Erros (${erros}/${game.maxErrors}):* ${Array.from(game.wrongGuesses).join(', ')}\n` +
          `❤️ *Vidas restantes:* ${vidasRestantes}`;

        await sock.replyText(id_chat, msg, message);
        return { status: false };
      }
    }

    // 3. AÇÃO: Sem argumentos -> Iniciar novo jogo ou exibir o atual
    if (game) {
      const masked = renderMaskedWord(game.word.palavra, game.guessedLetters);
      const erros = game.wrongGuesses.size;
      const vidasRestantes = game.maxErrors - erros;

      const statusMsg =
        `🎮 *JOGO DA FORCA EM ANDAMENTO!* 🎮\n\n` +
        `\`\`\`${forcaStages[erros]}\`\`\`\n\n` +
        `🎯 *Palavra:* \`${masked}\`\n` +
        `💡 *Dica:* _${game.word.dica}_\n` +
        `❤️ *Vidas restantes:* ${vidasRestantes}\n` +
        `🚫 *Letras erradas:* ${Array.from(game.wrongGuesses).join(', ') || 'Nenhuma'}\n\n` +
        `📌 *Como jogar:* Digite *\`${prefix}forca <letra>\`* ou chute a palavra com *\`${prefix}forca <palpite>\`*.\n` +
        `🏳️ Para desistir: *\`${prefix}forca desistir\`*`;

      await sock.replyText(id_chat, statusMsg, message);
      return { status: false };
    }

    // Sorteia nova palavra sem repetir a anterior
    const lastIndex = lastWordIndices.get(id_chat) || -1;
    let randomIndex = Math.floor(Math.random() * forcaWords.length);
    if (forcaWords.length > 1 && randomIndex === lastIndex) {
      randomIndex = (randomIndex + 1) % forcaWords.length;
    }
    lastWordIndices.set(id_chat, randomIndex);
    const chosenWord = forcaWords[randomIndex];

    // Timeout de 5 minutos para inatividade
    const timer = setTimeout(async () => {
      const active = activeForcas.get(id_chat);
      if (active && active.word.palavra === chosenWord.palavra) {
        activeForcas.delete(id_chat);
        try {
          await sock.sendText(
            id_chat,
            `⏰ *JOGO DA FORCA CANCELADO POR INATIVIDADE!*\n` +
              `A palavra era: *${chosenWord.palavra}* (_${chosenWord.dica}_).\n` +
              `Para iniciar um novo jogo, digite *\`${prefix}forca\`*.`,
          );
        } catch {}
      }
    }, 5 * 60 * 1000);

    activeForcas.set(id_chat, {
      word: chosenWord,
      guessedLetters: new Set(),
      wrongGuesses: new Set(),
      maxErrors: 6,
      timer,
    });

    const maskedInitial = renderMaskedWord(chosenWord.palavra, new Set());

    const initialMsg =
      `🕹️ *NOVO JOGO DA FORCA INICIADO!* 🕹️\n\n` +
      `\`\`\`${forcaStages[0]}\`\`\`\n\n` +
      `🎯 *Palavra:* \`${maskedInitial}\`\n` +
      `💡 *Dica:* _${chosenWord.dica}_\n` +
      `❤️ *Vidas:* 6\n\n` +
      `📌 *Como jogar:*\n` +
      `• Mande uma letra: *\`${prefix}forca a\`*\n` +
      `• Chute a palavra inteira: *\`${prefix}forca ${chosenWord.palavra.length > 5 ? 'pipoca' : 'sol'}\`*\n` +
      `• Desistir da partida: *\`${prefix}forca desistir\`*\n\n` +
      `🎲 *Boa sorte a todos do grupo!*`;

    await sock.replyText(id_chat, initialMsg, message);
    return { status: true };
  },
};

export default command;
