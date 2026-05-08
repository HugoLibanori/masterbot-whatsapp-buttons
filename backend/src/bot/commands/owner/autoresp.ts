import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { createText } from '../../../utils/utils.js';
import * as botController from '../../controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'autoresp',
  description:
    'Define o cooldown da auto-resposta em PV (em segundos). Suporta sufixos: s, m, h, d. Só dono pode usar.',
  category: 'owner',
  aliases: ['autoresp', 'autorespondercd'],
  owner: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat } = messageContent;

    const current = Number(dataBot.auto_reply_cooldown_seconds ?? 86400);

    if (!args.length) {
      const pretty = formatSeconds(current);
      await sock.sendText(id_chat, `⏱️ Cooldown atual de auto-reply: ${current}s (${pretty}).`);
      return;
    }

    const input = args[0].toLowerCase().trim();

    function parseValue(v: string): number | null {
      if (v === 'off' || v === '0') return 0;
      const num = Number(v);
      if (!isNaN(num)) return Math.max(0, Math.floor(num));

      const m = v.match(/^([0-9]+(?:\.[0-9]+)?)([smhd])$/i);
      if (!m) return null;
      const n = Number(m[1]);
      const unit = m[2].toLowerCase();
      switch (unit) {
        case 's':
          return Math.max(0, Math.floor(n));
        case 'm':
          return Math.max(0, Math.floor(n * 60));
        case 'h':
          return Math.max(0, Math.floor(n * 3600));
        case 'd':
          return Math.max(0, Math.floor(n * 86400));
        default:
          return null;
      }
    }

    const parsed = parseValue(input);
    if (parsed === null) {
      await sock.sendText(id_chat, `❌ Valor inválido. Ex: 3600 | 1h | 1d | off`);
      return;
    }

    await botController.updateBotData({ auto_reply_cooldown_seconds: parsed });
    const prettyNew = parsed === 0 ? 'desabilitado' : formatSeconds(parsed);
    await sock.sendText(
      id_chat,
      `✅ Auto-reply cooldown atualizado para ${parsed}s (${prettyNew}).`,
    );
    return;
  },
};

function formatSeconds(sec: number) {
  if (sec === 0) return 'desabilitado';
  if (sec % 86400 === 0) return `${sec / 86400}d`;
  if (sec % 3600 === 0) return `${sec / 3600}h`;
  if (sec % 60 === 0) return `${sec / 60}m`;
  return `${sec}s`;
}

export default command;
