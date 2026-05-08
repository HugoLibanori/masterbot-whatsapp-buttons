import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { getClientDB } from '../../../database/index.js'; // ✅ troca aqui
import Users from '../../../database/models/User.js';

const command: Command = {
  name: 'topxp',
  description:
    'Mostra o ranking de XP (semanal, mensal ou geral) e permite limitar o número de resultados.',
  category: 'users',
  aliases: ['topxp', 'rankxp', 'leaderboard'],
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,

  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, pushName } = messageContent;

    // ✅ PEGA O NOME DA SESSÃO ATUAL DO BOT
    const sessionName = sock.session_name;
    if (!sessionName) {
      await sock.sendText(id_chat, '❌ Sessão não identificada.');
      return;
    }

    // ✅ ATIVA O BANCO DA SESSÃO
    const db = getClientDB(sessionName);

    if (!dataBot.xp?.status) {
      return await sock.sendText(
        id_chat,
        `❌ ${pushName || 'Você'}, o sistema de XP está desativado no momento.`,
      );
    }

    let tipo = 'geral';
    let limit = 10;

    if (args.length > 0) {
      const firstArg = args[0].toLowerCase();
      if (['semanal', 'mensal', 'geral'].includes(firstArg)) {
        tipo = firstArg;
        if (args[1] && !isNaN(parseInt(args[1]))) {
          limit = parseInt(args[1]);
        }
      } else if (!isNaN(parseInt(firstArg))) {
        limit = parseInt(firstArg);
      }
    }

    let where = '';
    if (tipo === 'semanal') {
      where = `WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    } else if (tipo === 'mensal') {
      where = `WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }

    const sql = `
      SELECT user_id, SUM(amount) as total
      FROM xp_events
      ${where}
      GROUP BY user_id
      ORDER BY total DESC
      LIMIT ${limit}
    `;

    // ✅ AGORA EXECUTA NO BANCO DA SESSÃO
    const [rows] = (await db.query(sql)) as any[];

    if (!rows || !rows.length) {
      await sock.sendText(id_chat, 'Ninguém no ranking ainda.');
      return;
    }

    const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▫️');

    const mentions: string[] = [];
    let texto = `🏆 TOP XP (${tipo.toUpperCase()}) - ${limit} Usuários\n\n`;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const uid = r.user_id as string;
      mentions.push(uid);

      const u = await Users.findOne({ where: { id_usuario: uid } });

      texto += `${medal(i)} @${uid.replace('@s.whatsapp.net', '')} — ${r.total} XP\n`;
    }

    await sock.sendTextWithMentions(id_chat, texto, mentions);
    return;
  },
};

export default command;
