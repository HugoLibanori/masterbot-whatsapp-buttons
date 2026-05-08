import * as types from '../../../types/BaileysTypes/index.js';
import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../controllers/BotController.js';
import BotModel from '../../../database/models/Bot.js'; // Importação direta para diagnóstico
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'tipos',
  description: 'Mostra todos os tipos ativos.',
  category: 'owner',
  aliases: ['tipos'],
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,

  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot_CACHE: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    const botRaw = await BotModel.findOne({ where: { id: 1 }, raw: true });

    const dadosParaUso = botRaw ? botRaw : dataBot_CACHE;

    const limiteTipos = dadosParaUso.limite_diario?.limite_tipos || {};

    let usuariosTipo = limiteTipos;
    if (!usuariosTipo) return;

    // 1. Ordem de prioridade
    const prioridade = ['dono', 'vip', 'premium', 'comum'];

    // 2. Chaves
    const todasChaves = Object.keys(usuariosTipo);

    // 3. Ordenação
    const chavesPadrao = prioridade.filter((k) => todasChaves.includes(k));
    const chavesCustom = todasChaves.filter((k) => !prioridade.includes(k));
    const chavesOrdenadas = [...chavesPadrao, ...chavesCustom];

    let respostaTitulo = createText(
      textMessage.admin.tipos.msgs.resposta.titulo,
      chavesOrdenadas.length.toString(),
    );
    let respostaItens = '';
    let acount = 0;

    for (let tipo of chavesOrdenadas) {
      acount++;
      const dados = usuariosTipo[tipo];

      const limiteVisual =
        dados.comandos === null || dados.comandos === -1 ? '∞' : dados.comandos.toString();

      respostaItens += createText(
        textMessage.admin.tipos.msgs.resposta.item,
        tipo, // Chave interna (ex: ouro)
        dados.titulo, // Título bonito (ex: 🥇 Ouro)
        limiteVisual,
        acount.toString(),
      );
    }

    const respostaFinal = respostaTitulo + respostaItens;
    await sock.replyText(id_chat, respostaFinal, message);
  },
};

export default command;
