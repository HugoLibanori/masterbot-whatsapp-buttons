import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { getNoticias, TipoNoticia } from '../../../services/NoticiasService.js';

const command: Command = {
  name: 'noticias',
  description: 'Exibe as principais notícias do dia, da semana ou por categoria/assunto.',
  category: 'users',
  aliases: ['noticias', 'noticia', 'news'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[] = [],
    dataBot?: Partial<Bot>,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    const prefix = dataBot?.prefix?.trim() || '!';

    await sock.sendReact(message.key, '📰', id_chat);

    const sub = (args[0] || '').toLowerCase().trim();
    let tipo: TipoNoticia = 'dia';
    let termoBusca = '';

    if (sub === 'semana' || sub === 'semanal') {
      tipo = 'semana';
    } else if (sub === 'mundo' || sub === 'internacional' || sub === 'global') {
      tipo = 'mundo';
    } else if (
      sub === 'tech' ||
      sub === 'tecnologia' ||
      sub === 'ti' ||
      sub === 'computador' ||
      sub === 'ia'
    ) {
      tipo = 'tech';
    } else if (sub === 'economia' || sub === 'financas' || sub === 'mercado' || sub === 'dolar') {
      tipo = 'economia';
    } else if (sub === 'dia' || sub === 'hoje' || sub === '') {
      tipo = 'dia';
    } else {
      // É uma busca personalizada
      tipo = 'busca';
      termoBusca = args.join(' ');
    }

    const { tituloSecao, itens } = await getNoticias(tipo, termoBusca);

    if (!itens || itens.length === 0) {
      await sock.sendReact(message.key, '❌', id_chat);
      return await sock.replyText(
        id_chat,
        `❌ Nenhuma notícia encontrada no momento para essa categoria ou termo. Tente novamente mais tarde.`,
        message,
      );
    }

    let texto = `╭━━━ ${tituloSecao} ━━━╮\n\n`;

    itens.forEach((item, index) => {
      const num = index + 1;
      texto += `*${num}.* 📌 *${item.titulo}*\n`;
      const dataStr = item.dataAmigavel ? ` • 🕒 _${item.dataAmigavel}_` : '';
      texto += `   🏷️ _${item.fonte}_${dataStr}\n`;
      texto += `   🔗 ${item.link}\n\n`;
    });

    texto += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    texto += `💡 *Outros comandos:* \n`;
    texto += `• *\`${prefix}noticias\`* ➔ Notícias de hoje\n`;
    texto += `• *\`${prefix}noticias semana\`* ➔ Destaques da semana\n`;
    texto += `• *\`${prefix}noticias mundo\`* ➔ Internacionais\n`;
    texto += `• *\`${prefix}noticias tech\`* ➔ Tecnologia\n`;
    texto += `• *\`${prefix}noticias <assunto>\`* ➔ Buscar qualquer tema`;

    // Botões interativos dinâmicos
    const buttons: types.IButton[] = [];

    if (tipo !== 'dia') {
      buttons.push({
        buttonId: `${prefix}noticias dia`,
        buttonText: { displayText: '📰 Notícias de Hoje' },
      });
    }

    if (tipo !== 'semana') {
      buttons.push({
        buttonId: `${prefix}noticias semana`,
        buttonText: { displayText: '📅 Destaques da Semana' },
      });
    }

    if (tipo !== 'tech') {
      buttons.push({
        buttonId: `${prefix}noticias tech`,
        buttonText: { displayText: '💻 Tecnologia' },
      });
    } else {
      buttons.push({
        buttonId: `${prefix}noticias mundo`,
        buttonText: { displayText: '🌍 Mundo' },
      });
    }

    try {
      await sock.sendButtons(id_chat, {
        text: texto,
        footer: 'Master Bot • Notícias em Tempo Real',
        buttons: buttons.slice(0, 3),
      });
    } catch {
      await sock.replyText(id_chat, texto, message);
    }

    await sock.sendReact(message.key, '✅', id_chat);
    return { status: true };
  },
};

export default command;
