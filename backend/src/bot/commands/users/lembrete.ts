import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { criarLembrete, parseTempo } from '../../../services/LembreteService.js';

const command: Command = {
  name: 'lembrete',
  description: 'Agenda um lembrete para ser disparado pelo bot no tempo indicado.',
  category: 'users',
  aliases: ['lembrete', 'lembrar', 'alarme'],
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

    if (!id_chat || !args || args.length < 2) {
      const helpMsg =
        `⏰ *[AGENDADOR DE LEMBRETES]*\n\n` +
        `Nunca mais esqueça de um compromisso ou tarefa!\n\n` +
        `📌 *Como usar:*\n` +
        `• \`${prefix}lembrete 15m Beber água\`\n` +
        `• \`${prefix}lembrete 2h Reunião de equipe\`\n` +
        `• \`${prefix}lembrete 30s Tirar algo do fogo\`\n` +
        `• \`${prefix}lembrete 1d Pagar fatura\`\n\n` +
        `⏱️ *Unidades válidas:* *s* (segundos), *m* (minutos), *h* (horas), *d* (dias).`;

      await sock.replyText(id_chat, helpMsg, message);
      return { status: false };
    }

    const tempoStr = args[0].trim();
    const texto = args.slice(1).join(' ').trim();

    if (!texto) {
      await sock.replyText(
        id_chat,
        `❌ Por favor, informe o texto do lembrete!\nExemplo: \`${prefix}lembrete 10m Tomar remédio\``,
        message,
      );
      return { status: false };
    }

    const parsed = parseTempo(tempoStr);
    if (!parsed) {
      await sock.replyText(
        id_chat,
        `❌ Tempo inválido (*${tempoStr}*)!\nExemplos válidos: *30s*, *10m*, *2h*, *1d*.`,
        message,
      );
      return { status: false };
    }

    // Limite máximo de 30 dias para evitar overflow
    if (parsed.ms > 30 * 24 * 60 * 60 * 1000) {
      await sock.replyText(
        id_chat,
        `❌ O tempo máximo para um lembrete é de 30 dias.`,
        message,
      );
      return { status: false };
    }

    try {
      const result = await criarLembrete({
        id_chat,
        id_usuario: userId,
        push_name: pushName || '',
        texto,
        tempoStr,
        is_group: Boolean(isGroup),
      });

      const horaFormatada = result.disparar_em.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dataFormatada = result.disparar_em.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const avisoFinal = isGroup
        ? '🔔 _Pode deixar comigo, quando chegar a hora exata eu vou marcar todos os membros aqui no grupo!_'
        : '🔔 _Pode deixar comigo, quando chegar a hora exata eu vou te avisar aqui!_';

      const resposta =
        `✅ *LEMBRETE AGENDADO COM SUCESSO!* ⏰\n\n` +
        `📌 *Aviso:* "${texto}"\n` +
        `⏳ *Tempo:* daqui a *${result.tempoFormatado}*\n` +
        `📆 *Disparo em:* ${dataFormatada} às ${horaFormatada}\n\n` +
        avisoFinal;

      await sock.replyText(id_chat, resposta, message);
      return { status: true };
    } catch (err: any) {
      console.error('Erro ao agendar lembrete:', err);
      await sock.replyText(
        id_chat,
        `❌ Erro ao agendar o lembrete: ${err?.message || 'Erro interno'}`,
        message,
      );
      return { status: false };
    }
  },
};

export default command;
