import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { quizQuestions, QuizQuestion } from '../../../utils/quizQuestions.js';

interface ActiveQuiz {
  question: QuizQuestion;
  startTime: number;
  expiresAt: number;
  timer: NodeJS.Timeout;
  attemptedUsers: Set<string>;
}

// Armazena o quiz ativo por chat/grupo
const activeQuizzes = new Map<string, ActiveQuiz>();
// Evita repetir a mesma pergunta imediatamente
const lastQuestionIds = new Map<string, number>();

const command: Command = {
  name: 'quiz',
  description: 'Inicia um jogo de perguntas e respostas com botões e premiação de XP no grupo.',
  category: 'users',
  aliases: ['quiz', 'pergunta', 'show'],
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
    const { id_chat, sender, senderLid, pushName, isGroup } = messageContent;
    const prefix = dataBot.prefix || '!';
    const userId = sender || senderLid || '';

    if (!id_chat) return { status: false };

    const activeQuiz = activeQuizzes.get(id_chat);

    // Se o usuário passou um argumento (ex: !quiz 2 ou clicou no botão)
    if (args && args.length > 0) {
      if (!activeQuiz) {
        await sock.replyText(
          id_chat,
          `❓ Não há nenhum Quiz ativo neste momento!\n💡 Digite *\`${prefix}quiz\`* para iniciar uma rodada.`,
          message,
        );
        return { status: false };
      }

      const input = args[0].trim().toLowerCase();
      let chosenIndex = -1;

      if (input === '1' || input === 'a') chosenIndex = 0;
      else if (input === '2' || input === 'b') chosenIndex = 1;
      else if (input === '3' || input === 'c') chosenIndex = 2;
      else if (input === '4' || input === 'd') chosenIndex = 3;

      if (chosenIndex === -1) {
        await sock.replyText(
          id_chat,
          `⚠️ Opção inválida! Escolha entre *1*, *2*, *3* ou *4* (ou clique no botão correspondente).`,
          message,
        );
        return { status: false };
      }

      const q = activeQuiz.question;

      // Resposta correta!
      if (chosenIndex === q.correta) {
        clearTimeout(activeQuiz.timer);
        activeQuizzes.delete(id_chat);

        // Concede XP ao vencedor (se XP estiver ativo)
        if (dataBot.xp?.status && userId) {
          try {
            const { XPService } = await import('../../../services/XPService.js');
            await XPService.addEvent(sock.session_name, userId, 'interaction');
          } catch {}
        }

        const mencao = userId ? `@${userId.split('@')[0]}` : pushName || 'Jogador';
        const respostaCerta = q.opcoes[q.correta];

        const winMsg =
          `🎉 *ACERTOU EM CHEIO!* 🎯\n\n` +
          `👑 *Vencedor:* ${mencao}\n` +
          `✅ *Resposta Correta:* ${chosenIndex + 1}️⃣ *${respostaCerta}*\n\n` +
          `💡 *Curiosidade:* ${q.curiosidade}\n\n` +
          `⚡ *Bônus:* +50 XP adicionados ao seu perfil!\n` +
          `🕹️ _Digite \`${prefix}quiz\` para iniciar outra pergunta!_`;

        if (userId) {
          await sock.sendTextWithMentions(id_chat, winMsg, [userId]);
        } else {
          await sock.replyText(id_chat, winMsg, message);
        }

        return { status: true };
      }

      // Resposta incorreta
      const userTag = userId ? `@${userId.split('@')[0]}` : pushName || 'Você';
      const wrongMsg =
        `❌ ${userTag} chutou *${chosenIndex + 1}️⃣ ${q.opcoes[chosenIndex]}* e *ERROU*! 😅\n` +
        `🤔 Quem no grupo sabe a resposta certa? O tempo ainda está correndo!`;

      if (userId) {
        await sock.sendTextWithMentions(id_chat, wrongMsg, [userId]);
      } else {
        await sock.replyText(id_chat, wrongMsg, message);
      }

      return { status: false };
    }

    // Se NÃO passou argumentos, vamos iniciar um novo Quiz
    if (activeQuiz) {
      const segundosRestantes = Math.max(
        1,
        Math.round((activeQuiz.expiresAt - Date.now()) / 1000),
      );
      await sock.replyText(
        id_chat,
        `⚠️ *Já existe uma pergunta ativa neste grupo!*\n\n` +
          `❓ *${activeQuiz.question.pergunta}*\n` +
          `⏳ Restam *${segundosRestantes} segundos* para responder!`,
        message,
      );
      return { status: false };
    }

    // Sorteia uma pergunta sem repetir a última
    const lastId = lastQuestionIds.get(id_chat) || -1;
    const available = quizQuestions.filter((q) => q.id !== lastId);
    const chosen = available[Math.floor(Math.random() * available.length)] || quizQuestions[0];
    lastQuestionIds.set(id_chat, chosen.id);

    const timeLimitMs = 45000;
    const expiresAt = Date.now() + timeLimitMs;

    // Timer de timeout de 45 segundos
    const timer = setTimeout(async () => {
      const current = activeQuizzes.get(id_chat);
      if (current && current.question.id === chosen.id) {
        activeQuizzes.delete(id_chat);
        try {
          const timeoutMsg =
            `⏰ *TEMPO ESGOTADO NO QUIZ!* 😴\n\n` +
            `Ninguém conseguiu responder a tempo!\n` +
            `❓ *Pergunta:* ${chosen.pergunta}\n` +
            `✅ *A resposta correta era:* ${chosen.correta + 1}️⃣ *${chosen.opcoes[chosen.correta]}*\n\n` +
            `💡 *Curiosidade:* ${chosen.curiosidade}\n\n` +
            `🕹️ _Digite \`${prefix}quiz\` para tentar uma nova rodada!_`;
          await sock.sendText(id_chat, timeoutMsg);
        } catch {}
      }
    }, timeLimitMs);

    activeQuizzes.set(id_chat, {
      question: chosen,
      startTime: Date.now(),
      expiresAt,
      timer,
      attemptedUsers: new Set(),
    });

    const bodyText =
      `🧠 *SHOW DO M@STE® BOT - QUIZ* 🧠\n` +
      `🏷️ *Categoria:* ${chosen.categoria}\n\n` +
      `❓ *${chosen.pergunta}*\n\n` +
      `1️⃣ ${chosen.opcoes[0]}\n` +
      `2️⃣ ${chosen.opcoes[1]}\n` +
      `3️⃣ ${chosen.opcoes[2]}\n` +
      `4️⃣ ${chosen.opcoes[3]}\n\n` +
      `⏱️ _Você tem 45 segundos! Clique em uma opção ou digite \`${prefix}quiz <número>\`_`;

    const buttons: types.MyButtons['buttons'] = [
      {
        buttonId: `${prefix}quiz 1`,
        buttonText: { displayText: `1️⃣ ${chosen.opcoes[0].slice(0, 20)}` },
      },
      {
        buttonId: `${prefix}quiz 2`,
        buttonText: { displayText: `2️⃣ ${chosen.opcoes[1].slice(0, 20)}` },
      },
      {
        buttonId: `${prefix}quiz 3`,
        buttonText: { displayText: `3️⃣ ${chosen.opcoes[2].slice(0, 20)}` },
      },
      {
        buttonId: `${prefix}quiz 4`,
        buttonText: { displayText: `4️⃣ ${chosen.opcoes[3].slice(0, 20)}` },
      },
    ];

    try {
      await sock.sendButtons(id_chat, {
        text: bodyText,
        footer: 'Aperte o botão com sua resposta ou digite o número:',
        buttons,
      });
    } catch {
      // Fallback em texto puro caso botões falhem
      await sock.replyText(id_chat, bodyText, message);
    }

    return { status: true };
  },
};

export default command;
