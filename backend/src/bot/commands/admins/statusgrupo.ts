import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'statusgrupo',
  description: 'Exibe o status do plano e configurações ativas do grupo.',
  category: 'admins',
  aliases: ['statusgrupo', 'planogrupoinfo', 'planogp'],
  group: true, // Apenas em grupos
  admin: true, // Apenas administradores do grupo
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
    const { id_chat, isGroup, grupo } = messageContent;

    if (!isGroup || !grupo?.id_group) {
      await sock.replyText(
        id_chat,
        '❌ Este comando só pode ser utilizado dentro de grupos!',
        message,
      );
      return { status: false };
    }

    try {
      const planStatus = await grupoController.getGroupPlanStatus(grupo.id_group);
      const groupData = grupo.dataBd;
      const groupName = groupData?.nome || 'Este Grupo';

      let planText = '';
      if (planStatus.plano_ativo && planStatus.expira_em) {
        const expStr = new Date(planStatus.expira_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        planText =
          `👑 *Plano do Grupo:* ATIVO ✨\n` +
          `📆 *Vencimento:* ${expStr}\n` +
          `⏳ *Dias Restantes:* ${planStatus.diasRestantes} dia(s)\n` +
          `⚡ *Benefício:* Todos os membros têm comandos liberados sem limite diário!`;
      } else {
        planText =
          `⚪ *Plano do Grupo:* INATIVO\n` +
          `ℹ️ Os membros utilizam seus limites individuais (comum/premium/vip).\n` +
          `💡 _Para contratar ou ativar um plano mensal para este grupo, fale com o dono do bot!_`;
      }

      // Outras funcionalidades do grupo
      const antilink = groupData?.antilink ? '✅ Ativado' : '❌ Desativado';
      const autosticker = groupData?.autosticker ? '✅ Ativado' : '❌ Desativado';
      const bemvindo = groupData?.bemvindo?.status ? '✅ Ativado' : '❌ Desativado';
      const mutar = groupData?.mutar ? '🔇 Ativado' : '🔊 Desativado';
      const contador = groupData?.contador?.status ? '✅ Ativado' : '❌ Desativado';

      const resposta =
        `📊 *INFORMAÇÕES DO GRUPO (ADMIN)*\n\n` +
        `👥 *Nome:* ${groupName}\n\n` +
        `${planText}\n\n` +
        `⚙️ *Recursos do Grupo:*\n` +
        `• Antilink: ${antilink}\n` +
        `• Auto-Sticker: ${autosticker}\n` +
        `• Boas-Vindas: ${bemvindo}\n` +
        `• Modo Silencioso: ${mutar}\n` +
        `• Contador de Mensagens: ${contador}`;

      await sock.replyText(id_chat, resposta, message);
      return { status: true };
    } catch (err: any) {
      console.error('Erro ao buscar status do grupo:', err);
      await sock.replyText(
        id_chat,
        '❌ Erro ao consultar as informações do grupo.',
        message,
      );
      return { status: false };
    }
  },
};

export default command;
