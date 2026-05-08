import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import Users from '../../../database/models/User.js';
import { getClientDB } from '../../../database/index.js'; // ✅ trocado aqui
import { XPService } from '../../../services/XPService.js';
import { commandErrorMsg } from '../../../utils/utils.js';

const command: Command = {
  name: 'usaref',
  description: 'Usa um código de convite para dar XP ao convidador.',
  category: 'users',
  aliases: ['usaref', 'usarref', 'refusar'],
  group: true,
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
    const { id_chat, sender, pushName, command, isGroup } = messageContent;
    if (!sender) return;

    // ✅ PEGA A SESSÃO ATUAL
    const sessionName = sock.session_name;
    if (!sessionName) {
      await sock.sendText(id_chat, '❌ Sessão não identificada.');
      return;
    }

    // ✅ ATIVA O BANCO DO CLIENTE
    const db = getClientDB(sessionName);

    if (isGroup && id_chat !== dataBot.grupo_oficial) {
      return await sock.sendText(
        id_chat,
        `❌ ${pushName || 'Você'}, este comando só pode ser usado no grupo oficial.\n\nDigite: *${dataBot.prefix || '!'}*grupooficial para receber o link do grupo.`,
      );
    }

    if (!dataBot.xp?.status) {
      return await sock.sendText(
        id_chat,
        `❌ ${pushName || 'Você'}, o sistema de XP está desativado no momento.`,
      );
    }

    if (!args.length) {
      await sock.sendText(id_chat, commandErrorMsg(command));
      return;
    }

    const code = args[0];
    let referrerId = '';

    try {
      referrerId = Buffer.from(code, 'base64url').toString('utf-8');
    } catch (_) {
      await sock.sendText(id_chat, 'Código inválido.');
      return;
    }

    if (!referrerId.endsWith('@s.whatsapp.net')) {
      await sock.sendText(id_chat, 'Código inválido.');
      return;
    }

    if (referrerId === sender) {
      await sock.sendText(id_chat, 'Você não pode usar seu próprio código.');
      return;
    }

    // ✅ QUERY INTERFACE DA SESSÃO
    const qi = db.getQueryInterface();

    // ✅ Garante a tabela referrals NO BANCO DO CLIENTE
    try {
      await qi.describeTable('referrals');
    } catch (_) {
      await qi.createTable('referrals', {
        id: { type: 'BIGINT UNSIGNED', primaryKey: true, autoIncrement: true },
        referrer_id: { type: 'VARCHAR(255)', allowNull: false },
        referred_id: { type: 'VARCHAR(255)', allowNull: false, unique: true },
        status: { type: 'VARCHAR(32)', allowNull: false, defaultValue: 'activated' },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          defaultValue: db.literal('CURRENT_TIMESTAMP'),
        },
      } as any);

      try {
        await db.query('CREATE UNIQUE INDEX idx_ref_referred ON referrals (referred_id)');
      } catch {}

      try {
        await db.query('CREATE INDEX idx_ref_referrer ON referrals (referrer_id)');
      } catch {}
    }

    // ✅ Verifica se já ativou antes (NA SESSÃO CORRETA)
    const [exists] = (await db.query('SELECT id FROM referrals WHERE referred_id = ? LIMIT 1', {
      replacements: [sender],
    })) as any[];

    if (exists && exists.length) {
      await sock.sendText(id_chat, 'Este número já ativou um código anteriormente.');
      return;
    }

    // ✅ Registra ativação NO BANCO DA SESSÃO
    await db.query('INSERT INTO referrals (referrer_id, referred_id, status) VALUES (?, ?, ?)', {
      replacements: [referrerId, sender, 'activated'],
    });

    // ✅ Dá XP ao convidador NA SESSÃO CORRETA
    await XPService.addEvent(sessionName, referrerId, 'referral_activated', {
      referred_id: sender,
    });

    await sock.sendText(id_chat, 'Código aplicado com sucesso! O convidador recebeu o XP.');

    try {
      await sock.sendTextWithMentions(
        referrerId,
        `🎉 Seu convite foi ativado por @${sender.replace('@s.whatsapp.net', '')}!`,
        [sender],
      );
    } catch {}

    return;
  },
};

export default command;
