import { Op } from 'sequelize';
import Lembrete from '../database/models/Lembrete.js';
import { getAllSockets } from '../api/sessionRuntime.js';

export function parseTempo(tempoStr: string): { ms: number; textoFormatado: string } | null {
  if (!tempoStr) return null;
  const match = tempoStr.trim().toLowerCase().match(/^(\d+)\s*([smhd])$/);
  if (!match) return null;

  const valor = parseInt(match[1], 10);
  const unidade = match[2];

  if (valor <= 0) return null;

  switch (unidade) {
    case 's':
      return {
        ms: valor * 1000,
        textoFormatado: `${valor} segundo${valor > 1 ? 's' : ''}`,
      };
    case 'm':
      return {
        ms: valor * 60 * 1000,
        textoFormatado: `${valor} minuto${valor > 1 ? 's' : ''}`,
      };
    case 'h':
      return {
        ms: valor * 60 * 60 * 1000,
        textoFormatado: `${valor} hora${valor > 1 ? 's' : ''}`,
      };
    case 'd':
      return {
        ms: valor * 24 * 60 * 60 * 1000,
        textoFormatado: `${valor} dia${valor > 1 ? 's' : ''}`,
      };
    default:
      return null;
  }
}

export async function criarLembrete(dados: {
  id_chat: string;
  id_usuario: string;
  push_name?: string;
  texto: string;
  tempoStr: string;
  is_group?: boolean;
}) {
  const parsed = parseTempo(dados.tempoStr);
  if (!parsed) {
    throw new Error('Formato de tempo inválido! Use por exemplo: 30s, 10m, 2h ou 1d.');
  }

  const disparar_em = new Date(Date.now() + parsed.ms);

  const lembrete = await Lembrete.create({
    id_chat: dados.id_chat,
    id_usuario: dados.id_usuario,
    push_name: dados.push_name || '',
    texto: dados.texto,
    disparar_em,
    enviado: false,
    is_group: dados.is_group ?? false,
  });

  return {
    lembrete,
    disparar_em,
    tempoFormatado: parsed.textoFormatado,
  };
}

let workerInterval: NodeJS.Timeout | null = null;

export function startLembreteWorker() {
  if (workerInterval) return;

  workerInterval = setInterval(async () => {
    try {
      const agora = new Date();
      const pendentes = await Lembrete.findAll({
        where: {
          enviado: false,
          disparar_em: {
            [Op.lte]: agora,
          },
        },
        limit: 20,
      });

      if (!pendentes || pendentes.length === 0) return;

      const sockets = getAllSockets();
      if (sockets.size === 0) return;

      // Pega o socket principal disponível
      const sock: any = Array.from(sockets.values())[0];
      if (!sock) return;

      for (const item of pendentes) {
        try {
          const userTag = item.id_usuario ? `@${item.id_usuario.split('@')[0]}` : item.push_name || 'Amigo';

          if (item.is_group) {
            let participantsToMention: string[] = [];
            try {
              const { getGroup } = await import('../bot/controllers/GrupoController.js');
              const gp = await getGroup(item.id_chat);
              if (gp?.participantes) {
                const parts = typeof gp.participantes === 'string' ? JSON.parse(gp.participantes) : gp.participantes;
                if (Array.isArray(parts)) {
                  participantsToMention = parts.filter(Boolean);
                }
              }
              if (participantsToMention.length === 0 && typeof sock.groupMetadata === 'function') {
                const meta = await sock.groupMetadata(item.id_chat);
                if (meta?.participants) {
                  participantsToMention = meta.participants.map((p: any) => p.id).filter(Boolean);
                }
              }
            } catch {}

            if (item.id_usuario && !participantsToMention.includes(item.id_usuario)) {
              participantsToMention.push(item.id_usuario);
            }

            const msg =
              `⏰ *[LEMBRETE COLETIVO - ATENÇÃO GRUPO!]* 📢\n\n` +
              `👤 *Agendado por:* ${userTag}\n` +
              `📌 *Aviso:* ${item.texto}\n\n` +
              `🔔 _Lembrete programado disparado pelo M@ste® Bot._`;

            if (typeof sock.sendTextWithMentions === 'function') {
              await sock.sendTextWithMentions(item.id_chat, msg, participantsToMention);
            } else if (typeof sock.sendMessage === 'function') {
              await sock.sendMessage(item.id_chat, { text: msg, mentions: participantsToMention });
            } else if (typeof sock.sendText === 'function') {
              await sock.sendText(item.id_chat, msg);
            }
          } else {
            const msg =
              `⏰ *[SEU LEMBRETE CHEGOU!]* ⏰\n\n` +
              `📌 *Lembrete:* ${item.texto}\n\n` +
              `🔔 _Agendado com sucesso pelo M@ste® Bot._`;

            if (typeof sock.sendText === 'function') {
              await sock.sendText(item.id_chat, msg);
            } else if (typeof sock.sendMessage === 'function') {
              await sock.sendMessage(item.id_chat, { text: msg });
            }
          }

          item.enviado = true;
          await item.save();
        } catch (itemErr) {
          console.error(`Erro ao disparar lembrete ID ${item.id}:`, itemErr);
        }
      }
    } catch (err) {
      // Ignora erro de checagem periódica caso o banco ainda esteja inicializando
    }
  }, 10000); // Checa a cada 10 segundos
}
